import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "staycation.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  outputDir: "/tmp/hiraya-test-results",
  use: { baseURL: "http://127.0.0.1:3000", headless: true, trace: "retain-on-failure" },
});
