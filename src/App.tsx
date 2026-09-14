// 앱 진입점 — 시작 화면, 갤러리, 도안 상세(재고 차감), 도안 만들기, 재고 현황을 잇는다.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Home } from 'lucide-react';
import CategoryHome from './components/CategoryHome';
import DifficultyPick from './components/DifficultyPick';
import PatternBrowse from './components/PatternBrowse';
import PatternDetail from './components/PatternDetail';
import PatternEditor from './components/PatternEditor';
import PatternGrid from './components/PatternGrid';
import InventoryPanel from './components/InventoryPanel';
import RecommendPicker, { MAX_PICKS } from './components/RecommendPicker';
import { useInventory } from './hooks/useInventory';
import { useCustomPatterns } from './hooks/useCustomPatterns';
import { useBackGuard } from './hooks/useBackGuard';
import { useRecommendPicks } from './hooks/useRecommendPicks';
import { PATTERNS } from './data/patterns';
import { pickRecommended } from './data/recommend';
import { COLOR_NAME, formatCount } from './data/inventory';
import {
  derivePattern,
  type CategoryId,
  type DifficultyId,
  type Pattern,
  type PatternSource,
} from './types/pattern';

type View = 'start' | 'difficulty' | 'browse' | 'detail' | 'stock' | 'editor' | 'recommend';

