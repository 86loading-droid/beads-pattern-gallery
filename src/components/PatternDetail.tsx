import { useMemo, useState } from 'react';
import { COLOR_HEX, COLOR_NAME, formatCount } from '../data/inventory';
import PatternGrid from './PatternGrid';
import type { BeadCount, ColorKey, Pattern } from '../types/pattern';
import type { StoreResult } from '../data/stockStore';

interface Props {
  pattern: Pattern;
  stock: Record<ColorKey, number>;
  shortages: ColorKey[];
  /** used를 생략하면 완성(전량 차감), 넘기면 부분 사용 차감 */
  onConsume: (pattern: Pattern, used?: BeadCount) => Promise<StoreResult>;
  /** 직접 만든 도안이면 고치기, 기본 도안이면 본떠 새로 만들기 */
  onEdit?: () => void;
  onBack: () => void;
}

/**
 * 도안 상세 + 재고 차감 화면.
 * 완성 버튼은 도안 전량을 차감하고, 직접 수량 입력은 미완성·부분 사용분만 차감합니다.
 */
export default function PatternDetail({ pattern, stock, shortages, onConsume, onEdit, onBack }: Props) {
  const [manual, setManual] = useState<BeadCount | null>(null);
  const [msg, setMsg] = useState<{ bad: boolean; text: string } | null>(null);
  const [sending, setSending] = useState(false);
  /** 실수로 눌러 재고가 깎이지 않도록 완성 처리는 두 번 확인합니다 */
  const [confirming, setConfirming] = useState(false);

  const keys = useMemo(
    () => (Object.keys(pattern.need) as ColorKey[]).sort((a, b) => (pattern.need[b] ?? 0) - (pattern.need[a] ?? 0)),
    [pattern],
  );
  const usedSumOf = (m: BeadCount) => (Object.values(m) as number[]).reduce((a, b) => a + b, 0);
  const usedOf = (k: ColorKey) => (manual ? (manual[k] ?? 0) : (pattern.need[k] ?? 0));
  const usedTotal = keys.reduce((s, k) => s + usedOf(k), 0);

  function startManual() {
    setMsg(null);
    setManual(
      Object.fromEntries(keys.map((k) => [k, Math.min(pattern.need[k] ?? 0, stock[k] ?? 0)])) as BeadCount,
    );
  }

  async function apply(used?: BeadCount) {
    setSending(true);
    const result = await onConsume(pattern, used);
    setSending(false);
    if (result.ok && result.state) {
      setManual(null);
      setMsg({
        bad: false,
        text: `${pattern.title} · ${used ? '부분 사용' : '완성'} 처리 완료. 비즈 ${formatCount(usedSumOf(used ?? pattern.need))}개를 재고에서 차감했습니다.`,
      });
    } else {
      setMsg({
        bad: true,
        text:
          result.error === 'empty'
            ? '차감할 수량이 없습니다. 사용한 비즈 수를 입력해 주세요.'
            : result.error === 'short'
              ? `재고가 모자랍니다 · ${(result.shortages ?? []).map((k) => COLOR_NAME[k]).join(', ')}`
              : result.error === 'busy'
                ? '다른 태블릿이 재고를 처리하는 중입니다. 잠시 후 다시 눌러 주세요.'
                : '재고 서버에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.',
      });
    }
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-6 text-[#5D4037] md:px-7 lg:max-w-5xl">
      <p className="text-xs font-bold tracking-widest text-[#E4572E]">도안 상세 · 재고 차감</p>
      <h1 className="mt-1 text-3xl font-extrabold">{pattern.title}</h1>

      <ul className="mt-3 flex flex-wrap gap-2 p-0 text-xs font-bold">
        <li className="rounded-full border border-[#EADBC6] bg-[#FBF3E6] px-3 py-1">
          {pattern.cols} × {pattern.rowCount} 칸
        </li>
        <li className="rounded-full border border-[#EADBC6] bg-[#FBF3E6] px-3 py-1">색 {pattern.colorCount}가지</li>
        <li className="rounded-full border border-[#EADBC6] bg-[#FBF3E6] px-3 py-1">
          비즈 {formatCount(pattern.beads)}개
        </li>
        {pattern.custom ? (
          <li className="rounded-full border border-[#E4572E] bg-[#FFF3EC] px-3 py-1 text-[#E4572E]">직접 만든 도안</li>
        ) : null}
      </ul>

      {msg ? (
        <p
          className={`my-4 rounded-r-xl border-l-4 px-4 py-2.5 text-sm font-bold ${
            msg.bad ? 'border-[#B3261E] bg-[#FBE1DE] text-[#B3261E]' : 'border-[#2F7D46] bg-[#F1F7F1] text-[#2F5D3A]'
          }`}
        >
          {msg.text}
        </p>
      ) : shortages.length ? (
        <p className="my-4 rounded-r-xl border-l-4 border-[#B3261E] bg-[#FBE1DE] px-4 py-2.5 text-sm font-bold text-[#B3261E]">
          재고가 모자란 색이 있어요 · {shortages.map((k) => COLOR_NAME[k]).join(', ')}. 완성 처리 대신 실제 사용량을
          직접 입력해 주세요.
        </p>
      ) : null}

      <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,360px)_1fr] lg:gap-7 lg:grid-cols-[minmax(0,440px)_1fr]">
        <div className="rounded-2xl border-2 border-[#EADBC6] bg-white p-3">
          <PatternGrid rows={pattern.rows} title={pattern.title} large numbered />
          <p className="mt-2 text-center text-[11px] text-[#8A7263]">
            가로 {pattern.cols}칸 · 세로 {pattern.rowCount}칸 · 다섯 칸마다 진한 선
          </p>
        </div>

        <div>
          <div className="overflow-x-auto rounded-2xl border-2 border-[#EADBC6] bg-white">
            <table className="w-full min-w-[400px] border-collapse text-sm">
              <thead>
                <tr className="bg-[#FBF3E6] text-xs text-[#8A7263]">
                  <th className="p-2.5 text-left">비즈 색</th>
                  <th className="p-2.5 text-right">도안 필요</th>
                  <th className="p-2.5 text-right">현재 재고</th>
                  <th className="p-2.5 text-right">{manual ? '사용 수량 입력' : '차감 수량'}</th>
                  <th className="p-2.5 text-right">차감 후</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {keys.map((k) => {
                  const have = stock[k] ?? 0;
                  const use = usedOf(k);
                  const after = have - use;
                  return (
                    <tr key={k} className={`border-t border-[#EADBC6] ${after < 0 ? 'bg-[#FBE1DE] font-bold text-[#B3261E]' : ''}`}>
                      <td className="p-2.5 text-left">
                        <span
                          className="mr-2 inline-block h-4 w-4 -translate-y-px rounded-full border-2 border-black/10 align-middle"
                          style={{ backgroundColor: COLOR_HEX[k] }}
                        />
                        {COLOR_NAME[k]}
                      </td>
                      <td className="p-2.5 text-right">{formatCount(pattern.need[k] ?? 0)}</td>
                      <td className="p-2.5 text-right">{formatCount(have)}</td>
                      <td className="p-2.5 text-right">
                        {manual ? (
                          <input
                            type="number"
                            min={0}
                            max={have}
                            step={1}
                            value={use}
                            aria-label={`${COLOR_NAME[k]} 사용 수량`}
                            onChange={(e) => {
                              const v = Math.max(0, Math.min(have, Math.floor(Number(e.target.value) || 0)));
                              setManual({ ...manual, [k]: v });
                            }}
                            className="w-24 rounded-lg border-2 border-[#D8C2A6] bg-[#FFFBF0] px-2 py-1 text-right"
                          />
                        ) : (
                          formatCount(use)
                        )}
                      </td>
                      <td className="p-2.5 text-right">{formatCount(after)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#EADBC6] font-bold tabular-nums">
                  <td className="p-2.5 text-left">합계</td>
                  <td className="p-2.5 text-right">{formatCount(pattern.beads)}</td>
                  <td className="p-2.5 text-right">—</td>
                  <td className="p-2.5 text-right">{formatCount(usedTotal)}</td>
                  <td className="p-2.5 text-right">—</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            {manual ? (
              <>
                <button type="button" onClick={() => setManual(null)} className="rounded-xl border-2 border-[#D8C2A6] px-4 py-2.5 font-bold">
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => apply(manual)}
                  disabled={sending}
                  className="rounded-xl border-2 border-[#E4572E] bg-[#E4572E] px-4 py-2.5 font-bold text-white disabled:opacity-40"
                >
                  {sending ? '처리 중…' : '입력 수량으로 차감'}
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={startManual} className="rounded-xl border-2 border-[#D8C2A6] px-4 py-2.5 font-bold">
                  직접 수량 입력 (미완성)
                </button>
                {confirming ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setConfirming(false)}
                      className="rounded-xl border-2 border-[#D8C2A6] px-4 py-2.5 font-bold"
                    >
                      아니요
                    </button>
                    <button
                      type="button"
                      disabled={sending}
                      onClick={() => {
                        setConfirming(false);
                        apply();
                      }}
                      className="rounded-xl border-2 border-[#E4572E] bg-[#E4572E] px-4 py-2.5 font-bold text-white disabled:opacity-40"
                    >
                      {sending ? '처리 중…' : `네, ${formatCount(pattern.beads)}개 차감`}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={shortages.length > 0 || sending}
                    onClick={() => {
                      setMsg(null);
                      setConfirming(true);
                    }}
                    className="rounded-xl border-2 border-[#E4572E] bg-[#E4572E] px-4 py-2.5 font-bold text-white disabled:opacity-40"
                  >
                    완성 — 전량 차감
                  </button>
                )}
              </>
            )}
          </div>

          {confirming ? (
            <p className="mt-3 rounded-r-xl border-l-4 border-[#E4572E] bg-[#FFF3EC] px-4 py-2.5 text-sm font-bold text-[#B03A16]">
              {pattern.title} 완성으로 처리하고 비즈 {formatCount(pattern.beads)}개를 재고에서 뺍니다. 맞나요?
            </p>
          ) : null}

          <p className="mt-4 border-l-[3px] border-[#D8C2A6] pl-2.5 text-[13px] text-[#8A7263]">
            완성 버튼은 도안 전량을 차감합니다. 도중에 그만두었거나 일부만 사용한 경우에는 직접 수량 입력으로 실제
            사용량만 차감하세요. 차감 내역은 재고 현황에서 되돌릴 수 있습니다.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2.5">
        <button type="button" onClick={onBack} className="rounded-xl border-2 border-[#D8C2A6] px-4 py-2.5 font-bold">
          ← 목록으로
        </button>
        {onEdit ? (
          <button type="button" onClick={onEdit} className="rounded-xl border-2 border-[#D8C2A6] px-4 py-2.5 font-bold">
            {pattern.custom ? '이 도안 고치기' : '이 도안 본떠 만들기'}
          </button>
        ) : null}
      </div>
    </section>
  );
}
