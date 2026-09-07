/**
 * 재고·도안 서버(구글 Apps Script)와 이야기하는 통로.
 *
 * 먼저 보통 방식(POST)으로 보내고, 그것이 막히면 <script> 태그 방식으로 한 번 더 보냅니다.
 * 아이폰 사파리처럼 다른 사이트로 보내는 요청을 막는 환경이 있어서, 한 쪽이 막혀도
 * 다른 쪽으로 통하도록 두 갈래를 둡니다. 한 번 성공한 방식은 기억해 두었다가 먼저 씁니다.
 */

/** 서버가 깨어나는 데 시간이 걸릴 수 있어 넉넉히 잡는다 */
const TIMEOUT_MS = 20000;

export interface ApiEnvelope {
  ok: boolean;
  error?: string;
  [key: string]: unknown;
}

type Route = 'post' | 'script';

/** 주소마다 잘 통했던 방식을 기억해 둔다 */
const preferred = new Map<string, Route>();

async function viaPost(
  url: string,
  key: string,
  action: string,
  payload: Record<string, unknown>,
): Promise<ApiEnvelope> {
  const control = new AbortController();
  const timer = window.setTimeout(() => control.abort(), TIMEOUT_MS);
  try {
    // Content-Type을 text/plain으로 보내는 이유: 다른 형식이면 브라우저가 사전 확인 요청을
    // 먼저 보내는데 Apps Script가 이를 처리하지 못해 요청이 막힙니다.
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ key, action, ...payload }),
      redirect: 'follow',
      signal: control.signal,
    });
    if (!res.ok) throw new Error(`http_${res.status}`);
    return (await res.json()) as ApiEnvelope;
  } finally {
    window.clearTimeout(timer);
  }
}

let seq = 0;

function viaScript(
  url: string,
  key: string,
  action: string,
  payload: Record<string, unknown>,
): Promise<ApiEnvelope> {
  return new Promise((resolve, reject) => {
    seq += 1;
    const name = `beadsCb${Date.now().toString(36)}${seq}`;
    const tag = document.createElement('script');
    let settled = false;

    const cleanup = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      delete (window as unknown as Record<string, unknown>)[name];
      tag.remove();
    };

    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('timeout'));
    }, TIMEOUT_MS);

    (window as unknown as Record<string, unknown>)[name] = (data: ApiEnvelope) => {
      cleanup();
      resolve(data);
    };

    tag.onerror = () => {
      cleanup();
      reject(new Error('script_failed'));
    };

    const query = new URLSearchParams({
      key,
      action,
      payload: JSON.stringify(payload),
      callback: name,
    });
    tag.src = `${url}?${query.toString()}`;
    document.head.appendChild(tag);
  });
}

/** 어느 방식으로든 서버에 한 번 다녀온다 */
export async function callApi(
  url: string,
  key: string,
  action: string,
  payload: Record<string, unknown> = {},
): Promise<ApiEnvelope> {
  const first: Route = preferred.get(url) ?? 'post';
  const second: Route = first === 'post' ? 'script' : 'post';
  const run = (route: Route) =>
    route === 'post' ? viaPost(url, key, action, payload) : viaScript(url, key, action, payload);

  try {
    const data = await run(first);
    preferred.set(url, first);
    return data;
  } catch {
    const data = await run(second);
    preferred.set(url, second);
    return data;
  }
}
