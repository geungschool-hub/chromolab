/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
// GitHub Pages는 https://<user>.github.io/chromolab/ 에 서빙되므로 빌드 시 base를 맞춘다.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/chromolab/' : '/',
  plugins: [
    react(),
    // PWA — 학교 와이파이 불안정 대응(오프라인 캐시). 첫 로드 후 네트워크 없이 동작.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'ChromoLab — 염색체로 배우는 세포분열',
        short_name: 'ChromoLab',
        description: '염색체를 직접 움직이며 체세포분열·감수분열을 배우는 학습 도구',
        lang: 'ko',
        theme_color: '#0f1419',
        background_color: '#0f1419',
        display: 'standalone',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
    }),
  ],
  build: {
    // Step 0 성능 예산: 초기 JS < 200KB gzip (≈ 600KB raw). 초과 시 빌드 경고.
    chunkSizeWarningLimit: 600,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // Playwright(E2E/시각회귀)는 별도 러너이므로 vitest 대상에서 제외
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
}));
