// 교사 시연 모드 (Step 0) — URL ?mode=teacher 로 활성화
// 근거: PRD §2.2(교사 페르소나), §9(교사 모드 토글)
//
// 교사 모드 효과(2단계 이후 UI에서 사용):
//   - 모든 용어 라벨 강제 표시(툴팁 의존 X)
//   - 폰트·버튼 확대(전자칠판 가독성)
//   - 단축키 시연(스페이스=다음, ←/→=이전/다음, F=전체화면)

export interface TeacherModeState {
  enabled: boolean;
  /** 라벨 강제 표시 */
  forceLabels: boolean;
  /** 확대 배율 (전자칠판용) */
  uiScale: number;
}

const DEFAULT_TEACHER_SCALE = 1.4;

/** 현재 URL에서 교사 모드 여부를 읽는다. (search param ?mode=teacher) */
export function readTeacherMode(search: string = window.location.search): TeacherModeState {
  const params = new URLSearchParams(search);
  const enabled = params.get('mode') === 'teacher';
  return {
    enabled,
    forceLabels: enabled,
    uiScale: enabled ? DEFAULT_TEACHER_SCALE : 1,
  };
}

/** 교사 모드 단축키 매핑 (시연용). 2단계 이후 키보드 핸들러에서 사용. */
export const TEACHER_SHORTCUTS = {
  next: [' ', 'ArrowRight'],
  prev: ['ArrowLeft'],
  fullscreen: ['f', 'F'],
  togglePlay: ['p', 'P'],
} as const;
