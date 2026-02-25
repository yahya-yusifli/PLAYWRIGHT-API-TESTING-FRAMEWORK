import { RequestHandler } from "../utils/request-handler";
import { config } from "../app-test.config"
import { APILogger } from "../utils/logger";
import { request } from "@playwright/test";


export async function createToken(email: string, password: string) {
    const context = await request.newContext()
    const logger = new APILogger()
    const api = new RequestHandler(context, config.apiURL, logger)

    try {
        const tokenResponse = await api
        .path('/users/login')
        .body({ "user": { "email": email, "password": password } })
        .postRequest(200)
    return 'Token ' + tokenResponse.user.token
    } catch(error) {
        if (error instanceof Error) {
            Error.captureStackTrace(error, createToken)
        }
        throw error
    } finally {
        await context.dispose()
    }
    
}