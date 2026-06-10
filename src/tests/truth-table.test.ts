// ⚠️ 진리표 자동 검증 — PRD §7.2/§7.3 표와 코드(domain/phases.ts)의 일치를 보장한다.
// 이 테스트가 깨지면 과학적 사실값이 바뀐 것이므로 PRD §13.1 프로세스를 따른다.

import { describe, it, expect } from 'vitest';
import {
  buildMitosisPhases,
  buildMeiosisPhases,
  mitosisPhases,
  meiosisPhases,
  MITOSIS_PHASE_COUNT,
  MEIOSIS_PHASE_COUNT,
} from '../domain/phases';
import { toCValue } from '../domain/types';

const find = (phases: typeof mitosisPhases, id: string) => {
  const p = phases.find((x) => x.id === id);
  if (!p) throw new Error(`phase not found: ${id}`);
  return p;
};

describe('체세포분열 진리표 (2n=4) — PRD §7.2', () => {
  // [시기, 핵상, 염색체수, 염색분체수, DNA상대량]
  const expected: Array<[string, string, number, number, number]> = [
    ['mitosis-g1', '2n', 4, 4, 2],
    ['mitosis-s', '2n', 4, 8, 4],
    ['mitosis-g2', '2n', 4, 8, 4],
    ['mitosis-prophase', '2n', 4, 8, 4],
    ['mitosis-metaphase', '2n', 4, 8, 4],
    ['mitosis-telophase', '2n', 4, 4, 2], // 딸세포 기준
  ];

  it.each(expected)(
    '%s → 핵상 %s, 염색체 %i, 염색분체 %i, DNA %i',
    (id, ploidy, chr, chromatid, dna) => {
      const p = find(mitosisPhases, id);
      expect(p.ploidy).toBe(ploidy);
      expect(p.chromosomeCount).toBe(chr);
      expect(p.chromatidCount).toBe(chromatid);
      expect(p.dnaRelative).toBe(dna);
    },
  );

  it('후기: 세포 전체 8/8, 한 극 4/4, DNA 4, 분리 대상=염색분체 (M2)', () => {
    const p = find(mitosisPhases, 'mitosis-anaphase');
    expect(p.chromosomeCount).toBe(8); // 분리 후 각 염색분체를 염색체로 셈
    expect(p.chromatidCount).toBe(8);
    expect(p.dnaRelative).toBe(4);
    expect(p.perPole).toEqual({ chromosomeCount: 4, chromatidCount: 4 });
    expect(p.separationEvent).toBe('chromatid');
  });

  it('말기에 딸세포 2개 형성', () => {
    expect(find(mitosisPhases, 'mitosis-telophase').daughterCells).toBe(2);
  });
});

describe('감수분열 진리표 (2n=4) — PRD §7.3', () => {
  const expected: Array<[string, string, number, number, number]> = [
    ['meiosis-s', '2n', 4, 8, 4],
    ['meiosis-g2', '2n', 4, 8, 4],
    ['meiosis-prophase1', '2n', 4, 8, 4],
    ['meiosis-metaphase1', '2n', 4, 8, 4],
    ['meiosis-telophase1', 'n', 2, 4, 2], // 감수 1분열 후 딸세포
    ['meiosis-metaphase2', 'n', 2, 4, 2],
    ['meiosis-telophase2', 'n', 2, 2, 1], // 감수 2분열 후 딸세포
  ];

  it.each(expected)(
    '%s → 핵상 %s, 염색체 %i, 염색분체 %i, DNA %i',
    (id, ploidy, chr, chromatid, dna) => {
      const p = find(meiosisPhases, id);
      expect(p.ploidy).toBe(ploidy);
      expect(p.chromosomeCount).toBe(chr);
      expect(p.chromatidCount).toBe(chromatid);
      expect(p.dnaRelative).toBe(dna);
    },
  );

  it('후기Ⅰ 분리 대상 = 상동염색체 (M3), 염색분체 아님', () => {
    expect(find(meiosisPhases, 'meiosis-anaphase1').separationEvent).toBe('homolog');
  });

  it('후기Ⅱ 분리 대상 = 염색분체', () => {
    expect(find(meiosisPhases, 'meiosis-anaphase2').separationEvent).toBe('chromatid');
  });

  it('핵상 감소(2n→n)는 감수 1분열 완료(말기Ⅰ) 시점 — M4', () => {
    expect(find(meiosisPhases, 'meiosis-metaphase1').ploidy).toBe('2n');
    expect(find(meiosisPhases, 'meiosis-telophase1').ploidy).toBe('n');
  });

  it('2가 염색체는 전기Ⅰ·중기Ⅰ에만 존재', () => {
    expect(find(meiosisPhases, 'meiosis-prophase1').bivalent).toBe(true);
    expect(find(meiosisPhases, 'meiosis-metaphase1').bivalent).toBe(true);
    expect(find(meiosisPhases, 'meiosis-anaphase1').bivalent).toBe(false);
  });

  it('감수분열 결과 딸세포 4개', () => {
    expect(find(meiosisPhases, 'meiosis-telophase2').daughterCells).toBe(4);
  });
});

