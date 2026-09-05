// 도안·재고 공통 타입 정의

/** 보유 비즈 색상 키 (재고 12색) */
export type ColorKey = 'A' | 'G' | 'K' | 'R' | 'O' | 'Y' | 'N' | 'S' | 'W' | 'V' | 'P' | 'T';

/** 난이도: 사용 색상 수 기준으로 산출 */
export type DifficultyId = 'easy' | 'medium' | 'challenge';

/** 주제(카테고리) */
export type CategoryId = 'animal' | 'vehicle' | 'food' | 'shape' | 'nature';

/** 격자 크기 — 최대 12×12 */
export type GridSizeId = 6 | 8 | 10 | 12;

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
}

/** 파생 정보까지 채워진 도안 */
export interface Pattern extends PatternSource {
  size: GridSizeId;
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
  return {
    ...src,
    size: src.rows.length as GridSizeId,
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
