import type { Pattern } from '../types/pattern';

/**
 * 첫 화면에 보여 줄 오늘의 추천 도안.
 *
 * 날짜를 씨앗으로 삼아 고르므로, 같은 날에는 모든 태블릿이 같은 세 가지를 봅니다.
 * (강사가 "오늘은 이 셋 중에 골라 보자"라고 말할 수 있어야 하기 때문입니다.)
 * 재고가 모자란 도안은 빼고, 난이도를 골고루 섞어 아이마다 고를 여지를 남깁니다.
 */

const LEVELS = ['easy', 'medium', 'challenge'] as const;

function daySeed(now: Date): number {
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

/** 씨앗이 같으면 같은 순서를 내놓는 아주 작은 난수 */
function makeRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

export function pickRecommended(
  all: Pattern[],
  canMake: (p: Pattern) => boolean,
  count = 3,
  today = new Date(),
): Pattern[] {
  if (!all.length) return [];
  const usable = all.filter(canMake);
  // 만들 수 있는 것이 너무 적으면 재고를 따지지 않고 보여 준다 — 빈 화면보다는 낫다
  const pool = usable.length >= count ? usable : all;
  const random = makeRandom(daySeed(today));
  const picked: Pattern[] = [];

  const takeFrom = (group: Pattern[]) => {
    const rest = group.filter((p) => !picked.some((q) => q.id === p.id));
    if (!rest.length) return;
    picked.push(rest[Math.floor(random() * rest.length)]);
  };

  // 쉬운 것 → 보통 → 도전 순으로 한 개씩 뽑아 난이도를 섞는다
  LEVELS.forEach((level) => {
    if (picked.length >= count) return;
    takeFrom(pool.filter((p) => p.difficulty === level));
  });

  // 그래도 모자라면 남은 것에서 채운다
  let guard = 0;
  while (picked.length < count && picked.length < pool.length && guard < 50) {
    takeFrom(pool);
    guard += 1;
  }
  return picked;
}
