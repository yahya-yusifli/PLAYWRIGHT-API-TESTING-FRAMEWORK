/**
 * Main HTTP helper used by tests.
 *
 * Created in:
 * - `utils/fixtures.ts` as `api` fixture.
 *
 * Used in tests like:
 * - `api.path('/articles').params(...).getRequest(200)`
 *
 * Why this file exists:
 * - one place for request building,
 * - one place for auth/header defaults,
 * - one place for status validation + logging.
 */

import { APIRequestContext } from "@playwright/test"
import { APILogger } from "./logger";
import { test } from "@playwright/test"

export class RequestHandler {

    // Playwright request context comes from fixture.
    private request: APIRequestContext
    private logger: APILogger
    
    // Builder state (cleared after each execute method).
    private baseUrl: string | undefined
    private defaultBaseUrl: string
    private apiPath: string = ''
    private queryParams: object = {}
    private apiHeaders: Record<string, string> = {}
    private apiBody: object = {}
    
    // Default token comes from worker fixture; clearAuth() can disable it per request.
    private defaultAuthToken: string
    private clearAuthFlag: boolean | undefined

    // Called only by fixture setup.
    constructor(request: APIRequestContext, apiBaseUrl: string, logger: APILogger, authToken: string = '') {
        this.request = request
        this.defaultBaseUrl = apiBaseUrl
        this.logger = logger
        this.defaultAuthToken = authToken
    }

    // Optional override if a specific request must target another host.
    url(url: string) {
        this.baseUrl = url
        return this
    }

    // Most common builder method used by tests.
    path(path: string) {
        this.apiPath = path
        return this
    }

    // Adds URL query params before execution.
    params(params: object) {
        this.queryParams = params
        return this
    }

    // Allows per-request header overrides.
    headers(headers: Record<string, string>) {
        this.apiHeaders = headers
        return this
    }

    // Sets payload for POST/PUT.
    body(body: object) {
        this.apiBody = body
        return this
    }

    // Used by negative tests to send request without default Authorization header.
    clearAuth() {
        this.clearAuthFlag = true
        return this
    }

    // Execute GET using previously built state and assert expected status code.
    // This is the end of the chain started in tests with path/params/headers.
    async getRequest(statusCode: number) {
        let responseJSON: any

        const url = this.getUrl()
        await test.step(`GET request to: ${url}`, async () => {
            this.logger.logRequest('GET', url, this.getHeades())
            const response = await this.request.get(url, {
                headers: this.getHeades()
            })
            this.cleanupFields()
            const actualStatus = response.status()
            responseJSON = await response.json()

            this.logger.logResponse(actualStatus, responseJSON)
            this.statusCodeValidator(actualStatus, statusCode, this.getRequest)
        })

        return responseJSON
    }

    // Execute POST. Empty response bodies are normalized to `{}`.
    async postRequest(statusCode: number) {
        let responseJSON: any
        const url = this.getUrl()
        await test.step(`POST request to: ${url}`, async () => {
            this.logger.logRequest('POST', url, this.getHeades(), this.apiBody)
            const response = await this.request.post(url, {
                headers: this.getHeades(),
                data: this.apiBody
            })
            this.cleanupFields()
            const actualStatus = response.status()
            try {
                responseJSON = await response.json()
            } catch (error) {
                responseJSON = {}
            }
            this.logger.logResponse(actualStatus, responseJSON)
            this.statusCodeValidator(actualStatus, statusCode, this.postRequest)
        })

        return responseJSON
    }

    // Execute PUT for update flows.
    async putRequest(statusCode: number) {
        let responseJSON: any

        const url = this.getUrl()
        await test.step(`PUT request to: ${url}`, async () => {
            this.logger.logRequest('PUT', url, this.getHeades(), this.apiBody)
            const response = await this.request.put(url, {
                headers: this.getHeades(),
                data: this.apiBody
            })
            this.cleanupFields()
            const actualStatus = response.status()
            try {
                responseJSON = await response.json()
            } catch (error) {
                responseJSON = {}
            }
            this.logger.logResponse(actualStatus, responseJSON)
            this.statusCodeValidator(actualStatus, statusCode, this.putRequest)
        })

        return responseJSON
    }

    // Execute DELETE. Caller verifies deletion with a follow-up GET when needed.
    async deleteRequest(statusCode: number) {
        const url = this.getUrl()
        await test.step(`DELETE request to: ${url}`, async () => {
            this.logger.logRequest('DELETE', url, this.getHeades())
            const response = await this.request.delete(url, {
                headers: this.getHeades()
            })
            this.cleanupFields()
            const actualStatus = response.status()
            this.logger.logResponse(actualStatus)
            this.statusCodeValidator(actualStatus, statusCode, this.deleteRequest)
        })
    }


    // Internal URL composer used by all execute methods.
    private getUrl() {
        const url = new URL(`${this.baseUrl ?? this.defaultBaseUrl}${this.apiPath}`)
        for (const [key, value] of Object.entries(this.queryParams)) {
            url.searchParams.append(key, value)
        }
        return url.toString()
    }

    // Central status assertion for GET/POST/PUT/DELETE.
    // We trim stack trace to point to the public method that test called.
    private statusCodeValidator(actualStatus: number, expectStatus: number, callingMethod: Function) {
        if (actualStatus !== expectStatus) {
            const logs = this.logger.getRecentLogs()
            const error = new Error(`Expected status ${expectStatus} but got ${actualStatus}\n\nRecent API Activity: \n${logs}`)
            Error.captureStackTrace(error, callingMethod)
            throw error
        }
    }

    // Adds default Authorization unless request explicitly cleared auth.
    private getHeades() {
        if (!this.clearAuthFlag) {
            this.apiHeaders['Authorization'] = this.apiHeaders['Authorization'] || this.defaultAuthToken
        }
        return this.apiHeaders
    }

    // Prevents request state leakage between chained calls across tests.
    private cleanupFields() {
        this.apiBody = {}
        this.apiHeaders = {}
        this.baseUrl = undefined
        this.apiPath = ''
        this.queryParams = {}
        this.clearAuthFlag = false
    }

}