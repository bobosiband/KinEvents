import { ApiKeyMiddleware } from '../middleware/ApiKeyMiddleware'
import { DomainError, NotFoundError } from '../errors/DomainError'
import { HealthHandler } from './HealthHandler'
import { LogsHandler } from './LogsHandler'
import { SendEmailHandler } from './SendEmailHandler'
import type { EmailService } from '../services/EmailService'

export interface HttpRequest {
  readonly method: string
  readonly path: string
  readonly headers: Record<string, string | undefined>
  readonly queryString: Record<string, string | undefined>
  readonly body: string | null
}

export interface HttpResponse {
  readonly statusCode: number
  readonly body: string
  readonly headers: Record<string, string>
}

export class Router {
  private readonly send: SendEmailHandler
  private readonly health: HealthHandler
  private readonly logs: LogsHandler

  public constructor(service: EmailService) {
    this.send = new SendEmailHandler(service)
    this.health = new HealthHandler(service)
    this.logs = new LogsHandler(service)
  }

  public async route(request: HttpRequest): Promise<HttpResponse> {
    try {
      const path = this.normalizePath(request.path)
      if (request.method === 'POST' && path === '/emails') {
        ApiKeyMiddleware.verify(request.headers)
        const body = request.body ? JSON.parse(request.body) : {}
        const result = await this.send.handle(body)
        return this.ok(result)
      }
      if (request.method === 'GET' && path === '/health') {
        const result = await this.health.handle()
        return this.ok(result)
      }
      if (request.method === 'GET' && path === '/emails/logs') {
        ApiKeyMiddleware.verify(request.headers)
        const result = await this.logs.handle(request.queryString)
        return this.ok(result)
      }
      throw new NotFoundError(`No route for ${request.method} ${path}`)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  private normalizePath(path: string): string {
    if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1)
    return path
  }

  private ok(body: unknown): HttpResponse {
    return {
      statusCode: 200,
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }
  }

  private errorResponse(error: unknown): HttpResponse {
    if (error instanceof DomainError) {
      return {
        statusCode: error.statusCode,
        body: JSON.stringify({ error: error.name, message: error.message }),
        headers: { 'Content-Type': 'application/json' },
      }
    }
    const message = error instanceof Error ? error.message : 'unknown error'
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'InternalError', message }),
      headers: { 'Content-Type': 'application/json' },
    }
  }
}
