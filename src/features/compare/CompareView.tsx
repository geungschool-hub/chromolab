// 비교 모드 (Step 5, F6) — 체세포분열 vs 감수분열 나란히 동기 재생.
// 근거: PRD F6 — '감수 2분열 = 체세포분열' 오개념(M7) 격파. 분리 대상·핵상 차이 대조.

import { useEffect, useState } from 'react';
import { buildMitosisPhases, buildMeiosisPhases, DEFAULT_DIPLOID } from '../../domain/phases';
import type { PhaseFacts } from '../../domain/types';
import { CellView } from '../mitosis/CellView';
import { MeiosisCellView } from '../meiosis/MeiosisCellView';
import './compare.css';

const M = buildMitosisPhases(DEFAULT_DIPLOID);
const ME = buildMeiosisPhases(DEFAULT_DIPLOID);
const MAX = Math.max(M.length, ME.length);

function SepBadge({ phase }: { phase: PhaseFacts }) {
  if (phase.bivalent) return <span className="cmp-badge biv">2가 염색체</span>;
  if (phase.separationEvent === 'homolog')
    return <span className="cmp-badge hom">상동염색체 분리</span>;
  if (phase.separationEvent === 'chromatid')
    return <span className="cmp-badge chr">염색분체 분리</span>;
  return <span className="cmp-badge none">—</span>;
}

function Side({
  title,
  phase,
  kind,
}: {
  title: string;
  phase: PhaseFacts;
  kind: 'mitosis' | 'meiosis';
}) {
  return (
    <div className="cmp-side">
      <div className="cmp-head">
        <strong>{title}</strong>
        <span className={`cmp-ploidy ploidy-${phase.ploidy}`}>{phase.ploidy}</span>
      </div>
      <div className="cmp-phase">{phase.labelKo}</div>
      <div className={`cmp-stage ${kind}`}>
        <div className={`cmp-scale ${kind}`}>
          {kind === 'mitosis' ? <CellView phase={phase} /> : <MeiosisCellView phase={phase} />}
        </div>
      </div>
      <SepBadge phase={phase} />
    </div>
  );
}

export function CompareView() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const mIdx = Math.min(step, M.length - 1);
  const meIdx = Math.min(step, ME.length - 1);
  const mPhase = M[mIdx]!;
  const mePhase = ME[meIdx]!;
  const isLast = step >= MAX - 1;

  useEffect(() => {
    if (!playing || isLast) return;
    const t = setTimeout(() => setStep((s) => s + 1), mePhase.durationMs);
    return () => clearTimeout(t);
  }, [playing, step, isLast, mePhase.durationMs]);

  return (
    <div className="compare">
      <p className="cmp-hint">
        같은 단계를 나란히 비교하세요. 특히 <b>후기</b>에서 <b>체세포=염색분체 분리</b> vs{' '}
        <b>감수 1분열=상동염색체 분리</b>, 그리고 핵상(2n vs n) 차이를 확인하세요.
      </p>

      <div className="cmp-grid">
        <Side title="체세포분열" phase={mPhase} kind="mitosis" />
        <Side title="감수분열" phase={mePhase} kind="meiosis" />
      </div>

      <div className="cmp-controls">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          ◀ 이전
        </button>
        <button
          className="primary"
          onClick={() => setStep((s) => Math.min(MAX - 1, s + 1))}
          disabled={isLast}
        >
          다음 ▶
        </button>
        <button
          onClick={() => {
            setStep(0);
            setPlaying(false);
          }}
        >
          ↺ 처음
        </button>
        <button className="play" onClick={() => setPlaying((p) => !p)} disabled={isLast}>
          {playing ? '⏸ 정지' : '▶ 동기 재생'}
        </button>
      </div>

      <table className="cmp-table">
        <thead>
          <tr>
            <th>구분</th>
            <th>체세포분열</th>
            <th>감수분열</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>분열 횟수</td>
            <td>1회</td>
            <td>2회</td>
          </tr>
          <tr>
            <td>딸세포 수</td>
            <td>2개</td>
            <td>4개</td>
          </tr>
          <tr>
            <td>핵상 변화</td>
            <td>2n → 2n</td>
            <td>2n → n</td>
          </tr>
          <tr>
            <td>2가 염색체</td>
            <td>없음</td>
            <td>있음 (전기Ⅰ)</td>
          </tr>
          <tr>
            <td>후기 분리 대상</td>
            <td>염색분체</td>
            <td>
              1분열: <b>상동염색체</b> / 2분열: 염색분체
            </td>
          </tr>
          <tr>
            <td>유전적 동일성</td>
            <td>모세포와 동일</td>
            <td>다양 (독립적 분리)</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
