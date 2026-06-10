// SVG 염색체 컴포넌트 (Step 2~3)
// 근거: PRD F1(염색체 해부 뷰), §10.1(SVG 렌더), 접근성(키보드/스크린리더)
//
// - 복제 전(unreplicated): 1개 염색분체
// - 복제 후(replicated): 2개 자매염색분체 + 동원체(가운데 잘록한 부위)
// - 부위(염색분체/동원체)를 탭하면 onPartClick 호출 → 명칭·정의 툴팁(F1)
// - 길이(lengthPx)와 너비(widthPx)를 독립 지정 → 상동염색체 쌍은 같은 길이, 다른 쌍은 다른 길이로 구분

import { PALETTE } from './palette';

export type ChromosomePart = 'chromatid' | 'chromatid-left' | 'chromatid-right' | 'centromere';

interface ChromosomeProps {
  replicated: boolean;
  color: string;
  /** 유래 라벨(부/모) — 색에만 의존하지 않도록 병기 */
  label?: string;
  onPartClick?: (part: ChromosomePart, term: string) => void;
  activeParts?: ChromosomePart[];
  /** 염색체 길이(px). 상동염색체 쌍은 같은 값, 다른 쌍은 다른 값으로 구분 */
  lengthPx?: number;
  /** 염색체 너비(px). 모든 염색체 동일 권장 */
  widthPx?: number;
}

const PART_TERM: Record<ChromosomePart, string> = {
  chromatid: 'chromatid',
  'chromatid-left': 'sisterChromatid',
  'chromatid-right': 'sisterChromatid',
  centromere: 'centromere',
};

export function Chromosome({
  replicated,
  color,
  label,
  onPartClick,
  activeParts = [],
  lengthPx = 120,
  widthPx = 30,
}: ChromosomeProps) {
  const W = widthPx;
  const L = lengthPx;
  const labelH = label ? Math.max(16, W * 0.7) : 0;
  const top = 4;
  // 라벨이 염색체 너비보다 넓을 수 있으므로 viewBox를 좌우로 넓혀 잘림 방지
  const boxW = label ? Math.max(W, 48) : W;
  const vbX = -(boxW - W) / 2;
  const barH = L - 8;
  const cy = top + barH / 2;

  const partProps = (part: ChromosomePart) => ({
    role: 'button' as const,
    tabIndex: onPartClick ? 0 : -1,
    style: { cursor: onPartClick ? 'pointer' : 'default', outline: 'none' },
    onClick: () => onPartClick?.(part, PART_TERM[part]),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (onPartClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onPartClick(part, PART_TERM[part]);
      }
    },
  });

  const glow = (part: ChromosomePart) =>
    activeParts.includes(part)
      ? { filter: 'url(#chromo-glow)', stroke: '#ffd166', strokeWidth: 2 }
      : {};

  return (
    <svg
      width={boxW}
      height={L + labelH}
      viewBox={`${vbX} 0 ${boxW} ${L + labelH}`}
      style={{ overflow: 'visible' }}
      aria-label={`염색체${replicated ? '(복제됨, 염색분체 2개)' : '(복제 전, 염색분체 1개)'}${
        label ? ` ${label}` : ''
      }`}
    >
      <defs>
        <filter id="chromo-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#ffd166" floodOpacity="0.9" />
        </filter>
      </defs>

      {replicated ? (
        <>
          <rect
            {...partProps('chromatid-left')}
            x={W * 0.1}
            y={top}
            width={W * 0.34}
            height={barH}
            rx={W * 0.17}
            fill={color}
            stroke={PALETTE.outline}
            strokeWidth={1}
            {...glow('chromatid-left')}
          />
          <rect
            {...partProps('chromatid-right')}
            x={W * 0.56}
            y={top}
            width={W * 0.34}
            height={barH}
            rx={W * 0.17}
            fill={color}
            stroke={PALETTE.outline}
            strokeWidth={1}
            {...glow('chromatid-right')}
          />
          <circle
            {...partProps('centromere')}
            cx={W / 2}
            cy={cy}
            r={W * 0.23}
            fill={PALETTE.centromere}
            {...glow('centromere')}
          />
        </>
      ) : (
        <>
          <rect
            {...partProps('chromatid')}
            x={W * 0.28}
            y={top}
            width={W * 0.44}
            height={barH}
            rx={W * 0.2}
            fill={color}
            stroke={PALETTE.outline}
            strokeWidth={1}
            {...glow('chromatid')}
          />
          <circle
            {...partProps('centromere')}
            cx={W / 2}
            cy={cy}
            r={W * 0.2}
            fill={PALETTE.centromere}
            {...glow('centromere')}
          />
        </>
      )}

      {label && (
        <text
          x={W / 2}
          y={L + labelH * 0.72}
          textAnchor="middle"
          fontSize={Math.max(13, W * 0.58)}
          fontWeight={800}
          style={{ fill: 'var(--text)' }}
        >
          {label}
        </text>
      )}
    </svg>
  );
}
