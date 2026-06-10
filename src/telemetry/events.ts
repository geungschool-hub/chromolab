// ChromoLab 익명 텔레메트리 이벤트 스키마 (Step 0)
// 근거: PRD §12 성공 지표(KPI). 개인정보 없음(익명). MVP는 LocalStorage 버퍼, 추후 백엔드 전송.
//
// 설계 원칙:
//   - 학생 식별 정보(이름/이메일) 절대 미수집. 익명 sessionId만 사용.
//   - 모든 이벤트는 PRD KPI(완주율·정답률·오개념 빈도)로 환원 가능해야 한다.

import type { MisconceptionId } from '../domain/misconceptions';

/** 익명 세션 식별자(브라우저 단위, LocalStorage 저장). 개인정보 아님. */
export type SessionId = string;

/** 분열 종류 (텔레메트리용 좁은 타입) */
export type TelemetryProcess = 'mitosis' | 'meiosis';

/** 공통 메타 — 모든 이벤트에 부착 */
export interface TelemetryBase {
  sessionId: SessionId;
  /** epoch ms. 호출부에서 주입(스크립트 환경 Date 제약 회피). */
  ts: number;
  /** 교사 시연 모드 여부 (?mode=teacher) */
  teacherMode: boolean;
}

/** 시기 진입 — 완주율·체류시간 분석 */
export interface PhaseEnteredEvent extends TelemetryBase {
  type: 'phase_entered';
  process: TelemetryProcess;
  phaseId: string;
  /** 자동재생/수동/드래그완료 중 어떤 방식으로 진입했는지 */
  via: 'auto' | 'next-button' | 'drag-complete' | 'scrub';
}

/** 퀴즈 응답 — 정답률 분석 (PRD KPI: 퀴즈 정답률 ≥80%) */
export interface QuizAnsweredEvent extends TelemetryBase {
  type: 'quiz_answered';
  phaseId: string;
  /** 무엇을 물었는가 */
  question: 'ploidy' | 'chromosomeCount' | 'chromatidCount' | 'dnaRelative';
  correct: boolean;
  /** 시도 회차(1부터) */
  attempt: number;
}

/** 오개념 발동 — M1~M7 빈도 추적 (PRD KPI: 오개념 감소) */
export interface MisconceptionTriggeredEvent extends TelemetryBase {
  type: 'misconception_triggered';
  misconceptionId: MisconceptionId;
  /** 어느 시기에서 잘못 배치했는가 */
  phaseId: string;
}

/** 세션 완료 — 완주율 (PRD KPI: 완주율 ≥70%) */
export interface SessionCompletedEvent extends TelemetryBase {
  type: 'session_completed';
  process: TelemetryProcess;
  /** 완주까지 걸린 시간(ms) */
  durationMs: number;
  /** 이번 세션 퀴즈 정답률 0~1 (퀴즈 미응시 시 null) */
  quizAccuracy: number | null;
}

/** 전체 이벤트 합집합 */
export type TelemetryEvent =
  | PhaseEnteredEvent
  | QuizAnsweredEvent
  | MisconceptionTriggeredEvent
  | SessionCompletedEvent;

export type TelemetryEventType = TelemetryEvent['type'];

/** 이벤트 싱크 인터페이스 — MVP는 LocalStorage, 추후 백엔드 HTTP로 교체 */
export interface TelemetrySink {
  emit(event: TelemetryEvent): void;
}

/** 이벤트 타임스탬프(epoch ms). 컴포넌트 렌더 순수성 규칙을 피하려 유틸로 분리. */
export function nowTs(): number {
  return Date.now();
}

/** 개발용 콘솔 싱크 (no-op에 가까움). 실제 싱크는 storage/ 또는 백엔드에서 구현. */
export const consoleSink: TelemetrySink = {
  emit(event) {
    if (import.meta.env?.DEV) {
      console.debug('[telemetry]', event.type, event);
    }
  },
};
