import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RECOMMEND_KEY,
  loadSettings,
  localSettings,
  parseIds,
  saveSetting,
  settingsShared,
} from '../data/settingsStore';

/** 다른 태블릿에서 바꾼 추천을 반영하기 위한 재조회 간격 (밀리초) */
const REFRESH_MS = 20000;

/**
 * 강사가 직접 고른 추천 도안 목록.
 * 비어 있으면 앱이 날짜에 따라 자동으로 고릅니다.
 */
export function useRecommendPicks() {
  const [ids, setIds] = useState<string[]>(() => parseIds(localSettings()[RECOMMEND_KEY]));
  const [busy, setBusy] = useState(false);
  /** 마지막 저장이 공유 저장소까지 갔는가 */
  const [synced, setSynced] = useState(settingsShared);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const map = await loadSettings();
      if (!alive.current) return;
      setIds(parseIds(map[RECOMMEND_KEY]));
      setSynced(settingsShared);
    } catch {
      // 연결이 안 되면 이 기기에 남아 있는 값을 그대로 쓴다
      if (alive.current) setSynced(false);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    refresh();
    const timer = settingsShared ? window.setInterval(refresh, REFRESH_MS) : undefined;
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
  }, [refresh]);

  const save = useCallback(async (next: string[]) => {
    setBusy(true);
    setIds(next);
    const ok = await saveSetting(RECOMMEND_KEY, next.join(','));
    if (alive.current) {
      setSynced(ok);
      setBusy(false);
    }
    return ok;
  }, []);

  return { ids, busy, synced, shared: settingsShared, save, refresh };
}
