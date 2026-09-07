import { useEffect, useMemo, useRef, useState } from 'react';
import { BEAD_COLORS, COLOR_HEX, COLOR_NAME, formatCount } from '../data/inventory';
import { MAX_SIDE, MIN_SIDE, newPatternId, nowText, type CustomPattern, type PatternResult } from '../data/patternStore';
import { CATEGORY_OPTIONS } from '../data/selectionOptions';
import { difficultyOf, type CategoryId, type ColorKey, type PatternSource } from '../types/pattern';

interface Props {
  /** 수정할 도안, 또는 본떠 만들 도안 */
  initial?: PatternSource | null;
  /** 본떠 만들기면 새 도안으로 저장합니다 */
  copy?: boolean;
  stock: Record<ColorKey, number>;
  busy: boolean;
  /** 지금 어디에 저장되는지 (공유 / 이 기기) */
  storeLabel: string;
  onSave: (pattern: CustomPattern) => Promise<PatternResult>;
  onDelete?: (id: string) => Promise<PatternResult>;
  onBack: () => void;
}

const EMPTY = '.';
const DIFFICULTY_LABEL = { easy: '쉬워요', medium: '보통이에요', challenge: '도전해요' };

function blank(cols: number, rows: number): string[] {
  return Array.from({ length: rows }, () => EMPTY.repeat(cols));
}

/** 칸 수가 바뀌어도 이미 칠한 그림은 왼쪽 위를 기준으로 남긴다 */
function resize(grid: string[], cols: number, rows: number): string[] {
  return Array.from({ length: rows }, (_, r) => {
    const line = grid[r] ?? '';
    return (line + EMPTY.repeat(cols)).slice(0, cols);
  });
}

/**
 * 도안 직접 입력 화면.
 * 칸을 누르거나 손가락을 끌어 색을 칠합니다. 색은 보유 12색만 쓸 수 있고,
 * 칠하는 동안 필요한 비즈 수와 재고 부족 여부를 바로 보여 줍니다.
 */
