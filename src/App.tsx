// 앱 진입점 — 시작 화면, 갤러리, 도안 상세(재고 차감), 재고 현황을 잇는다.
// 기존 App.tsx의 갤러리 렌더링만 아래 gallery 블록 자리에 넣으면 됩니다.

import { useCallback, useMemo, useState } from 'react';
import StartScreen from './components/StartScreen';
import PatternDetail from './components/PatternDetail';
import PatternGrid from './components/PatternGrid';
import InventoryPanel from './components/InventoryPanel';
import { useInventory } from './hooks/useInventory';
import { PATTERNS } from './data/patterns';
import { COLOR_NAME, formatCount } from './data/inventory';
import { ALL_SELECTED, filterPatterns, type PatternSelection } from './types/pattern';

type View = 'start' | 'gallery' | 'detail' | 'stock';

export default function App() {
  const [view, setView] = useState<View>('start');
  const [selection, setSelection] = useState<PatternSelection>(ALL_SELECTED);
  const [openId, setOpenId] = useState<string | null>(null);
  const inv = useInventory();

  const countFor = useCallback((partial: PatternSelection) => filterPatterns(PATTERNS, partial).length, []);
  const list = useMemo(() => filterPatterns(PATTERNS, selection), [selection]);
  const open = openId ? PATTERNS.find((p) => p.id === openId) ?? null : null;

  const header = (
    <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 pt-4 text-[#5D4037] md:px-7 lg:max-w-5xl">
      <span className="mr-auto text-sm text-[#8A7263]">컬러비즈 도안 갤러리</span>
      <span className="text-xs text-[#8A7263]">
        {inv.offline ? '재고 서버 연결 끊김' : inv.storeLabel}
      </span>
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
        <p className="mx-auto max-w-3xl px-4 py-10 text-center text-[#8A7263]">재고를 불러오는 중입니다…</p>
      </>
    );
  }

  if (view === 'start') {
    return (
      <>
        {header}
        <StartScreen
          countFor={countFor}
          onComplete={(next) => {
            setSelection(next);
            setView('gallery');
          }}
        />
      </>
    );
  }

  if (view === 'stock') {
    return (
      <>
        {header}
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
        <PatternDetail
          pattern={open}
          stock={inv.stock}
          shortages={inv.shortagesFor(open.need)}
          onConsume={inv.consume}
          onBack={() => setView('gallery')}
        />
      </>
    );
  }

  return (
    <>
      {header}
      <section className="mx-auto w-full max-w-3xl px-4 py-6 text-[#5D4037] md:px-7 lg:max-w-5xl">
        <h1 className="text-3xl font-extrabold">이런 도안이 있어요</h1>
        <p className="mt-1 text-sm text-[#8A7263]">{list.length}개 도안</p>

        <div className="mt-4 grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
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
                className="flex flex-col items-center gap-2 rounded-2xl border-2 border-[#EADBC6] bg-white p-3.5"
              >
                <span className="w-20">
                  <PatternGrid rows={p.rows} title={p.title} />
                </span>
                <span className="font-bold">{p.title}</span>
                <span className="text-xs tabular-nums text-[#8A7263]">
                  {p.cols}×{p.rowCount} · {p.colorCount}색 · 비즈 {formatCount(p.beads)}개
                </span>
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
