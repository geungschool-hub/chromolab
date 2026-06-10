// 감수분열 세포 뷰 (Step 4) — 2가 염색체 형성, 상동염색체 분리(1분열) vs 염색분체 분리(2분열)
// 근거: PRD F3, §7.5(독립적 분리). 세포는 1→2→4개로 나뉜다.

import { motion } from 'framer-motion';
import { Chromosome } from '../../components/Chromosome';
import {
  getMeiosisLayout,
  cellRegions,
  M_STAGE_W,
  M_STAGE_H,
  M_CX,
  M_POLE_Y,
} from './meiosisLayout';
import type { PhaseFacts } from '../../domain/types';
import '../mitosis/mitosis.css';
import './meiosis.css';

export function MeiosisCellView({ phase }: { phase: PhaseFacts }) {
  const { bodies, cellCount, equators } = getMeiosisLayout(phase.id);
  const isAnaphase2 = phase.id === 'meiosis-anaphase2';
  const regions = cellRegions(cellCount);

  // 2가 염색체 연결선(상동끼리): bivalent 시기에 같은 쌍(A/B) 2개를 잇는다
  const connectors: { x1: number; y1: number; x2: number; y2: number }[] = [];
  if (phase.bivalent) {
    for (const letter of ['A', 'B']) {
      const pair = bodies.filter((b) => b.label.startsWith(letter));
      if (pair.length === 2) {
        connectors.push({ x1: pair[0]!.x, y1: pair[0]!.y, x2: pair[1]!.x, y2: pair[1]!.y });
      }
    }
  }

  // 감수2분열 후기: 염색분체가 해당 세포 적도판(LC/RC)에서 출발
  const anaInitialX = (x: number) => (x < M_CX ? 130 : 330);

  return (
    <div
      className="cellview"
      style={{ width: M_STAGE_W, height: M_STAGE_H }}
      aria-label="감수분열 세포"
    >
      {/* 세포 외곽 */}
      {regions.map((r, i) => (
        <div key={i} className="cell-shape" style={{ left: r.left, width: r.width }} />
      ))}

      {/* 적도판 */}
      {equators.map((e, i) => (
        <div key={i} className={`equator ${e.active ? 'active' : ''}`} style={{ left: e.x }} />
      ))}

      {/* 방추사 + 2가 연결선 */}
      <svg className="spindle" width={M_STAGE_W} height={M_STAGE_H} aria-hidden>
        {bodies.flatMap((b) =>
          b.polesFrom.map((px) => (
            <motion.line
              key={`${b.key}-${px}`}
              x1={px}
              y1={M_POLE_Y}
              initial={isAnaphase2 ? { x2: anaInitialX(b.x), y2: b.y } : false}
              animate={{ x2: b.x, y2: b.y }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              stroke="var(--spindle)"
              strokeWidth={1.6}
              strokeDasharray="2 3"
              opacity={0.8}
            />
          )),
        )}
        {connectors.map((c, i) => (
          <line
            key={`conn-${i}`}
            x1={c.x1}
            y1={c.y1}
            x2={c.x2}
            y2={c.y2}
            stroke="var(--homolog)"
            strokeWidth={3}
            opacity={0.5}
          />
        ))}
      </svg>

      {/* 염색체들 */}
      {bodies.map((b) => (
        <motion.div
          key={b.key}
          className="cell-body"
          initial={isAnaphase2 ? { left: anaInitialX(b.x), top: b.y, opacity: 1 } : false}
          animate={{ left: b.x, top: b.y, opacity: 1 }}
          transition={{ duration: isAnaphase2 ? 0.9 : 0.6, ease: 'easeInOut' }}
        >
          <Chromosome
            replicated={b.replicated}
            color={b.color}
            label={b.label}
            lengthPx={b.lengthPx}
            widthPx={26}
          />
        </motion.div>
      ))}

      {/* 분리/형성 라벨 */}
      {phase.bivalent && (
        <div className="sep-label bivalent-label">상동염색체끼리 접합 → 2가 염색체</div>
      )}
      {phase.separationEvent === 'homolog' && (
        <div className="sep-label homolog-label">
          ⚠️ <b>상동염색체</b>가 분리 (염색분체 아님)
        </div>
      )}
      {phase.separationEvent === 'chromatid' && (
        <div className="sep-label">염색분체가 분리 → 양극 이동</div>
      )}
    </div>
  );
}
