import type { ReactElement } from 'react';
import { COLOR_HEX } from '../data/inventory';
import type { ColorKey } from '../types/pattern';

/** 빈칸 바탕 — 화이트 비즈와 헷갈리지 않도록 한 단계 어두운 베이지를 쓴다 */
const EMPTY_BG = '#E4DCCB';
const EMPTY_LINE = 'rgba(93,64,55,0.22)';
/** 색이 칠해진 칸의 테두리 — 같은 색이 이어져도 칸이 구분되도록 모든 칸에 똑같이 둔다 */
const FILLED_LINE = 'rgba(93,64,55,0.32)';

interface Props {
  rows: string[];
  title: string;
  large?: boolean;
  /** 행·열 번호를 함께 보여 줍니다 (상세 화면처럼 큰 격자에서만 켜세요) */
  numbered?: boolean;
}

/**
 * 도안 픽셀 격자 렌더러 — 갤러리 썸네일과 상세 화면이 함께 사용.
 *
 * 칸마다 사이를 띄우고 테두리를 둘러, 같은 색이 이어지는 자리에서도 한 칸 한 칸이
 * 따로 보이게 합니다. 모든 칸을 똑같은 굵기로 그려서 특정 줄만 도드라지지 않습니다.
 */
export default function PatternGrid({ rows, title, large = false, numbered = false }: Props) {
  const width = rows[0].length;
  const height = rows.length;
  const columns = numbered ? width + 1 : width;
  const numberClass = large ? 'text-[11px]' : 'text-[8px]';
  const round = large ? 'rounded-[3px]' : 'rounded-[2px]';
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
      cells.push(
        <span
          key={`${r}-${c}`}
          className={`aspect-square ${round}`}
          style={{
            backgroundColor: filled ? COLOR_HEX[ch as ColorKey] : EMPTY_BG,
            boxShadow: `inset 0 0 0 1px ${filled ? FILLED_LINE : EMPTY_LINE}`,
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
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: large ? '3px' : '1.5px',
      }}
    >
      {cells}
    </div>
  );
}
