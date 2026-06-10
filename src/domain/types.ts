// ChromoLab 도메인 타입 — 세포분열 진리표의 단일 기준 타입
// 근거: ChromoLab_PRD.md §10.2(데이터 모델), §7.2/§7.3(진리표)

/** 핵상: 2배체(2n) 또는 반수체(n). 핵 1개(딸세포/한 극) 기준 */
export type Ploidy = '2n' | 'n';

/** 분열 종류 */
export type Process = 'mitosis' | 'meiosis';

/** 큰 시기 구분 */
export type StageKind = 'interphase' | 'division';

/** 이 시기에 분리되는 대상 (오개념 M2/M3/M4 핵심) */
export type SeparationTarget = 'homolog' | 'chromatid' | null;

/**
 * 한 시기(Phase)의 과학적 사실값.
 * ⚠️ 이 값들은 시뮬레이터·그래프·퀴즈 정답의 단일 기준원이다.
 *   카운트는 모두 "세포 전체" 기준이며, 후기처럼 양극이 갈라지는 시기는
 *   perPole(한 극 기준)을 별도로 제공한다.
 */
export interface PhaseFacts {
  /** 고유 id (예: 'mitosis-anaphase') */
  id: string;
  process: Process;
  /** 한국어 표준 시기명 (교과서 표기) */
  labelKo: string;
  /** i18n 키 */
  i18nKey: string;
  stage: StageKind;
  /** 핵 1개(딸세포/한 극) 기준 핵상 */
  ploidy: Ploidy;
  /** 세포 전체 기준 염색체 수 */
  chromosomeCount: number;
  /** 세포 전체 기준 염색분체 수 */
  chromatidCount: number;
  /** 핵 1개당 DNA 상대량 (교과서 표기: 1·2·4) */
  dnaRelative: number;
  /** 양극이 갈라지는 시기의 한 극 기준 값 (없으면 null) */
  perPole: { chromosomeCount: number; chromatidCount: number } | null;
  /**
   * 후기처럼 동원체 분리 직후의 "세포 전체 염색체 수"는 순간적이라 시험에 잘 다뤄지지 않는다.
   * true면 퀴즈 대상에서 제외하고, 화면은 perPole(한 극 기준)을 1차로 표시한다. (개선안: 후기 8개 비강조)
   */
  transientChromosomeCount?: boolean;
  /**
   * 후기 등 순간적 시기에 화면에 띄우는 "참고용" 안내 표지.
   * 예: "후기는 짧은 순간이라 이때의 순간적 염색체 수·핵상 변화는 거의 다루지 않습니다."
   * 학생이 순간값(예: 세포 전체 염색체 8개)을 시험 대상으로 오해하지 않도록 함.
   */
  transientNotice?: string;
  /** 이 시기에 일어나는 분리 사건 (없으면 null) */
  separationEvent: SeparationTarget;
  /** 2가 염색체(=4분 염색체) 존재 여부 */
  bivalent: boolean;
  /** 이 시기 종료 시 형성된 딸세포 수 (해당 없으면 null) */
  daughterCells: number | null;
  /**
   * 자동재생 시 이 시기에 머무는 기본 시간(ms). 학습 우선순위에 따라 가중.
   * 0.5~2배속은 전체에 배율로 적용한다. (개선안 #2)
   */
  durationMs: number;
  /** S기 등 DNA 복제가 일어나는 시기 → 그래프 수직선 "복제 시점" 표시 */
  dnaReplication?: boolean;
  /**
   * 그래프 주석 문구. 예: 감수 1·2분열 사이 "간기 없이 진행 — DNA 복제 없음".
   * 학생이 DNA 상대량 4→2→1을 보고 "또 복제됐다"고 오해하는 것을 방지. (개선안 #1)
   */
  graphAnnotation?: string;
  /** 교과/오개념 관련 비고 */
  note?: string;
}

/** DNA 상대량(1·2·4)을 C값 표기(C·2C·4C)로 변환 — 보조 토글용 (§7.1) */
export function toCValue(dnaRelative: number): string {
  return dnaRelative === 1 ? 'C' : `${dnaRelative}C`;
}
