import { derivePattern, type Pattern, type PatternSource } from '../types/pattern';

/**
 * 도안 원본. 한 글자가 한 칸이며 '.'은 빈칸, 나머지는 재고 색상 키입니다.
 * 보유 12색(A연두 G초록 K검정 R빨강 O주황 Y노랑 N연한갈색 S살색 W화이트 V연보라 P찐핑 T투명)만 사용합니다.
 * 원본 도안에 보유하지 않은 색(파랑·하늘색·진한 갈색 등)이 쓰인 경우 가장 가까운 보유색으로 바꿔 두었습니다.
 * 가로·세로 칸 수가 달라도 됩니다. 필요 비즈 수·색상 수·난이도는 derivePattern이 자동으로 계산합니다.
 */
const SOURCES: PatternSource[] = [
  { id: 'duck', title: '오리', category: 'animal',
    rows: ['WWWWWWWWW', 'WWWWWWWWW', 'WKKKWKKKW', 'WWWWWWWWW', 'WWKWWWKWW', 'YWWYYYWWY', 'YYYYYYYYY', 'WYYYYYYYW'] },
  { id: 'chick', title: '병아리', category: 'animal',
    rows: ['..YYY..', '.YYYYY.', 'YYYYYYY', 'YKYYYKY', 'YKYOYKY', '.YOOOY.', 'YYYYYYY', 'YYYYYYY', '.YYYYY.', '..YYY..'] },
  { id: 'panda', title: '판다', category: 'animal',
    rows: ['WWWWWWWWWWWW', 'WWWWWWWWWWWW', 'WKKWWWWWWKKW', 'KKKKWWWWKKKK', 'KKKWWWWWWKKK', 'KKWWWWWWWWKK', 'WWKKWWWWKKWW', 'WKKWKWWKWKKW', 'WKKKKWWKKKKW', 'WWSSWKKWSSWW', 'WWWWWWWWWWWW', 'WWWWWWWWWWWW'] },
  { id: 'frog-face', title: '개구리 얼굴', category: 'animal',
    rows: ['.GGGG..GGGG.', '.GGGG..GGGG.', '.GGGGGGGGGG.', '.GGWWGGWWGG.', 'GGGKKGGKKGGG', 'GGGKWGGKWGGG', 'GGSSWGGWSSGG', 'GGGGKGGKGGGG', '.GGGKKKKGGG.', '..GGGGGGGG..'] },
  { id: 'snake', title: '뱀', category: 'animal',
    rows: ['......GGG..', '....GGGGGG.', '...GGYKYGGG', '..GGYYKYYGG', '..GGGYKYGGG', 'GGGWGGGGGGG', 'KKKKGGGGGG.', '.GGGGGGGG..'] },
  { id: 'butterfly-s', title: '나비', category: 'animal',
    rows: ['....K.K....', '.KK.K.K.KK.', 'KOOKWKWKOOK', 'KOYYKKKYYOK', 'KOYYYKYYYOK', '.KOYYKYYOK.', '..KKYKYKK..', '.KOYYKYYOK.', '.KOOK.KOOK.', '..KK...KK..'] },
  { id: 'rabbit', title: '토끼', category: 'animal',
    rows: ['WWKKWWWWKKWW', 'WKVVKWWKVVKW', 'WKPPKWWKPPKW', 'WKPPKWWKPPKW', 'WKWWKKKKWWKW', 'KWWWWWWWWWWK', 'KWWKWWWWKWWK', 'KWWWWWWWWWWK', 'KWPWWKKWWPWK', 'KWWWKWWKWWWK', 'WKWWWWWWWWKW', 'WWKKKKKKKKWW'] },
  { id: 'frog-big', title: '왕눈이 개구리', category: 'animal',
    rows: ['WWKKWWWWKKWW', 'WKWWKWWKWWKW', 'WKWKKWWKKWKW', 'KAAAAAAAAAAK', 'KAAAAAAAAAAK', 'KAAAAAAAAAAK', 'KPAAAAAAAAPK', 'KPPAAAAAAPPK', 'KAAKAAAAKAAK', 'WKAAKKKKAAKW', 'WWKAAAAAAKWW', 'WWWKKKKKKWWW'] },
  { id: 'lemon', title: '레몬', category: 'food',
    rows: ['....GG.', '...G...', '..YYY..', '.YYYYY.', 'YYYYYYY', 'YYYYYYY', 'YYYYYYY', '.YYYYY.', '..YYY..'] },
  { id: 'bingsu', title: '빙수', category: 'food',
    rows: ['...RRRR...', '..RRRRRR..', '.WWYWVWPW.', 'WVYWVWRWWW', 'WWWYWWWWPW', 'KKKKKKKKKK', 'KTTTTTTTTK', '.KTTTTTTK.', '..KTTTTK..', '...KKKK...'] },
  { id: 'pizza', title: '피자', category: 'food',
    rows: ['..NN.....', '..NNNN...', '..SRRNNN.', '..SRSSSN.', '.SSSSSSNN', '.RSRSRRSN', '.SRRSRS..', '.RSSSS...', 'SSS......', 'SS.......'] },
  { id: 'watermelon', title: '수박', category: 'food',
    rows: ['GRRRRRRRRRG', 'GRRKRRRRKRG', 'GKRRRRRRRRG', 'GGRRRKRRRGG', '.GGRRRRKGG.', '..GGGGGGG..'] },
  { id: 'fries', title: '감자튀김', category: 'food',
    rows: ['...Y..Y..YY', 'YY.Y.YY.YYY', '.YYYYYYYYY.', '.YYYYYYYYY.', 'KRYYYYYYYRK', 'KRRRRRRRRRK', '.KRRORORRK.', '.KRORORORK.', '.KRORRRORK.', '.KRRRRRRRK.', '..KKKKKKK..'] },
  { id: 'burger', title: '햄버거', category: 'food',
    rows: ['.NNNN.', 'NNNNNN', 'YYYYYY', 'GRRRRG', 'NGGGGN', '.NNNN.'] },
  { id: 'donut', title: '도넛', category: 'food',
    rows: ['..NNNN..', '.NKPKPN.', 'NKYKPKPN', 'NPK..PKN', 'NKP..KPN', 'NPKPKYKN', '.NPKPKN.', '..NNNN..'] },
  { id: 'star-face', title: '별', category: 'shape',
    rows: ['TTTTTTTTTTTT', 'TTTTTKKTTTTT', 'TTTTKYYKTTTT', 'TTTKYYYYKTTT', 'TKKYYYYYYKKT', 'TKYYKYYKYYKT', 'TTKYPYYPYKTT', 'TTTKYYYYKTTT', 'TTKYYYYYYKTT', 'TTKYYKKYYKTT', 'TTTKKTTKKTTT', 'TTTTTTTTTTTT'] },
  { id: 'cloud', title: '구름', category: 'shape',
    rows: ['...K.KK..', '..KKKWWK.', '.KWWKWWK.', 'KWWWWWWWK', 'KWWWWWWWK', '.KKKKKKK.'] },
  { id: 'round-face', title: '동그란 얼굴', category: 'shape',
    rows: ['TTTTTTTTTTTT', 'TTTKKKKKKTTT', 'TTKWWWWWWKTT', 'TKWWWWWWWWKT', 'KWWWWWWWWWWK', 'KWWWKWWKWWWK', 'KWWPWKKWPWWK', 'KWWWWWWWWWWK', 'TKWWWWWWWWKT', 'TTKWWWWWWKTT', 'TTTKKKKKKTTT', 'TTTTTTTTTTTT'] },
  { id: 'heart12', title: '하트', category: 'shape',
    rows: ['WWWWWWWWWWWW', 'WWWWWWWWWWWW', 'WWKKKWWKKKWW', 'WKRRRKKRRRKW', 'KRWWRRRRRRRK', 'KRWRRRRRRRRK', 'WKRRRRRRRRKW', 'WWKRRRRRRKWW', 'WWWKRRRRKWWW', 'WWWWKRRKWWWW', 'WWWWWKKWWWWW', 'WWWWWWWWWWWW'] },
  { id: 'sun', title: '해', category: 'shape',
    rows: ['WWWWWOOWWWWW', 'WWOWWOOWWOWW', 'WWOOKKKKOOWW', 'WWWKYYYYKWWW', 'OOKYYYYYYKOO', 'WOKYKYYKYKOW', 'WWKPYKKYPKWW', 'WOKYYYYYYKOW', 'OOWKYYYYKWOO', 'WWOWKKKKWOWW', 'WWOWWOOWWOWW', 'WWWWWOOWWWWW'] },
  { id: 'rainbow12', title: '무지개', category: 'shape',
    rows: ['WWWWKKKKWWWW', 'WWWKRRRRKWWW', 'WWKROOOORKWW', 'WKROYYYYORKW', 'KRYYAAAAYORK', 'KRYAVVVVAYRK', 'KRYVVVVVVYRK', 'KRYVVVVVVYRK', 'KRYVVKKVVYRK', 'KKKVKWWKVKKK', 'KWWKKWWKKWWK', 'WWWWKWWKWWWW'] },
  { id: 'moon', title: '달', category: 'shape',
    rows: ['WWWKKKKKWWWW', 'WWKYYYYYKWWW', 'WKYYYYYKWWWW', 'WKYYYYKWWWWW', 'KYYYYYKWWWWW', 'KYYYYYKWWWWW', 'KYYYYYKWWWWW', 'KYYYKYKWWWWW', 'KYYPYYYKWWWW', 'KYYYYKYYKWKW', 'WKYYYYYYYYYK', 'WWKYYYYYYYKW'] },
  { id: 'note', title: '음표', category: 'shape',
    rows: ['...KKK..', '...KKKK.', '...K..KK', '...K..KK', '...K.KK.', '...K.K..', '...K....', '.KKK....', 'KKKK....', 'KKKK....', '.KK.....'] },
  { id: 'heart8', title: '작은 하트', category: 'shape',
    rows: ['........', '.KK..KK.', 'KRRKKRRK', 'RRRRRRRR', 'KRRRRRRK', '.KRRRRK.', '..KRRK..', '...KK...'] },
  { id: 'apple12', title: '사과', category: 'food',
    rows: ['..K.....', '..KK....', '.RRKRR..', 'RWWRWWR.', 'RWKWKWR.', 'RWWWWWR.', '.RWRWR..', '..R.R...'] },
  { id: 'heart-violet', title: '보라 하트', category: 'shape',
    rows: ['.KK.KK.', 'KVVKVVK', 'KVVVVVK', '.KVVVK.', '..KVK..', '...K...'] },
  { id: 'butterfly-l', title: '큰 나비', category: 'nature',
    rows: ['..K...K..', '...V.V...', 'OOYYVYYOO', 'OYOYVYOYO', 'OYYYVYYYO', '.OYYVYYO.', 'OYOYVYOYO', 'OYYOVOYYO', '.OO...OO.'] },
  { id: 'bee', title: '꿀벌', category: 'nature',
    rows: ['....KK.KK...', '...KWWKWWK..', '...KWWWKWK..', '...KKKKKKK..', '..KKYYKYYYK.', '.KYKYYKYYYYK', 'KKYKYYKYYKYK', '.KYKYYKYYYYK', '..KKYYKYYYK.', '...KKKKKKK..'] },
  { id: 'snail', title: '달팽이', category: 'nature',
    rows: ['.......K.K.', '.......KKK.', '......KSSSK', '.KKK..KSKSK', 'KNNNK.KSSK.', 'KNKNNKSSK..', 'KNNKNKSSK..', 'KNKNNKSSK..', '.KNNKSSSK..', 'KKKKKKKK...'] },
  { id: 'tree-s', title: '나무', category: 'nature',
    rows: ['..G..', '.GGG.', 'GGGGG', '..N..', '..N..'] },
  { id: 'mushroom', title: '버섯', category: 'nature',
    rows: ['..NN..', '.NSNN.', 'NSNNSN', 'NNNNNN', '..SS..', '..SS..'] },
  { id: 'fish', title: '물고기', category: 'nature',
    rows: ['O.OOO.', 'OOOOKO', 'OOOOOO', 'O.OOO.'] },
  { id: 'flower-red', title: '꽃', category: 'nature',
    rows: ['..RR..', '.PRRP.', '.RYYR.', '.RYYR.', '.PRRP.', '..RR..'] },
  { id: 'tree-l', title: '큰 나무', category: 'nature',
    rows: ['.GGGGGGN', 'GGGNNGNG', 'NGGNNNGG', 'GNGNNGG.', '.GNNNG..', '...NN...', '...NN...', '...NN...'] },
  { id: 'maple', title: '단풍잎', category: 'nature',
    rows: ['...R...', '..RRR..', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '...R...', '...R...'] },
  { id: 'face-smile', title: '웃는 얼굴', category: 'emotion',
    rows: ['..YYYYYY..', '.YYYYYYYY.', 'YYKYYYYKYY', 'YKYKYYKYKY', 'YYYYYYYYYY', 'PPYYYYYYPP', 'YYYYYYYYYY', 'YYKYYYYKYY', '.YYKKKKYY.', '..YYYYYY..'] },
  { id: 'face-angry', title: '화난 얼굴', category: 'emotion',
    rows: ['..YYYYYYYY..', '.YYYYYYYYYY.', 'YYYKYYYYYKYY', 'YYKYKYYYKYKY', 'YKYYYKYKYYYK', 'PPYYYYYYYYPP', 'PPYYYYYYYYPP', 'YYYYYYYYYYYY', 'YYYKYYYYKYYY', 'YYYYKKKKYYYY', '.YYYYYYYYYY.', '..YYYYYYYY..'] },
  { id: 'face-love', title: '설레는 얼굴', category: 'emotion',
    rows: ['..YYYYYYYY..', '.YYYYYYYYYY.', 'YYYYYYYYYYYY', 'YYPYPYYPYPYY', 'YYPPPYYPPPYY', 'YYYPYYYYPYYY', 'YYYYYYYYYYYY', 'YYKYYYYYYKYY', 'YYKYYYYYYKYY', 'YYYKKKKKKYYY', '.YYYYYYYYYY.', '..YYYYYYYY..'] },
  { id: 'face-surprise', title: '놀란 얼굴', category: 'emotion',
    rows: ['.YYYY.', 'YKYYYY', 'YKYKKY', 'YYYYYY', 'YKYYKY', '.YKKY.'] },
  { id: 'face-grin', title: '활짝 웃는 얼굴', category: 'emotion',
    rows: ['..YYYY..', '.YYYYYY.', 'YYKYYYYY', 'YYKYYKKY', 'YPYYYYPY', 'YYKYYKYY', '.YYKKYY.', '..YYYY..'] },
  { id: 'face-frown', title: '찡그린 얼굴', category: 'emotion',
    rows: ['..YYYY..', '.YYYYYY.', 'YYKYYKYY', 'YYWYYWYY', 'YYKYYKYY', 'YYYYYYYY', '.YYKKYY.', '..YKKY..'] },

  // 캐릭터 — 저작권 걱정 없이 쓸 수 있도록 새로 그린 창작 캐릭터입니다.
  { id: 'star-buddy', title: '별이', category: 'character',
    rows: ['...YY...', '...YY...', 'YYYYYYYY', '.YKYYKY.', '..YYYY..', '..YKKY..', '.YY..YY.', '.Y....Y.'] },
  { id: 'blob-pink', title: '동글이', category: 'character',
    rows: ['.PPPP.', 'PPPPPP', 'PKPPKP', 'PPPPPP', 'PPWWPP', '.PPPP.'] },
  { id: 'mini-robot', title: '꼬마 로봇', category: 'character',
    rows: ['..K..K..', '..YTTY..', '.TTTTTT.', '.TKTTKT.', '.TTRRTT.', '.TAAAAT.', '..T..T..', '..K..K..'] },
  { id: 'cloudy', title: '구름이', category: 'character',
    rows: ['..KKKK..', '.KWWWWK.', 'KWWWWWWK', 'KWKWWKWK', 'KWPWWPWK', '.KWWWWK.', '..KKKK..', '.T.T.T..'] },
  { id: 'rainbow-fairy', title: '무지개 요정', category: 'character',
    rows: ['..RRRR..', '.OOOOOO.', 'YYYYYYYY', '.AAAAAA.', '.SKSSKS.', '.SSPPSS.', '..GGGG..', '..V..V..'] },
  { id: 'color-monster', title: '알록달록 괴물', category: 'character',
    rows: ['.K.KK.K.', '.GGGGGG.', 'GAAGGAAG', 'GKWGGWKG', 'GGGGGGGG', 'GOOOOOOG', '.GPPPPG.', '..V..V..'] },
  { id: 'square-pal', title: '네모 친구', category: 'character',
    rows: ['..........', '.VVVVVVVV.', '.VVVVVVVV.', '.VKVVVVKV.', '.VVVVVVVV.', '.VVWWWWVV.', '.VVVVVVVV.', '.VVVVVVVV.', '..VV..VV..', '..........'] },
  { id: 'space-pal', title: '우주 친구', category: 'character',
    rows: ['....WWWW....', '...WWWWWW...', '..WWKKKKWW..', '..WKKKKKKW..', '..WKKKKKKW..', '..WWKKKKWW..', '...WWWWWW...', '..WWWWWWWW..', '..WWWWWWWW..', '..WW....WW..', '..WW....WW..', '............'] },
  { id: 'little-wizard', title: '꼬마 마법사', category: 'character',
    rows: ['.....V......', '....VVV.....', '...VVVVV....', '..VVYVVVV...', '.VVVVVVVVV..', 'NNNSSSSSNNN.', 'NNSSSSSSSNN.', 'NNSKSSSKSNN.', '.NSSSSSSSN..', '..RRRRRRR...', '..RRRRRRR...', '..R.....R...'] },
  { id: 'octo-pal', title: '문어 친구', category: 'character',
    rows: ['...RRRR...', '..PPPPPP..', '.PPPPPPPP.', '.PKPPPPKP.', '.PPPPPPPP.', '.PVWWWWVP.', '.PPPPPPPP.', '.PPPPPPPP.', 'P.P.PP.P.P', 'P..P..P..P'] },
  { id: 'rainbow-robot', title: '무지개 로봇', category: 'character',
    rows: ['..K......K..', '..KTTTTTTK..', '..TTTTTTTT..', '..TKTTTTKT..', '..TTTTTTTT..', '..TTWWWWTT..', '.RRRRRRRRRR.', '.OOOOOOOOOO.', '.YYYYYYYYYY.', '.AAAAAAAAAA.', '..V......V..', '..K......K..'] },
  { id: 'forest-fairy', title: '숲 요정', category: 'character',
    rows: ['...AAAAAA...', '..AAGGGGAA..', '..AGGGGGGA..', '...SSSSSS...', '...SKSSKS...', '...SSPPSS...', '..YYSSSSYY..', '.GGGGGGGGGG.', '.GGGGGGGGGG.', '..NNN..NNN..', '..N.N..N.N..', '............'] },
  // 앱에서 함께 제공하는 기본 도안
  { id: 'cat', title: '고양이', category: 'animal',
    rows: ['NN....NN', 'NNN..NNN', 'NNNNNNNN', 'NKNNNNKN', 'NNNNNNNN', 'NNWPWNNN', '.NNNNNN.', '..N..N..'] },
  { id: 'dog', title: '강아지', category: 'animal',
    rows: ['NN......NN', 'NNN....NNN', 'NNNNNNNNNN', 'NNNNNNNNNN', 'NKNNNNNNKN', 'NNNNNNNNNN', 'NNNNWKWNNN', 'NNNWWWWWNN', 'NNNNWPWNNN', '.NNNNNNNN.'] },
  { id: 'bear', title: '곰돌이', category: 'animal',
    rows: ['NNN......NNN', 'NNNN....NNNN', 'NNWN....NWNN', '.NNNNNNNNNN.', 'NNNNNNNNNNNN', 'NNKNNNNNNKNN', 'NNNNNNNNNNNN', 'NNNNWWWWNNNN', 'NNNWWKKWWNNN', 'NNNWWWWWWNNN', '.NNNWPPWNNN.', '..NNNNNNNN..'] },
  { id: 'car', title: '자동차', category: 'vehicle',
    rows: ['........', '..RRRR..', '.RTTTTR.', 'RRRRRRRR', 'YRRRRRRY', '........', '.KK..KK.', '........'] },
  { id: 'bus', title: '버스', category: 'vehicle',
    rows: ['..........', '.YYYYYYYY.', 'YYYYYYYYYY', 'YTTYTTYTTY', 'YTTYTTYTTY', 'YYYYYYYYYY', 'YWYYYYYYWY', 'NNNNNNNNNN', '.KK....KK.', '.KK....KK.'] },
  { id: 'train', title: '기차', category: 'vehicle',
    rows: ['...W........', '..WWW.......', '..RRRRRRRR..', '.RRTTRRTTRR.', 'RRRTTRRTTRRR', 'RRRRRRRRRRRR', 'YYYYYYYYYYYY', 'KKKKKKKKKKKK', '.SS..SS..SS.', '.KK..KK..KK.', '.KK..KK..KK.', '............'] },
  { id: 'berry', title: '딸기', category: 'food',
    rows: ['...G....', '..GGG...', '.RRRRR..', 'RRWRRRR.', 'RRRRWRR.', '.RWRRR..', '..RRR...', '...R....'] },
  { id: 'icecream', title: '아이스크림', category: 'food',
    rows: ['....PPPP....', '...PPPPPP...', '..PPPPPPPP..', '..VVVVVVVV..', '..AAAAAAAA..', '...YYYYYY...', '...NNNNNN...', '...NWNNWN...', '....NNNN....', '....NNNN....', '.....NN.....', '...KKKKKK...'] },
  { id: 'snow', title: '눈송이', category: 'nature',
    rows: ['.....TT.....', '.T...TT...T.', '..T..TT..T..', '...TTTTTT...', '..TTTTTTTT..', 'TTTTTTTTTTTT', 'TTTTTTTTTTTT', '..TTTTTTTT..', '...TTTTTT...', '..T..TT..T..', '.T...TT...T.', '.....TT.....'] },
];

export const PATTERNS: Pattern[] = SOURCES.map(derivePattern);

/** 도안 데이터 무결성 검사 — 행 길이가 어긋나거나 빈 도안을 바로 잡아냅니다. */
export function validatePatterns(list: Pattern[] = PATTERNS): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  list.forEach((p) => {
    if (seen.has(p.id)) problems.push(`${p.title}: id가 중복입니다 (${p.id})`);
    seen.add(p.id);
    const widths = new Set(p.rows.map((r) => r.length));
    if (widths.size !== 1) {
      problems.push(`${p.title}: 행마다 폭이 다릅니다 (${[...widths].join('/')})`);
    }
    if (p.beads === 0) problems.push(`${p.title}: 색이 칠해진 칸이 없습니다`);
  });
  return problems;
}
