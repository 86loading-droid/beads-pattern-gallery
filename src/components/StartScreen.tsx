import { useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, Check, LayoutGrid } from 'lucide-react';
import {
  CATEGORY_OPTIONS,
  DIFFICULTY_OPTIONS,
  GRID_SIZE_OPTIONS,
  PREVIEW_COLORS,
  STEPS,
  type StepKey,
} from '../data/selectionOptions';
import { ALL_SELECTED, type Pattern, type PatternSelection } from '../types/pattern';
import { COLOR_HEX, formatCount } from '../data/inventory';

interface StartScreenProps {
  /** 3단계 선택이 끝나면 호출됩니다. */
  onComplete: (selection: PatternSelection) => void;
  /**
   * (선택) 현재까지의 선택으로 몇 개의 도안이 남는지 계산해 카드에 표시합니다.
   * 갤러리 데이터가 준비되면 filterPatterns(...)를 감싸 넘기세요.
   */
  countFor?: (partial: PatternSelection) => number;
  /** 첫 단계 위에 보여 줄 오늘의 추천 도안 */
  recommended?: Pattern[];
  /** 추천 도안을 누르면 바로 그 도안을 엽니다 */
  onOpen?: (id: string) => void;
}

/** 추천 카드 안에 들어가는 작은 격자 — 칸마다 사이를 띄워 한 칸씩 보이게 한다 */
function TinyGrid({ rows, title }: { rows: string[]; title: string }) {
  const width = rows[0].length;
  return (
    <div
      role="img"
      aria-label={`${title} 도안 미리보기`}
      className="grid w-full gap-[1.5px] rounded-lg bg-white p-1.5"
      style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }}
    >
      {rows.flatMap((row, y) =>
        row.split('').map((ch, x) => (
          <span
            key={`${y}-${x}`}
            className="aspect-square rounded-[2px]"
            style={{
              backgroundColor: ch === '.' ? '#E4DCCB' : COLOR_HEX[ch as keyof typeof COLOR_HEX],
              boxShadow: `inset 0 0 0 1px rgba(93,64,55,${ch === '.' ? '0.22' : '0.32'})`,
            }}
          />
        )),
      )}
    </div>
  );
}

const LEVEL_LABEL: Record<string, string> = {
  easy: '쉬워요',
  medium: '보통이에요',
  challenge: '도전해요',
};

/** 6×6 미니 픽셀 미리보기 */
function MiniPreview({ rows, label }: { rows: string[]; label: string }) {
  return (
    <div
      role="img"
      aria-label={`${label} 도안 미리보기`}
      className="grid gap-[2px] rounded-md bg-white/70 p-[3px] shadow-inner"
      style={{ gridTemplateColumns: `repeat(${rows[0].length}, 1fr)` }}
    >
      {rows.flatMap((row, y) =>
        row.split('').map((ch, x) => (
          <span
            key={`${y}-${x}`}
            className="aspect-square rounded-[2px]"
            style={{ backgroundColor: ch === '.' ? 'transparent' : PREVIEW_COLORS[ch] }}
          />
        )),
      )}
    </div>
  );
}

