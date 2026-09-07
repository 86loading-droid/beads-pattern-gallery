import type { ReactElement } from 'react';
import { COLOR_HEX } from '../data/inventory';
import type { ColorKey } from '../types/pattern';

/** 빈칸도 눈에 보이도록 아주 옅은 모눈 바탕을 깔아 준다 */
const EMPTY_BG = '#FCF7EE';
const LINE = 'rgba(93,64,55,0.20)';
/** 다섯 칸마다 진한 선 — 아이들이 칸을 세기 쉽게 한다 */
const LINE5 = 'rgba(93,64,55,0.55)';

interface Props {
  rows: string[];
  title: string;
  large?: boolean;
  /** 행·열 번호를 함께 보여 줍니다 (상세 화면처럼 큰 격자에서만 켜세요) */
  numbered?: boolean;
}

/**
 * 도안 픽셀 격자 렌더러 — 갤러리 썸네일과 상세 화면이 함께 사용.
 * 색이 없는 칸도 테두리와 옅은 바탕으로 그려서, 학생이 몇 번째 칸인지 세어 가며
 * 따라 만들 수 있게 합니다. 다섯 칸마다 선을 진하게 해 세기 쉽도록 했습니다.
 */
export default function PatternGrid({ rows, title, large = false, numbered = false }: Props) {
  const width = rows[0].length;
  const height = rows.length;
  const columns = numbered ? width + 1 : width;
  const numberClass = large ? 'text-[11px]' : 'text-[8px]';
  const cells: ReactElement[] = [];

  const numberCell = (key: string, label: number) => (
    <span
      key={key}
      aria-hidden="true"
      className={`flex aspect-square items-center justify-center font-bold leading-none tabular-nums text-[#8A7263] ${numberClass}`}
    >
      {label}
    </span>
  );

  if (numbered) {
    cells.push(<span key="corner" className="aspect-square" />);
    for (let c = 0; c < width; c += 1) cells.push(numberCell(`ch-${c}`, c + 1));
  }

  for (let r = 0; r < height; r += 1) {
    if (numbered) cells.push(numberCell(`rh-${r}`, r + 1));
    for (let c = 0; c < width; c += 1) {
      const ch = rows[r][c];
      const filled = ch !== '.';
      const heavyRight = (c + 1) % 5 === 0 || c === width - 1;
      const heavyBottom = (r + 1) % 5 === 0 || r === height - 1;
      cells.push(
        <span
          key={`${r}-${c}`}
          className="aspect-square"
          style={{
            backgroundColor: filled ? COLOR_HEX[ch as ColorKey] : EMPTY_BG,
            borderRight: `${heavyRight ? 2 : 1}px solid ${heavyRight ? LINE5 : LINE}`,
            borderBottom: `${heavyBottom ? 2 : 1}px solid ${heavyBottom ? LINE5 : LINE}`,
            borderLeft: c === 0 ? `2px solid ${LINE5}` : undefined,
            borderTop: r === 0 ? `2px solid ${LINE5}` : undefined,
            boxShadow: filled && large ? 'inset 0 0 0 2px rgba(255,255,255,0.3)' : undefined,
          }}
        />,
      );
    }
  }

  return (
    <div
      role="img"
      aria-label={`${title} 도안 가로 ${width}칸 세로 ${height}칸`}
      className="grid select-none"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {cells}
    </div>
  );
}
