import { ArrowLeft, ChevronDown } from 'lucide-react';
import PatternGrid from './PatternGrid';
import { COLOR_NAME, formatCount } from '../data/inventory';
import { CATEGORY_OPTIONS, DIFFICULTY_OPTIONS } from '../data/selectionOptions';
import type { CategoryId, ColorKey, DifficultyId, Pattern } from '../types/pattern';

interface Props {
  patterns: Pattern[];
  category: CategoryId | 'all';
  difficulty: DifficultyId | 'all';
  /** 재고가 모자란 색을 알려 줍니다 */
  shortagesFor: (need: Partial<Record<ColorKey, number>>) => ColorKey[];
  onOpen: (id: string) => void;
  onBack: () => void;
  onNewPattern: () => void;
}

/**
 * 도안을 세로로 넘겨 보며 고르는 화면.
 *
 * 도안 하나를 크게 보여 주고 아래로 계속 이어 붙여, 손가락으로 쓸어 내리면서
 * 여러 도안을 훑어보고 마음에 드는 것을 바로 고를 수 있게 합니다.
 * 작은 그림을 여러 개 늘어놓는 대신 크게 보여 주는 쪽을 택한 이유는,
 * 아이가 칸 모양을 알아볼 수 있어야 "이거 할래"라고 고를 수 있기 때문입니다.
 */
export default function PatternBrowse({
  patterns,
  category,
  difficulty,
  shortagesFor,
  onOpen,
  onBack,
  onNewPattern,
}: Props) {
  const cat = CATEGORY_OPTIONS.find((c) => c.id === category);
  const diff = DIFFICULTY_OPTIONS.find((d) => d.id === difficulty);
  const where = [cat ? `${cat.emoji} ${cat.label}` : '전체 도안', diff ? diff.label : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-12 pt-4 text-[#5D4037] md:px-7 lg:max-w-5xl">
      <p className="text-sm font-semibold tracking-wide text-[#A1887F]">{where}</p>
      <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
        도안 {patterns.length}개 · 아래로 넘겨 보세요
      </h1>
      <p className="mt-1 text-sm text-[#8D6E63]">
        마음에 드는 도안의 <span className="font-bold">이 도안 만들기</span>를 누르면 시작합니다.
      </p>

      {patterns.length === 0 ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-[#D8C2A6] p-8 text-center">
          <p className="font-bold">여기에는 아직 도안이 없어요.</p>
          <p className="mt-1 text-sm text-[#8A7263]">다른 난이도를 골라 보거나 직접 만들어 보세요.</p>
          <button
            type="button"
            onClick={onNewPattern}
            className="mt-4 rounded-xl border-2 border-[#E4572E] px-4 py-2.5 font-bold text-[#E4572E]"
          >
            ＋ 새 도안 만들기
          </button>
        </div>
      ) : null}

      <ul className="mt-4 space-y-4">
        {patterns.map((p, i) => {
          const short = shortagesFor(p.need);
          return (
            <li
              key={p.id}
              className="rounded-2xl border-[3px] border-[#EADBC6] bg-white p-3 sm:p-4"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="rounded-full bg-[#F3E9DC] px-2 py-0.5 text-xs font-bold tabular-nums text-[#8A7263]">
                  {i + 1} / {patterns.length}
                </span>
                <h2 className="text-xl font-extrabold sm:text-2xl">{p.title}</h2>
                {p.custom ? (
                  <span className="rounded-full bg-[#FFF6F1] px-2 py-0.5 text-xs font-bold text-[#E4572E]">
                    직접 만든 도안
                  </span>
                ) : null}
              </div>

              <p className="mt-0.5 text-sm text-[#8A7263]">
                {p.cols}×{p.rowCount}칸 · 색 {p.colorCount}가지 · 비즈 {formatCount(p.beads)}개
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,210px)] sm:items-start">
                <div className="mx-auto w-full max-w-[420px] rounded-xl bg-[#FFFBF0] p-2">
                  <PatternGrid rows={p.rows} title={p.title} large />
                </div>

                <div className="flex flex-col gap-2">
                  {short.length ? (
                    <p className="rounded-xl border-2 border-[#EFC5C0] bg-[#FDEEEC] px-3 py-2 text-sm text-[#8C2F2F]">
                      {short.map((k) => COLOR_NAME[k]).join(', ')} 비즈가 모자랍니다.
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onOpen(p.id)}
                    className="rounded-xl bg-[#E4572E] px-4 py-3 text-base font-bold text-white
                               focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5D4037]/30"
                  >
                    이 도안 만들기
                  </button>
                  {i < patterns.length - 1 ? (
                    <p className="hidden items-center justify-center gap-1 text-xs text-[#A1887F] sm:flex">
                      <ChevronDown size={14} aria-hidden="true" /> 아래에 도안이 더 있어요
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-semibold hover:bg-[#F5EADB]
                     focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5D4037]/30"
        >
          <ArrowLeft size={18} aria-hidden="true" /> 난이도 다시 고르기
        </button>
        <button
          type="button"
          onClick={onNewPattern}
          className="rounded-xl border-2 border-[#E4572E] px-4 py-2.5 font-bold text-[#E4572E]"
        >
          ＋ 새 도안 만들기
        </button>
      </div>
    </main>
  );
}
