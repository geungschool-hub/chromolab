// 유전 모델 — 두 개체의 생식세포가 무작위로 수정되어 '자손'의 유전적 다양성이 커지는 과정.
// 근거: 2022개정 '생명과학' [12생과03-02]. 유전적 다양성 증가 요인:
//   ① 감수분열 시 상동염색체의 독립적 분리 → 한 개체가 만드는 생식세포가 2ⁿ종류 (← 기존 '생식세포 다양성' 탭)
//   ② 수정 시 암수 생식세포의 무작위 결합 → 자손은 (난자 종류)×(정자 종류)가지 조합 (← 이 모듈)
// 교차(crossing over)는 일반선택 본문 밖 → 모델 미반영(요약에서 '더 커진다'로만 언급).
//
// 모델 단순화: 독립적으로 분리되는 유전자 쌍 2개(A/a, B/b)만 사용(2n=4 모델과 정합).

export type AlleleA = 'A' | 'a';
export type AlleleB = 'B' | 'b';

/** 한 쌍의 유전자형(우성 먼저 표기) */
export type PairA = 'AA' | 'Aa' | 'aa';
export type PairB = 'BB' | 'Bb' | 'bb';

/** 한 개체의 유전자형 (예: AaBb) */
export interface Genotype {
  A: PairA;
  B: PairB;
}

/** 생식세포(반수체 n=2): 각 쌍에서 대립유전자 하나씩 */
export interface Gamete {
  A: AlleleA;
  B: AlleleB;
}

export const PAIR_A_OPTIONS: PairA[] = ['AA', 'Aa', 'aa'];
export const PAIR_B_OPTIONS: PairB[] = ['BB', 'Bb', 'bb'];

/** 쌍 문자열의 두 대립유전자 (예: 'Aa' → ['A','a']) */
function pairAlleles(pair: string): [string, string] {
  return [pair[0]!, pair[1]!];
}

/** 쌍 문자열의 '서로 다른' 대립유전자 (예: 'AA' → ['A'], 'Aa' → ['A','a']) */
function distinctAlleles(pair: string): string[] {
  return [...new Set(pairAlleles(pair))];
}

/** 생식세포 라벨 (예: {A:'A',B:'b'} → 'Ab') */
export function gameteLabel(g: Gamete): string {
  return `${g.A}${g.B}`;
}

/** 유전자형 라벨 (예: {A:'Aa',B:'Bb'} → 'AaBb') */
export function genotypeLabel(g: Genotype): string {
  return `${g.A}${g.B}`;
}

/**
 * 유전자형이 만들 수 있는 '서로 다른' 생식세포 종류.
 * 이형접합 쌍 수 k에 대해 2^k 종류 (여기서 k는 0~2).
 */
export function distinctGametes(g: Genotype): Gamete[] {
  const as = distinctAlleles(g.A) as AlleleA[];
  const bs = distinctAlleles(g.B) as AlleleB[];
  const out: Gamete[] = [];
  for (const a of as) for (const b of bs) out.push({ A: a, B: b });
  return out;
}

/**
 * 무작위 생식세포 1개 — 각 쌍에서 두 대립유전자 중 하나를 50:50으로 고른다(올바른 빈도).
 * rng는 테스트 주입용(기본 Math.random).
 */
export function randomGamete(g: Genotype, rng: () => number = Math.random): Gamete {
  const a = pairAlleles(g.A)[rng() < 0.5 ? 0 : 1] as AlleleA;
  const b = pairAlleles(g.B)[rng() < 0.5 ? 0 : 1] as AlleleB;
  return { A: a, B: b };
}

function canonA(x: AlleleA, y: AlleleA): PairA {
  const hasDom = x === 'A' || y === 'A';
  const hasRec = x === 'a' || y === 'a';
  if (hasDom && hasRec) return 'Aa';
  return hasDom ? 'AA' : 'aa';
}

function canonB(x: AlleleB, y: AlleleB): PairB {
  const hasDom = x === 'B' || y === 'B';
  const hasRec = x === 'b' || y === 'b';
  if (hasDom && hasRec) return 'Bb';
  return hasDom ? 'BB' : 'bb';
}

/** 난자 + 정자 → 수정란(자손) 유전자형. 우성 먼저로 정규화. */
export function combine(egg: Gamete, sperm: Gamete): Genotype {
  return { A: canonA(egg.A, sperm.A), B: canonB(egg.B, sperm.B) };
}

export interface DiversityStats {
  /** 어머니가 만드는 생식세포 종류 수 (2^이형접합쌍수) */
  momGameteTypes: number;
  /** 아버지가 만드는 생식세포 종류 수 */
  dadGameteTypes: number;
  /** 무작위 수정으로 가능한 (난자×정자) 조합 수 */
  fertilizationCombos: number;
  /** 그중 서로 다른 자손 유전자형 수 */
  distinctGenotypes: number;
  /** 서로 다른 자손 유전자형 라벨(정렬) */
  genotypeList: string[];
}

/** 두 개체의 수정으로 생기는 자손 다양성 통계 */
export function diversityStats(mom: Genotype, dad: Genotype): DiversityStats {
  const eggs = distinctGametes(mom);
  const sperms = distinctGametes(dad);
  const labels = new Set<string>();
  for (const e of eggs) for (const s of sperms) labels.add(genotypeLabel(combine(e, s)));
  return {
    momGameteTypes: eggs.length,
    dadGameteTypes: sperms.length,
    fertilizationCombos: eggs.length * sperms.length,
    distinctGenotypes: labels.size,
    genotypeList: [...labels].sort(),
  };
}

export interface GenotypeRatio {
  /** 자손 유전자형 (예: 'AaBb') */
  label: string;
  /** 퍼넷 격자에서 이 유전자형이 나오는 칸 수 */
  count: number;
  /** 전체 칸 수(=난자 종류 × 정자 종류). 모든 칸은 동일 확률. */
  total: number;
}

/**
 * 자손 유전자형의 '이론적' 비율.
 * 이형접합 쌍은 두 대립유전자가 50:50이라 '서로 다른 생식세포'들이 모두 같은 확률 →
 * 격자의 각 칸도 동일 확률(1/total). 따라서 비율 = (그 유전자형 칸 수)/total.
 * 칸 수 내림차순, 동률은 라벨 오름차순으로 정렬.
 */
export function genotypeRatios(mom: Genotype, dad: Genotype): GenotypeRatio[] {
  const eggs = distinctGametes(mom);
  const sperms = distinctGametes(dad);
  const map = new Map<string, number>();
  for (const e of eggs)
    for (const s of sperms) {
      const label = genotypeLabel(combine(e, s));
      map.set(label, (map.get(label) ?? 0) + 1);
    }
  const total = eggs.length * sperms.length;
  return [...map.entries()]
    .map(([label, count]) => ({ label, count, total }))
    .sort((a, b) => b.count - a.count || (a.label < b.label ? -1 : 1));
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** 정수 배열을 최대공약수로 나눠 가장 간단한 정수비로. 예: [4,2,2,1] → [4,2,2,1] */
export function simplestRatio(counts: number[]): number[] {
  if (counts.length === 0) return [];
  const g = counts.reduce((acc, n) => gcd(acc, n));
  return g > 1 ? counts.map((n) => n / g) : counts.slice();
}
