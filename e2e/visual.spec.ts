import { test, expect } from '@playwright/test';

// Step 0 시각 회귀 — 브레이크포인트별 첫 화면 스냅샷.
// 기준 이미지 생성/갱신: `npx playwright test --update-snapshots`
// (사전: `npx playwright install chromium`)

test('첫 화면 시각 회귀 (브레이크포인트별)', async ({ page }, testInfo) => {
  await page.goto('/');
  // 진리표가 렌더될 때까지 대기 (데이터 계층 확인)
  await expect(page.getByRole('heading', { name: 'ChromoLab' })).toBeVisible();
  await expect(page.locator('table')).toHaveCount(2);
  await expect(page).toHaveScreenshot(`home-${testInfo.project.name}.png`, {
    fullPage: true,
  });
});

test('교사 모드 진입(?mode=teacher)이 동작한다', async ({ page }) => {
  await page.goto('/?mode=teacher');
  await expect(page.getByRole('heading', { name: 'ChromoLab' })).toBeVisible();
});
