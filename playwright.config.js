import { defineConfig } from "@playwright/test";

// CHROME_PATH overrides the browser binary when Playwright's own build is not installed.
export default defineConfig({
  testDir: "tests/e2e",
  use: {
    baseURL: "http://localhost:3200",
    viewport: { width: 1280, height: 720 },
    launchOptions: { executablePath: process.env.CHROME_PATH || undefined },
  },
  webServer: { command: "npm run dev", port: 3200, reuseExistingServer: true },
});
