import { AppConfig } from '../config/AppConfig'
import { UnauthorizedError } from '../errors/DomainError'

export class ApiKeyMiddleware {
  public static verify(headers: Record<string, string | undefined>): void {
    const header = headers['x-api-key'] ?? headers['X-Api-Key']
    if (!header || header !== AppConfig.emailServiceApiKey) {
      throw new UnauthorizedError('Invalid or missing API key')
    }
  }
}
