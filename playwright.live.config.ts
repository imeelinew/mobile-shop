import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/live',
  workers: 1,
  timeout: 60_000,
  use: { ...devices['Pixel 7'], baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: {
    command: 'VITE_APP_URL=/api npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
})
