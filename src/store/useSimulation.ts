// 시뮬레이션 상태 저장소 (Step 3) — Zustand
// 근거: PRD §10.4 상태 머신 — 시기 인덱스가 곧 §7 진리표 행과 1:1. 그래프/카운터/퀴즈가 이 상태를 구독.

import { create } from 'zustand';
import { buildMitosisPhases, buildMeiosisPhases, DEFAULT_DIPLOID } from '../domain/phases';
import type { PhaseFacts, Process } from '../domain/types';

interface SimState {
  process: Process;
  diploid: number;
  phases: PhaseFacts[];
  index: number;
  isPlaying: boolean;
  /** 재생 배속 (0.5 / 1 / 2) */
  speed: number;

  current: () => PhaseFacts;
  isLast: () => boolean;
  load: (process: Process, diploid?: number) => void;
  next: () => void;
  prev: () => void;
  goTo: (i: number) => void;
  reset: () => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (s: number) => void;
}

function buildPhases(process: Process, diploid: number): PhaseFacts[] {
  return process === 'mitosis' ? buildMitosisPhases(diploid) : buildMeiosisPhases(diploid);
}

export const useSimulation = create<SimState>((set, get) => ({
  process: 'mitosis',
  diploid: DEFAULT_DIPLOID,
  phases: buildMitosisPhases(DEFAULT_DIPLOID),
  index: 0,
  isPlaying: false,
  speed: 1,

  current: () => {
    const { phases, index } = get();
    return phases[index]!;
  },
  isLast: () => get().index >= get().phases.length - 1,

  load: (process, diploid = DEFAULT_DIPLOID) =>
    set({ process, diploid, phases: buildPhases(process, diploid), index: 0, isPlaying: false }),

  next: () =>
    set((s) => {
      const last = s.index >= s.phases.length - 1;
      if (last) return { isPlaying: false };
      return { index: s.index + 1 };
    }),
  prev: () => set((s) => ({ index: Math.max(0, s.index - 1), isPlaying: false })),
  goTo: (i) => set((s) => ({ index: Math.min(Math.max(0, i), s.phases.length - 1) })),
  reset: () => set({ index: 0, isPlaying: false }),
  play: () => set((s) => ({ isPlaying: !s.isLast() })),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying && !s.isLast() })),
  setSpeed: (speed) => set({ speed }),
}));
