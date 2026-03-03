const { defineConfig } = require("@playwright/test");

const baseURL = process.env.BASE_URL || "http://localhost:3000";

module.exports = defineConfig({
  testDir: "./e2e",
  timeout: 45000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL,
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run dev",
    url: baseURL,
    timeout: 120000,
    reuseExistingServer: !process.env.CI
  }
});