export default function PatternEditor({
  initial,
  copy = false,
  stock,
  busy,
  storeLabel,
  onSave,
  onDelete,
  onBack,
}: Props) {
  const editing = !!initial && !copy && initial.custom;
  const [title, setTitle] = useState(initial ? (copy ? `${initial.title} 사본` : initial.title) : '');
  const [category, setCategory] = useState<CategoryId>(initial?.category ?? 'shape');
  const [cols, setCols] = useState(initial ? initial.rows[0].length : 8);
  const [rowCount, setRowCount] = useState(initial ? initial.rows.length : 8);
  const [grid, setGrid] = useState<string[]>(initial ? [...initial.rows] : blank(8, 8));
  const [brush, setBrush] = useState<string>('R');
  const [msg, setMsg] = useState<{ bad: boolean; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const painting = useRef(false);

  // 손가락을 떼면 어디서 떼든 칠하기를 멈춘다
  useEffect(() => {
    const stop = () => {
      painting.current = false;
    };
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, []);

  const need = useMemo(() => {
    const map: Partial<Record<ColorKey, number>> = {};
    grid.forEach((row) =>
      row.split('').forEach((ch) => {
        if (ch === EMPTY) return;
        const k = ch as ColorKey;
        map[k] = (map[k] ?? 0) + 1;
      }),
    );
    return map;
  }, [grid]);

  const usedKeys = Object.keys(need) as ColorKey[];
  const beads = usedKeys.reduce((a, k) => a + (need[k] ?? 0), 0);
  const shortages = usedKeys.filter((k) => (stock[k] ?? 0) < (need[k] ?? 0));
  const difficulty = difficultyOf(usedKeys.length);

  function paint(r: number, c: number) {
    setGrid((prev) => {
      const line = prev[r];
      if (!line || line[c] === brush) return prev;
      const next = [...prev];
      next[r] = line.slice(0, c) + brush + line.slice(c + 1);
      return next;
    });
  }

  function setSize(nextCols: number, nextRows: number) {
    const c = Math.max(MIN_SIDE, Math.min(MAX_SIDE, nextCols));
    const r = Math.max(MIN_SIDE, Math.min(MAX_SIDE, nextRows));
    setCols(c);
    setRowCount(r);
    setGrid((prev) => resize(prev, c, r));
  }

  async function submit() {
    setMsg(null);
    const pattern: CustomPattern = {
      id: editing && initial ? initial.id : newPatternId(),
      title: title.trim(),
      category,
      rows: grid,
      custom: true,
      at: nowText(),
    };
    const res = await onSave(pattern);
    if (res.ok) {
      onBack();
      return;
    }
    setMsg({
      bad: true,
      text:
        res.error === 'notitle'
          ? '도안 이름을 입력해 주세요.'
          : res.error === 'empty'
            ? '색을 칠한 칸이 없습니다. 한 칸 이상 칠해 주세요.'
            : res.error === 'toobig'
              ? `가로·세로 모두 ${MAX_SIDE}칸까지만 만들 수 있습니다.`
              : res.error === 'busy'
                ? '다른 태블릿이 저장하는 중입니다. 잠시 후 다시 눌러 주세요.'
                : '저장하지 못했습니다. 인터넷 연결을 확인해 주세요.',
    });
  }

  const stepper = (label: string, value: number, onChange: (v: number) => void) => (
    <div className="flex items-center gap-2">
      <span className="w-10 text-sm text-[#8A7263]">{label}</span>
      <button
        type="button"
        aria-label={`${label} 한 칸 줄이기`}
        onClick={() => onChange(value - 1)}
        disabled={value <= MIN_SIDE}
        className="h-10 w-10 rounded-xl border-2 border-[#D8C2A6] text-lg font-bold disabled:opacity-40"
      >
        −
      </button>
      <span className="w-10 text-center text-lg font-bold tabular-nums">{value}</span>
      <button
        type="button"
        aria-label={`${label} 한 칸 늘리기`}
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_SIDE}
        className="h-10 w-10 rounded-xl border-2 border-[#D8C2A6] text-lg font-bold disabled:opacity-40"
      >
        +
      </button>
    </div>
  );

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-6 text-[#5D4037] md:px-7 lg:max-w-5xl">
      <p className="text-xs font-bold tracking-widest text-[#E4572E]">
        {editing ? '도안 고치기' : '도안 만들기'} · {storeLabel}
      </p>
      <h1 className="mt-1 text-3xl font-extrabold">{editing ? '도안을 고쳐요' : '도안을 만들어요'}</h1>
      <p className="mt-1 text-sm text-[#8A7263]">
        칸을 누르면 고른 색으로 칠해집니다. 손가락을 끌면 여러 칸을 한 번에 칠할 수 있어요.
      </p>

      {msg ? (
        <p
          className={`my-4 rounded-r-xl border-l-4 px-4 py-2.5 text-sm font-bold ${
            msg.bad ? 'border-[#B3261E] bg-[#FBE1DE] text-[#B3261E]' : 'border-[#2F7D46] bg-[#F1F7F1] text-[#2F5D3A]'
          }`}
        >
          {msg.text}
        </p>
      ) : null}

      <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,300px)] lg:gap-7">
        {/* 왼쪽 — 그리는 칸 */}
        <div>
          <div
            className="mx-auto grid w-full max-w-[520px] gap-[3px] rounded-2xl border-2 border-[#EADBC6] bg-white p-2 select-none [touch-action:none]"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {grid.map((row, r) =>
              row.split('').map((ch, c) => (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  aria-label={`${r + 1}행 ${c + 1}칸 ${ch === EMPTY ? '빈칸' : COLOR_NAME[ch as ColorKey]}`}
                  onPointerDown={() => {
                    painting.current = true;
                    paint(r, c);
                  }}
                  onPointerEnter={() => {
                    if (painting.current) paint(r, c);
                  }}
                  className="aspect-square rounded-[3px]"
                  style={{
                    // 모든 칸을 똑같이 그려서 한 칸 한 칸이 따로 보이게 한다
                    backgroundColor: ch === EMPTY ? '#E4DCCB' : COLOR_HEX[ch as ColorKey],
                    boxShadow: `inset 0 0 0 1px rgba(93,64,55,${ch === EMPTY ? '0.22' : '0.32'})`,
                  }}
                />
              )),
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            {stepper('가로', cols, (v) => setSize(v, rowCount))}
            {stepper('세로', rowCount, (v) => setSize(cols, v))}
            <button
              type="button"
              onClick={() => setGrid(blank(cols, rowCount))}
              className="rounded-xl border-2 border-[#D8C2A6] px-4 py-2.5 text-sm font-bold"
            >
              전체 지우기
            </button>
          </div>
        </div>

        {/* 오른쪽 — 색 고르기와 저장 */}
        <div>
          <h2 className="text-sm font-bold text-[#8A7263]">칠할 색</h2>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {BEAD_COLORS.map((c) => {
              const want = need[c.key] ?? 0;
              const have = stock[c.key] ?? 0;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setBrush(c.key)}
                  aria-pressed={brush === c.key}
                  className={`flex items-center gap-2 rounded-xl border-2 px-2.5 py-2 text-left text-xs font-bold ${
                    brush === c.key ? 'border-[#E4572E] bg-[#FFF3EC]' : 'border-[#EADBC6] bg-white'
                  }`}
                >
                  <span
                    className="inline-block h-5 w-5 shrink-0 rounded-full border-2 border-black/10"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate">{c.name}</span>
                    <span className={`block text-[10px] font-normal tabular-nums ${want > have ? 'text-[#B3261E]' : 'text-[#8A7263]'}`}>
                      {want > 0 ? `${formatCount(want)} / ` : ''}
                      {formatCount(have)}
                    </span>
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setBrush(EMPTY)}
              aria-pressed={brush === EMPTY}
              className={`col-span-2 flex items-center gap-2 rounded-xl border-2 px-2.5 py-2 text-xs font-bold ${
                brush === EMPTY ? 'border-[#E4572E] bg-[#FFF3EC]' : 'border-[#EADBC6] bg-white'
              }`}
            >
              <span className="inline-block h-5 w-5 rounded-full border-2 border-dashed border-[#B9A48D] bg-[#FBF6EC]" />
              지우개 (빈칸)
            </button>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border-2 border-[#EADBC6] bg-white p-3 text-sm">
            <dt className="text-[#8A7263]">칸 수</dt>
            <dd className="text-right font-bold tabular-nums">
              {cols} × {rowCount}
            </dd>
            <dt className="text-[#8A7263]">쓴 색</dt>
            <dd className="text-right font-bold tabular-nums">{usedKeys.length}가지</dd>
            <dt className="text-[#8A7263]">필요한 비즈</dt>
            <dd className="text-right font-bold tabular-nums">{formatCount(beads)}개</dd>
            <dt className="text-[#8A7263]">난이도</dt>
            <dd className="text-right font-bold">{DIFFICULTY_LABEL[difficulty]}</dd>
          </dl>

          {shortages.length ? (
            <p className="mt-2 rounded-r-xl border-l-4 border-[#B3261E] bg-[#FBE1DE] px-3 py-2 text-xs font-bold text-[#B3261E]">
              재고보다 많이 쓴 색이 있어요 · {shortages.map((k) => COLOR_NAME[k]).join(', ')}
            </p>
          ) : null}

          <label className="mt-4 block text-sm font-bold text-[#8A7263]" htmlFor="pattern-title">
            도안 이름
          </label>
          <input
            id="pattern-title"
            type="text"
            value={title}
            maxLength={20}
            placeholder="예: 우리 반 마스코트"
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border-2 border-[#D8C2A6] bg-[#FFFBF0] px-3 py-2.5"
          />

          <label className="mt-3 block text-sm font-bold text-[#8A7263]" htmlFor="pattern-category">
            주제
          </label>
          <select
            id="pattern-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryId)}
            className="mt-1 w-full rounded-xl border-2 border-[#D8C2A6] bg-[#FFFBF0] px-3 py-2.5"
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.emoji} {o.label}
              </option>
            ))}
          </select>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <button type="button" onClick={onBack} className="rounded-xl border-2 border-[#D8C2A6] px-4 py-2.5 font-bold">
              취소
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="rounded-xl border-2 border-[#E4572E] bg-[#E4572E] px-4 py-2.5 font-bold text-white disabled:opacity-40"
            >
              {busy ? '저장 중…' : editing ? '고친 도안 저장' : '도안 저장'}
            </button>
          </div>

          {editing && onDelete && initial ? (
            <div className="mt-4 border-t border-[#EADBC6] pt-3">
              {confirmDelete ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-[#B3261E]">정말 지울까요?</span>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-xl border-2 border-[#D8C2A6] px-3 py-1.5 text-sm font-bold"
                  >
                    아니요
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await onDelete(initial.id);
                      if (res.ok) onBack();
                      else setMsg({ bad: true, text: '지우지 못했습니다. 잠시 후 다시 시도해 주세요.' });
                    }}
                    className="rounded-xl border-2 border-[#B3261E] bg-[#B3261E] px-3 py-1.5 text-sm font-bold text-white"
                  >
                    네, 지울게요
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="rounded-xl border-2 border-[#D8C2A6] px-4 py-2 text-sm font-bold text-[#B3261E]"
                >
                  이 도안 지우기
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
