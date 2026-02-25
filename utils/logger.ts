/**
 * Minimal in-memory API logger.
 *
 * Created in:
 * - `utils/fixtures.ts` inside the `api` fixture.
 *
 * Consumed by:
 * - `utils/request-handler.ts` (writes logs),
 * - `utils/custom-expect.ts` (reads logs on assertion failures).
 */

export class APILogger {

    // Ordered timeline of API activity for the current test.
    private recentLogs: any[] = []

    // Called from RequestHandler before sending HTTP request.
    logRequest(method: string, url: string, headers: Record<string, string>, body?: any){
        const logEntry = {method, url, headers, body}
        this.recentLogs.push({type: 'Request Details', data: logEntry})
    }

    // Called from RequestHandler after receiving HTTP response.
    logResponse(statusCode: number, body?: any){
        const logEntry = {statusCode, body}
        this.recentLogs.push({type: 'Response Details', data: logEntry})
    }

    // Called by custom matchers to attach API context to failure output.
    getRecentLogs(){
        const logs = this.recentLogs.map(log => {
            return `===${log.type}===\n${JSON.stringify(log.data, null, 4)}`
        }).join('\n\n')
        return logs
    }

}