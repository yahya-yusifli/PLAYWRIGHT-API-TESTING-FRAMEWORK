/**
 * Custom matchers used by API tests.
 *
 * Called from:
 * - test files: `import { expect } from '../utils/custom-expect'`
 *
 * Depends on:
 * - logger instance injected from `utils/fixtures.ts` via `setCustomExpectLogger`.
 *
 * Why this file exists:
 * - keeps assertion style consistent,
 * - appends recent API logs on failure,
 * - centralizes schema validation matcher.
 */

import { expect as baseExpect } from '@playwright/test';
import { APILogger } from './logger';
import { validateSchema } from './schema-validator';

// Filled by fixtures before each test; used to enrich matcher failure messages.
let apiLogger: APILogger

// Called in `fixtures.ts` when `api` fixture is created.
export const setCustomExpectLogger = (logger: APILogger) => {
    apiLogger = logger
}

// Type augmentation so TS knows `shouldEqual`, `shouldMatchSchema`, etc.
declare global {
    namespace PlaywrightTest {
        interface Matchers<R, T>{
            shouldEqual(expected: T): R
            shouldBeLessThanOrEqual(expected: T): R
            shouldMatchSchema(dirName: string, fileName: string, createSchemaFlag?: boolean): Promise<R>
        }
    }
}

export const expect = baseExpect.extend({
    // Flow: test -> shouldMatchSchema -> validateSchema() in schema-validator.ts
    // If schema check fails, we append recent request/response logs for faster diagnosis.
    async shouldMatchSchema(received: any, dirName: string, fileName: string, createSchemaFlag: boolean = false) {
        let pass: boolean;
        let message: string = ''
        
        try {
            await validateSchema(dirName, fileName, received, createSchemaFlag)
            pass = true;
            message = 'Schema validation passed'
        } catch (e: any) {
            pass = false;
            const logs = apiLogger.getRecentLogs()
            message = `${e.message}\n\nRecent API Activity: \n${logs}`
        }

        return {
            message: () => message,
            pass
        };
    },
    // Wrapper around Playwright `toEqual` to keep one failure format with API context.
    shouldEqual(received: any, expected: any) {
        let pass: boolean;
        let logs: string = ''

        try {
            baseExpect(received).toEqual(expected);
            pass = true;
            if (this.isNot) {
                logs = apiLogger.getRecentLogs()
            }
        } catch (e: any) {
            pass = false;
            logs = apiLogger.getRecentLogs()
        }

        const hint = this.isNot ? 'not' : ''
        const message = this.utils.matcherHint('shouldEqual', undefined, undefined, { isNot: this.isNot }) +
            '\n\n' +
            `Expected: ${hint} ${this.utils.printExpected(expected)}\n` +
            `Received: ${this.utils.printReceived(received)}\n\n` +
            `Recent API Activity: \n${logs}`

        return {
            message: () => message,
            pass
        };
    },
    // Wrapper around Playwright `toBeLessThanOrEqual` with the same API-log behavior.
    shouldBeLessThanOrEqual(received: any, expected: any) {
        let pass: boolean;
        let logs: string = ''

        try {
            baseExpect(received).toBeLessThanOrEqual(expected);
            pass = true;
            if (this.isNot) {
                logs = apiLogger.getRecentLogs()
            }
        } catch (e: any) {
            pass = false;
            logs = apiLogger.getRecentLogs()
        }

        const hint = this.isNot ? 'not' : ''
        const message = this.utils.matcherHint('shouldBeLessThanOrEqual', undefined, undefined, { isNot: this.isNot }) +
            '\n\n' +
            `Expected: ${hint} ${this.utils.printExpected(expected)}\n` +
            `Received: ${this.utils.printReceived(received)}\n\n` +
            `Recent API Activity: \n${logs}`

        return {
            message: () => message,
            pass
        };
    }
})