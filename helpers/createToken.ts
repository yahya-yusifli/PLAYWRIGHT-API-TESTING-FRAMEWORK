/**
 * Logs in and returns Authorization header value (`Token <jwt>`).
 *
 * Called from:
 * - `utils/fixtures.ts` worker fixture (`authToken`).
 *
 * Why separate function:
 * - auth bootstrap is centralized in one place,
 * - fixtures stay focused on wiring dependencies,
 * - login request details can evolve without touching tests.
 */

import { RequestHandler } from "../utils/request-handler";
import { config } from "../app-test.config"
import { APILogger } from "../utils/logger";
import { request } from "@playwright/test";

/**
 * Sends `POST /users/login` and returns token string used by RequestHandler.
 */
export async function createToken(email: string, password: string) {
    // Independent API context: auth setup should not pollute test request context.
    const context = await request.newContext()
    const logger = new APILogger()
    const api = new RequestHandler(context, config.apiURL, logger)

    try {
        const tokenResponse = await api
        .path('/users/login')
        .body({ "user": { "email": email, "password": password } })
        .postRequest(200)
    // RequestHandler expects Authorization value in this format.
    return 'Token ' + tokenResponse.user.token
    } catch(error) {
        // Keep stack trace cleaner by trimming this helper frame.
        if (error instanceof Error) {
            Error.captureStackTrace(error, createToken)
        }
        throw error
    } finally {
        // Always release the temporary context.
        await context.dispose()
    }
    
}