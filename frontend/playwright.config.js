import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  reporter: process.env.CI ? "github" : "line",
  retries: process.env.CI ? 1 : 0,
  use: {
    browserName: "chromium",
    baseURL: process.env.APP_URL || "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  }
});
