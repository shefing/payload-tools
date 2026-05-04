import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  retries: 0,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
})
