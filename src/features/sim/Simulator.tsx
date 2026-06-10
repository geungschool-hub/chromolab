// 공용 시뮬레이터 셸 (Step 3~4) — 체세포/감수분열 공통 컨트롤·그래프·카운터
// 근거: PRD §10.4 상태 머신. process만 바꾸면 동일 UI로 두 분열을 모두 구동.

import { useEffect, type ReactNode } from 'react';
import { useSimulation } from '../../store/useSimulation';
import { SyncGraphs } from '../graphs/SyncGraphs';
import { Tip } from '../../components/Tip';
import { toCValue, type PhaseFacts, type Process } from '../../domain/types';
import '../mitosis/mitosis.css';

const SPEEDS = [0.5, 1, 2];

function PloidyChip({ phase }: { phase: PhaseFacts }) {
  const count =
    phase.transientChromosomeCount && phase.perPole
      ? phase.perPole.chromosomeCount
      : phase.chromosomeCount;
  return (
    <span className={`ploidy-chip ploidy-${phase.ploidy}`}>
      핵상 {phase.ploidy} = {count}
    </span>
  );
}

function Counters({ phase }: { phase: PhaseFacts }) {
  const transient = phase.transientChromosomeCount && phase.perPole;
  const chrom = transient ? phase.perPole!.chromosomeCount : phase.chromosomeCount;
  const chromatid = transient ? phase.perPole!.chromatidCount : phase.chromatidCount;
  return (
    <div className="counters">
      <div className="counter">
        <span className="c-label">핵상</span>
        <span className={`c-val ploidy-text-${phase.ploidy}`}>{phase.ploidy}</span>
      </div>
      <div className="counter">
        <span className="c-label">염색체 수{transient ? ' (극당)' : ''}</span>
        <span className="c-val">{chrom}</span>
      </div>
      <div className="counter">
        <span className="c-label">염색분체 수{transient ? ' (극당)' : ''}</span>
        <span className="c-val chromatid-text">{chromatid}</span>
      </div>
      <div className="counter">
        <span className="c-label">DNA 상대량</span>
        <span className="c-val dna-text">
          {phase.dnaRelative} <small>({toCValue(phase.dnaRelative)})</small>
        </span>
      </div>
    </div>
  );
}

interface SimulatorProps {
  process: Process;
  /** 세포 시각화 — 현재 시기를 받아 렌더 */
  renderCell: (phase: PhaseFacts) => ReactNode;
  /** 완료 시 요약 문구 */
  result: ReactNode;
}

export function Simulator({ process, renderCell, result }: SimulatorProps) {
  const { phases, index, isPlaying, speed } = useSimulation();
  const load = useSimulation((s) => s.load);
  const next = useSimulation((s) => s.next);
  const prev = useSimulation((s) => s.prev);
  const goTo = useSimulation((s) => s.goTo);
  const reset = useSimulation((s) => s.reset);
  const togglePlay = useSimulation((s) => s.togglePlay);
  const setSpeed = useSimulation((s) => s.setSpeed);

  // 마운트/process 변경 시 해당 분열로 로드
  useEffect(() => {
    load(process);
  }, [load, process]);

  const phase = phases[index]!;
  const isLast = index >= phases.length - 1;
  // 로드 직후 process가 바뀌는 1프레임 방지(훅 호출 후 렌더에서만 분기)
  const mismatch = phase.process !== process;

  // 자동재생
  useEffect(() => {
    if (!isPlaying || isLast || mismatch) return;
    const t = setTimeout(() => next(), phase.durationMs / speed);
    return () => clearTimeout(t);
  }, [isPlaying, index, speed, isLast, next, phase.durationMs, mismatch]);

  if (mismatch) return null;

  return (
    <div className="mitosis">
      <div className="sim-topbar">
        <div className="phase-title">
          <span className="phase-step">
            시기 {index + 1}/{phases.length}
          </span>
          <h3>{phase.labelKo}</h3>
          {phase.dnaReplication && <span className="badge rep">DNA 복제</span>}
          {phase.bivalent && <span className="badge bivalent">2가 염색체</span>}
          {phase.separationEvent === 'homolog' && (
            <span className="badge homolog-b">상동염색체 분리</span>
          )}
          {phase.separationEvent === 'chromatid' && (
            <span className="badge chromatid-b">염색분체 분리</span>
          )}
          {phase.transientNotice && (
            <Tip text={phase.transientNotice}>
              <span className="badge transient">참고: 순간적 시기</span>
            </Tip>
          )}
        </div>
        <PloidyChip phase={phase} />
      </div>

      <div className="sim-body">
        <div className="sim-left">
          {renderCell(phase)}
          <p className="phase-note">{phase.note}</p>
        </div>
        <div className="sim-right">
          <SyncGraphs phases={phases} index={index} />
          <Counters phase={phase} />
        </div>
      </div>

      <div className="phase-rail" role="group" aria-label="시기 이동">
        {phases.map((p, i) => (
          <button
            key={p.id}
            className={`rail-dot ${i === index ? 'on' : ''} ${i < index ? 'done' : ''}`}
            onClick={() => goTo(i)}
            title={p.labelKo}
            aria-label={p.labelKo}
          />
        ))}
      </div>

      <div className="sim-controls">
        {/* 주 동작: 단계 이동 */}
        <div className="nav-group">
          <button onClick={prev} disabled={index === 0}>
            ◀ 이전
          </button>
          <button className="primary" onClick={next} disabled={isLast}>
            다음 단계 ▶
          </button>
        </div>

        <button className="ghost reset-btn" onClick={reset}>
          ↺ 처음으로
        </button>

        {/* 보조 동작: 자동재생(시연용) — 분리·외곽선 스타일 */}
        <div className="play-group">
          <button
            className={`play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={togglePlay}
            disabled={isLast}
            aria-pressed={isPlaying}
          >
            {isPlaying ? '⏸ 정지' : '▶ 자동재생'}
          </button>
          <span className="speed">
            {SPEEDS.map((s) => (
              <button
                key={s}
                className={speed === s ? 'spd on' : 'spd'}
                onClick={() => setSpeed(s)}
              >
                {s}×
              </button>
            ))}
          </span>
        </div>
      </div>

      {isLast && <div className="result-card">{result}</div>}
    </div>
  );
}
