// 드래그 엔진 (Step 2) — Pointer Events 기반, PC/모바일 통일 + 자석 스냅
// 근거: PRD §8.1 — hit area ≥44px, 거리 ≤32px 자석 스냅, touch-action:none
//
// 좌표계: 컨테이너(ref) 기준 px. SVG/DOM 어디서나 동일하게 동작.
// 사용처: 3단계(체세포)·4단계(감수) 시뮬레이터에서 염색체 정렬/분리.

import { useCallback, useRef, useState } from 'react';

export interface Point {
  x: number;
  y: number;
}

export interface SnapTarget {
  id: string;
  x: number;
  y: number;
  /** 이 거리(px) 이내면 흡착 (PRD: ≤32px) */
  radius: number;
  /**
   * 흡착 축. 'both'=점(기본), 'x'=세로선(x만 보고 y는 유지), 'y'=가로선.
   * 적도판처럼 세로 가이드선은 'x'로 두면 선 근처 어디서나 흡착된다.
   */
  axis?: 'both' | 'x' | 'y';
}

interface UseDraggableOptions {
  initial: Point;
  /** 컨테이너 좌표를 계산할 기준 요소 */
  containerRef: React.RefObject<HTMLElement | SVGElement | null>;
  snapTargets?: SnapTarget[];
  /** 드롭 시 가장 가까운 스냅 타깃(없으면 null) */
  onDrop?: (pos: Point, snappedTargetId: string | null) => void;
}

const DEFAULT_SNAP_RADIUS = 32;

/** 타깃까지의 거리 — 축에 따라 점/세로선/가로선 거리 */
function axisDist(pos: Point, t: SnapTarget): number {
  switch (t.axis) {
    case 'x':
      return Math.abs(pos.x - t.x); // 세로선: x 거리만
    case 'y':
      return Math.abs(pos.y - t.y); // 가로선: y 거리만
    default:
      return Math.hypot(pos.x - t.x, pos.y - t.y); // 점
  }
}

/** 흡착 시 이동할 위치 — 축에 따라 한 좌표만 끌어당기고 나머지는 유지 */
function snapPoint(pos: Point, t: SnapTarget): Point {
  switch (t.axis) {
    case 'x':
      return { x: t.x, y: pos.y }; // 세로선에 붙되 높이는 유지
    case 'y':
      return { x: pos.x, y: t.y };
    default:
      return { x: t.x, y: t.y };
  }
}

/** 현재 위치에서 흡착 범위 내 가장 가까운 타깃 */
function findSnap(pos: Point, targets: SnapTarget[]): SnapTarget | null {
  let best: SnapTarget | null = null;
  let bestD = Infinity;
  for (const t of targets) {
    const d = axisDist(pos, t);
    const r = t.radius || DEFAULT_SNAP_RADIUS;
    if (d <= r && d < bestD) {
      best = t;
      bestD = d;
    }
  }
  return best;
}

export function useDraggable({
  initial,
  containerRef,
  snapTargets = [],
  onDrop,
}: UseDraggableOptions) {
  const [position, setPosition] = useState<Point>(initial);
  const [isDragging, setIsDragging] = useState(false);
  const [nearestTargetId, setNearestTargetId] = useState<string | null>(null);
  const offset = useRef<Point>({ x: 0, y: 0 });

  const toLocal = useCallback(
    (clientX: number, clientY: number): Point => {
      const rect = containerRef.current?.getBoundingClientRect();
      return { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) };
    },
    [containerRef],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      const local = toLocal(e.clientX, e.clientY);
      offset.current = { x: local.x - position.x, y: local.y - position.y };
      setIsDragging(true);
    },
    [position, toLocal],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const local = toLocal(e.clientX, e.clientY);
      const next = { x: local.x - offset.current.x, y: local.y - offset.current.y };
      const snap = findSnap(next, snapTargets);
      setNearestTargetId(snap?.id ?? null);
      // 흡착 범위 내면 타깃으로 끌어당김(자석). 축 제약에 따라 한 좌표만 끌림.
      setPosition(snap ? snapPoint(next, snap) : next);
    },
    [isDragging, snapTargets, toLocal],
  );

  const endDrag = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      (e.target as Element).releasePointerCapture?.(e.pointerId);
      setIsDragging(false);
      const snap = findSnap(position, snapTargets);
      setNearestTargetId(null);
      onDrop?.(position, snap?.id ?? null);
    },
    [isDragging, position, snapTargets, onDrop],
  );

  return {
    position,
    isDragging,
    nearestTargetId,
    setPosition,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      style: { touchAction: 'none' as const },
    },
  };
}
