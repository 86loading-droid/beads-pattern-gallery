import { useCallback, useEffect, useRef, useState } from 'react';
import {
  localPatternStore,
  pickPatternStore,
  type CustomPattern,
  type PatternResult,
  type PatternStore,
} from '../data/patternStore';

/** 다른 태블릿에서 만든 도안을 반영하기 위한 재조회 간격 (밀리초) */
const REFRESH_MS = 60000;

/**
 * 앱에서 직접 만든 도안 목록.
 *
 * 스프레드시트 공유 저장을 먼저 시도하고, 스프레드시트 쪽이 아직 도안을 다룰 준비가
 * 안 되어 있으면 이 기기 저장소로 조용히 내려앉습니다. 강사는 어느 쪽이든 바로 쓸 수 있고,
 * 지금 어디에 저장되는지는 화면에 그대로 표시합니다.
 */
export function useCustomPatterns() {
  const [list, setList] = useState<CustomPattern[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const storeRef = useRef<PatternStore>(pickPatternStore());
  const [store, setStore] = useState<PatternStore>(storeRef.current);
  const alive = useRef(true);

  const fallBack = useCallback(async () => {
    // 공유 저장이 불가능한 상태 — 이 기기 저장소로 바꾸고 그쪽 목록을 읽는다
    storeRef.current = localPatternStore;
    if (alive.current) setStore(localPatternStore);
    return localPatternStore.load();
  }, []);

  const refresh = useCallback(async () => {
    let next: CustomPattern[] = [];
    try {
      next = await storeRef.current.load();
    } catch {
      next = await fallBack();
    }
    if (!alive.current) return;
    setList(next);
    setReady(true);
  }, [fallBack]);

  useEffect(() => {
    alive.current = true;
    refresh();
    const timer = store.shared ? window.setInterval(refresh, REFRESH_MS) : undefined;
    return () => {
      alive.current = false;
      if (timer) window.clearInterval(timer);
    };
  }, [refresh, store.shared]);

  /** 공유 저장이 이 동작을 못 받아 주면 이 기기 저장소로 한 번 더 시도한다 */
  const apply = useCallback(
    async (run: (s: PatternStore) => Promise<PatternResult>): Promise<PatternResult> => {
      setBusy(true);
      let res = await run(storeRef.current);
      if (!res.ok && (res.error === 'unsupported' || res.error === 'network') && storeRef.current.shared) {
        storeRef.current = localPatternStore;
        if (alive.current) setStore(localPatternStore);
        res = await run(localPatternStore);
      }
      if (alive.current) {
        if (res.ok && res.list) setList(res.list);
        setBusy(false);
      }
      return res;
    },
    [],
  );

  const save = useCallback((pattern: CustomPattern) => apply((s) => s.save(pattern)), [apply]);
  const remove = useCallback((id: string) => apply((s) => s.remove(id)), [apply]);

  return { list, ready, busy, shared: store.shared, storeLabel: store.label, save, remove, refresh };
}
