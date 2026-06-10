// 드래그 엔진 검증용 데모 (Step 2) — 2n=4 모델의 염색체 4개를 세포 중앙(적도판)에 정렬
// 실제 시뮬레이터(3·4단계)는 이 엔진(useDraggable)을 그대로 사용한다.

import { useRef, useState } from 'react';
import { Chromosome } from '../../components/Chromosome';
import { useDraggable, type SnapTarget } from '../../engine/useDraggable';
import { homologColor, ORIGIN_LABEL } from '../../components/palette';
import './dragdemo.css';

const STAGE_W = 340;
const STAGE_H = 380;
// 적도판은 세로 가이드선 → axis:'x'. 선에 가까이(40px)만 가면 높이와 무관하게 흡착.
const PLATE: SnapTarget = { id: 'plate', x: STAGE_W / 2, y: STAGE_H / 2, radius: 40, axis: 'x' };

// 2n=4 → 상동염색체 2쌍(부/모). 초기 위치는 세포 안에 흩어 둔다.
const CHROMOSOMES = [
  { id: 'A-p', pair: 0, origin: 'paternal' as const, x: 70, y: 90 },
  { id: 'A-m', pair: 0, origin: 'maternal' as const, x: 75, y: 290 },
  { id: 'B-p', pair: 1, origin: 'paternal' as const, x: 270, y: 95 },
  { id: 'B-m', pair: 1, origin: 'maternal' as const, x: 265, y: 285 },
];

interface ChromoState {
  near: boolean;
  snapped: boolean;
}

function DraggableChromosome({
  initial,
  color,
  label,
  lengthPx,
  containerRef,
  onState,
}: {
  initial: { x: number; y: number };
  color: string;
  label: string;
  lengthPx: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onState: (s: ChromoState) => void;
}) {
  const drag = useDraggable({
    initial,
    containerRef,
    snapTargets: [PLATE],
    onDrop: (_pos, targetId) => onState({ near: false, snapped: targetId === PLATE.id }),
  });

  // 드래그 중 근접 상태 보고
  const near = drag.nearestTargetId === PLATE.id;
  const { style: dragStyle, ...handlers } = drag.handlers;

  return (
    <div
      className={`dd-chromo ${near ? 'near' : ''}`}
      style={{ left: drag.position.x, top: drag.position.y, ...dragStyle }}
      onPointerMove={(e) => {
        handlers.onPointerMove(e);
        onState({ near: drag.nearestTargetId === PLATE.id, snapped: false });
      }}
      onPointerDown={handlers.onPointerDown}
      onPointerUp={handlers.onPointerUp}
      onPointerCancel={handlers.onPointerCancel}
    >
      <Chromosome replicated color={color} label={label} lengthPx={lengthPx} widthPx={30} />
    </div>
  );
}

export function DragDemo() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [states, setStates] = useState<Record<string, ChromoState>>({});

  const setOne = (id: string) => (s: ChromoState) => setStates((prev) => ({ ...prev, [id]: s }));

  const alignedCount = CHROMOSOMES.filter((c) => states[c.id]?.snapped).length;
  const anyNear = CHROMOSOMES.some((c) => states[c.id]?.near);
  const allAligned = alignedCount === CHROMOSOMES.length;

  return (
    <div className="dragdemo">
      <p className="dd-title">
        🔬 체세포분열 <b>중기</b> 정렬 연습
      </p>
      <p className="dd-hint">
        <b>2n = 4</b> (상동염색체 2쌍). 체세포분열 중기처럼 염색체 4개를 <b>세포 중앙(적도판)</b>
        점선으로 끌어 한 줄로 정렬해 보세요. 선 가까이(40px)만 가면 높이와 상관없이 흡착됩니다.
        (PC·모바일 동일)
      </p>

      <div
        ref={stageRef}
        className="dd-stage"
        style={{ width: STAGE_W, height: STAGE_H }}
        aria-label="세포 시뮬레이션 영역 (2n=4)"
      >
        <div className="dd-cell" />
        <div className={`dd-plate ${anyNear || allAligned ? 'active' : ''}`} />
        <span className="dd-plate-label">세포 중앙(적도판)</span>

        {CHROMOSOMES.map((c) => (
          <DraggableChromosome
            key={c.id}
            initial={{ x: c.x, y: c.y }}
            color={homologColor(c.pair, c.origin)}
            label={`${c.pair === 0 ? 'A' : 'B'}-${ORIGIN_LABEL[c.origin]}`}
            lengthPx={c.pair === 0 ? 100 : 70}
            containerRef={stageRef}
            onState={setOne(c.id)}
          />
        ))}
      </div>

      <div className={`dd-status ${allAligned ? 'ok' : ''}`} aria-live="polite">
        {allAligned
          ? '✓ 4개 염색체가 모두 적도판에 정렬되었습니다! (체세포분열 중기 모습)'
          : `정렬: ${alignedCount} / 4`}
      </div>
    </div>
  );
}
