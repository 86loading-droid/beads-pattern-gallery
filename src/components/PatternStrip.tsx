import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PatternGrid from './PatternGrid';
import { COLOR_NAME, formatCount } from '../data/inventory';
import type { ColorKey, Pattern } from '../types/pattern';

interface Props {
  patterns: Pattern[];
  /** 재고가 모자란 색 */
  shortagesFor: (need: Partial<Record<ColorKey, number>>) => ColorKey[];
  onOpen: (id: string) => void;
  /** 목록 설명 — 화면 낭독기용 */
  label: string;
}

/**
 * 도안을 좌우로 넘겨 보는 가로 띠.
 *
 * 손가락으로 옆으로 쓸면 넘어가고, 마우스나 키보드를 쓰는 경우를 위해
 * 양옆에 화살표 단추를 둡니다. 카드 하나가 딱 맞게 멈추도록 스냅을 걸어,
 * 도안이 반쯤 잘린 채로 멈추지 않게 했습니다.
 */
export default function PatternStrip({ patterns, shortagesFor, onOpen, label }: Props) {
  const box = useRef<HTMLUListElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const check = useCallback(() => {
    const el = box.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    check();
    const el = box.current;
    if (!el) return;
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [check, patterns.length]);

  function slide(dir: -1 | 1) {
    const el = box.current;
    if (!el) return;
    // 한 번에 카드 하나만큼 — 어디까지 봤는지 놓치지 않게 한다
    const step = el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  }

  if (!patterns.length) return null;

  const arrow = (dir: -1 | 1, on: boolean) => (
    <button
      type="button"
      onClick={() => slide(dir)}
      disabled={!on}
      aria-label={dir === -1 ? '왼쪽 도안 보기' : '오른쪽 도안 보기'}
      className="absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border-2
                 border-[#D8C2A6] bg-white/95 shadow-md disabled:opacity-0 sm:grid"
      style={dir === -1 ? { left: -6 } : { right: -6 }}
    >
      {dir === -1 ? (
        <ChevronLeft size={20} aria-hidden="true" />
      ) : (
        <ChevronRight size={20} aria-hidden="true" />
      )}
    </button>
  );

  return (
    <div className="relative">
      {arrow(-1, canLeft)}
      {arrow(1, canRight)}

      <ul
        ref={box}
        onScroll={check}
        aria-label={label}
        className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain pb-1
                   [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {patterns.map((p) => {
          const short = shortagesFor(p.need);
          return (
            <li key={p.id} className="w-[150px] shrink-0 snap-start sm:w-[172px]">
              <button
                type="button"
                onClick={() => onOpen(p.id)}
                className="flex h-full w-full flex-col gap-1.5 rounded-xl border-2 border-white bg-white/90 p-2
                           text-left transition hover:border-[#C9A87C] focus-visible:outline-none
                           focus-visible:ring-4 focus-visible:ring-[#5D4037]/30"
              >
                <PatternGrid rows={p.rows} title={p.title} />
                <span className="text-sm font-bold leading-tight text-[#5D4037]">{p.title}</span>
                <span className="mt-auto text-[11px] leading-tight text-[#8A7263]">
                  {p.cols}×{p.rowCount}칸 · 비즈 {formatCount(p.beads)}개
                </span>
                {short.length ? (
                  <span className="text-[11px] font-bold leading-tight text-[#B3261E]">
                    {short.map((k) => COLOR_NAME[k]).join(', ')} 모자람
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