/** 큰 선택 카드 — 최소 터치 영역 88px, 아이콘·라벨·설명 3중 표상 */
function OptionCard({
  emoji,
  label,
  hint,
  tone,
  selected,
  onClick,
  children,
  badge,
  row = false,
}: {
  emoji: string;
  label: string;
  hint: string;
  tone: { bg: string; border: string; text: string };
  selected?: boolean;
  onClick: () => void;
  children?: ReactNode;
  badge?: string;
  /** true면 화면 폭과 무관하게 가로 한 줄 배치 (난이도 카드) */
  row?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected ?? false}
      className={`group relative flex w-full items-center gap-4 rounded-2xl border-[3px] p-4 text-left transition
                 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4
                 focus-visible:ring-[#5D4037]/40 active:translate-y-0 ${
                   row
                     ? 'min-h-[6.5rem] md:min-h-[7rem] md:px-6'
                     : 'min-h-[7.5rem] sm:flex-col sm:items-start sm:justify-between'
                 }`}
      style={{ backgroundColor: tone.bg, borderColor: tone.border }}
    >
      <div className={`flex items-center gap-3 ${row ? 'flex-1' : 'sm:w-full'}`}>
        <span aria-hidden="true" className={`leading-none ${row ? 'text-3xl md:text-4xl' : 'text-3xl sm:text-4xl'}`}>
          {emoji}
        </span>
        <span className="flex flex-col">
          <span className={`font-bold ${row ? 'text-xl md:text-2xl' : 'text-lg sm:text-xl'}`} style={{ color: tone.text }}>
            {label}
          </span>
          <span className={`opacity-80 ${row ? 'text-sm md:text-base' : 'text-sm'}`} style={{ color: tone.text }}>
            {hint}
          </span>
        </span>
      </div>

      {children ? <div className="w-16 shrink-0 sm:w-20">{children}</div> : null}

      {badge ? (
        <span
          className="absolute right-3 top-3 rounded-full bg-white/85 px-2 py-0.5 text-xs font-semibold"
          style={{ color: tone.text }}
        >
          {badge}
        </span>
      ) : null}

      {selected ? (
        <span
          className="absolute bottom-3 right-3 grid h-7 w-7 place-items-center rounded-full text-white"
          style={{ backgroundColor: tone.border }}
        >
          <Check size={16} strokeWidth={3} aria-hidden="true" />
          <span className="sr-only">선택됨</span>
        </span>
      ) : null}
    </button>
  );
}

