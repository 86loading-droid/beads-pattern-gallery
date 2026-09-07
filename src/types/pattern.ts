// 도안·재고 공통 타입 정의

/** 보유 비즈 색상 키 (재고 12색) */
export type ColorKey = 'A' | 'G' | 'K' | 'R' | 'O' | 'Y' | 'N' | 'S' | 'W' | 'V' | 'P' | 'T';

/** 난이도: 사용 색상 수 기준으로 산출 */
export type DifficultyId = 'easy' | 'medium' | 'challenge';

/** 주제(카테고리) */
export type CategoryId = 'animal' | 'vehicle' | 'food' | 'shape' | 'nature' | 'emotion';

/**
 * 격자 크기 묶음 — 고르기 쉽도록 두 단계로만 나눕니다.
 *  8 = 미니 사이즈 (6×6 · 8×8)
 * 12 = 보통 사이즈 (10×10 · 12×12, 그보다 큰 도안도 여기에 담깁니다)
 * 도안은 가로·세로 칸 수가 다를 수 있으므로 긴 쪽을 기준으로 담습니다.
 */
export type GridSizeId = 8 | 12;

export const GRID_SIZES: GridSizeId[] = [8, 12];

/** 긴 쪽 칸 수를 담을 수 있는 묶음 */
export function sizeOf(rows: string[]): GridSizeId {
  const longest = Math.max(rows.length, ...rows.map((r) => r.length));
  return longest <= 8 ? 8 : 12;
}

export type OrAll<T> = T | 'all';

export interface PatternSelection {
  difficulty: OrAll<DifficultyId>;
  category: OrAll<CategoryId>;
  gridSize: OrAll<GridSizeId>;
}

/** 색상별 수량 맵 */
export type BeadCount = Partial<Record<ColorKey, number>>;

/** 도안 원본 — rows는 한 글자당 한 칸, '.'은 빈칸 */
export interface PatternSource {
  id: string;
  title: string;
  category: CategoryId;
  rows: string[];
  /** 앱에서 직접 만든 도안이면 true — 수정·삭제할 수 있습니다 */
  custom?: boolean;
  /** 만든 시각 (직접 만든 도안만) */
  at?: string;
}

/** 파생 정보까지 채워진 도안 */
export interface Pattern extends PatternSource {
  /** 담기는 격자 묶음 (긴 쪽 기준) */
  size: GridSizeId;
  /** 실제 가로 칸 수 */
  cols: number;
  /** 실제 세로 칸 수 */
  rowCount: number;
  /** 가로·세로가 같지 않은 도안 */
  oblong: boolean;
  /** 색상별 필요 비즈 수 */
  need: BeadCount;
  colorCount: number;
  beads: number;
  difficulty: DifficultyId;
}

export const ALL_SELECTED: PatternSelection = {
  difficulty: 'all',
  category: 'all',
  gridSize: 'all',
};

/** 색상 수로 난이도를 산출 — 라벨과 실제 도안이 어긋나지 않게 한 곳에서만 결정 */
export function difficultyOf(colorCount: number): DifficultyId {
  if (colorCount <= 3) return 'easy';
  if (colorCount <= 6) return 'medium';
  return 'challenge';
}

/** 도안 원본에 need·beads·difficulty를 채워 넣는다 */
export function derivePattern(src: PatternSource): Pattern {
  const need: BeadCount = {};
  src.rows.forEach((row) => {
    row.split('').forEach((ch) => {
      if (ch === '.') return;
      const key = ch as ColorKey;
      need[key] = (need[key] ?? 0) + 1;
    });
  });
  const values = Object.values(need) as number[];
  const colorCount = values.length;
  const cols = Math.max(...src.rows.map((r) => r.length));
  return {
    ...src,
    size: sizeOf(src.rows),
    cols,
    rowCount: src.rows.length,
    oblong: cols !== src.rows.length,
    need,
    colorCount,
    beads: values.reduce((a, b) => a + b, 0),
    difficulty: difficultyOf(colorCount),
  };
}

export function filterPatterns(patterns: Pattern[], selection: PatternSelection): Pattern[] {
  return patterns.filter(
    (p) =>
      (selection.difficulty === 'all' || p.difficulty === selection.difficulty) &&
      (selection.category === 'all' || p.category === selection.category) &&
      (selection.gridSize === 'all' || p.size === selection.gridSize),
  );
}
