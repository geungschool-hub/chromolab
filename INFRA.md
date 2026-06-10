# ChromoLab — Step 0 공통 인프라 안내

PRD(`../ChromoLab_PRD.md`) 기반 구현. 이 문서는 **Step 0(공통 인프라)** 설정과 사용법을 정리한다.

## 명령어
| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (http://localhost:5173) |
| `npm run typecheck` | 엄격 타입 검사 (`tsc -b`) |
| `npm test` | 진리표 단위 테스트 (Vitest) |
| `npm run build` | 타입체크 + 프로덕션 빌드 |
| `npm run format` / `format:check` | Prettier 정렬 / 검사 |
| `npm run lint` | ESLint |
| `npm run e2e` | Playwright 시각 회귀 (사전: `npx playwright install chromium`) |
| `npm run e2e:update` | 시각 회귀 기준 이미지 생성/갱신 |

## Step 0 구성 요소
| 항목 | 위치 | 비고 |
|---|---|---|
| TS 엄격 모드 | `tsconfig.app.json` | `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` |
| Prettier | `.prettierrc.json` | singleQuote, printWidth 100 |
| ESLint | `eslint.config.js` | typescript-eslint (스캐폴드) |
| Husky pre-commit | `.husky/pre-commit` | lint-staged → typecheck → test |
| lint-staged | `package.json` | 스테이징 파일만 prettier+eslint |
| Playwright 시각회귀 | `playwright.config.ts`, `e2e/` | 360/768/1280 브레이크포인트 |
| 텔레메트리 스키마 | `src/telemetry/events.ts` | 익명 이벤트 4종 (phase_entered, quiz_answered, misconception_triggered M1~M7, session_completed) |
| 교사 모드 | `src/app/teacherMode.ts` | URL `?mode=teacher` |
| 성능 예산 | `vite.config.ts` | 초기 JS < 200KB gzip (chunkSizeWarningLimit 600KB raw) |

## 성능 예산 (PRD 기준)
- 초기 JS < **200KB gzip** (현재 ~63KB)
- 모바일 60fps 유지
- 화면당 SVG 노드 < 500개 (2단계 이후 렌더링 시 준수)

## ⚠️ 최초 1회 필요
시각 회귀 테스트 실행 전 브라우저 설치:
```
npx playwright install chromium
```
이후 `npm run e2e:update`로 기준 이미지를 만들고, 이후 `npm run e2e`로 회귀 검사.