export default function StartScreen({ onComplete, countFor, recommended = [], onOpen }: StartScreenProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<PatternSelection>(ALL_SELECTED);

  const step = STEPS[stepIndex];

  const summary = useMemo(() => {
    const items: { key: StepKey; text: string }[] = [];
    if (draft.difficulty !== 'all') {
      const found = DIFFICULTY_OPTIONS.find((o) => o.id === draft.difficulty);
      if (found) items.push({ key: 'difficulty', text: `${found.emoji} ${found.label}` });
    }
    if (draft.category !== 'all') {
      const found = CATEGORY_OPTIONS.find((o) => o.id === draft.category);
      if (found) items.push({ key: 'category', text: `${found.emoji} ${found.label}` });
    }
    if (draft.gridSize !== 'all') {
      const found = GRID_SIZE_OPTIONS.find((o) => o.id === draft.gridSize);
      if (found) items.push({ key: 'gridSize', text: `${found.emoji} ${found.label}` });
    }
    return items;
  }, [draft]);

  function choose(key: StepKey, value: PatternSelection[StepKey]) {
    const next = { ...draft, [key]: value } as PatternSelection;
    setDraft(next);
    if (stepIndex === STEPS.length - 1) onComplete(next);
    else setStepIndex(stepIndex + 1);
  }

  function countWith(key: StepKey, value: PatternSelection[StepKey]) {
    if (!countFor) return undefined;
    const n = countFor({ ...draft, [key]: value } as PatternSelection);
    return `${n}개`;
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pb-10 pt-6 md:px-7 lg:max-w-5xl">
      <header className="mb-5">
        <p className="text-sm font-semibold tracking-wide text-[#A1887F]">
          컬러비즈 도안 갤러리{countFor ? ` · 도안 ${countFor(ALL_SELECTED)}종` : ''}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-[#5D4037] sm:text-3xl">
          {step.title}
        </h1>
        <p className="mt-1 text-sm text-[#8D6E63]">{step.subtitle}</p>
      </header>

      {/* 오늘의 추천 — 고르기 어려워하는 아이에게 바로 건넬 수 있는 세 가지 */}
      {stepIndex === 0 && recommended.length > 0 && onOpen ? (
        <section aria-label="오늘의 추천 도안" className="mb-6">
          <h2 className="text-lg font-bold text-[#5D4037]">오늘의 추천 도안</h2>
          <p className="mt-0.5 text-sm text-[#8D6E63]">
            고르기 어려우면 여기서 바로 시작해도 좋아요. 매일 바뀝니다.
          </p>
          <ul className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
            {recommended.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onOpen(p.id)}
                  className="flex h-full w-full flex-col gap-1.5 rounded-2xl border-[3px] border-[#E7D8C4] bg-white p-2
                             text-left transition hover:-translate-y-0.5 hover:border-[#C9A87C] hover:shadow-lg
                             focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5D4037]/30 sm:gap-2 sm:p-3"
                >
                  <TinyGrid rows={p.rows} title={p.title} />
                  <span className="text-sm font-bold leading-tight text-[#5D4037] sm:text-base">{p.title}</span>
                  <span className="mt-auto text-[11px] leading-tight text-[#8A7263] sm:text-xs">
                    {LEVEL_LABEL[p.difficulty] ?? ''} · {p.cols}×{p.rowCount}칸 · 비즈 {formatCount(p.beads)}개
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 진행 표시 — 숫자·색·문장 3중 안내 */}
      <ol
        className="mb-5 flex items-center gap-2"
        aria-label={`전체 ${STEPS.length}단계 중 ${stepIndex + 1}단계`}
      >
        {STEPS.map((s, i) => (
          <li key={s.key} className="flex flex-1 items-center gap-2">
            <span
              aria-current={i === stepIndex ? 'step' : undefined}
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold transition ${
                i < stepIndex
                  ? 'bg-[#8D6E63] text-white'
                  : i === stepIndex
                    ? 'bg-[#5D4037] text-white ring-4 ring-[#FFEDD5]'
                    : 'bg-[#F3E9DC] text-[#A1887F]'
              }`}
            >
              {i < stepIndex ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : i + 1}
            </span>
            <span
              className={`h-1.5 flex-1 rounded-full ${i < stepIndex ? 'bg-[#8D6E63]' : 'bg-[#F3E9DC]'}`}
              aria-hidden="true"
            />
          </li>
        ))}
      </ol>

      {/* 선택 요약 칩 — 누르면 그 단계로 되돌아감 */}
      {summary.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {summary.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStepIndex(STEPS.findIndex((s) => s.key === item.key))}
              className="rounded-full border-2 border-[#E7D8C4] bg-white px-3 py-1 text-sm font-semibold text-[#5D4037]
                         hover:border-[#C9A87C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5D4037]/30"
            >
              {item.text}
              <span className="sr-only"> 다시 고르기</span>
            </button>
          ))}
        </div>
      ) : null}

      {/* 옵션 카드 영역 */}
      <section
        key={step.key}
        aria-label={step.title}
        className={
          step.key === 'difficulty'
            ? 'grid gap-3 md:max-w-[760px]'
            : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'
        }
      >
        {step.key === 'difficulty' &&
          DIFFICULTY_OPTIONS.map((o) => (
            <OptionCard
              key={o.id}
              emoji={o.emoji}
              label={o.label}
              hint={o.hint}
              tone={o.tone}
              row
              selected={draft.difficulty === o.id}
              badge={countWith('difficulty', o.id)}
              onClick={() => choose('difficulty', o.id)}
            />
          ))}

        {step.key === 'category' &&
          CATEGORY_OPTIONS.map((o) => (
            <OptionCard
              key={o.id}
              emoji={o.emoji}
              label={o.label}
              hint={o.hint}
              tone={o.tone}
              selected={draft.category === o.id}
              badge={countWith('category', o.id)}
              onClick={() => choose('category', o.id)}
            >
              <MiniPreview rows={o.preview} label={o.label} />
            </OptionCard>
          ))}

        {step.key === 'gridSize' &&
          GRID_SIZE_OPTIONS.map((o) => (
            <OptionCard
              key={o.id}
              emoji={o.emoji}
              label={o.label}
              tone={o.tone}
              hint={`${o.hint} · 비즈 ${o.beads}개`}
              selected={draft.gridSize === o.id}
              badge={countWith('gridSize', o.id)}
              onClick={() => choose('gridSize', o.id)}
            />
          ))}
      </section>

      {/* 하단 조작 */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          disabled={stepIndex === 0}
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-semibold text-[#5D4037] disabled:opacity-35
                     hover:bg-[#F5EADB] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5D4037]/30"
        >
          <ArrowLeft size={18} aria-hidden="true" /> 이전
        </button>

        <button
          type="button"
          onClick={() => onComplete({ ...draft })}
          className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#5D4037] px-4 py-2.5 font-bold text-[#5D4037]
                     hover:bg-[#5D4037] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5D4037]/30"
        >
          <LayoutGrid size={18} aria-hidden="true" />
          {summary.length === 0 ? '전체 도안 보기' : '지금 선택으로 보기'}
        </button>
      </div>
    </main>
  );
}
