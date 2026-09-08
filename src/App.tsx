// 앱 진입점 — 시작 화면, 갤러리, 도안 상세(재고 차감), 도안 만들기, 재고 현황을 잇는다.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Home } from 'lucide-react';
import StartScreen from './components/StartScreen';
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
  ALL_SELECTED,
  derivePattern,
  filterPatterns,
  type Pattern,
  type PatternSelection,
  type PatternSource,
} from './types/pattern';

type View = 'start' | 'gallery' | 'detail' | 'stock' | 'editor' | 'recommend';

export default function App() {
  const [view, setView] = useState<View>('start');
  const [selection, setSelection] = useState<PatternSelection>(ALL_SELECTED);
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
    if (view === 'detail' || view === 'stock') {
      setView('gallery');
      return true;
    }
    if (view === 'recommend') {
      setView('start');
      return true;
    }
    if (view === 'gallery') {
      setSelection(ALL_SELECTED);
      setView('start');
      return true;
    }
    if (view === 'editor') {
      say('도안을 만드는 중이에요. 나가려면 취소 버튼을 눌러 주세요.');
      return true;
    }
    say('첫 화면이에요. 화면 안의 버튼으로 움직여 주세요.');
    return true;
  }, [say, view]);
  useBackGuard(handleBack);

  // 직접 만든 도안을 앞에 두어 최근 만든 것이 먼저 보이게 한다
  const all: Pattern[] = useMemo(
    () => [...mine.list.map(derivePattern), ...PATTERNS],
    [mine.list],
  );

  const countFor = useCallback((partial: PatternSelection) => filterPatterns(all, partial).length, [all]);

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
  const list = useMemo(() => filterPatterns(all, selection), [all, selection]);
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
    setSelection(ALL_SELECTED);
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
            setView('gallery');
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
        <StartScreen
          key={homeNonce}
          countFor={countFor}
          recommended={recommended}
          recommendNote={
            chosenIds.length
              ? picks.shared && picks.synced
                ? '강사가 고른 도안입니다. 모든 태블릿에 같이 보입니다.'
                : '강사가 고른 도안입니다. 지금은 이 기기에만 저장돼 있어요.'
              : '고르기 어려우면 여기서 바로 시작해도 좋아요. 매일 바뀝니다.'
          }
          onPick={() => setView('recommend')}
          onOpen={(id) => {
            setOpenId(id);
            setView('detail');
          }}
          onComplete={(next) => {
            setSelection(next);
            setView('gallery');
          }}
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
          onBack={() => setView('gallery')}
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
          onBack={() => setView('gallery')}
        />
      </>
    );
  }

  return (
    <>
      {header}
      {banner}
      <section className="mx-auto w-full max-w-3xl px-4 py-6 text-[#5D4037] md:px-7 lg:max-w-5xl">
        <h1 className="text-3xl font-extrabold">이런 도안이 있어요</h1>
        <p className="mt-1 text-sm text-[#8A7263]">
          {list.length}개 도안
          {mine.list.length ? ` · 직접 만든 도안 ${mine.list.length}개 (${mine.storeLabel})` : ''}
        </p>
        {mine.shared && (!mine.online || mine.pending > 0) ? (
          <p className="mt-2 rounded-xl border-2 border-[#EACB9B] bg-[#FFF8EC] px-3 py-2 text-sm text-[#7A5A2E]">
            {mine.pending > 0
              ? `직접 만든 도안 ${mine.pending}개가 아직 이 태블릿에만 있습니다. 인터넷이 연결되면 자동으로 올라가고, 그때부터 다른 태블릿에서도 보입니다.`
              : '지금 공유 저장소에 연결되지 않았습니다. 만든 도안은 이 태블릿에 안전하게 보관되며, 연결되면 자동으로 올라갑니다.'}
            <button
              type="button"
              onClick={mine.refresh}
              className="ml-2 rounded-lg border-2 border-[#EACB9B] px-2 py-0.5 text-xs font-bold"
            >
              지금 맞추기
            </button>
          </p>
        ) : null}

        <div className="mt-4 grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
          <button
            type="button"
            onClick={startNew}
            className="flex min-h-[168px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#E4572E] bg-[#FFF6F1] p-3.5 text-[#E4572E]"
          >
            <span className="text-3xl leading-none">＋</span>
            <span className="font-bold">새 도안 만들기</span>
            <span className="text-xs">직접 칠해서 추가해요</span>
          </button>

          {list.map((p) => {
            const short = inv.shortagesFor(p.need);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setOpenId(p.id);
                  setView('detail');
                }}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 bg-white p-3.5 ${
                  p.custom ? 'border-[#E4572E]' : 'border-[#EADBC6]'
                }`}
              >
                <span className="w-20">
                  <PatternGrid rows={p.rows} title={p.title} />
                </span>
                <span className="font-bold">{p.title}</span>
                <span className="text-xs tabular-nums text-[#8A7263]">
                  {p.cols}×{p.rowCount} · {p.colorCount}색 · 비즈 {formatCount(p.beads)}개
                </span>
                {p.custom ? <span className="text-[11px] font-bold text-[#E4572E]">직접 만든 도안</span> : null}
                {short.length > 0 ? (
                  <span className="text-[11px] font-bold text-[#B3261E]">
                    재고 부족 {short.map((k) => COLOR_NAME[k]).join(', ')}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            setSelection(ALL_SELECTED);
            setView('start');
          }}
          className="mt-6 rounded-xl border-2 border-[#D8C2A6] px-4 py-2.5 font-bold"
        >
          ← 처음부터 다시 고르기
        </button>
      </section>
    </>
  );
}