export default function App() {
  const [view, setView] = useState<View>('start');
  /** 지금 고른 주제와 난이도 — 'all'이면 가리지 않음 */
  const [pickedCategory, setPickedCategory] = useState<CategoryId | 'all'>('all');
  const [pickedDifficulty, setPickedDifficulty] = useState<DifficultyId | 'all'>('all');
  /** 도안을 어느 화면에서 열었는지 — 닫을 때 그 자리로 돌아가기 위해 */
  const [cameFrom, setCameFrom] = useState<View>('browse');
  const [openId, setOpenId] = useState<string | null>(null);
  /** 편집기에 넘길 원본 — null이면 빈 도안부터 시작 */
  const [editBase, setEditBase] = useState<{ source: PatternSource; copy: boolean } | null>(null);
  const [notice, setNotice] = useState('');
  const noticeTimer = useRef<number | undefined>(undefined);
  const inv = useInventory();
  const mine = useCustomPatterns();
  const picks = useRecommendPicks();
  /** 첫 화면 버튼을 누를 때마다 올라가는 값 — 3단계 고르기를 1단계로 되돌린다 */
  const [homeNonce, setHomeNonce] = useState(0);
  /** 도안을 만드는 중에 첫 화면으로 나가려 할 때의 재확인 */
  const leaveEditor = useRef(false);

  /** 화면 아래에 잠깐 떴다 사라지는 안내 */
  const say = useCallback((text: string) => {
    setNotice(text);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(''), 2600);
  }, []);
  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  /**
   * 뒤로가기(갤럭시 뒤로가기 버튼 · 아이폰 화면 쓸기)는 앱 밖으로 나가지 않고
   * 앱 안에서 한 단계만 돌아갑니다. 도안을 만드는 중에는 잠가 둡니다.
   */
  const handleBack = useCallback(() => {
    if (view === 'detail') {
      setView(cameFrom);
      return true;
    }
    if (view === 'stock') {
      setView('browse');
      return true;
    }
    if (view === 'browse') {
      setView('difficulty');
      return true;
    }
    if (view === 'difficulty' || view === 'recommend') {
      setView('start');
      return true;
    }
    if (view === 'editor') {
      say('도안을 만드는 중이에요. 나가려면 취소 버튼을 눌러 주세요.');
      return true;
    }
    say('첫 화면이에요. 화면 안의 버튼으로 움직여 주세요.');
    return true;
  }, [cameFrom, say, view]);
  useBackGuard(handleBack);

  // 직접 만든 도안을 앞에 두어 최근 만든 것이 먼저 보이게 한다
  const all: Pattern[] = useMemo(
    () => [...mine.list.map(derivePattern), ...PATTERNS],
    [mine.list],
  );

  /** 고른 주제에 속한 도안 */
  const inCategory = useMemo(
    () => (pickedCategory === 'all' ? all : all.filter((p) => p.category === pickedCategory)),
    [all, pickedCategory],
  );
  /** 거기서 다시 난이도로 거른 도안 — 넘겨 보기 화면에 들어갑니다 */
  const browseList = useMemo(
    () =>
      pickedDifficulty === 'all'
        ? inCategory
        : inCategory.filter((p) => p.difficulty === pickedDifficulty),
    [inCategory, pickedDifficulty],
  );

  /**
   * 첫 화면에 걸 추천 도안.
   * 강사가 고른 것이 있으면 그대로, 없으면 날짜에 따라 자동으로 고릅니다.
   */
  const shortagesFor = inv.shortagesFor;
  const chosenIds = picks.ids;
  const recommended = useMemo(() => {
    const chosen = chosenIds
      .map((id) => all.find((p) => p.id === id))
      .filter((p): p is Pattern => Boolean(p))
      .slice(0, MAX_PICKS);
    if (chosen.length) return chosen;
    return pickRecommended(all, (p) => shortagesFor(p.need).length === 0);
  }, [all, chosenIds, shortagesFor]);
  const open = openId ? all.find((p) => p.id === openId) ?? null : null;

  /** 어느 화면에서든 첫 화면으로 — 도안을 만드는 중이면 한 번 더 확인한다 */
  const goHome = useCallback(() => {
    if (view === 'editor' && !leaveEditor.current) {
      leaveEditor.current = true;
      say('만들던 도안이 사라져요. 한 번 더 누르면 첫 화면으로 갑니다.');
      window.setTimeout(() => {
        leaveEditor.current = false;
      }, 4000);
      return;
    }
    leaveEditor.current = false;
    setEditBase(null);
    setOpenId(null);
    setPickedCategory('all');
    setPickedDifficulty('all');
    setHomeNonce((n) => n + 1);
    setView('start');
  }, [say, view]);

  function startNew() {
    setEditBase(null);
    setView('editor');
  }

  function startFrom(source: PatternSource, copy: boolean) {
    setEditBase({ source, copy });
    setView('editor');
  }

  const banner = notice ? (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4"
    >
      <p className="rounded-full border-2 border-[#D8C2A6] bg-[#5D4037] px-4 py-2 text-sm font-bold text-[#FFFBF0] shadow-lg">
        {notice}
      </p>
    </div>
  ) : null;

  const header = (
    <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-4 pt-4 text-[#5D4037] md:px-7 lg:max-w-5xl">
      <button
        type="button"
        onClick={goHome}
        className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#D8C2A6] px-3 py-1.5 text-xs font-bold
                   text-[#5D4037] hover:bg-[#F5EADB] focus-visible:outline-none focus-visible:ring-4
                   focus-visible:ring-[#5D4037]/30"
      >
        <Home size={14} aria-hidden="true" /> 첫 화면
      </button>
      <span className="mr-auto text-sm text-[#8A7263]">컬러비즈 도안 갤러리</span>
      <span className="text-xs text-[#8A7263]">{inv.offline ? '재고 서버 연결 끊김' : inv.storeLabel}</span>
      <button
        type="button"
        onClick={startNew}
        className="rounded-full border-2 border-[#E4572E] px-3 py-1.5 text-xs font-bold text-[#E4572E]"
      >
        + 도안 만들기
      </button>
      <button
        type="button"
        onClick={() => setView('stock')}
        className="rounded-full border-2 border-[#D8C2A6] px-3 py-1.5 text-xs font-bold tabular-nums"
      >
        남은 비즈 {formatCount(inv.total)}
      </button>
    </div>
  );

  if (!inv.ready) {
    return (
      <>
        {header}
        {banner}
        <p className="mx-auto max-w-3xl px-4 py-10 text-center text-[#8A7263]">재고를 불러오는 중입니다…</p>
      </>
    );
  }

  if (view === 'editor') {
    return (
      <>
        {header}
        {banner}
        <PatternEditor
          initial={editBase?.source ?? null}
          copy={editBase?.copy ?? false}
          stock={inv.stock}
          busy={mine.busy}
          storeLabel={mine.storeLabel}
          onSave={mine.save}
          onDelete={mine.remove}
          onBack={() => {
            setEditBase(null);
            setView('browse');
          }}
        />
      </>
    );
  }

  if (view === 'start') {
    return (
      <>
        {header}
        {banner}
        <CategoryHome
          key={homeNonce}
          all={all}
          recommended={recommended}
          recommendNote={
            chosenIds.length
              ? picks.shared && picks.synced
                ? '강사가 고른 도안입니다. 모든 태블릿에 같이 보입니다.'
                : '강사가 고른 도안입니다. 지금은 이 기기에만 저장돼 있어요.'
              : '고르기 어려우면 여기서 바로 시작해도 좋아요. 매일 바뀝니다.'
          }
          onPickRecommend={() => setView('recommend')}
          onOpen={(id) => {
            setOpenId(id);
            setCameFrom('start');
            setView('detail');
          }}
          onPickCategory={(id) => {
            setPickedCategory(id);
            setPickedDifficulty('all');
            setView('difficulty');
          }}
        />
      </>
    );
  }

  if (view === 'difficulty') {
    return (
      <>
        {header}
        {banner}
        <DifficultyPick
          category={pickedCategory}
          patterns={inCategory}
          shortagesFor={shortagesFor}
          onOpen={(id) => {
            setOpenId(id);
            setCameFrom('difficulty');
            setView('detail');
          }}
          onPick={(d) => {
            setPickedDifficulty(d);
            setView('browse');
          }}
          onBack={() => setView('start')}
        />
      </>
    );
  }

  if (view === 'browse') {
    return (
      <>
        {header}
        {banner}
        <PatternBrowse
          patterns={browseList}
          category={pickedCategory}
          difficulty={pickedDifficulty}
          shortagesFor={shortagesFor}
          onOpen={(id) => {
            setOpenId(id);
            setCameFrom('browse');
            setView('detail');
          }}
          onBack={() => setView('difficulty')}
          onNewPattern={startNew}
        />
      </>
    );
  }

  if (view === 'recommend') {
    return (
      <>
        {header}
        {banner}
        <RecommendPicker
          all={all}
          current={chosenIds}
          busy={picks.busy}
          shared={picks.shared}
          onBack={() => setView('start')}
          onSave={async (ids) => {
            const ok = await picks.save(ids);
            say(
              ids.length === 0
                ? '자동 추천으로 되돌렸어요.'
                : ok
                  ? `추천 도안 ${ids.length}개를 모든 태블릿에 걸었어요.`
                  : `추천 도안 ${ids.length}개를 이 기기에 저장했어요. 연결되면 다른 태블릿에도 퍼집니다.`,
            );
            setView('start');
          }}
        />
      </>
    );
  }

  if (view === 'stock') {
    return (
      <>
        {header}
        {banner}
        <InventoryPanel
          stock={inv.stock}
          logs={inv.logs}
          usedTotal={inv.usedTotal}
          onAdjust={inv.adjustStock}
          onRemove={inv.removeEntry}
          onBack={() => setView('browse')}
        />
      </>
    );
  }

  if (view === 'detail' && open) {
    return (
      <>
        {header}
        {banner}
        <PatternDetail
          pattern={open}
          stock={inv.stock}
          shortages={inv.shortagesFor(open.need)}
          onConsume={inv.consume}
          onEdit={() => startFrom(open, !open.custom)}
          onBack={() => setView(cameFrom)}
        />
      </>
    );
  }

  // 남은 경우는 모두 넘겨 보기 화면으로 — 화면 상태가 어긋나도 빈 화면이 뜨지 않게 한다
  return (
    <>
      {header}
      {banner}
      <PatternBrowse
        patterns={browseList}
        category={pickedCategory}
        difficulty={pickedDifficulty}
        shortagesFor={shortagesFor}
        onOpen={(id) => {
          setOpenId(id);
          setView('detail');
        }}
        onBack={() => setView('difficulty')}
        onNewPattern={startNew}
      />
    </>
  );
}
