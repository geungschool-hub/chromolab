// ChromoLab 오개념 사전 — 흔한 오개념 M1~M7과 방지/교정 피드백
// 근거: ChromoLab_PRD.md §7.4 오개념 사전 & UI/UX 방지 설계
//
// F5 즉시 교정 피드백은 이 사전을 참조해 비난 없는 어조의 교정 문구를 출력한다.

export interface Misconception {
  id: string;
  /** 학생이 흔히 갖는 오해 */
  wrongBelief: string;
  /** 과학적으로 올바른 사실 */
  correct: string;
  /** 오답 배치 시 즉시 피드백 문구 (F5) */
  feedback: string;
  /** UI/UX 방지 설계 메모 */
  uiStrategy: string;
}

export const misconceptions = {
  M1: {
    id: 'M1',
    wrongBelief: '염색분체와 상동염색체를 같은 것으로 생각한다.',
    correct:
      '자매염색분체는 복제로 생긴 동일한 가닥, 상동염색체는 부·모에게서 온 한 쌍의 염색체다.',
    feedback:
      '자매염색분체는 같은 색·패턴, 상동염색체는 명도가 다른 한 쌍입니다. 둘을 구분해 보세요.',
    uiStrategy: '자매염색분체=동일 색/패턴, 상동염색체=동계열 다른 명도 + 부/모 라벨.',
  },
  M2: {
    id: 'M2',
    wrongBelief: '후기에 분리된 뒤에도 계속 "염색분체"라고 부른다.',
    correct: '염색분체가 분리되는 순간부터 각각이 딸세포의 염색체가 된다.',
    feedback: '분리된 순간부터는 "염색체"입니다. 카운터의 염색체 수가 늘어난 것을 확인해 보세요.',
    uiStrategy: '분리 애니메이션과 동시에 라벨을 "염색분체→염색체"로 전환, 카운터 갱신.',
  },
  M3: {
    id: 'M3',
    wrongBelief: '감수 1분열 중기 배열이 체세포분열 중기와 같다고 생각한다.',
    correct: '중기Ⅰ은 상동염색체 쌍(2가 염색체)이, 체세포 중기는 낱개 염색체가 배열된다.',
    feedback: '감수 1분열 중기에서는 상동염색체가 쌍을 이뤄(2가 염색체) 정렬됩니다.',
    uiStrategy: '중기Ⅰ은 2가 염색체를 2줄로, 체세포 중기는 낱개를 1줄로 배열.',
  },
  M4: {
    id: 'M4',
    wrongBelief: '핵상 감소(2n→n)가 감수 2분열에서 일어난다고 생각한다.',
    correct: '핵상은 상동염색체가 분리되는 감수 1분열에서 2n→n으로 감소한다.',
    feedback: '핵상은 감수 1분열이 끝날 때 이미 n이 됩니다. 감수 2분열에서는 변하지 않아요.',
    uiStrategy: '핵상 인디케이터가 감수 1분열 완료(말기Ⅰ) 시점에 색 전환 + 펄스.',
  },
  M5: {
    id: 'M5',
    wrongBelief: '간기는 세포가 쉬는 휴지기라고 생각한다.',
    correct: '간기는 DNA 복제와 소기관 증가가 일어나는 가장 바쁜 시기다.',
    feedback: '간기는 쉬는 시기가 아닙니다. S기에 DNA가 복제되는 것을 확인해 보세요.',
    uiStrategy: 'S기 DNA 복제 애니메이션을 필수 재생 + "간기는 가장 바쁜 시기" 캡션.',
  },
  M6: {
    id: 'M6',
    wrongBelief: '염색체 수와 염색분체 수가 항상 같다고 생각한다.',
    correct: '복제 후에는 염색체 수는 그대로지만 염색분체 수가 2배가 된다.',
    feedback: '복제 후에는 염색체 4개, 염색분체 8개처럼 수가 달라집니다.',
    uiStrategy: '그래프에 염색체 수·염색분체 수를 항상 분리 카운터로 표기.',
  },
  M7: {
    id: 'M7',
    wrongBelief: '감수 2분열이 체세포분열과 완전히 같다고 생각한다.',
    correct: '분리 사건(염색분체)은 같지만, 감수 2분열은 핵상이 n이고 시작 염색체 수가 절반이다.',
    feedback: '분리되는 대상은 같지만 핵상이 다릅니다. 감수 2분열은 n, 체세포분열은 2n이에요.',
    uiStrategy: '비교 모드에서 핵상(2n/n)을 배경색으로 구분, 시작 염색체 수 차이 강조.',
  },
} satisfies Record<string, Misconception>;

/** 오개념 식별자 (M1~M7) */
export type MisconceptionId = keyof typeof misconceptions;

export function getMisconception(id: MisconceptionId): Misconception {
  return misconceptions[id]; // satisfies로 키가 보장되어 undefined 가능성 없음
}
