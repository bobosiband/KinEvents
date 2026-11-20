import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { AppConfig } from './config/AppConfig'
import { Router } from './api/Router'
import { DynamoEmailLogRepository } from './repositories/DynamoEmailLogRepository'
import { EmailService } from './services/EmailService'
import { NodemailerTransport } from './services/NodemailerTransport'
import { TemplateRegistry } from './templates/TemplateRegistry'

let cachedRouter: Router | undefined

function buildRouter(): Router {
  AppConfig.assertReady()
  const transport = new NodemailerTransport()
  const repository = new DynamoEmailLogRepository()
  const templates = TemplateRegistry.default()
  const service = new EmailService(transport, repository, templates)
  return new Router(service)
}

export const handler = async (event: APIGatewayProxyEvent, _context: Context): Promise<APIGatewayProxyResult> => {
  if (!cachedRouter) {
    cachedRouter = buildRouter()
  }
  const response = await cachedRouter.route({
    method: event.httpMethod,
    path: event.path,
    headers: normalizeHeaders(event.headers as Record<string, string | undefined> | null),
    queryString: (event.queryStringParameters ?? {}) as Record<string, string | undefined>,
    body: event.body,
  })
  return {
    statusCode: response.statusCode,
    body: response.body,
    headers: response.headers,
  }
}

function normalizeHeaders(raw: Record<string, string | undefined> | null): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {}
  if (!raw) return out
  for (const [key, value] of Object.entries(raw)) {
    out[key.toLowerCase()] = value
  }
  return out
}
