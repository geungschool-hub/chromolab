// 체세포분열 세포 뷰 (Step 3) — 시기에 따라 염색체가 올바른 위치로 이동(애니메이션)
// 근거: PRD F2. S기 복제(1→2 염색분체), 중기 적도판 정렬, 후기 양극 이동, 말기 2개 딸세포.

import { motion } from 'framer-motion';
import { Chromosome } from '../../components/Chromosome';
import { getMitosisBodies, STAGE_W, STAGE_H, CX, POLE_LEFT, POLE_RIGHT } from './cellLayout';
import type { PhaseFacts } from '../../domain/types';
import './mitosis.css';

export function CellView({ phase }: { phase: PhaseFacts }) {
  const bodies = getMitosisBodies(phase.id);
  const isDivision = phase.stage === 'division';
  const isMetaphase = phase.id === 'mitosis-metaphase';
  const isAnaphase = phase.id === 'mitosis-anaphase';
  const isTelophase = phase.id === 'mitosis-telophase';

  return (
    <div
      className="cellview"
      style={{ width: STAGE_W, height: STAGE_H }}
      aria-label="세포 시뮬레이션"
    >
      {/* 세포 외곽 — 말기엔 두 딸세포 */}
      {isTelophase ? (
        <>
          <div className="cell-shape" style={{ left: '4%', width: '44%' }} />
          <div className="cell-shape" style={{ right: '4%', width: '44%' }} />
        </>
      ) : (
        <div className="cell-shape" style={{ left: '6%', right: '6%' }} />
      )}

      {/* 방추사 — 각 염색체의 동원체(중심)에 연결. 분열기에만. */}
      {isDivision && !isTelophase && (
        <svg className="spindle" width={STAGE_W} height={STAGE_H} aria-hidden>
          {bodies.flatMap((b) => {
            // 후기: 분리된 염색분체는 향하는 극에서만 연결. 그 외: 양극에서 연결.
            const poles = isAnaphase
              ? [b.key.endsWith('-L') ? POLE_LEFT : POLE_RIGHT]
              : [POLE_LEFT, POLE_RIGHT];
            return poles.map((px) => (
              <motion.line
                key={`${b.key}-${px}`}
                x1={px}
                y1={STAGE_H / 2}
                initial={isAnaphase ? { x2: CX, y2: b.y } : false}
                animate={{ x2: b.x, y2: b.y }}
                transition={{ duration: isAnaphase ? 0.9 : 0.55, ease: 'easeInOut' }}
                stroke="var(--spindle)"
                strokeWidth={1.6}
                strokeDasharray="2 3"
                opacity={0.8}
              />
            ));
          })}
          <circle cx={POLE_LEFT} cy={STAGE_H / 2} r={6} fill="var(--spindle)" />
          <circle cx={POLE_RIGHT} cy={STAGE_H / 2} r={6} fill="var(--spindle)" />
        </svg>
      )}

      {/* 적도판 가이드선 — 중기에 강조 */}
      <div className={`equator ${isMetaphase ? 'active' : ''}`} style={{ left: CX }} />

      {/* 염색체들 */}
      {bodies.map((b) => (
        <motion.div
          key={b.key}
          className="cell-body"
          // 후기: 적도판(중앙)에서 시작해 양극으로 미끄러짐(염색분체 분리 이동)
          initial={isAnaphase ? { left: CX, top: b.y, opacity: 1 } : false}
          animate={{ left: b.x, top: b.y, opacity: 1 }}
          transition={{ duration: isAnaphase ? 0.9 : 0.55, ease: 'easeInOut' }}
        >
          <Chromosome
            replicated={b.replicated}
            color={b.color}
            label={b.label}
            lengthPx={b.lengthPx}
            widthPx={28}
          />
        </motion.div>
      ))}

      {/* 후기 분리 라벨 (오개념 M2) */}
      {isAnaphase && (
        <div className="sep-label">
          염색분체가 분리 → 각각 <b>딸세포의 염색체</b>가 됨
        </div>
      )}
    </div>
  );
}
