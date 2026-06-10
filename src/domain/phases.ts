// ChromoLab 진리표 — 세포분열 시기별 과학적 사실값 (단일 기준원)
// 근거: ChromoLab_PRD.md §7.2(체세포분열)·§7.3(감수분열), 교과서 『생명과학』(이준규 외) p.140~147
//
// ⚠️ 시뮬레이터·그래프·퀴즈는 반드시 이 파일만 참조한다. 값 변경은 PRD §13.1 과학 오류 수정 프로세스 준수.
// 카운트 규칙:
//   - chromosomeCount / chromatidCount = "세포 전체" 기준
//   - 후기처럼 양극이 갈라지는 시기는 perPole(한 극 기준)을 별도 제공
//   - 후기 분리 직후 "세포 전체 염색체 수"는 순간적이라 transientChromosomeCount=true로 표시(퀴즈 제외)

import type { PhaseFacts } from './types';

/**
 * 시기별 자동재생 기본 시간(ms). 학습 우선순위 가중 (개선안 #2).
 * - S기(DNA 복제)·중기(정렬)는 길게, 간기 G1/G2·말기는 짧게.
 * - id 전체를 키로 사용해 모호성 제거. 누락 시 DEFAULT_DURATION 사용.
 */
const PHASE_DURATION_MS: Record<string, number> = {
  // 체세포분열 (S기·중기를 상대적으로 길게 두되 전체는 짧게)
  'mitosis-g1': 900,
  'mitosis-s': 2000, // DNA 복제 — 가장 중요한 시각화
  'mitosis-g2': 900,
  'mitosis-prophase': 1300,
  'mitosis-metaphase': 1700, // 적도판 정렬
  'mitosis-anaphase': 1300,
  'mitosis-telophase': 1100,
  // 감수분열
  'meiosis-g1': 900,
  'meiosis-s': 2000, // DNA 복제(1회뿐)
  'meiosis-g2': 900,
  'meiosis-prophase1': 1300,
  'meiosis-metaphase1': 1700, // 2가 염색체 무작위 배열
  'meiosis-anaphase1': 1300,
  'meiosis-telophase1': 1100,
  'meiosis-prophase2': 1100,
  'meiosis-metaphase2': 1300,
  'meiosis-anaphase2': 1300,
  'meiosis-telophase2': 1100,
};
const DEFAULT_DURATION = 1100;
const dur = (id: string): number => PHASE_DURATION_MS[id] ?? DEFAULT_DURATION;

/** durationMs를 제외한 시기 정의 — 빌더에서 id별 재생시간을 주입한다. */
type RawPhase = Omit<PhaseFacts, 'durationMs'>;

/** raw 배열에 durationMs를 주입해 완성 */
const withDuration = (raw: RawPhase[]): PhaseFacts[] =>
  raw.map((p) => ({ ...p, durationMs: dur(p.id) }));

/**
 * 2배체 수(diploidNumber, 예: 2n=4)로부터 체세포분열 시기 배열을 생성한다.
 * 기본 모델은 2n=4 (D=4). PRD §11에 따라 2n=2, 2n=6 확장 가능.
 */
