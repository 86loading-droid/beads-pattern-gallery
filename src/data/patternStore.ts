import type { CategoryId, PatternSource } from '../types/pattern';

/**
 * 앱에서 직접 만든 도안의 저장소.
 *
 * 재고와 같은 구글 스프레드시트를 쓰면 모든 태블릿이 같은 도안을 봅니다.
 * 스프레드시트 쪽 준비가 아직 안 되어 있으면 이 기기 저장소로 자동 전환되므로,
 * 어느 경우에도 도안을 만들고 쓰는 데는 지장이 없습니다.
 */

export interface CustomPattern extends PatternSource {
  custom: true;
  at: string;
}

export type PatternError = 'empty' | 'notitle' | 'toobig' | 'notfound' | 'busy' | 'network' | 'unsupported';

export interface PatternResult {
  ok: boolean;
  list?: CustomPattern[];
  error?: PatternError;
}

export interface PatternStore {
  /** true면 모든 기기가 같은 도안 목록을 봅니다 */
  readonly shared: boolean;
  readonly label: string;
  load(): Promise<CustomPattern[]>;
  save(pattern: CustomPattern): Promise<PatternResult>;
  remove(id: string): Promise<PatternResult>;
}

/** 한 도안의 최대 칸 수 — 태블릿에서 다루기 힘들 만큼 커지는 것을 막습니다 */
export const MAX_SIDE = 17;
export const MIN_SIDE = 4;

export const newPatternId = () => `my-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export const nowText = () =>
  new Date().toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

/** 저장 전에 형식을 확인한다 — 서버와 이 기기 저장소가 같은 기준을 쓰도록 한 곳에 둔다 */
export function checkPattern(p: CustomPattern): PatternError | null {
  if (!p.title || !p.title.trim()) return 'notitle';
  if (!p.rows || p.rows.length < MIN_SIDE) return 'empty';
  const width = p.rows[0].length;
  if (width < MIN_SIDE) return 'empty';
  if (width > MAX_SIDE || p.rows.length > MAX_SIDE) return 'toobig';
  if (p.rows.some((r) => r.length !== width)) return 'empty';
  if (!p.rows.some((r) => r.split('').some((ch) => ch !== '.'))) return 'empty';
  return null;
}

function normalize(raw: unknown): CustomPattern[] {
  if (!Array.isArray(raw)) return [];
  const out: CustomPattern[] = [];
  raw.forEach((item) => {
    const p = item as Partial<CustomPattern>;
    if (!p || typeof p.id !== 'string' || !Array.isArray(p.rows)) return;
    out.push({
      id: p.id,
      title: String(p.title ?? '이름 없는 도안'),
      category: (p.category ?? 'shape') as CategoryId,
      rows: p.rows.map((r) => String(r)),
      custom: true,
      at: String(p.at ?? ''),
    });
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* 이 기기에만 저장                                                      */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'beadpatterns.v1';
/** 아직 스프레드시트에 올리지 못한 도안 — 연결이 돌아오면 자동으로 올립니다 */
const PENDING_KEY = 'beadpatterns.pending.v1';

export function readLocal(): CustomPattern[] {
  try {
    return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch {
    return [];
  }
}

export function writeLocal(list: CustomPattern[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // 저장 공간이 막혀 있어도 화면 동작은 막지 않는다
  }
}

/** 이 기기에만 있고 아직 못 올린 도안을 기록해 둔다 */
export function readPending(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
    return Array.isArray(raw) ? raw.map((x) => String(x)) : [];
  } catch {
    return [];
  }
}

function writePending(ids: string[]) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(ids));
  } catch {
    // 무시 — 다음 저장 때 다시 시도한다
  }
}

export function markPending(id: string) {
  const ids = readPending();
  if (!ids.includes(id)) writePending([...ids, id]);
}

export function clearPending(id: string) {
  writePending(readPending().filter((x) => x !== id));
}

/** 이 기기 저장소에 한 벌 남겨 둔다 — 연결이 끊겨도 만든 도안을 잃지 않는다 */
export function mirrorLocal(pattern: CustomPattern) {
  writeLocal([pattern, ...readLocal().filter((p) => p.id !== pattern.id)]);
}

export function dropLocal(id: string) {
  writeLocal(readLocal().filter((p) => p.id !== id));
  clearPending(id);
}

export const localPatternStore: PatternStore = {
  shared: false,
  label: '이 기기에만 저장',
  async load() {
    return readLocal();
  },
  async save(pattern) {
    const bad = checkPattern(pattern);
    if (bad) return { ok: false, error: bad };
    const list = readLocal().filter((p) => p.id !== pattern.id);
    const next = [pattern, ...list];
    writeLocal(next);
    return { ok: true, list: next };
  },
  async remove(id) {
    const list = readLocal();
    if (!list.some((p) => p.id === id)) return { ok: false, error: 'notfound' };
    const next = list.filter((p) => p.id !== id);
    writeLocal(next);
    return { ok: true, list: next };
  },
};

/* ------------------------------------------------------------------ */
/* 구글 스프레드시트 (재고와 같은 Apps Script 웹 앱)                      */
/* ------------------------------------------------------------------ */

interface ApiResponse {
  ok: boolean;
  error?: string;
  list?: unknown;
}

export function createSheetPatternStore(url: string, key: string): PatternStore {
  async function call(action: string, payload: Record<string, unknown> = {}): Promise<ApiResponse> {
    // Content-Type을 text/plain으로 보내는 이유는 재고 저장소와 같습니다(사전 확인 요청 회피).
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ key, action, ...payload }),
      redirect: 'follow',
    });
    return (await res.json()) as ApiResponse;
  }

  function toError(code: string | undefined): PatternError {
    if (code === 'unknown_action') return 'unsupported';
    if (code === 'busy' || code === 'notfound' || code === 'empty' || code === 'notitle' || code === 'toobig') {
      return code as PatternError;
    }
    return 'network';
  }

  async function run(action: string, payload: Record<string, unknown> = {}): Promise<PatternResult> {
    try {
      const data = await call(action, payload);
      if (data.ok) return { ok: true, list: normalize(data.list) };
      return { ok: false, error: toError(data.error) };
    } catch {
      return { ok: false, error: 'network' };
    }
  }

  return {
    shared: true,
    label: '스프레드시트 공유 도안',
    async load() {
      const data = await call('patterns');
      if (!data.ok) throw new Error(data.error || 'load_failed');
      return normalize(data.list);
    },
    save: (pattern) => run('savePattern', { pattern }),
    remove: (id) => run('removePattern', { id }),
  };
}

/* ------------------------------------------------------------------ */

/**
 * 배포본에 스프레드시트 주소가 있으면 공유 저장소를 돌려주고, 없으면 null.
 * null이면 이 기기 저장소만 씁니다.
 */
export function pickSharedPatternStore(): PatternStore | null {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  const url = (env.VITE_STOCK_API ?? '').trim();
  const key = (env.VITE_STOCK_KEY ?? '').trim();
  return url ? createSheetPatternStore(url, key) : null;
}

/** 배포본에 스프레드시트 주소가 있으면 공유 저장, 없으면 이 기기 저장 */
export function pickPatternStore(): PatternStore {
  return pickSharedPatternStore() ?? localPatternStore;
}
