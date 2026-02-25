import { defineConfig, devices } from '@playwright/test';
/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Playwright configuration for API testing
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',  // Directory containing test files
  fullyParallel: false,  // Run tests sequentially (not in parallel)
  retries: process.env.CI ? 2 : 0,  // Number of retries on failure
  workers: 1,  // Number of worker processes
  reporter: [['list'], ['html', { open: 'never' }]],  // Use list reporter for console output

  // Global test options
  use: {
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'api-testing',  // Single project for API tests
      testMatch: 'example*',
      dependencies: ['smoke-test']
    },
    {
      name: 'smoke-test',
      //testMatch: 'smoke*',
    },
    {
      name: 'ui-testz',
      testDir: './test/ui-tests',

      use: {
        defaultBrowserType: 'chromium'
      }
    }
  ],
});