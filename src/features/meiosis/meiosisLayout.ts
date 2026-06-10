// 감수분열 시기별 배치 (Step 4) — 2n=4 모델
// 근거: PRD F3 — 감수1분열(상동염색체 분리), 감수2분열(염색분체 분리), 핵상 2n→n.
//
// 좌표계: 스테이지 px. 감수1분열은 1개 세포(적도판 x=CX), 감수2분열은 2개 세포(각자 적도판).
// 말기Ⅱ는 딸세포 4개. 방추사는 각 body의 polesFrom(연결 극 x) 목록으로 표현.

import { homologColor } from '../../components/palette';

export const M_STAGE_W = 460;
export const M_STAGE_H = 380;
export const M_CX = M_STAGE_W / 2; // 230
export const M_POLE_Y = M_STAGE_H / 2; // 190

// 감수1분열 양극
const D1_L = 80;
const D1_R = 380;
// 감수2분열 두 세포(좌/우) 중심과 미니 양극
const LC = 130;
const LC_PL = 70;
const LC_PR = 190;
const RC = 330;
const RC_PL = 270;
const RC_PR = 390;

export interface MBody {
  key: string;
  x: number;
  y: number;
  replicated: boolean;
  color: string;
  label: string;
  lengthPx: number;
  /** 연결된 방추사 극의 x좌표들(없으면 방추사 없음) */
  polesFrom: number[];
}

export interface MeiosisLayout {
  bodies: MBody[];
  /** 세포 외곽 개수: 1 / 2 / 4 */
  cellCount: 1 | 2 | 4;
  /** 적도판 가이드선 */
  equators: { x: number; active: boolean }[];
}

const CHROMS = [
  { id: 'A-p', pair: 0, origin: 'paternal' as const },
  { id: 'A-m', pair: 0, origin: 'maternal' as const },
  { id: 'B-p', pair: 1, origin: 'paternal' as const },
  { id: 'B-m', pair: 1, origin: 'maternal' as const },
];
const LEN: Record<number, number> = { 0: 72, 1: 50 };
const labelOf = (c: (typeof CHROMS)[number]) =>
  `${c.pair === 0 ? 'A' : 'B'}-${c.origin === 'paternal' ? '부' : '모'}`;
const colorOf = (c: (typeof CHROMS)[number]) => homologColor(c.pair, c.origin);
const lenOf = (c: (typeof CHROMS)[number]) => LEN[c.pair]!;
const byId = (id: string) => CHROMS.find((c) => c.id === id)!;

function body(
  id: string,
  x: number,
  y: number,
  replicated: boolean,
  polesFrom: number[] = [],
  keySuffix = '',
): MBody {
  const c = byId(id);
  return {
    key: id + keySuffix,
    x,
    y,
    replicated,
    color: colorOf(c),
    label: labelOf(c),
    lengthPx: lenOf(c),
    polesFrom,
  };
}

