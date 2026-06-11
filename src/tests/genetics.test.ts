// 유전 모델 검증 — 생식세포 종류·무작위 수정·자손 유전자형·다양성 통계.
// 근거: [12생과03-02] 유전적 다양성. 정답지(독립적 분리) 경우와 일관.

import { describe, it, expect } from 'vitest';
import {
  distinctGametes,
  gameteLabel,
  combine,
  genotypeLabel,
  randomGamete,
  diversityStats,
  genotypeRatios,
  simplestRatio,
  type Genotype,
} from '../features/fertilization/genetics';

const AaBb: Genotype = { A: 'Aa', B: 'Bb' };

describe('생식세포 종류 (독립적 분리)', () => {
  it('AaBb는 4종류(AB·Ab·aB·ab)를 만든다 — 2²=4', () => {
    const labels = distinctGametes(AaBb).map(gameteLabel).sort();
    expect(labels).toEqual(['AB', 'Ab', 'aB', 'ab']);
  });

  it('AABB는 1종류만(AB)', () => {
    const labels = distinctGametes({ A: 'AA', B: 'BB' }).map(gameteLabel);
    expect(labels).toEqual(['AB']);
  });

  it('Aabb는 2종류(Ab·ab) — 이형접합 쌍 1개', () => {
    const labels = distinctGametes({ A: 'Aa', B: 'bb' }).map(gameteLabel).sort();
    expect(labels).toEqual(['Ab', 'ab']);
  });
});

describe('수정(combine) — 우성 먼저 정규화', () => {
  it('난자 ab + 정자 AB → AaBb', () => {
    expect(genotypeLabel(combine({ A: 'a', B: 'b' }, { A: 'A', B: 'B' }))).toBe('AaBb');
  });
  it('난자 AB + 정자 AB → AABB', () => {
    expect(genotypeLabel(combine({ A: 'A', B: 'B' }, { A: 'A', B: 'B' }))).toBe('AABB');
  });
  it('난자 ab + 정자 ab → aabb', () => {
    expect(genotypeLabel(combine({ A: 'a', B: 'b' }, { A: 'a', B: 'b' }))).toBe('aabb');
  });
});

describe('자손 다양성 통계', () => {
  it('AaBb × AaBb → 수정 조합 16, 서로 다른 유전자형 9', () => {
    const s = diversityStats(AaBb, AaBb);
    expect(s.momGameteTypes).toBe(4);
    expect(s.dadGameteTypes).toBe(4);
    expect(s.fertilizationCombos).toBe(16);
    expect(s.distinctGenotypes).toBe(9);
  });

  it('AABB × aabb → 조합 1, 자손은 모두 AaBb 1종류', () => {
    const s = diversityStats({ A: 'AA', B: 'BB' }, { A: 'aa', B: 'bb' });
    expect(s.fertilizationCombos).toBe(1);
    expect(s.distinctGenotypes).toBe(1);
    expect(s.genotypeList).toEqual(['AaBb']);
  });

  it('Aabb × aaBb → 조합 4, 자손 유전자형 4종', () => {
    const s = diversityStats({ A: 'Aa', B: 'bb' }, { A: 'aa', B: 'Bb' });
    expect(s.fertilizationCombos).toBe(4);
    expect(s.distinctGenotypes).toBe(4);
    expect(s.genotypeList).toEqual(['AaBb', 'Aabb', 'aaBb', 'aabb']);
  });
});

describe('자손 유전자형 이론 비율', () => {
  it('AaBb × AaBb → 9종, AaBb가 4/16로 최다 · 합 16', () => {
    const r = genotypeRatios({ A: 'Aa', B: 'Bb' }, { A: 'Aa', B: 'Bb' });
    expect(r).toHaveLength(9);
    expect(r[0]).toEqual({ label: 'AaBb', count: 4, total: 16 });
    expect(r.reduce((s, x) => s + x.count, 0)).toBe(16);
    // 양 끝 동형접합은 각각 1/16
    expect(r.find((x) => x.label === 'AABB')!.count).toBe(1);
    expect(r.find((x) => x.label === 'aabb')!.count).toBe(1);
  });

  it('Aa × Aa(B쌍 동형) → Aa:AA:aa = 2:1:1 (전체 합 4)', () => {
    const r = genotypeRatios({ A: 'Aa', B: 'BB' }, { A: 'Aa', B: 'BB' });
    const byLabel = Object.fromEntries(r.map((x) => [x.label, x.count]));
    expect(byLabel['AaBB']).toBe(2);
    expect(byLabel['AABB']).toBe(1);
    expect(byLabel['aaBB']).toBe(1);
  });

  it('simplestRatio: [4,2,2,2,2,1,1,1,1] 그대로, [4,2,2] → [2,1,1]', () => {
    expect(simplestRatio([4, 2, 2, 2, 2, 1, 1, 1, 1])).toEqual([4, 2, 2, 2, 2, 1, 1, 1, 1]);
    expect(simplestRatio([4, 2, 2])).toEqual([2, 1, 1]);
    expect(simplestRatio([6, 3, 9])).toEqual([2, 1, 3]);
  });
});

describe('randomGamete — 주입한 rng로 결정적', () => {
  it('rng<0.5는 첫 대립유전자, ≥0.5는 둘째', () => {
    // 'Aa' → [A,a], 'Bb' → [B,b]
    expect(gameteLabel(randomGamete(AaBb, () => 0.1))).toBe('AB');
    expect(gameteLabel(randomGamete(AaBb, () => 0.9))).toBe('ab');
  });

  it('동형접합은 rng와 무관하게 같은 대립유전자', () => {
    expect(gameteLabel(randomGamete({ A: 'AA', B: 'bb' }, () => 0.9))).toBe('Ab');
  });
});
