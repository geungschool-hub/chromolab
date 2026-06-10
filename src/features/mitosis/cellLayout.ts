// 체세포분열 시기별 염색체 배치 (Step 3) — 2n=4 모델
// 근거: PRD F2. 시기 전환 시 염색체가 올바른 위치로 이동(중기 적도판 정렬, 후기 양극 이동).
//
// 좌표계: 세포 스테이지(STAGE_W × STAGE_H) px. 적도판 = 세로선 x=CX. 양극 = 좌/우.

import { homologColor } from '../../components/palette';

export const STAGE_W = 440;
export const STAGE_H = 380;
export const CX = STAGE_W / 2; // 적도판 x
export const POLE_LEFT = 90;
export const POLE_RIGHT = STAGE_W - 90;

/** 화면에 그릴 염색체(또는 분리된 염색분체) 한 덩어리 */
export interface Body {
  key: string;
  x: number;
  y: number;
  replicated: boolean;
  color: string;
  label: string;
  /** 염색체 길이(px) — 상동염색체 쌍은 같은 길이, 다른 쌍은 다른 길이 */
  lengthPx: number;
  /** 말기: 어느 딸세포에 속하는지 */
  cell?: 'left' | 'right';
}

// 쌍별 길이: A쌍(0) 길게, B쌍(1) 짧게 → 상동 관계를 길이로 구분(색에만 의존하지 않음)
const PAIR_LENGTH: Record<number, number> = { 0: 78, 1: 54 };

// 2n=4 → 상동염색체 2쌍. 각 염색체의 식별/색/라벨.
const CHROMS = [
  { id: 'A-p', pair: 0, origin: 'paternal' as const },
  { id: 'A-m', pair: 0, origin: 'maternal' as const },
  { id: 'B-p', pair: 1, origin: 'paternal' as const },
  { id: 'B-m', pair: 1, origin: 'maternal' as const },
];

const labelOf = (c: (typeof CHROMS)[number]) =>
  `${c.pair === 0 ? 'A' : 'B'}-${c.origin === 'paternal' ? '부' : '모'}`;
const colorOf = (c: (typeof CHROMS)[number]) => homologColor(c.pair, c.origin);
const lengthOf = (c: (typeof CHROMS)[number]) => PAIR_LENGTH[c.pair]!;

// 간기/전기: 핵 안에 흩어진 위치
const SCATTER: Record<string, { x: number; y: number }> = {
  'A-p': { x: 150, y: 120 },
  'A-m': { x: 150, y: 260 },
  'B-p': { x: 300, y: 120 },
  'B-m': { x: 300, y: 260 },
};

// 중기: 적도판(x=CX)에 세로로 한 줄 정렬
const META_Y: Record<string, number> = { 'A-p': 90, 'A-m': 175, 'B-p': 260, 'B-m': 345 };

export function getMitosisBodies(phaseId: string): Body[] {
  const replicated = !['mitosis-g1', 'mitosis-anaphase', 'mitosis-telophase'].includes(phaseId);

  // 간기·전기: 흩어진 4개
  if (['mitosis-g1', 'mitosis-s', 'mitosis-g2', 'mitosis-prophase'].includes(phaseId)) {
    return CHROMS.map((c) => ({
      key: c.id,
      x: SCATTER[c.id]!.x,
      y: SCATTER[c.id]!.y,
      replicated,
      color: colorOf(c),
      label: labelOf(c),
      lengthPx: lengthOf(c),
    }));
  }

  // 중기: 적도판 정렬
  if (phaseId === 'mitosis-metaphase') {
    return CHROMS.map((c) => ({
      key: c.id,
      x: CX,
      y: META_Y[c.id]!,
      replicated: true,
      color: colorOf(c),
      label: labelOf(c),
      lengthPx: lengthOf(c),
    }));
  }

  // 후기: 염색분체 분리 → 8개(각 극에 4개). 단일 염색분체(replicated=false).
  if (phaseId === 'mitosis-anaphase') {
    return CHROMS.flatMap((c) => [
      {
        key: `${c.id}-L`,
        x: POLE_LEFT,
        y: META_Y[c.id]!,
        replicated: false,
        color: colorOf(c),
        label: labelOf(c),
        lengthPx: lengthOf(c),
      },
      {
        key: `${c.id}-R`,
        x: POLE_RIGHT,
        y: META_Y[c.id]!,
        replicated: false,
        color: colorOf(c),
        label: labelOf(c),
        lengthPx: lengthOf(c),
      },
    ]);
  }

  // 말기·세포질분열: 두 딸세포에 4개씩
  if (phaseId === 'mitosis-telophase') {
    const leftC = STAGE_W * 0.27;
    const rightC = STAGE_W * 0.73;
    const ys = [120, 260];
    return CHROMS.flatMap((c, i) => {
      const yTop = ys[i % 2]!;
      const xOff = i < 2 ? -28 : 28;
      return [
        {
          key: `${c.id}-L`,
          x: leftC + xOff,
          y: yTop,
          replicated: false,
          color: colorOf(c),
          label: labelOf(c),
          lengthPx: lengthOf(c),
          cell: 'left' as const,
        },
        {
          key: `${c.id}-R`,
          x: rightC + xOff,
          y: yTop,
          replicated: false,
          color: colorOf(c),
          label: labelOf(c),
          lengthPx: lengthOf(c),
          cell: 'right' as const,
        },
      ];
    });
  }

  return [];
}
