import { COLOR_HEX } from './inventory';
import type { CategoryId, DifficultyId, GridSizeId } from '../types/pattern';

/**
 * 선택 화면 옵션 데이터.
 * UDL 원칙에 따라 각 옵션은 (1) 텍스트 라벨 (2) 아이콘/이모지 (3) 색상 (4) 미니 미리보기
 * 네 가지 표상을 함께 제공하여, 글자를 읽지 못해도 선택할 수 있게 합니다.
 */

export interface OptionItem<T> {
  id: T;
  label: string;
  /** 보조 설명 — 보호자·교사용 */
  hint: string;
  emoji: string;
  /** 카드 배경/테두리 색 (Tailwind 임의 값으로 사용) */
  tone: { bg: string; border: string; text: string };
}

export const DIFFICULTY_OPTIONS: OptionItem<DifficultyId>[] = [
  {
    id: 'easy',
    label: '쉬워요',
    hint: '색 2~3가지 · 큰 덩어리 모양',
    emoji: '🟢',
    tone: { bg: '#E9F7EA', border: '#7BC47F', text: '#2F6B33' },
  },
  {
    id: 'medium',
    label: '보통이에요',
    hint: '색 4~6가지 · 부분 세부 묘사',
    emoji: '🟡',
    tone: { bg: '#FFF4E0', border: '#F0A64E', text: '#8A5216' },
  },
  {
    id: 'challenge',
    label: '도전해요',
    hint: '색 7가지 이상 · 촘촘한 배치',
    emoji: '🔴',
    tone: { bg: '#FDEBEC', border: '#E27A7A', text: '#8C2F2F' },
  },
];

/** 6×6 미니 미리보기 — '.'는 빈칸, 나머지는 실제 재고 색상 키 */
export const PREVIEW_COLORS: Record<string, string> = COLOR_HEX;

export const CATEGORY_OPTIONS: (OptionItem<CategoryId> & { preview: string[] })[] = [
  {
    id: 'animal',
    label: '동물',
    hint: '고양이 · 강아지 · 곰',
    emoji: '🐱',
    tone: { bg: '#FFF1E6', border: '#E9A178', text: '#8A4B2A' },
    preview: ['.N..N.', 'NNNNNN', 'NKNNKN', 'NNNNNN', 'N.NN.N', '.NNNN.'],
  },
  {
    id: 'vehicle',
    label: '탈것',
    hint: '자동차 · 버스 · 기차',
    emoji: '🚗',
    tone: { bg: '#E8F1FA', border: '#7FA8D4', text: '#2C4E75' },
    preview: ['......', '.RRRR.', 'RRTTRR', 'RRRRRR', '.K..K.', '......'],
  },
  {
    id: 'food',
    label: '음식',
    hint: '사과 · 딸기 · 아이스크림',
    emoji: '🍎',
    tone: { bg: '#FDECEE', border: '#E28A96', text: '#8C3444',
    },
    preview: ['..G...', '.RRRR.', 'RRRRRR', 'RRRRRR', '.RRRR.', '..RR..'],
  },
  {
    id: 'shape',
    label: '모양·기호',
    hint: '하트 · 별',
    emoji: '💛',
    tone: { bg: '#FFF8DF', border: '#E5C55C', text: '#7A6117' },
    preview: ['.P..P.', 'PPPPPP', 'PPPPPP', '.PPPP.', '..PP..', '......'],
  },
  {
    id: 'nature',
    label: '자연·계절',
    hint: '나무 · 꽃 · 무지개 · 눈송이',
    emoji: '🌳',
    tone: { bg: '#EAF6EA', border: '#7BB77E', text: '#31663A' },
    preview: ['..G...', '.GGG..', 'GGGGG.', '..N...', '..N...', '.NNN..'],
  },
];

export const GRID_SIZE_OPTIONS: (OptionItem<GridSizeId> & { beads: number })[] = [
  {
    id: 6,
    label: '6 × 6',
    hint: '가장 작아요 · 5~10분',
    emoji: '▫️',
    tone: { bg: '#F4F7F4', border: '#A8BFA8', text: '#3F5B45' },
    beads: 36,
  },
  {
    id: 8,
    label: '8 × 8',
    hint: '조금 작아요 · 10~15분',
    emoji: '◽',
    tone: { bg: '#F2F6F9', border: '#9BB6CC', text: '#33526B' },
    beads: 64,
  },
  {
    id: 10,
    label: '10 × 10',
    hint: '보통이에요 · 15~25분',
    emoji: '◻️',
    tone: { bg: '#FBF3F6', border: '#C99FB4', text: '#6B3A52' },
    beads: 100,
  },
  {
    id: 12,
    label: '12 × 12',
    hint: '가장 커요 · 25분 이상',
    emoji: '⬜',
    tone: { bg: '#FFF3E4', border: '#DDA55F', text: '#7A4B14' },
    beads: 144,
  },
];

/** 단계 정의 — 순서를 바꾸려면 이 배열만 수정하면 됩니다. */
export const STEPS = [
  { key: 'difficulty', title: '얼마나 어렵게 할까요?', subtitle: '1단계 · 난이도 고르기' },
  { key: 'category', title: '무엇을 만들고 싶나요?', subtitle: '2단계 · 주제 고르기' },
  { key: 'gridSize', title: '크기는 어떻게 할까요?', subtitle: '3단계 · 칸 수 고르기' },
] as const;

export type StepKey = (typeof STEPS)[number]['key'];
