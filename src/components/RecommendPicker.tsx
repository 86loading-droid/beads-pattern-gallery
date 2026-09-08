import { useMemo, useState } from 'react';
import { ArrowLeft, Check, RotateCcw } from 'lucide-react';
import PatternGrid from './PatternGrid';
import { formatCount } from '../data/inventory';
import type { Pattern } from '../types/pattern';

/** 첫 화면에 걸 수 있는 최대 개수 — 너무 많으면 고르는 의미가 없어집니다 */
export const MAX_PICKS = 6;

const LEVEL_LABEL: Record<string, string> = {
  easy: '쉬워요',
  medium: '보통이에요',
  challenge: '도전해요',
};

interface Props {
  all: Pattern[];
  /** 지금 걸려 있는 추천 도안 id */
  current: string[];
  busy: boolean;
  /** true면 고른 결과가 다른 태블릿에도 퍼집니다 */
  shared: boolean;
  onSave: (ids: string[]) => void;
  onBack: () => void;
}

/**
 * 첫 화면에 걸 추천 도안을 강사가 직접 고르는 화면.
 * 하나도 고르지 않으면 앱이 날짜에 따라 자동으로 골라 줍니다.
 */
export default function RecommendPicker({ all, current, busy, shared, onSave, onBack }: Props) {
  const [picked, setPicked] = useState<string[]>(current.slice(0, MAX_PICKS));
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    const q = query.trim();
    if (!q) return all;
    return all.filter((p) => p.title.includes(q));
  }, [all, query]);

  const chosen = useMemo(
    () => picked.map((id) => all.find((p) => p.id === id)).filter(Boolean) as Pattern[],
    [all, picked],
  );

  function toggle(id: string) {
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_PICKS) return prev;
      return [...prev, id];
    });
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-4 text-[#5D4037] md:px-7 lg:max-w-5xl">
      <p className="text-sm font-semibold tracking-wide text-[#A1887F]">첫 화면 설정</p>
      <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">추천 도안 고르기</h1>
      <p className="mt-1 text-sm text-[#8D6E63]">
        첫 화면에 걸어 둘 도안을 최대 {MAX_PICKS}개까지 고르세요.
        {shared
          ? ' 고른 결과는 모든 태블릿에 함께 반영됩니다.'
          : ' 지금은 이 기기에만 저장됩니다.'}
      </p>

      {/* 지금 고른 것 — 순서대로 첫 화면에 걸립니다 */}
      <section aria-label="고른 추천 도안" className="mt-4 rounded-2xl border-2 border-[#EADBC6] bg-white p-3">
        <p className="text-sm font-bold">
          고른 도안 {picked.length}개 / {MAX_PICKS}개
        </p>
        {chosen.length ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {chosen.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => toggle(p.id)}
                  className="rounded-full border-2 border-[#C9A87C] bg-[#FFF6EA] px-3 py-1 text-sm font-bold
                             focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5D4037]/30"
                >
                  {p.title} <span aria-hidden="true">×</span>
                  <span className="sr-only">빼기</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-[#8A7263]">
            고르지 않으면 앱이 날짜에 따라 매일 자동으로 3개를 골라 보여 줍니다.
          </p>
        )}
      </section>

      <label className="mt-4 block">
        <span className="text-sm font-bold">도안 이름으로 찾기</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="예: 나비"
          className="mt-1 w-full rounded-xl border-2 border-[#EADBC6] bg-white px-3 py-2 text-base
                     focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5D4037]/30"
        />
      </label>

      <ul className="mt-4 grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]">
        {list.map((p) => {
          const on = picked.includes(p.id);
          const full = !on && picked.length >= MAX_PICKS;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => toggle(p.id)}
                aria-pressed={on}
                disabled={full}
                className={`relative flex h-full w-full flex-col gap-2 rounded-2xl border-[3px] p-3 text-left transition
                            disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4
                            focus-visible:ring-[#5D4037]/30 ${
                              on
                                ? 'border-[#E4572E] bg-[#FFF6F1]'
                                : 'border-[#EADBC6] bg-white hover:border-[#C9A87C]'
                            }`}
              >
                <PatternGrid rows={p.rows} title={p.title} />
                <span className="text-sm font-bold leading-tight">{p.title}</span>
                <span className="mt-auto text-[11px] leading-tight text-[#8A7263]">
                  {LEVEL_LABEL[p.difficulty] ?? ''} · {p.cols}×{p.rowCount}칸 · 비즈{' '}
                  {formatCount(p.beads)}개
                </span>
                {on ? (
                  <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-[#E4572E] text-white">
                    <Check size={14} strokeWidth={3} aria-hidden="true" />
                    <span className="sr-only">고름</span>
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      {/* 저장 줄 — 화면 아래에 붙여 두어 스크롤 중에도 누를 수 있게 한다 */}
      <div className="fixed inset-x-0 bottom-0 border-t-2 border-[#EADBC6] bg-[#FFFBF0]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 lg:max-w-5xl">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 font-semibold hover:bg-[#F5EADB]
                       focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5D4037]/30"
          >
            <ArrowLeft size={18} aria-hidden="true" /> 취소
          </button>
          <button
            type="button"
            onClick={() => setPicked([])}
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#D8C2A6] px-3 py-2 font-bold
                       focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5D4037]/30"
          >
            <RotateCcw size={16} aria-hidden="true" /> 자동으로 되돌리기
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onSave(picked)}
            className="ml-auto rounded-xl bg-[#E4572E] px-5 py-2.5 font-bold text-white disabled:opacity-50
                       focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5D4037]/30"
          >
            {busy ? '저장하는 중…' : '이대로 첫 화면에 걸기'}
          </button>
        </div>
      </div>
    </main>
  );
}
