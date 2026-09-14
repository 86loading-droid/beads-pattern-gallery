import { Home as HomeIcon, SlidersHorizontal } from 'lucide-react';
import PatternGrid from './PatternGrid';
import { formatCount } from '../data/inventory';
import { CATEGORY_OPTIONS } from '../data/selectionOptions';
import type { CategoryId, Pattern } from '../types/pattern';

interface Props {
  all: Pattern[];
  recommended: Pattern[];
  recommendNote: string;
  onOpen: (id: string) => void;
  onPickRecommend: () => void;
  onPickCategory: (id: CategoryId | 'all') => void;
}

/** 카드 안에 들어가는 작은 격자 */
function Thumb({ p }: { p: Pattern }) {
  return (
    <span className="block w-full rounded-md bg-white p-1">
      <PatternGrid rows={p.rows} title={p.title} />
    </span>
  );
}

/**
 * 첫 화면 — 주제별로 어떤 도안이 있는지 한눈에 보여 줍니다.
 * 주제를 고르면 난이도 고르기로 넘어갑니다.
 */
export default function CategoryHome({
  all,
  recommended,
  recommendNote,
  onOpen,
  onPickRecommend,
  onPickCategory,
}: Props) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-10 pt-4 text-[#5D4037] md:px-7 lg:max-w-5xl">
      <p className="text-sm font-semibold tracking-wide text-[#A1887F]">
        컬러비즈 도안 갤러리 · 도안 {all.length}종
      </p>
      <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">무엇을 만들어 볼까요?</h1>

      {/* 추천 도안 */}
      {recommended.length > 0 ? (
        <section aria-label="추천 도안" className="mt-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold">추천 도안</h2>
            <button
              type="button"
              onClick={onPickRecommend}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border-2 border-[#D8C2A6] px-3 py-1
                         text-xs font-bold hover:bg-[#F5EADB] focus-visible:outline-none focus-visible:ring-4
                         focus-visible:ring-[#5D4037]/30"
            >
              <SlidersHorizontal size={14} aria-hidden="true" /> 직접 고르기
            </button>
          </div>
          <p className="mt-0.5 text-sm text-[#8D6E63]">{recommendNote}</p>
          <ul className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
            {recommended.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onOpen(p.id)}
                  className="flex h-full w-full flex-col gap-1.5 rounded-2xl border-[3px] border-[#E7D8C4] bg-white p-2
                             text-left transition hover:-translate-y-0.5 hover:border-[#C9A87C] hover:shadow-lg
                             focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5D4037]/30 sm:p-3"
                >
                  <Thumb p={p} />
                  <span className="text-sm font-bold leading-tight sm:text-base">{p.title}</span>
                  <span className="mt-auto text-[11px] leading-tight text-[#8A7263] sm:text-xs">
                    {p.cols}×{p.rowCount}칸 · 비즈 {formatCount(p.beads)}개
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 주제별 한눈에 보기 */}
      <section aria-label="주제별 도안" className="mt-7">
        <h2 className="text-lg font-bold">주제를 골라 보세요</h2>
        <p className="mt-0.5 text-sm text-[#8D6E63]">
          주제를 누르면 난이도를 고르고, 도안을 하나씩 넘겨 보며 고를 수 있어요.
        </p>

        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {CATEGORY_OPTIONS.map((c) => {
            const mine = all.filter((p) => p.category === c.id);
            if (!mine.length) return null;
            const shown = mine.slice(0, 3);
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onPickCategory(c.id)}
                  className="flex w-full flex-col gap-2.5 rounded-2xl border-[3px] p-3 text-left transition
                             hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none
                             focus-visible:ring-4 focus-visible:ring-[#5D4037]/30"
                  style={{ backgroundColor: c.tone.bg, borderColor: c.tone.border }}
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true" className="text-2xl leading-none">
                      {c.emoji}
                    </span>
                    <span className="flex flex-col">
                      <span className="text-lg font-bold" style={{ color: c.tone.text }}>
                        {c.label}
                      </span>
                      <span className="text-xs opacity-80" style={{ color: c.tone.text }}>
                        {c.hint}
                      </span>
                    </span>
                    <span
                      className="ml-auto rounded-full bg-white/85 px-2 py-0.5 text-xs font-bold"
                      style={{ color: c.tone.text }}
                    >
                      {mine.length}개
                    </span>
                  </span>

                  <span className="grid grid-cols-3 gap-2">
                    {shown.map((p) => (
                      <Thumb key={p.id} p={p} />
                    ))}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={() => onPickCategory('all')}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#5D4037]
                     px-4 py-3 font-bold hover:bg-[#5D4037] hover:text-white focus-visible:outline-none
                     focus-visible:ring-4 focus-visible:ring-[#5D4037]/30 sm:w-auto"
        >
          <HomeIcon size={18} aria-hidden="true" /> 주제 상관없이 전체 도안 보기
        </button>
      </section>
    </main>
  );
}
