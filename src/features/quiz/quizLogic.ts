// 퀴즈 문항 생성 (Step 5, F7) — 진리표(phases.ts)에서 정답·해설을 끌어온다.
// 근거: PRD F7 — "지금 핵상/염색체 수/DNA 상대량은?" 즉답.

import { toCValue, type PhaseFacts } from '../../domain/types';

export type SubKey = 'ploidy' | 'chromosomeCount' | 'dnaRelative';

export interface SubQuestion {
  key: SubKey;
  prompt: string;
  options: string[];
  answer: string;
  explain: string;
}

/** 한 시기에 대한 3종 질문 생성 */
export function buildQuestions(phase: PhaseFacts, diploid: number): SubQuestion[] {
  const D = diploid;

  return [
    {
      key: 'ploidy',
      prompt: '이 세포 1개의 핵상은?',
      options: ['2n', 'n'],
      answer: phase.ploidy,
      explain:
        phase.ploidy === '2n'
          ? '상동염색체가 쌍으로 있으므로 2n입니다.'
          : '상동염색체가 한 개씩만 있으므로 n입니다. (감수 1분열 후 n)',
    },
    {
      key: 'chromosomeCount',
      prompt: '이 세포 1개에 있는 염색체 수는?',
      options: [D / 2, D, 2 * D].map(String),
      answer: String(phase.chromosomeCount),
      explain: `세포 1개(전체)를 기준으로 세면 이 시기에는 ${phase.chromosomeCount}개입니다.`,
    },
    {
      key: 'dnaRelative',
      prompt: 'G₁기 세포 1개를 2로 둘 때, 이 세포 1개의 DNA 상대량은?',
      options: ['1', '2', '4'],
      answer: String(phase.dnaRelative),
      explain: `G₁기 세포를 2로 두면 이 시기 세포 1개의 DNA 상대량은 ${phase.dnaRelative} (${toCValue(phase.dnaRelative)})입니다. S기 복제로 2→4, 분열로 감소합니다.`,
    },
  ];
}

/** 퀴즈 대상에서 제외할 시기인가 (후기 등 순간적 시기 — 사용자 정책) */
export function isQuizable(phase: PhaseFacts): boolean {
  return !phase.transientChromosomeCount;
}
