import { defineConfig } from "@playwright/test";

const viewports = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "desktop", width: 1440, height: 900 },
];

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  webServer: {
    command: "node serve.mjs",
    port: 4173,
    reuseExistingServer: true,
  },
  use: { baseURL: "http://localhost:4173" },
  projects: viewports.map((v) => ({
    name: v.name,
    use: { viewport: { width: v.width, height: v.height } },
  })),
});