export function buildMitosisPhases(diploidNumber: number): PhaseFacts[] {
  const D = diploidNumber; // 2n
  const raw: RawPhase[] = [
    {
      id: 'mitosis-g1',
      process: 'mitosis',
      labelKo: 'G₁기',
      i18nKey: 'phase.mitosis.g1',
      stage: 'interphase',
      ploidy: '2n',
      chromosomeCount: D,
      chromatidCount: D, // 복제 전: 염색체당 염색분체 1개
      dnaRelative: 2,
      perPole: null,
      separationEvent: null,
      bivalent: false,
      daughterCells: null,
      note: '간기의 첫 시기예요. 세포가 자라면서 세포소기관과 단백질을 만듭니다. 염색체는 풀어져 있어 보이지 않아요. (간기는 쉬는 시기가 아닙니다 — M5)',
    },
    {
      id: 'mitosis-s',
      process: 'mitosis',
      labelKo: 'S기',
      i18nKey: 'phase.mitosis.s',
      stage: 'interphase',
      ploidy: '2n',
      chromosomeCount: D,
      chromatidCount: 2 * D, // DNA 복제 → 염색체당 염색분체 2개
      dnaRelative: 4,
      perPole: null,
      separationEvent: null,
      bivalent: false,
      daughterCells: null,
      dnaReplication: true,
      graphAnnotation: 'DNA 복제(상대량 2→4). 간기는 휴지기가 아님(M5).',
      note: 'DNA가 복제됩니다. 염색체 수는 그대로지만, 각 염색체가 염색분체 2개가 되어 염색분체 수와 DNA 양이 2배가 돼요.',
    },
    {
      id: 'mitosis-g2',
      process: 'mitosis',
      labelKo: 'G₂기',
      i18nKey: 'phase.mitosis.g2',
      stage: 'interphase',
      ploidy: '2n',
      chromosomeCount: D,
      chromatidCount: 2 * D,
      dnaRelative: 4,
      perPole: null,
      separationEvent: null,
      bivalent: false,
      daughterCells: null,
      note: '분열을 준비하는 시기예요. 복제가 끝난 상태를 유지합니다.',
    },
    {
      id: 'mitosis-prophase',
      process: 'mitosis',
      labelKo: '전기',
      i18nKey: 'phase.mitosis.prophase',
      stage: 'division',
      ploidy: '2n',
      chromosomeCount: D,
      chromatidCount: 2 * D,
      dnaRelative: 4,
      perPole: null,
      separationEvent: null,
      bivalent: false,
      daughterCells: null,
      note: '염색체가 응축되어 보이기 시작합니다(각 염색체는 염색분체 2개). 핵막이 사라지고 방추사가 만들어져요.',
    },
    {
      id: 'mitosis-metaphase',
      process: 'mitosis',
      labelKo: '중기',
      i18nKey: 'phase.mitosis.metaphase',
      stage: 'division',
      ploidy: '2n',
      chromosomeCount: D,
      chromatidCount: 2 * D,
      dnaRelative: 4,
      perPole: null,
      separationEvent: null,
      bivalent: false,
      daughterCells: null,
      note: '염색체가 낱개로 세포 중앙(적도판)에 한 줄로 배열됩니다.',
    },
    {
      id: 'mitosis-anaphase',
      process: 'mitosis',
      labelKo: '후기',
      i18nKey: 'phase.mitosis.anaphase',
      stage: 'division',
      ploidy: '2n',
      chromosomeCount: 2 * D, // 염색분체 분리 → 각각이 염색체 (오개념 M2). 단 순간적 → transient
      chromatidCount: 2 * D,
      dnaRelative: 4, // 세포질분열 전이라 핵 1개 기준 DNA는 아직 4
      perPole: { chromosomeCount: D, chromatidCount: D },
      separationEvent: 'chromatid',
      bivalent: false,
      daughterCells: null,
      transientChromosomeCount: true, // 세포 전체 2D개는 순간값 → 퀴즈 제외, 화면은 극당 표시
      transientNotice:
        '후기는 아주 짧은 순간이라, 이 시기에 잠깐 나타나는 염색체 수(세포 전체 8개)나 핵상 변화는 보통 시험·설명에서 다루지 않아요. 참고만 하세요.',
      note: '염색분체가 분리되어 양극으로 이동합니다. 분리된 순간부터는 각각이 딸세포의 염색체가 돼요.',
    },
    {
      id: 'mitosis-telophase',
      process: 'mitosis',
      labelKo: '말기·세포질분열',
      i18nKey: 'phase.mitosis.telophase',
      stage: 'division',
      ploidy: '2n',
      chromosomeCount: D,
      chromatidCount: D,
      dnaRelative: 2,
      perPole: null,
      separationEvent: null,
      bivalent: false,
      daughterCells: 2,
      note: '핵막이 다시 생기고 세포질이 나뉩니다. 모세포와 유전적으로 똑같은 딸세포(2n) 2개가 만들어져요.',
    },
  ];
  return withDuration(raw);
}

/**
 * 2배체 수로부터 감수분열 시기 배열을 생성한다. 기본 모델 2n=4 (D=4).
 */