describe('불변식 — 모델 무관 성질', () => {
  it('DNA 복제는 간기 S기에서 한 번만 (상대량 2→4)', () => {
    expect(find(mitosisPhases, 'mitosis-g1').dnaRelative).toBe(2);
    expect(find(mitosisPhases, 'mitosis-s').dnaRelative).toBe(4);
  });

  it('염색체 수 ≠ 염색분체 수 (복제 후) — M6', () => {
    const s = find(mitosisPhases, 'mitosis-s');
    expect(s.chromosomeCount).not.toBe(s.chromatidCount);
  });

  it('2n=6 모델도 진리표 규칙을 만족', () => {
    const m = buildMitosisPhases(6);
    const g1 = m.find((p) => p.id === 'mitosis-g1')!;
    const s = m.find((p) => p.id === 'mitosis-s')!;
    expect(g1.chromosomeCount).toBe(6);
    expect(g1.chromatidCount).toBe(6);
    expect(s.chromatidCount).toBe(12);

    const mei = buildMeiosisPhases(6);
    const tel2 = mei.find((p) => p.id === 'meiosis-telophase2')!;
    expect(tel2.chromosomeCount).toBe(3); // n=3
    expect(tel2.ploidy).toBe('n');
  });

  it('C값 변환: 1→C, 2→2C, 4→4C', () => {
    expect(toCValue(1)).toBe('C');
    expect(toCValue(2)).toBe('2C');
    expect(toCValue(4)).toBe('4C');
  });
});

// 개선안 #3 — 시기 개수 == PRD 표 행 수 == 그래프 x축 카테고리 수 (1:1 고정)
describe('시기 개수 정합성 — 개선안 #3', () => {
  it('체세포분열 phases 길이 = MITOSIS_PHASE_COUNT(7)', () => {
    expect(mitosisPhases.length).toBe(MITOSIS_PHASE_COUNT);
    expect(MITOSIS_PHASE_COUNT).toBe(7);
  });
  it('감수분열 phases 길이 = MEIOSIS_PHASE_COUNT(11)', () => {
    expect(meiosisPhases.length).toBe(MEIOSIS_PHASE_COUNT);
    expect(MEIOSIS_PHASE_COUNT).toBe(11);
  });
  it('모든 시기 id는 고유하다 (그래프 x축 키 충돌 방지)', () => {
    const ids = [...mitosisPhases, ...meiosisPhases].map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// 개선안 #2 — 시기별 재생시간 가중 (S기·중기가 가장 김)
describe('재생시간 가중 — 개선안 #2', () => {
  it('모든 시기에 양수 durationMs가 있다', () => {
    [...mitosisPhases, ...meiosisPhases].forEach((p) => {
      expect(p.durationMs).toBeGreaterThan(0);
    });
  });
  it('S기가 전기보다 길다 (DNA 복제 강조)', () => {
    const s = mitosisPhases.find((p) => p.id === 'mitosis-s')!;
    const prophase = mitosisPhases.find((p) => p.id === 'mitosis-prophase')!;
    expect(s.durationMs).toBeGreaterThan(prophase.durationMs);
  });
});

// 개선안 #1 — 감수 1·2분열 사이 DNA 복제 없음 (4→2 유지→1, 재복제 아님)
describe('감수분열 DNA 상대량 경로 — 개선안 #1', () => {
  it('DNA 상대량은 한 번 감소하면 다시 증가하지 않는다(복제 1회뿐)', () => {
    // 감수분열 진행 순서대로 dnaRelative가 단조 비증가(2→4 복제 제외 후)
    const afterReplication = meiosisPhases
      .slice(meiosisPhases.findIndex((p) => p.id === 'meiosis-s'))
      .map((p) => p.dnaRelative);
    for (let i = 1; i < afterReplication.length; i++) {
      expect(afterReplication[i]!).toBeLessThanOrEqual(afterReplication[i - 1]!);
    }
  });
  it('감수 1분열 후~중기Ⅱ까지 DNA 상대량 2 유지 (사이 복제 없음)', () => {
    const ids = ['meiosis-telophase1', 'meiosis-prophase2', 'meiosis-metaphase2'];
    ids.forEach((id) => {
      expect(meiosisPhases.find((p) => p.id === id)!.dnaRelative).toBe(2);
    });
  });
  it('전기Ⅱ에 "복제 없음" 그래프 주석이 있다', () => {
    const p2 = meiosisPhases.find((p) => p.id === 'meiosis-prophase2')!;
    expect(p2.graphAnnotation).toMatch(/복제 없음/);
  });
  it('DNA 복제 시기는 S기 단 한 곳뿐', () => {
    const reps = meiosisPhases.filter((p) => p.dnaReplication);
    expect(reps).toHaveLength(1);
    expect(reps[0]!.id).toBe('meiosis-s');
  });
});

// 후기 8개 비강조 — transient 플래그
describe('후기 세포 전체 염색체 수는 transient(퀴즈 제외)', () => {
  it('체세포 후기·감수 후기Ⅱ는 transientChromosomeCount=true', () => {
    expect(mitosisPhases.find((p) => p.id === 'mitosis-anaphase')!.transientChromosomeCount).toBe(
      true,
    );
    expect(meiosisPhases.find((p) => p.id === 'meiosis-anaphase2')!.transientChromosomeCount).toBe(
      true,
    );
  });
  it('transient 시기는 perPole(한 극 기준) 값을 갖는다', () => {
    const a = mitosisPhases.find((p) => p.id === 'mitosis-anaphase')!;
    expect(a.perPole).not.toBeNull();
    expect(a.perPole!.chromosomeCount).toBe(4);
  });
  it('transient 시기에는 "참고" 안내 표지(transientNotice)가 있다', () => {
    expect(mitosisPhases.find((p) => p.id === 'mitosis-anaphase')!.transientNotice).toMatch(/참고/);
    expect(meiosisPhases.find((p) => p.id === 'meiosis-anaphase2')!.transientNotice).toMatch(
      /참고/,
    );
  });
  it('후기 핵상은 4n이 아니라 표준 표기 2n으로 유지한다(순간적 변화 비표기)', () => {
    expect(mitosisPhases.find((p) => p.id === 'mitosis-anaphase')!.ploidy).toBe('2n');
  });
});
