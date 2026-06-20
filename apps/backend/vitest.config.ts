import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// NestJS relies on emitted decorator metadata for DI. esbuild (Vitest's default
// transformer) doesn't emit it, so we transform with SWC instead.
export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts', 'test/**/*.e2e.spec.ts'],
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
  plugins: [swc.vite()],
});
