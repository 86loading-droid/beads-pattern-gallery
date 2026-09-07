import { callApi } from './api';
import { BEAD_COLORS, INITIAL_STOCK, type StockEntry } from './inventory';
import type { BeadCount, ColorKey } from '../types/pattern';

export interface StockState {
  stock: Record<ColorKey, number>;
  logs: StockEntry[];
}

export type ConsumeInput = {
  title: string;
  kind: '완성' | '부분 사용';
  used: BeadCount;
};

export type StoreError = 'empty' | 'short' | 'nochange' | 'busy' | 'network';

export interface StoreResult {
  ok: boolean;
  /** 성공했을 때의 새 상태 */
  state?: StockState;
  error?: StoreError;
  /** error가 'short'일 때 모자란 색 */
  shortages?: ColorKey[];
}

export interface StockStore {
  /** true면 모든 기기가 같은 재고를 봅니다 */
  readonly shared: boolean;
  readonly label: string;
  load(): Promise<StockState>;
  consume(input: ConsumeInput): Promise<StoreResult>;
  removeEntry(id: string): Promise<StoreResult>;
  adjust(next: Partial<Record<ColorKey, number>>): Promise<StoreResult>;
}

const emptyState = (): StockState => ({ stock: { ...INITIAL_STOCK }, logs: [] });
const nowText = () =>
  new Date().toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

/* ------------------------------------------------------------------ */
/* 이 기기에만 저장 (배포 전 개발용 · 공유 주소가 없을 때의 대비책)        */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'beadstock.v1';
const LOG_KEEP = 60;

function readLocal(): StockState {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as StockState | null;
    if (raw && raw.stock) return { stock: { ...INITIAL_STOCK, ...raw.stock }, logs: raw.logs ?? [] };
  } catch {
    // 저장소를 쓸 수 없으면 초기 재고로 시작한다
  }
  return emptyState();
}

function writeLocal(state: StockState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 저장 실패는 화면 동작을 막지 않는다
  }
}

export const localStore: StockStore = {
  shared: false,
  label: '이 기기에만 저장',
  async load() {
    return readLocal();
  },
  async consume({ title, kind, used }) {
    const state = readLocal();
    const entries = (Object.entries(used) as [ColorKey, number][]).filter(([, v]) => v > 0);
    if (entries.length === 0) return { ok: false, error: 'empty' };
    const shortages = entries.filter(([k, v]) => (state.stock[k] ?? 0) < v).map(([k]) => k);
    if (shortages.length) return { ok: false, error: 'short', shortages };

    const stock = { ...state.stock };
    let total = 0;
    entries.forEach(([k, v]) => {
      stock[k] = (stock[k] ?? 0) - v;
      total += v;
    });
    const entry: StockEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind,
      title,
      used: Object.fromEntries(entries) as BeadCount,
      total,
      at: nowText(),
    };
    const next = { stock, logs: [entry, ...state.logs].slice(0, LOG_KEEP) };
    writeLocal(next);
    return { ok: true, state: next };
  },
  async removeEntry(id) {
    const state = readLocal();
    const target = state.logs.find((e) => e.id === id);
    if (!target) return { ok: false, error: 'nochange' };
    const stock = { ...state.stock };
    (Object.entries(target.used) as [ColorKey, number][]).forEach(([k, v]) => {
      stock[k] = (stock[k] ?? 0) + v;
    });
    const next = { stock, logs: state.logs.filter((e) => e.id !== id) };
    writeLocal(next);
    return { ok: true, state: next };
  },
  async adjust(nextStock) {
    const state = readLocal();
    const stock = { ...state.stock };
    let changed = false;
    BEAD_COLORS.forEach((c) => {
      const target = nextStock[c.key];
      if (typeof target !== 'number' || !isFinite(target) || target < 0) return;
      const v = Math.floor(target);
      if (v !== stock[c.key]) {
        stock[c.key] = v;
        changed = true;
      }
    });
    if (!changed) return { ok: false, error: 'nochange' };
    const next = { stock, logs: state.logs };
    writeLocal(next);
    return { ok: true, state: next };
  },
};

/* ------------------------------------------------------------------ */
/* 구글 스프레드시트 (Apps Script 웹 앱)                                 */
/* ------------------------------------------------------------------ */

interface ApiResponse {
  ok: boolean;
  error?: string;
  shortages?: ColorKey[];
  state?: { stock: Record<string, number>; logs: StockEntry[] };
}

function normalize(raw: ApiResponse['state']): StockState {
  return {
    stock: { ...INITIAL_STOCK, ...(raw?.stock ?? {}) } as Record<ColorKey, number>,
    logs: Array.isArray(raw?.logs) ? raw.logs : [],
  };
}

/**
 * Apps Script 웹 앱을 재고 저장소로 사용합니다.
 * 통신 방식은 api.ts 가 맡습니다 — 한 방식이 막히면 다른 방식으로 자동 전환합니다.
 */
export function createSheetStore(url: string, key: string): StockStore {
  async function call(action: string, payload: Record<string, unknown> = {}): Promise<ApiResponse> {
    return (await callApi(url, key, action, payload)) as unknown as ApiResponse;
  }

  async function run(action: string, payload: Record<string, unknown> = {}): Promise<StoreResult> {
    try {
      const data = await call(action, payload);
      if (data.ok && data.state) return { ok: true, state: normalize(data.state) };
      const code: StoreError =
        data.error === 'short' || data.error === 'empty' || data.error === 'nochange' || data.error === 'busy'
          ? data.error
          : 'network';
      return { ok: false, error: code, shortages: data.shortages };
    } catch {
      return { ok: false, error: 'network' };
    }
  }

  return {
    shared: true,
    label: '스프레드시트 공유 재고',
    async load() {
      const data = await call('state');
      if (!data.ok || !data.state) throw new Error(data.error || 'load_failed');
      return normalize(data.state);
    },
    consume: (input) => run('consume', input),
    removeEntry: (id) => run('removeEntry', { id }),
    adjust: (next) => run('adjust', { next }),
  };
}

/* ------------------------------------------------------------------ */

/**
 * 배포 시 .env 의 VITE_STOCK_API 가 채워져 있으면 스프레드시트를 쓰고,
 * 비어 있으면 이 기기 저장소를 씁니다.
 */
export function pickStore(): StockStore {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  const url = (env.VITE_STOCK_API ?? '').trim();
  const key = (env.VITE_STOCK_KEY ?? '').trim();
  return url ? createSheetStore(url, key) : localStore;
}
