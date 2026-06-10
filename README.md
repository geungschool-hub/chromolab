# 🧬 ChromoLab — 염색체로 배우는 세포분열

염색체를 직접 움직이며 **체세포분열·감수분열**을 배우는 고등학교 생명과학 학습 도구입니다.
2022 개정 교육과정 '생명과학'(일반선택) · 성취기준 [12생과03-01]·[12생과03-02] 기반.

## 기능

- **① 염색체 해부** — 염색분체·동원체·상동염색체를 탭하며 구분
- **② 체세포분열 / ③ 감수분열** — 시기별 시뮬레이터 + DNA 상대량·염색체 수 동기화 그래프
- **④ 비교** — 체세포 vs 감수분열 나란히 동기 재생
- **⑤ 생식세포 다양성** — 유전자형 AaBb의 독립적 분리(두 경우) 단계 애니메이션
- **⑥ 퀴즈** — 임의 시기의 핵상·염색체 수·DNA 상대량 즉답 채점
- **정리표** — 시기별 과학 사실값(단일 기준원)

## 설계 특징

- 모든 수치는 `src/domain/phases.ts`(정리표) 한 곳에서 나와 화면 간 불일치 방지 (단위 테스트로 강제)
- 색맹 대응(색 + 길이 + 라벨 삼중 인코딩), 동작 줄이기 존중, PWA 오프라인 지원
- 검정교과서 표준 용어·표기 준수

## 개발

```bash
npm install
npm run dev        # 개발 서버
npm test           # 단위 테스트
npm run build      # 프로덕션 빌드
npm run e2e        # 시각 회귀(사전: npx playwright install chromium)
```

## 기술 스택

React + TypeScript + Vite · SVG · Framer Motion · Recharts · Zustand · PWA(Workbox)

배포: GitHub Pages (`.github/workflows/deploy.yml` 자동 배포)
