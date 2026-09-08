import type { BeadCount, ColorKey } from '../types/pattern';

/**
 * 보유 비즈 재고.
 * init 값은 최초 실물 재고 수량이며, 실제 잔량은 useInventory가 관리합니다.
 * 색상을 추가하려면 여기에 한 줄만 추가하면 도안·재고 화면 전체에 반영됩니다.
 */
export interface BeadColor {
  key: ColorKey;
  name: string;
  hex: string;
  init: number;
}

export const BEAD_COLORS: BeadColor[] = [
  { key: 'A', name: '연두', hex: '#A5CE3A', init: 16604 },
  { key: 'G', name: '초록', hex: '#2F9E5A', init: 9556 },
  { key: 'K', name: '검정', hex: '#2B2B2B', init: 17059 },
  { key: 'R', name: '빨강', hex: '#E03C31', init: 8019 },
  { key: 'O', name: '주황', hex: '#F08030', init: 9704 },
  { key: 'Y', name: '노랑', hex: '#F7CE46', init: 21031 },
  { key: 'N', name: '연한 갈색', hex: '#C89B6A', init: 9630 },
  { key: 'S', name: '살색', hex: '#F6CFAE', init: 15717 },
  { key: 'W', name: '화이트', hex: '#F7F4EE', init: 7585 },
  { key: 'V', name: '연보라', hex: '#B9A0DC', init: 3864 },
  { key: 'P', name: '찐핑', hex: '#E8437F', init: 10231 },
  { key: 'T', name: '투명', hex: '#DDE5E8', init: 9000 },
  // 뒤에 추가한 색 — 수량은 재고 현황 화면에서 직접 넣습니다
  { key: 'B', name: '파랑', hex: '#2E63C8', init: 0 },
  { key: 'C', name: '하늘', hex: '#7EC8E8', init: 0 },
  { key: 'F', name: '연핑크', hex: '#F7B6CC', init: 0 },
];

export const COLOR_HEX = Object.fromEntries(BEAD_COLORS.map((c) => [c.key, c.hex])) as Record<ColorKey, string>;
export const COLOR_NAME = Object.fromEntries(BEAD_COLORS.map((c) => [c.key, c.name])) as Record<ColorKey, string>;

/** 재고 초기값 */
export const INITIAL_STOCK = Object.fromEntries(
  BEAD_COLORS.map((c) => [c.key, c.init]),
) as Record<ColorKey, number>;

/** 소비 기록 한 건 — 잔량 파악이 목적이므로 사용량만 남깁니다 */
export interface StockEntry {
  id: string;
  /** 완성 = 도안 전량 사용, 부분 사용 = 실제 사용량 직접 입력 */
  kind: '완성' | '부분 사용';
  /** 도안 이름 */
  title: string;
  /** 색상별 사용 수량 (양수) */
  used: BeadCount;
  /** 사용 수량 합계 */
  total: number;
  at: string;
}

/** 최초 재고 합계 */
export const START_TOTAL = BEAD_COLORS.reduce((a, c) => a + c.init, 0);

export const formatCount = (n: number) => n.toLocaleString('ko-KR');
