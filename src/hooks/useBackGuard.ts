import { useEffect, useRef } from 'react';

/**
 * 뒤로가기 오작동 방지.
 *
 * 태블릿에서 아이가 화면 가장자리를 쓸거나(아이폰) 뒤로가기 버튼을 누르면(갤럭시)
 * 만들던 도안이나 재고 화면이 통째로 닫히는 일이 생깁니다.
 * 여기서는 방문 기록에 되돌아올 자리를 하나 만들어 두고, 뒤로가기가 들어올 때마다
 * 그 자리를 다시 채워 넣습니다. 그래서 뒤로가기는 앱 밖으로 나가지 않고
 * 앱 안에서 '이전 화면으로'만 움직입니다.
 *
 * onBack은 화면 이동을 처리하고, 더 돌아갈 곳이 없으면 false를 돌려주면 됩니다.
 */
export function useBackGuard(onBack: () => boolean) {
  const handler = useRef(onBack);
  handler.current = onBack;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const arm = () => {
      try {
        window.history.pushState({ beadGuard: true }, '');
      } catch {
        // 방문 기록을 쓸 수 없는 환경(파일로 직접 열기 등)에서는 그냥 넘어간다
      }
    };

    arm();
    const onPop = () => {
      handler.current();
      // 어떤 경우에도 앱 밖으로 나가지 않도록 되돌아올 자리를 다시 만든다
      arm();
    };

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
}
