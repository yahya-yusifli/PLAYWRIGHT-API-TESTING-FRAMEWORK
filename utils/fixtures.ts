/**
 * Shared test fixtures used by all spec files.
 *
 * Entry point for test runtime dependencies:
 * - tests import `test` from this file,
 * - this file wires `authToken`, `api`, and `config` into each test.
 */

import { test as base } from '@playwright/test';
import { RequestHandler } from '../utils/request-handler';
import { APILogger } from './logger';
import { setCustomExpectLogger } from './custom-expect';
import { createToken } from '../helpers/createToken';
import { config } from '../app-test.config';

// Objects injected into each test callback: test('name', async ({ api, config }) => ...)
export type TestOptions = {
    api: RequestHandler
    config: typeof config
}

// Objects created once per worker process and reused by tests in that worker.
export type WorkerFixture = {
    authToken: string
}

export const test = base.extend<TestOptions, WorkerFixture>({
    // authToken comes from helpers/createToken.ts and is produced once per worker.
    // Reason: login is expensive; we reuse one token for many tests.
    authToken: [ async ({}, use) => {
        const authToken = await createToken(config.userEmail, config.userPassword)
        await use(authToken)
    }, {scope: 'worker'}], 

    // api fixture is created per test.
    // Flow:
    // 1) create APILogger,
    // 2) pass logger into custom expect,
    // 3) create RequestHandler(request, baseUrl, logger, authToken).
    // This is why assertion errors can show recent API request/response history.
    api: async({request, authToken}, use) => {
        const logger = new APILogger()
        setCustomExpectLogger(logger)
        const requestHandler = new RequestHandler(request, config.apiURL, logger, authToken)
        await use(requestHandler)
    },
    // config is exposed as fixture so tests can consume one consistent source.
    config: async({}, use) => {
        await use(config)
    }
})