export function buildMeiosisPhases(diploidNumber: number): PhaseFacts[] {
  const D = diploidNumber; // 2n
  const half = D / 2; // n
  const raw: RawPhase[] = [
    {
      id: 'meiosis-g1',
      process: 'meiosis',
      labelKo: 'G₁기',
      i18nKey: 'phase.meiosis.g1',
      stage: 'interphase',
      ploidy: '2n',
      chromosomeCount: D,
      chromatidCount: D,
      dnaRelative: 2,
      perPole: null,
      separationEvent: null,
      bivalent: false,
      daughterCells: null,
      note: '간기의 첫 시기예요. 세포가 자라면서 세포소기관과 단백질을 만듭니다. 염색체는 풀어져 있어 보이지 않아요.',
    },
    {
      id: 'meiosis-s',
      process: 'meiosis',
      labelKo: 'S기',
      i18nKey: 'phase.meiosis.s',
      stage: 'interphase',
      ploidy: '2n',
      chromosomeCount: D,
      chromatidCount: 2 * D,
      dnaRelative: 4,
      perPole: null,
      separationEvent: null,
      bivalent: false,
      daughterCells: null,
      dnaReplication: true,
      graphAnnotation: 'DNA 복제(상대량 2→4). 감수분열 전체에서 복제는 이 한 번뿐.',
      note: 'DNA가 복제됩니다. 감수분열 전체에서 복제는 이 한 번뿐이에요.',
    },
    {
      id: 'meiosis-g2',
      process: 'meiosis',
      labelKo: 'G₂기',
      i18nKey: 'phase.meiosis.g2',
      stage: 'interphase',
      ploidy: '2n',
      chromosomeCount: D,
      chromatidCount: 2 * D,
      dnaRelative: 4,
      perPole: null,
      separationEvent: null,
      bivalent: false,
      daughterCells: null,
      note: '분열을 준비합니다. 복제는 일어나지 않아요(복제는 S기에 이미 끝남).',
    },
    {
      id: 'meiosis-prophase1',
      process: 'meiosis',
      labelKo: '전기Ⅰ',
      i18nKey: 'phase.meiosis.prophase1',
      stage: 'division',
      ploidy: '2n',
      chromosomeCount: D,
      chromatidCount: 2 * D,
      dnaRelative: 4,
      perPole: null,
      separationEvent: null,
      bivalent: true,
      daughterCells: null,
      note: '상동염색체가 접합하여 2가 염색체(=4분 염색체) 형성.',
    },
    {
      id: 'meiosis-metaphase1',
      process: 'meiosis',
      labelKo: '중기Ⅰ',
      i18nKey: 'phase.meiosis.metaphase1',
      stage: 'division',
      ploidy: '2n',
      chromosomeCount: D,
      chromatidCount: 2 * D,
      dnaRelative: 4,
      perPole: null,
      separationEvent: null,
      bivalent: true,
      daughterCells: null,
      note: '2가 염색체가 세포 중앙에 무작위 방향으로 배열(독립적 분리, 2ⁿ 조합의 시작).',
    },
    {
      id: 'meiosis-anaphase1',
      process: 'meiosis',
      labelKo: '후기Ⅰ',
      i18nKey: 'phase.meiosis.anaphase1',
      stage: 'division',
      ploidy: '2n',
      chromosomeCount: D,
      chromatidCount: 2 * D,
      dnaRelative: 4,
      perPole: { chromosomeCount: half, chromatidCount: D },
      separationEvent: 'homolog', // ⚠️ 상동염색체 분리 (염색분체 아님, 오개념 M3)
      bivalent: false,
      daughterCells: null,
      note: '⚠️ 상동염색체가 분리되어 양극으로 이동(염색분체 분리 아님). 각 극은 n이 됨.',
    },
    {
      id: 'meiosis-telophase1',
      process: 'meiosis',
      labelKo: '말기Ⅰ (감수 1분열 완료)',
      i18nKey: 'phase.meiosis.telophase1',
      stage: 'division',
      ploidy: 'n', // ⚠️ 핵상 감소 시점 = 감수 1분열 완료 (오개념 M4)
      chromosomeCount: half,
      chromatidCount: D,
      dnaRelative: 2,
      perPole: null,
      separationEvent: null,
      bivalent: false,
      daughterCells: 2,
      note: '⚠️ 핵상이 2n→n으로 감소(M4 핵심 시점). 딸세포(n) 2개. 각 염색체는 아직 2개의 염색분체.',
    },
    {
      id: 'meiosis-prophase2',
      process: 'meiosis',
      labelKo: '전기Ⅱ',
      i18nKey: 'phase.meiosis.prophase2',
      stage: 'division',
      ploidy: 'n',
      chromosomeCount: half,
      chromatidCount: D,
      dnaRelative: 2,
      perPole: null,
      separationEvent: null,
      bivalent: false,
      daughterCells: null,
      // ⚠️ 개선안 #1: 감수 1·2분열 사이 복제 없음을 그래프에 명시 → 4→2→1을 "재복제"로 오해 방지
      graphAnnotation: '감수 1·2분열 사이: 간기 없이 진행 — DNA 복제 없음 (상대량 2 유지).',
      note: 'DNA 복제 없이 감수 2분열 시작(교과서: "간기 없이 진행"). 상대량 2 유지.',
    },
    {
      id: 'meiosis-metaphase2',
      process: 'meiosis',
      labelKo: '중기Ⅱ',
      i18nKey: 'phase.meiosis.metaphase2',
      stage: 'division',
      ploidy: 'n',
      chromosomeCount: half,
      chromatidCount: D,
      dnaRelative: 2,
      perPole: null,
      separationEvent: null,
      bivalent: false,
      daughterCells: null,
      note: '염색체가 낱개로 세포 중앙에 배열(체세포 중기와 핵상 n으로 구분, 오개념 M7).',
    },
    {
      id: 'meiosis-anaphase2',
      process: 'meiosis',
      labelKo: '후기Ⅱ',
      i18nKey: 'phase.meiosis.anaphase2',
      stage: 'division',
      ploidy: 'n',
      chromosomeCount: D, // 염색분체 분리 → 일시적으로 세포당 2배 (순간값 → transient)
      chromatidCount: D,
      dnaRelative: 2,
      perPole: { chromosomeCount: half, chromatidCount: half },
      separationEvent: 'chromatid', // 염색분체 분리 (체세포 후기와 동일 사건이나 핵상 n)
      bivalent: false,
      daughterCells: null,
      transientChromosomeCount: true,
      transientNotice:
        '후기Ⅱ도 아주 짧은 순간이라, 이 시기에 잠깐 나타나는 염색체 수 변화는 보통 시험·설명에서 다루지 않아요. 참고만 하세요.',
      note: '염색분체가 분리되어 양극 이동. 화면은 한 극당 값을 우선 표시.',
    },
    {
      id: 'meiosis-telophase2',
      process: 'meiosis',
      labelKo: '말기Ⅱ (감수 2분열 완료)',
      i18nKey: 'phase.meiosis.telophase2',
      stage: 'division',
      ploidy: 'n',
      chromosomeCount: half,
      chromatidCount: half,
      dnaRelative: 1,
      perPole: null,
      separationEvent: null,
      bivalent: false,
      daughterCells: 4,
      note: '염색체 수·DNA가 모세포의 절반인 딸세포(n) 4개 형성.',
    },
  ];
  return withDuration(raw);
}

/** 기본 모델: 2n = 4 */
export const DEFAULT_DIPLOID = 4;

/** ⚠️ 시기 개수 — PRD §7.2/§7.3 표 행 수 및 그래프 x축 카테고리 수와 일치해야 함 (개선안 #3) */
export const MITOSIS_PHASE_COUNT = 7;
export const MEIOSIS_PHASE_COUNT = 11;

export const mitosisPhases: PhaseFacts[] = buildMitosisPhases(DEFAULT_DIPLOID);
export const meiosisPhases: PhaseFacts[] = buildMeiosisPhases(DEFAULT_DIPLOID);

/** id로 시기 조회 */
export function getPhaseById(id: string): PhaseFacts | undefined {
  return [...mitosisPhases, ...meiosisPhases].find((p) => p.id === id);
}
