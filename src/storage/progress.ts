// 진도·퀴즈 결과 저장 (Step 5, F8) — LocalStorage 우선, 추후 백엔드 이관 대비 schemaVersion 포함.
// 근거: PRD F8, §10.2. 개인정보 없음(익명 sessionId).

const KEY = 'chromolab.progress';
const SCHEMA_VERSION = 1 as const;

export interface PhaseScore {
  total: number;
  correct: number;
}

export interface Progress {
  schemaVersion: typeof SCHEMA_VERSION;
  sessionId: string;
  quiz: {
    total: number;
    correct: number;
    perPhase: Record<string, PhaseScore>;
  };
}

function newSessionId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    /* ignore */
  }
  return 'sess-' + Math.floor(Math.random() * 1e9).toString(36);
}

function fresh(): Progress {
  return {
    schemaVersion: SCHEMA_VERSION,
    sessionId: newSessionId(),
    quiz: { total: 0, correct: 0, perPhase: {} },
  };
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const parsed = JSON.parse(raw) as Progress;
    if (parsed.schemaVersion !== SCHEMA_VERSION) return fresh(); // 버전 불일치 시 초기화(이관 로직 자리)
    return parsed;
  } catch {
    return fresh();
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* 저장 실패는 조용히 무시(시크릿 모드 등) */
  }
}

/** 퀴즈 한 문항 결과 기록 */
export function recordQuiz(phaseId: string, correct: boolean): Progress {
  const p = loadProgress();
  p.quiz.total += 1;
  if (correct) p.quiz.correct += 1;
  const ps = p.quiz.perPhase[phaseId] ?? { total: 0, correct: 0 };
  ps.total += 1;
  if (correct) ps.correct += 1;
  p.quiz.perPhase[phaseId] = ps;
  saveProgress(p);
  return p;
}

export function resetProgress(): Progress {
  const f = fresh();
  saveProgress(f);
  return f;
}
