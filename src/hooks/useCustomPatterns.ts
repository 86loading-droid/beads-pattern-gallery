import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clearPending,
  dropLocal,
  localPatternStore,
  markPending,
  mirrorLocal,
  pickSharedPatternStore,
  readLocal,
  readPending,
  type CustomPattern,
  type PatternResult,
  type PatternStore,
} from '../data/patternStore';

/** 다른 태블릿에서 만든 도안을 반영하기 위한 재조회 간격 (밀리초) */
const REFRESH_MS = 20000;

function mergeLists(shared: CustomPattern[], extras: CustomPattern[]): CustomPattern[] {
  const seen = new Set(shared.map((p) => p.id));
  return [...extras.filter((p) => !seen.has(p.id)), ...shared];
}

/**
 * 앱에서 직접 만든 도안 목록.
 *
 * 만든 도안은 언제나 이 기기에 한 벌 남기고, 스프레드시트에도 올립니다.
 * 연결이 끊겨 있으면 '올릴 것' 목록에 담아 두었다가 연결이 돌아오는 즉시 자동으로
 * 올리므로, 다른 태블릿에서도 곧 같은 도안이 보입니다. 한 번 실패했다고 이 기기
 * 저장으로 주저앉지 않고 새로고침할 때마다 공유 저장을 다시 시도합니다.
 */
export function useCustomPatterns() {
  const sharedRef = useRef<PatternStore | null>(pickSharedPatternStore());
  const hasShared = sharedRef.current !== null;

  const [list, setList] = useState<CustomPattern[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  /** 공유 저장소와 마지막 통신이 성공했는가 */
  const [online, setOnline] = useState(hasShared);
  const [pending, setPending] = useState<number>(() => (hasShared ? readPending().length : 0));
  const alive = useRef(true);
  const syncing = useRef(false);

  const showLocalOnly = useCallback(() => {
    const local = readLocal();
    if (!alive.current) return;
    setList(local);
    setOnline(false);
    setPending(hasShared ? readPending().length : 0);
    setReady(true);
  }, [hasShared]);

  /**
   * 아직 못 올린 도안을 스프레드시트로 밀어 올린다.
   * 마지막으로 성공한 저장의 응답(최신 전체 목록)을 돌려주어 조회를 한 번 아낀다.
   */
  const pushPending = useCallback(async (store: PatternStore): Promise<CustomPattern[] | null> => {
    const ids = readPending();
    if (!ids.length) return null;
    const local = readLocal();
    let latest: CustomPattern[] | null = null;
    for (const id of ids) {
      const p = local.find((x) => x.id === id);
      if (!p) {
        clearPending(id);
        continue;
      }
      const res = await store.save(p);
      if (res.ok) {
        clearPending(id);
        if (res.list) latest = res.list;
      } else if (res.error === 'network' || res.error === 'unsupported' || res.error === 'busy') {
        // 연결이 아직이면 여기서 멈춘다 — 다음 새로고침에 다시 시도한다
        throw new Error('offline');
      } else {
        // 서버가 받아 주지 않는 도안이면 계속 붙들고 있지 않는다
        clearPending(id);
      }
    }
    return latest;
  }, []);

  const refresh = useCallback(async () => {
    const shared = sharedRef.current;
    if (!shared) {
      const local = readLocal();
      if (!alive.current) return;
      setList(local);
      setReady(true);
      return;
    }
    if (syncing.current) return;
    syncing.current = true;
    try {
      // 올릴 것이 있으면 먼저 올린다. 그 응답에 최신 목록이 담겨 오므로 한 번 덜 다녀온다.
      const pushed = await pushPending(shared);
      const fresh = pushed ?? (await shared.load());
      const stillPending = readPending();
      const local = readLocal();
      const extras = local.filter((p) => stillPending.includes(p.id));
      if (!alive.current) return;
      setList(mergeLists(fresh, extras));
      setOnline(true);
      setPending(stillPending.length);
      setReady(true);
    } catch {
      showLocalOnly();
    } finally {
      syncing.current = false;
    }
  }, [pushPending, showLocalOnly]);

  useEffect(() => {
    alive.current = true;
    refresh();
    const timer = hasShared ? window.setInterval(refresh, REFRESH_MS) : undefined;
    // 태블릿을 다시 켜거나 화면으로 돌아왔을 때 곧바로 맞춰 준다
    const onWake = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', onWake);
    return () => {
      alive.current = false;
      if (timer) window.clearInterval(timer);
      window.removeEventListener('online', refresh);
      document.removeEventListener('visibilitychange', onWake);
    };
  }, [refresh, hasShared]);

  const save = useCallback(
    async (pattern: CustomPattern): Promise<PatternResult> => {
      setBusy(true);
      // 무엇보다 먼저 이 기기에 남긴다 — 통신이 어떻게 되든 만든 도안은 잃지 않는다
      const bad = await localPatternStore.save(pattern);
      if (!bad.ok) {
        if (alive.current) setBusy(false);
        return bad;
      }
      mirrorLocal(pattern);

      const shared = sharedRef.current;
      let res: PatternResult = { ok: true, list: readLocal() };
      if (shared) {
        const up = await shared.save(pattern);
        if (up.ok) {
          clearPending(pattern.id);
          const stillPending = readPending();
          const extras = readLocal().filter((p) => stillPending.includes(p.id));
          res = { ok: true, list: mergeLists(up.list ?? [], extras) };
          if (alive.current) {
            setOnline(true);
            setPending(stillPending.length);
          }
        } else if (up.error === 'network' || up.error === 'unsupported' || up.error === 'busy') {
          // 연결 문제 — 나중에 자동으로 올린다
          markPending(pattern.id);
          if (alive.current) {
            setOnline(false);
            setPending(readPending().length);
          }
        } else {
          // 형식 문제는 이 기기 저장에서도 이미 걸러졌어야 한다 — 그대로 알린다
          dropLocal(pattern.id);
          if (alive.current) setBusy(false);
          return up;
        }
      }
      if (alive.current) {
        if (res.list) setList(res.list);
        setBusy(false);
      }
      return res;
    },
    [],
  );

  const remove = useCallback(async (id: string): Promise<PatternResult> => {
    setBusy(true);
    const shared = sharedRef.current;
    let found = readLocal().some((p) => p.id === id);
    if (shared) {
      const res = await shared.remove(id);
      if (res.ok) {
        found = true;
        if (alive.current) setOnline(true);
      }
    }
    dropLocal(id);
    const stillPending = readPending();
    const local = readLocal();
    let next = local;
    if (shared) {
      try {
        const fresh = await shared.load();
        next = mergeLists(
          fresh,
          local.filter((p) => stillPending.includes(p.id)),
        );
      } catch {
        next = local;
      }
    }
    if (alive.current) {
      setList(next);
      setPending(shared ? stillPending.length : 0);
      setBusy(false);
    }
    return found ? { ok: true, list: next } : { ok: false, error: 'notfound' };
  }, []);

  const storeLabel = !hasShared
    ? '이 기기에만 저장'
    : !online
      ? '연결 끊김 — 이 기기에 보관 중'
      : pending > 0
        ? `스프레드시트 공유 도안 · ${pending}개 올리는 중`
        : '스프레드시트 공유 도안';

  return { list, ready, busy, shared: hasShared, online, pending, storeLabel, save, remove, refresh };
}
