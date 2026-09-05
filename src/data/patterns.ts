import { derivePattern, type Pattern, type PatternSource } from '../types/pattern';

/**
 * 도안 원본. 한 글자가 한 칸이며 '.'은 빈칸, 나머지는 재고 색상 키입니다.
 * 보유 12색(A연두 G초록 K검정 R빨강 O주황 Y노랑 N연한갈색 S살색 W화이트 V연보라 P찐핑 T투명)만 사용합니다.
 * 필요 비즈 수·색상 수·난이도는 derivePattern이 자동으로 계산하므로 별도로 적지 않습니다.
 */
const SOURCES: PatternSource[] = [
  { id: 'heart', title: '하트', category: 'shape',
    rows: ['RR..RR', 'RRRRRR', 'RRRRRR', '.RRRR.', '..RR..', '......'] },
  { id: 'tree', title: '작은 나무', category: 'nature',
    rows: ['..GG..', '.GGGG.', 'GGGGGG', '.GGGG.', '..NN..', '..NN..'] },
  { id: 'apple', title: '사과', category: 'food',
    rows: ['...G..', '.RRRR.', 'RRRRRR', 'RRRRRR', '.RRRR.', '..RR..'] },

  { id: 'star', title: '별', category: 'shape',
    rows: ['...YY...', '...YY...', 'YYYYYYYY', '.YYYYYY.', '..YYYY..', '..YYYY..', '.YY..YY.', 'Y......Y'] },
  { id: 'cat', title: '고양이', category: 'animal',
    rows: ['NN....NN', 'NNN..NNN', 'NNNNNNNN', 'NKNNNNKN', 'NNNNNNNN', 'NNWPWNNN', '.NNNNNN.', '..N..N..'] },
  { id: 'car', title: '자동차', category: 'vehicle',
    rows: ['........', '..RRRR..', '.RTTTTR.', 'RRRRRRRR', 'YRRRRRRY', '........', '.KK..KK.', '........'] },
  { id: 'berry', title: '딸기', category: 'food',
    rows: ['...G....', '..GGG...', '.RRRRR..', 'RRWRRRR.', 'RRRRWRR.', '.RWRRR..', '..RRR...', '...R....'] },

  { id: 'dog', title: '강아지', category: 'animal',
    rows: ['NN......NN', 'NNN....NNN', 'NNNNNNNNNN', 'NNNNNNNNNN', 'NKNNNNNNKN', 'NNNNNNNNNN', 'NNNNWKWNNN', 'NNNWWWWWNN', 'NNNNWPWNNN', '.NNNNNNNN.'] },
  { id: 'flower', title: '꽃', category: 'nature',
    rows: ['..PP..PP..', '.PPPP.PPP.', 'PPPPPPPPPP', 'PPPPYYPPPP', 'PPPYYYYPPP', 'PPPPYYPPPP', 'PPPPPPPPPP', '.PPPP.PPP.', '....GG....', '...GGGG...'] },
  { id: 'bus', title: '버스', category: 'vehicle',
    rows: ['..........', '.YYYYYYYY.', 'YYYYYYYYYY', 'YTTYTTYTTY', 'YTTYTTYTTY', 'YYYYYYYYYY', 'YWYYYYYYWY', 'NNNNNNNNNN', '.KK....KK.', '.KK....KK.'] },

  { id: 'bear', title: '곰돌이', category: 'animal',
    rows: ['NNN......NNN', 'NNNN....NNNN', 'NNWN....NWNN', '.NNNNNNNNNN.', 'NNNNNNNNNNNN', 'NNKNNNNNNKNN', 'NNNNNNNNNNNN', 'NNNNWWWWNNNN', 'NNNWWKKWWNNN', 'NNNWWWWWWNNN', '.NNNWPPWNNN.', '..NNNNNNNN..'] },
  { id: 'icecream', title: '아이스크림', category: 'food',
    rows: ['....PPPP....', '...PPPPPP...', '..PPPPPPPP..', '..VVVVVVVV..', '..AAAAAAAA..', '...YYYYYY...', '...NNNNNN...', '...NWNNWN...', '....NNNN....', '....NNNN....', '.....NN.....', '...KKKKKK...'] },
  { id: 'train', title: '기차', category: 'vehicle',
    rows: ['...W........', '..WWW.......', '..RRRRRRRR..', '.RRTTRRTTRR.', 'RRRTTRRTTRRR', 'RRRRRRRRRRRR', 'YYYYYYYYYYYY', 'KKKKKKKKKKKK', '.SS..SS..SS.', '.KK..KK..KK.', '.KK..KK..KK.', '............'] },
  { id: 'rainbow', title: '무지개', category: 'nature',
    rows: ['...RRRRRR...', '..ROOOOOOR..', '.ROYYYYYYOR.', 'ROYAAAAAAYOR', 'OYAGGGGGGAYO', 'YAGVVVVVVGAY', 'AGVPPPPPPVGA', 'GVP......PVG', 'VP........PV', 'P..........P', '............', '............'] },
  { id: 'snow', title: '눈송이', category: 'nature',
    rows: ['.....TT.....', '.T...TT...T.', '..T..TT..T..', '...TTTTTT...', '..TTTTTTTT..', 'TTTTTTTTTTTT', 'TTTTTTTTTTTT', '..TTTTTTTT..', '...TTTTTT...', '..T..TT..T..', '.T...TT...T.', '.....TT.....'] },
];

export const PATTERNS: Pattern[] = SOURCES.map(derivePattern);

/** 도안 데이터 무결성 검사 — 개발 중 잘못된 행 길이를 바로 잡아냅니다. */
export function validatePatterns(list: Pattern[] = PATTERNS): string[] {
  const problems: string[] = [];
  list.forEach((p) => {
    const widths = new Set(p.rows.map((r) => r.length));
    if (widths.size !== 1 || !widths.has(p.rows.length)) {
      problems.push(`${p.title}: 정사각 격자가 아닙니다 (${p.rows.length}행, 폭 ${[...widths].join('/')})`);
    }
  });
  return problems;
}
