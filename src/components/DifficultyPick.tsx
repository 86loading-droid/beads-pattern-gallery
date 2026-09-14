import { ArrowLeft, LayoutGrid } from 'lucide-react';
import PatternStrip from './PatternStrip';
import { CATEGORY_OPTIONS, DIFFICULTY_OPTIONS } from '../data/selectionOptions';
import type { CategoryId, ColorKey, DifficultyId, Pattern } from '../types/pattern';

interface Props {
  /** 고른 주제 — 'all'이면 전체 */
  category: CategoryId | 'all';
  /** 그 주제에 속한 도안 */
  patterns: Pattern[];
  shortagesFor: (need: Partial<Record<ColorKey, number>>) => ColorKey[];
  /** 도안을 바로 엽니다 */
  onOpen: (id: string) => void;
  /** 그 난이도를 세로로 크게 훑어봅니다 */
  onPick: (difficulty: DifficultyId | 'all') => void;
  onBack: () => void;
}

/**
 * 주제를 고른 뒤 난이도를 고르는 화면.
 *
 * 난이도마다 그 안의 도안을 가로 띠로 늘어놓아, 화면을 옮기지 않고도 좌우로 넘기며
 * 바로 확인하고 고를 수 있게 합니다. 난이도를 고르는 일과 도안을 고르는 일을
 * 한 화면에서 끝낼 수 있어야 아이가 기다리지 않습니다.
 */
export default function DifficultyPick({
  category,
  patterns,
  shortagesFor,
  onOpen,
  onPick,
  onBack,
}: Props) {
  const found = CATEGORY_OPTIONS.find((c) => c.id === category);
  const name = found ? found.label : '전체';

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-10 pt-4 text-[#5D4037] md:px-7 lg:max-w-5xl">
      <p className="text-sm font-semibold tracking-wide text-[#A1887F]">
        {found ? `${found.emoji} ${name}` : '전체 도안'} · {patterns.length}개
      </p>
      <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">어떤 도안을 만들까요?</h1>
      <p className="mt-1 text-sm text-[#8D6E63]">
        난이도마다 도안이 늘어서 있어요. 옆으로 넘겨 보고 마음에 드는 도안을 누르세요.
      </p>

      <div className="mt-4 space-y-4">
        {DIFFICULTY_OPTIONS.map((d) => {
          const mine = patterns.filter((p) => p.difficulty === d.id);
          return (
            <section
              key={d.id}
              aria-label={`${d.label} 도안`}
              className="rounded-2xl border-[3px] p-3"
              style={{ backgroundColor: d.tone.bg, borderColor: d.tone.border }}
            >
              <div className="mb-2.5 flex flex-wrap items-center gap-2">
                <span aria-hidden="true" className="text-2xl leading-none">
                  {d.emoji}
                </span>
                <span className="flex flex-col">
                  <span className="text-lg font-bold" style={{ color: d.tone.text }}>
                    {d.label}
                  </span>
                  <span className="text-xs opacity-80" style={{ color: d.tone.text }}>
                    {mine.length ? d.hint : '이 주제에는 아직 없어요'}
                  </span>
                </span>

                {mine.length ? (
                  <button
                    type="button"
                    onClick={() => onPick(d.id)}
                    className="ml-auto rounded-full bg-white/90 px-3 py-1 text-xs font-bold
                               focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5D4037]/30"
                    style={{ color: d.tone.text }}
                  >
                    {mine.length}개 크게 보기
                  </button>
                ) : null}
              </div>

              {mine.length ? (
                <PatternStrip
                  patterns={mine}
                  shortagesFor={shortagesFor}
                  onOpen={onOpen}
                  label={`${d.label} 도안 목록`}
                />
              ) : null}
            </section>
          );
        })}
      </div>

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
          <LayoutGrid size={18} aria-hidden="true" /> 난이도 상관없이 모두 크게 보기
        </button>
      </div>
    </main>
  );
}
