// 색맹 대응 팔레트 (Step 2) — 빨강-초록 의존 금지 (PRD 접근성 요구)
// 근거: PRD §7.4(M1 색 구분), 접근성(색맹 대응). 색 + 패턴 + 라벨 삼중 인코딩 원칙.
//
// 핵심 구분:
//   - 자매염색분체(sister): 같은 색 (동일 출처 강조)
//   - 상동염색체(homolog): 같은 계열(hue) + 다른 명도 (부/모) → 색만으로 구분하지 않고 라벨 병기
//   - 핵상 2n/n: 파랑/주황 (색맹 안전)

export const PALETTE = {
  ploidy2n: '#4c8dff', // 파랑
  ploidyN: '#ffa64c', // 주황
  // 상동염색체 쌍 A: 청색 계열 (부=진한, 모=연한)
  homologA: { paternal: '#2f6fd6', maternal: '#8fb8f0' },
  // 상동염색체 쌍 B: 자주 계열 (부=진한, 모=연한)
  homologB: { paternal: '#9b59b6', maternal: '#d2a8e0' },
  centromere: '#2b2b2b',
  spindle: '#9aa7b5',
  homologSep: '#c792ea',
  chromatidSep: '#5ad1c8',
  outline: '#1a212b',
} as const;

/** 상동염색체 쌍(인덱스)·유래에 맞는 색 반환 */
export function homologColor(pairIndex: number, origin: 'paternal' | 'maternal'): string {
  const pairs = [PALETTE.homologA, PALETTE.homologB];
  const pair = pairs[pairIndex % pairs.length]!;
  return pair[origin];
}

/** 유래 라벨 (색에만 의존하지 않도록 항상 병기) */
export const ORIGIN_LABEL: Record<'paternal' | 'maternal', string> = {
  paternal: '부',
  maternal: '모',
};
