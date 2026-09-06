import { COLOR_HEX } from '../data/inventory';
import type { ColorKey } from '../types/pattern';

/** 도안 픽셀 격자 렌더러 — 갤러리 썸네일과 상세 화면이 함께 사용 */
export default function PatternGrid({
  rows,
  title,
  large = false,
}: {
  rows: string[];
  title: string;
  large?: boolean;
}) {
  const width = rows[0].length;
  return (
    <div
      role="img"
      aria-label={`${title} 도안 ${rows.length}×${width}`}
      className={large ? 'grid gap-[2px]' : 'grid gap-[1px]'}
      style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }}
    >
      {rows.flatMap((row, y) =>
        row.split('').map((ch, x) => (
          <span
            key={`${y}-${x}`}
            className={`aspect-square ${large ? 'rounded-[3px]' : 'rounded-[2px]'}`}
            style={{
              backgroundColor: ch === '.' ? 'transparent' : COLOR_HEX[ch as ColorKey],
              // 화이트·투명 비즈도 흰 배경에서 구분되도록 아주 옅은 테두리를 둔다
              boxShadow:
                ch === '.'
                  ? undefined
                  : large
                    ? 'inset 0 0 0 2px rgba(255,255,255,0.35), inset 0 0 0 3px rgba(93,64,55,0.16)'
                    : 'inset 0 0 0 1px rgba(93,64,55,0.16)',
            }}
          />
        )),
      )}
    </div>
  );
}
