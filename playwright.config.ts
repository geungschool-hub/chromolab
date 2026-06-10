import { defineConfig, devices } from '@playwright/test';

// Step 0 시각 회귀 테스트 — 360/768/1280 브레이크포인트 기준 스크린샷 비교
// 근거: PRD §9(반응형). 기준 이미지는 `npx playwright test --update-snapshots`로 생성.
//
// ⚠️ 최초 실행 전 브라우저 설치 필요: `npx playwright install chromium`

export default defineConfig({
  testDir: './e2e',
  snapshotDir: './e2e/__screenshots__',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
  },
  // dev 서버를 자동 기동(이미 떠 있으면 재사용)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  // PRD §9 브레이크포인트별 프로젝트
  projects: [
    { name: 'mobile-360', use: { viewport: { width: 360, height: 740 } } },
    {
      name: 'tablet-768',
      use: { ...devices['iPad Mini'], viewport: { width: 768, height: 1024 } },
    },
    { name: 'desktop-1280', use: { viewport: { width: 1280, height: 800 } } },
  ],
  expect: {
    // 폰트 렌더 미세차 허용
    toHaveScreenshot: { maxDiffPixelRatio: 0.02 },
  },
});
