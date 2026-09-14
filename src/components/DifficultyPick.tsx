import { ArrowLeft, LayoutGrid } from 'lucide-react';
import PatternGrid from './PatternGrid';
import { CATEGORY_OPTIONS, DIFFICULTY_OPTIONS } from '../data/selectionOptions';
import type { CategoryId, DifficultyId, Pattern } from '../types/pattern';

interface Props {
  /** 고른 주제 — 'all'이면 전체 */
  category: CategoryId | 'all';
  /** 그 주제에 속한 도안 */
  patterns: Pattern[];
  onPick: (difficulty: DifficultyId | 'all') => void;
  onBack: () => void;
}

/**
 * 주제를 고른 뒤 난이도를 고르는 화면.
 * 각 난이도에 실제로 어떤 도안이 있는지 미리 보여 주어, 고르기 전에 짐작할 수 있게 합니다.
 */
export default function DifficultyPick({ category, patterns, onPick, onBack }: Props) {
  const found = CATEGORY_OPTIONS.find((c) => c.id === category);
  const name = found ? found.label : '전체';

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-10 pt-4 text-[#5D4037] md:px-7 lg:max-w-5xl">
      <p className="text-sm font-semibold tracking-wide text-[#A1887F]">
        {found ? `${found.emoji} ${name}` : '전체 도안'} · {patterns.length}개
      </p>
      <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">얼마나 어렵게 할까요?</h1>
      <p className="mt-1 text-sm text-[#8D6E63]">난이도를 고르면 도안을 하나씩 넘겨 보며 고를 수 있어요.</p>

      <ul className="mt-4 grid gap-3">
        {DIFFICULTY_OPTIONS.map((d) => {
          const mine = patterns.filter((p) => p.difficulty === d.id);
          const shown = mine.slice(0, 4);
          return (
            <li key={d.id}>
              <button
                type="button"
                disabled={mine.length === 0}
                onClick={() => onPick(d.id)}
                className="flex w-full items-center gap-3 rounded-2xl border-[3px] p-3 text-left transition
                           disabled:opacity-40 hover:-translate-y-0.5 hover:shadow-lg disabled:hover:translate-y-0
                           disabled:hover:shadow-none focus-visible:outline-none focus-visible:ring-4
                           focus-visible:ring-[#5D4037]/30"
                style={{ backgroundColor: d.tone.bg, borderColor: d.tone.border }}
              >
                <span aria-hidden="true" className="text-2xl leading-none">
                  {d.emoji}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-lg font-bold" style={{ color: d.tone.text }}>
                    {d.label}
                  </span>
                  <span className="text-xs opacity-80" style={{ color: d.tone.text }}>
                    {mine.length ? d.hint : '이 주제에는 아직 없어요'}
                  </span>
                </span>

                <span className="ml-auto flex shrink-0 items-center gap-1.5">
                  {shown.map((p) => (
                    <span key={p.id} className="w-10 rounded bg-white/85 p-0.5 sm:w-12">
                      <PatternGrid rows={p.rows} title={p.title} />
                    </span>
                  ))}
                  <span
                    className="rounded-full bg-white/85 px-2 py-0.5 text-xs font-bold"
                    style={{ color: d.tone.text }}
                  >
                    {mine.length}개
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-semibold hover:bg-[#F5EADB]
                     focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5D4037]/30"
        >
          <ArrowLeft size={18} aria-hidden="true" /> 주제 다시 고르기
        </button>
        <button
          type="button"
          onClick={() => onPick('all')}
          className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#5D4037] px-4 py-2.5 font-bold
                     hover:bg-[#5D4037] hover:text-white focus-visible:outline-none focus-visible:ring-4
                     focus-visible:ring-[#5D4037]/30"
        >
          <LayoutGrid size={18} aria-hidden="true" /> 난이도 상관없이 모두 보기
        </button>
      </div>
    </main>
  );
}
