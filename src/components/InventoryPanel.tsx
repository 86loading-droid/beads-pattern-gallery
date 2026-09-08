import { useMemo, useState } from 'react';
import { BEAD_COLORS, START_TOTAL, formatCount, type StockEntry } from '../data/inventory';
import type { StoreResult } from '../data/stockStore';
import type { ColorKey } from '../types/pattern';

interface Props {
  stock: Record<ColorKey, number>;
  logs: StockEntry[];
  /** 기록에 남아 있는 소비 합계 */
  usedTotal: number;
  /** 고친 최종 수량을 잔량에 반영 (소비 기록에는 남지 않음) */
  onAdjust: (next: Partial<Record<ColorKey, number>>) => Promise<StoreResult>;
  /** 잘못 남은 소비 기록 취소 */
  onRemove: (id: string) => Promise<StoreResult>;
  onBack: () => void;
}

/**
 * 재고 현황 · 재고 수량 수정 · 소비 기록.
 * 발주 시점 판단은 교사가 하므로 경고나 자동 구매 제안은 두지 않고,
 * 색상별 남은 수량과 처음 대비 비율만 정확히 보여 줍니다.
 */
export default function InventoryPanel({ stock, logs, usedTotal, onAdjust, onRemove, onBack }: Props) {
  const [draft, setDraft] = useState<Partial<Record<ColorKey, number>> | null>(null);
  const [sortLow, setSortLow] = useState(true);
  const [msg, setMsg] = useState<{ bad: boolean; text: string } | null>(null);

  // 막대 길이의 기준 — 처음 수량이 0인 색(뒤에 추가한 색)도 제대로 보이도록 지금 수량까지 함께 본다
  const max = Math.max(
    1,
    ...BEAD_COLORS.map((c) => Math.max(c.init, stock[c.key] ?? 0)),
  );
  const total = (Object.values(stock) as number[]).reduce((a, b) => a + b, 0);
  const editing = draft !== null;

  const ordered = useMemo(
    () => (sortLow ? [...BEAD_COLORS].sort((a, b) => (stock[a.key] ?? 0) - (stock[b.key] ?? 0)) : BEAD_COLORS),
    [sortLow, stock],
  );

  async function saveStock() {
    if (!draft) return;
    const before = total;
    const res = await onAdjust(draft);
    if (!res.ok || !res.state) {
      setMsg({
        bad: true,
        text:
          res.error === 'nochange'
            ? '바뀐 수량이 없습니다.'
            : '재고 서버에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.',
      });
      return;
    }
    const delta = (Object.values(res.state.stock) as number[]).reduce((a, b) => a + b, 0) - before;
    setDraft(null);
    setMsg({ bad: false, text: `재고를 수정했습니다. 합계 ${delta >= 0 ? '+' : ''}${formatCount(delta)}개.` });
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-6 text-[#5D4037] md:px-7 lg:max-w-5xl">
      <p className="text-xs font-bold tracking-widest text-[#E4572E]">
        남은 비즈 {formatCount(total)}개 · 처음 {formatCount(START_TOTAL)}개
      </p>
      <h1 className="mt-1 text-3xl font-extrabold">비즈 재고</h1>

      {msg ? (
        <p
          className={`my-4 rounded-r-xl border-l-4 px-4 py-2.5 text-sm font-bold ${
            msg.bad ? 'border-[#B3261E] bg-[#FBE1DE] text-[#B3261E]' : 'border-[#2F7D46] bg-[#F1F7F1] text-[#2F5D3A]'
          }`}
        >
          {msg.text}
        </p>
      ) : null}

      {editing ? (
        <p className="mt-3 text-sm text-[#8A7263]">
          새로 들어온 비즈를 더하거나, 실제로 세어 본 수량으로 고칠 수 있습니다. 잔량에만 반영되고 소비 기록에는 남지
          않습니다.
        </p>
      ) : null}

      <div className="mt-6 flex items-baseline gap-3">
        <h2 className="mr-auto text-lg font-extrabold">색상별 남은 수량</h2>
        {editing ? null : (
          <button
            type="button"
            onClick={() => setSortLow((v) => !v)}
            className="rounded-full border-2 border-[#D8C2A6] px-3 py-1 text-xs font-bold"
          >
            {sortLow ? '적은 색부터' : '기본 색 순서'}
          </button>
        )}
      </div>

      <div className="mt-2 grid grid-cols-[100px_1fr_100px_74px] gap-2.5 text-xs font-bold text-[#8A7263] md:grid-cols-[130px_1fr_120px_84px]">
        <span>비즈 색</span>
        <span>남은 양</span>
        <span className="text-right">수량</span>
        <span className="text-right">처음 대비</span>
      </div>

      <div className="mt-1.5 grid gap-2.5">
        {ordered.map((c) => {
          const have = stock[c.key] ?? 0;
          const value = editing ? (draft?.[c.key] ?? have) : have;
          const diff = value - have;
          // 처음 수량이 없는 색은 견줄 대상이 없으므로 비율을 비워 둔다
          const ratio = c.init ? Math.round((have / c.init) * 100) : null;
          return (
            <div
              key={c.key}
              className="grid grid-cols-[100px_1fr_100px_74px] items-center gap-2.5 text-sm md:grid-cols-[130px_1fr_120px_84px] md:text-base"
            >
              <span>
                <span
                  className="mr-2 inline-block h-4 w-4 -translate-y-px rounded-full border-2 border-black/10 align-middle"
                  style={{ backgroundColor: c.hex }}
                />
                {c.name}
              </span>

              {editing ? (
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={value}
                  aria-label={`${c.name} 재고 수량`}
                  onChange={(e) => setDraft({ ...draft, [c.key]: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
                  className="w-full rounded-lg border-2 border-[#D8C2A6] bg-[#FFFBF0] px-2 py-1.5 text-right tabular-nums"
                />
              ) : (
                <span className="h-3.5 overflow-hidden rounded-full bg-[#EFE2CE]">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${Math.max(0, Math.min(100, (have / max) * 100))}%`, backgroundColor: c.hex }}
                  />
                </span>
              )}

              <span className="text-right font-bold tabular-nums">
                {editing ? (
                  <>
                    <span className={diff > 0 ? 'text-[#2F7D46]' : diff < 0 ? 'text-[#B3261E]' : 'text-[#8A7263]'}>
                      {diff === 0 ? '변동 없음' : `${diff > 0 ? '+' : ''}${formatCount(diff)}`}
                    </span>
                    <small className="block text-[11px] font-normal text-[#8A7263]">현재 {formatCount(have)}</small>
                  </>
                ) : (
                  <>
                    {formatCount(have)}
                    <small className="block text-[11px] font-normal text-[#8A7263]">
                      {c.init ? `처음 ${formatCount(c.init)}` : '직접 입력'}
                    </small>
                  </>
                )}
              </span>

              <span className="text-right font-bold tabular-nums text-[#8A7263]">
                {editing ? '' : ratio === null ? '—' : `${ratio}%`}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-2.5">
        {editing ? (
          <>
            <button
              type="button"
              onClick={() => {
                setDraft(null);
                setMsg(null);
              }}
              className="rounded-xl border-2 border-[#D8C2A6] px-4 py-2.5 font-bold"
            >
              취소
            </button>
            <button
              type="button"
              onClick={saveStock}
              className="rounded-xl border-2 border-[#E4572E] bg-[#E4572E] px-4 py-2.5 font-bold text-white"
            >
              수정한 재고 저장
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setMsg(null);
                setDraft({ ...stock });
              }}
              className="rounded-xl border-2 border-[#D8C2A6] px-4 py-2.5 font-bold"
            >
              재고 수량 수정
            </button>
            <button type="button" onClick={onBack} className="rounded-xl border-2 border-[#D8C2A6] px-4 py-2.5 font-bold">
              ← 도안 목록
            </button>
          </>
        )}
      </div>

      <h2 className="mt-7 text-lg font-extrabold">소비 기록</h2>
      <p className="text-sm text-[#8A7263]">
        최근 {logs.length}건 · 합계 {formatCount(usedTotal)}개 소비. 잘못 기록된 건은 취소하면 그만큼 재고로 돌아갑니다.
      </p>
      {logs.length === 0 ? (
        <p className="mt-2 text-sm text-[#8A7263]">아직 소비 기록이 없습니다.</p>
      ) : (
        <ul className="mt-2 list-none p-0">
          {logs.map((e) => (
            <li key={e.id} className="flex items-baseline gap-2.5 border-b border-[#EADBC6] py-2 text-sm last:border-b-0">
              <span className="shrink-0 text-xs tabular-nums text-[#8A7263]">{e.at}</span>
              <span className={`shrink-0 font-bold ${e.kind === '완성' ? '' : 'text-[#E4572E]'}`}>{e.kind}</span>
              <span className="truncate">{e.title}</span>
              <span className="ml-auto shrink-0 tabular-nums text-[#8A7263]">-{formatCount(e.total)}개</span>
              <button
                type="button"
                onClick={async () => {
                  const res = await onRemove(e.id);
                  setMsg(
                    res.ok
                      ? { bad: false, text: `${e.title} 소비 기록을 취소했습니다.` }
                      : { bad: true, text: '취소하지 못했습니다. 잠시 후 다시 시도해 주세요.' },
                  );
                }}
                className="shrink-0 rounded-full border-2 border-[#D8C2A6] px-3 py-0.5 text-xs font-bold"
              >
                취소
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
