// 개념 퀴즈(생식세포 다양성·수정과 자손) — '염색체의 이동'(독립적 분리·수정 결합) 중심.
// 근거: [12생과03-02], genetics.ts. 과학 정확성: 교차는 정답/주요 보기에서 배제(오답 보기로만),
//       핵상 4n 미표기, 동원체 카운팅 없음.

import { distinctGametes, type Genotype } from '../fertilization/genetics';

export interface ConceptQuestion {
  topic: '생식세포 다양성' | '수정과 자손';
  prompt: string;
  options: string[];
  answer: string;
  explain: string;
}

type Gen = (rng: () => number) => ConceptQuestion;

const pick = <T>(arr: readonly T[], rng: () => number): T => arr[Math.floor(rng() * arr.length)]!;

// ── C. 생식세포 다양성 ───────────────────────────────────────────
const GENOS: { g: Genotype; label: string }[] = [
  { g: { A: 'Aa', B: 'Bb' }, label: 'AaBb' },
  { g: { A: 'Aa', B: 'BB' }, label: 'AaBB' },
  { g: { A: 'AA', B: 'Bb' }, label: 'AABb' },
  { g: { A: 'Aa', B: 'bb' }, label: 'Aabb' },
  { g: { A: 'aa', B: 'Bb' }, label: 'aaBb' },
  { g: { A: 'AA', B: 'BB' }, label: 'AABB' },
];

const c1: Gen = (rng) => {
  const { g, label } = pick(GENOS, rng);
  const count = distinctGametes(g).length; // 1 · 2 · 4
  const het = Math.round(Math.log2(count));
  return {
    topic: '생식세포 다양성',
    prompt: `유전자형이 ${label}인 개체는 생식세포를 몇 종류 만들 수 있을까요? (중기Ⅰ에서 상동염색체가 무작위로 배열·분리)`,
    options: ['1', '2', '4'],
    answer: String(count),
    explain:
      het === 0
        ? '두 쌍 모두 동형접합이라 생식세포는 1종류뿐이에요.'
        : `이형접합인 쌍이 ${het}개이므로 2^${het} = ${count}종류예요. (동형접합 쌍은 한 종류만)`,
  };
};

const c2: Gen = (rng) => {
  const n = pick([2, 3, 4] as const, rng);
  const ans = 2 ** n;
  return {
    topic: '생식세포 다양성',
    prompt: `상동염색체가 ${n}쌍인 생물은 생식세포를 최대 몇 종류 만들까요? (각 쌍이 독립적으로 분리)`,
    options: [2 ** (n - 1), ans, 2 ** (n + 1)].map(String),
    answer: String(ans),
    explain: `각 상동염색체 쌍이 독립적으로 양극에 배열되므로 2^${n} = ${ans}가지예요.`,
  };
};

const c3: Gen = () => ({
  topic: '생식세포 다양성',
  prompt: '한 개체가 여러 종류의 생식세포를 만드는 가장 큰 이유는?',
  options: ['상동염색체의 독립적(무작위) 분리', 'DNA 복제', '세포질분열'],
  answer: '상동염색체의 독립적(무작위) 분리',
  explain:
    '중기Ⅰ에서 상동염색체 쌍이 무작위 방향으로 배열되어 분리(이동)되기 때문이에요. n쌍이면 2ⁿ종류가 생겨요.',
});

// ── D. 수정과 자손 다양성 ────────────────────────────────────────
const D1_CASES = [
  { x: 2, y: 2, opts: [2, 4, 8] }, // 답 4
  { x: 2, y: 4, opts: [6, 8, 16] }, // 답 8
  { x: 4, y: 4, opts: [8, 16, 32] }, // 답 16
] as const;

const d1: Gen = (rng) => {
  const c = pick(D1_CASES, rng);
  const ans = c.x * c.y;
  return {
    topic: '수정과 자손',
    prompt: `어머니가 ${c.x}종류의 난자를, 아버지가 ${c.y}종류의 정자를 만들어요. 무작위로 수정될 때 (난자×정자) 조합은 몇 가지일까요?`,
    options: c.opts.map(String),
    answer: String(ans),
    explain: `${c.x} × ${c.y} = ${ans}가지. 어떤 난자와 어떤 정자가 만날지는 우연이라 종류 수를 곱해요.`,
  };
};

const d2: Gen = () => ({
  topic: '수정과 자손',
  prompt: '난자(n)와 정자(n)가 수정되면 수정란의 핵상은 어떻게 될까요?',
  options: ['n + n → n', 'n + n → 2n', '2n + 2n → 2n'],
  answer: 'n + n → 2n',
  explain: '생식세포(n)와 생식세포(n)가 합쳐져 체세포와 같은 2n이 회복돼요.',
});

const d3: Gen = () => ({
  topic: '수정과 자손',
  prompt: '자손의 유전적 다양성이 커지는 주된 두 가지 원인으로 옳은 것은?',
  options: [
    '감수분열의 독립적 분리 + 무작위 수정',
    'DNA 복제 + 세포질분열',
    '체세포분열 + 핵막 소실',
  ],
  answer: '감수분열의 독립적 분리 + 무작위 수정',
  explain:
    '① 감수분열에서 상동염색체가 독립적으로 분리되고(2ⁿ 생식세포), ② 암수 생식세포가 무작위로 수정되기 때문이에요.',
});

const d4: Gen = () => ({
  topic: '수정과 자손',
  prompt:
    '사람은 한 사람이 약 840만(2²³) 종류의 생식세포를 만들 수 있어요. 이 숫자가 나오는 원리는?',
  options: ['상동염색체 23쌍의 독립적 분리', 'DNA가 23번 복제됨', '염색체가 23번 교차됨'],
  answer: '상동염색체 23쌍의 독립적 분리',
  explain: '23쌍이 각각 독립적으로 분리되므로 2²³ ≈ 840만 가지예요.',
});

const TEMPLATES: Gen[] = [c1, c2, c3, d1, d2, d3, d4];

/** 개념 문항 1개를 무작위로 생성. avoidPrompt가 주어지면 직전 문항과 같은 문제를 피한다. */
export function pickConceptQuestion(
  rng: () => number = Math.random,
  avoidPrompt?: string,
): ConceptQuestion {
  let q = pick(TEMPLATES, rng)(rng);
  for (let i = 0; i < 20 && avoidPrompt && q.prompt === avoidPrompt; i++) {
    q = pick(TEMPLATES, rng)(rng);
  }
  return q;
}