export function getMeiosisLayout(phaseId: string): MeiosisLayout {
  switch (phaseId) {
    // ── 간기 ──
    case 'meiosis-g1':
      return {
        cellCount: 1,
        equators: [],
        bodies: [
          body('A-p', 150, 120, false),
          body('A-m', 150, 260, false),
          body('B-p', 310, 120, false),
          body('B-m', 310, 260, false),
        ],
      };
    case 'meiosis-s':
    case 'meiosis-g2':
      return {
        cellCount: 1,
        equators: [],
        bodies: [
          body('A-p', 150, 120, true),
          body('A-m', 150, 260, true),
          body('B-p', 310, 120, true),
          body('B-m', 310, 260, true),
        ],
      };

    // ── 감수 1분열 ──
    case 'meiosis-prophase1': // 2가 염색체 형성: 상동끼리 접합(라벨 겹침 방지로 좌우 간격 확보)
      return {
        cellCount: 1,
        equators: [{ x: M_CX, active: false }],
        bodies: [
          body('A-p', 150, 135, true, [D1_L, D1_R]),
          body('A-m', 205, 135, true, [D1_L, D1_R]),
          body('B-p', 280, 255, true, [D1_L, D1_R]),
          body('B-m', 335, 255, true, [D1_L, D1_R]),
        ],
      };
    case 'meiosis-metaphase1': // 2가 염색체 적도판 배열(상동이 양쪽에)
      return {
        cellCount: 1,
        equators: [{ x: M_CX, active: true }],
        bodies: [
          body('A-p', M_CX - 28, 130, true, [D1_L]),
          body('A-m', M_CX + 28, 130, true, [D1_R]),
          body('B-p', M_CX - 28, 255, true, [D1_L]),
          body('B-m', M_CX + 28, 255, true, [D1_R]),
        ],
      };
    case 'meiosis-anaphase1': // 상동염색체 분리(각자 2개 염색분체 유지)
      return {
        cellCount: 1,
        equators: [{ x: M_CX, active: false }],
        bodies: [
          body('A-p', D1_L, 130, true, [D1_L]),
          body('A-m', D1_R, 130, true, [D1_R]),
          body('B-p', D1_L, 255, true, [D1_L]),
          body('B-m', D1_R, 255, true, [D1_R]),
        ],
      };
    case 'meiosis-telophase1': // 딸세포 2개(n), 각 염색체는 아직 2개 염색분체
      return {
        cellCount: 2,
        equators: [],
        bodies: [
          body('A-p', LC, 130, true),
          body('B-p', LC, 255, true),
          body('A-m', RC, 130, true),
          body('B-m', RC, 255, true),
        ],
      };

    // ── 감수 2분열 (2개 세포) ──
    case 'meiosis-prophase2':
      return {
        cellCount: 2,
        equators: [
          { x: LC, active: false },
          { x: RC, active: false },
        ],
        bodies: [
          body('A-p', 110, 130, true, [LC_PL, LC_PR]),
          body('B-p', 150, 255, true, [LC_PL, LC_PR]),
          body('A-m', 310, 130, true, [RC_PL, RC_PR]),
          body('B-m', 370, 255, true, [RC_PL, RC_PR]),
        ],
      };
    case 'meiosis-metaphase2': // 각 세포 적도판 정렬
      return {
        cellCount: 2,
        equators: [
          { x: LC, active: true },
          { x: RC, active: true },
        ],
        bodies: [
          body('A-p', LC, 130, true, [LC_PL, LC_PR]),
          body('B-p', LC, 255, true, [LC_PL, LC_PR]),
          body('A-m', RC, 130, true, [RC_PL, RC_PR]),
          body('B-m', RC, 255, true, [RC_PL, RC_PR]),
        ],
      };
    case 'meiosis-anaphase2': // 염색분체 분리 → 각 세포 양극으로
      return {
        cellCount: 2,
        equators: [
          { x: LC, active: false },
          { x: RC, active: false },
        ],
        bodies: [
          body('A-p', LC_PL, 130, false, [LC_PL], '-L'),
          body('A-p', LC_PR, 130, false, [LC_PR], '-R'),
          body('B-p', LC_PL, 255, false, [LC_PL], '-L'),
          body('B-p', LC_PR, 255, false, [LC_PR], '-R'),
          body('A-m', RC_PL, 130, false, [RC_PL], '-L'),
          body('A-m', RC_PR, 130, false, [RC_PR], '-R'),
          body('B-m', RC_PL, 255, false, [RC_PL], '-L'),
          body('B-m', RC_PR, 255, false, [RC_PR], '-R'),
        ],
      };
    case 'meiosis-telophase2': // 딸세포 4개(n)
      return {
        cellCount: 4,
        equators: [],
        bodies: [
          body('A-p', 70, 140, false, [], '-L'),
          body('B-p', 70, 240, false, [], '-L'),
          body('A-p', 180, 140, false, [], '-R'),
          body('B-p', 180, 240, false, [], '-R'),
          body('A-m', 290, 140, false, [], '-L'),
          body('B-m', 290, 240, false, [], '-L'),
          body('A-m', 400, 140, false, [], '-R'),
          body('B-m', 400, 240, false, [], '-R'),
        ],
      };

    default:
      return { cellCount: 1, equators: [], bodies: [] };
  }
}

/** cellCount에 따른 세포 외곽 영역(%) */
export function cellRegions(cellCount: 1 | 2 | 4): { left: string; width: string }[] {
  if (cellCount === 1) return [{ left: '5%', width: '90%' }];
  if (cellCount === 2)
    return [
      { left: '4%', width: '44%' },
      { left: '52%', width: '44%' },
    ];
  return [
    { left: '2%', width: '22%' },
    { left: '26%', width: '22%' },
    { left: '52%', width: '22%' },
    { left: '76%', width: '22%' },
  ];
}
