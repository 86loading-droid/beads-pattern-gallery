import { callApi } from './api';

/**
 * 모든 태블릿이 함께 보는 설정.
 *
 * 지금은 '추천 도안 목록' 하나를 담습니다. 스프레드시트에 저장하므로 한 대에서 고르면
 * 다른 태블릿에도 곧 반영됩니다. 스프레드시트가 없거나 연결이 끊기면 이 기기에만 남습니다.
 */

/** 스프레드시트 설정 시트에 쓰는 이름 */
export const RECOMMEND_KEY = 'recommendedIds';

const LOCAL_KEY = 'beadsettings.v1';

type Settings = Record<string, string>;

function readLocal(): Settings {
  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}') as unknown;
    return raw && typeof raw === 'object' ? (raw as Settings) : {};
  } catch {
    return {};
  }
}

function writeLocal(map: Settings) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(map));
  } catch {
    // 저장 공간이 막혀 있어도 화면 동작은 막지 않는다
  }
}

function endpoint(): { url: string; key: string } | null {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  const url = (env.VITE_STOCK_API ?? '').trim();
  if (!url) return null;
  return { url, key: (env.VITE_STOCK_KEY ?? '').trim() };
}

/** true면 고른 추천이 다른 태블릿에도 퍼집니다 */
export const settingsShared = endpoint() !== null;

export function localSettings(): Settings {
  return readLocal();
}

export async function loadSettings(): Promise<Settings> {
  const at = endpoint();
  if (!at) return readLocal();
  const data = await callApi(at.url, at.key, 'settings');
  if (!data.ok) throw new Error(data.error || 'load_failed');
  const map = (data.settings ?? {}) as Settings;
  writeLocal(map);
  return map;
}

/** 돌려주는 값은 '공유 저장까지 되었는가' 입니다 */
export async function saveSetting(name: string, value: string): Promise<boolean> {
  writeLocal({ ...readLocal(), [name]: value });
  const at = endpoint();
  if (!at) return false;
  try {
    const data = await callApi(at.url, at.key, 'setSetting', { name, value });
    if (data.ok && data.settings) writeLocal(data.settings as Settings);
    return Boolean(data.ok);
  } catch {
    return false;
  }
}

/** "a,b,c" 를 목록으로 */
export const parseIds = (raw: string | undefined): string[] =>
  (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
