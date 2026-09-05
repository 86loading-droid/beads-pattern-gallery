import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { INITIAL_STOCK } from '../data/inventory';
import { pickStore, type StockState, type StockStore, type StoreResult } from '../data/stockStore';
import type { BeadCount, ColorKey, Pattern } from '../types/pattern';

/** 다른 태블릿의 변경을 반영하기 위한 재조회 간격 (밀리초) */
const REFRESH_MS = 30000;

const emptyState = (): StockState => ({ stock: { ...INITIAL_STOCK }, logs: [] });

/**
 * 비즈 재고 관리.
 * 저장 위치는 stockStore가 정합니다. 배포본에서는 구글 스프레드시트를 쓰고,
 * 주소가 없으면 이 기기 저장소로 자동 전환됩니다.
 * 남기는 기록은 소비(완성·부분 사용)뿐이며 담당자 정보는 수집하지 않습니다.
 */
export function useInventory(store: StockStore = pickStore()) {
  const [{ stock, logs }, setState] = useState<StockState>(emptyState);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const next = await store.load();
      if (!alive.current) return;
      setState(next);
      setOffline(false);
    } catch {
      if (alive.current) setOffline(true);
    } finally {
      if (alive.current) setReady(true);
    }
  }, [store]);

  useEffect(() => {
    alive.current = true;
    refresh();
    // 공유 재고일 때만 주기적으로 다시 읽는다 (이 기기 저장소는 스스로 바뀔 일이 없다)
    const timer = store.shared ? window.setInterval(refresh, REFRESH_MS) : undefined;
    return () => {
      alive.current = false;
      if (timer) window.clearInterval(timer);
    };
  }, [refresh, store.shared]);

  const total = useMemo(() => (Object.values(stock) as number[]).reduce((a, b) => a + b, 0), [stock]);
  const usedTotal = useMemo(() => logs.reduce((a, e) => a + e.total, 0), [logs]);

  const shortagesFor = useCallback(
    (need: BeadCount): ColorKey[] =>
      (Object.keys(need) as ColorKey[]).filter((k) => (stock[k] ?? 0) < (need[k] ?? 0)),
    [stock],
  );

  const apply = useCallback(async (run: () => Promise<StoreResult>): Promise<StoreResult> => {
    setBusy(true);
    const res = await run();
    if (alive.current) {
      if (res.ok && res.state) {
        setState(res.state);
        setOffline(false);
      } else if (res.error === 'network') {
        setOffline(true);
      }
      setBusy(false);
    }
    return res;
  }, []);

  /**
   * 사용 수량만큼 재고를 차감하고 소비 기록을 남긴다.
   * used를 생략하면 도안 전량(완성), 넘기면 실제 사용량(부분 사용).
   */
  const consume = useCallback(
    (pattern: Pattern, used?: BeadCount) =>
      apply(() =>
        store.consume({
          title: pattern.title,
          kind: used ? '부분 사용' : '완성',
          used: used ?? pattern.need,
        }),
      ),
    [apply, store],
  );

  /** 잘못 남은 소비 기록을 지우고 그만큼 재고를 되돌린다 */
  const removeEntry = useCallback((id: string) => apply(() => store.removeEntry(id)), [apply, store]);

  /** 재고 수량을 직접 고친다 — 소비 기록에는 남지 않고 잔량에만 반영된다 */
  const adjustStock = useCallback(
    (next: Partial<Record<ColorKey, number>>) => apply(() => store.adjust(next)),
    [apply, store],
  );

  return {
    stock,
    logs,
    total,
    usedTotal,
    ready,
    busy,
    offline,
    shared: store.shared,
    storeLabel: store.label,
    shortagesFor,
    consume,
    removeEntry,
    adjustStock,
    refresh,
  };
}
