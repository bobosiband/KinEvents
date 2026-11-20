import type { EmailService } from '../services/EmailService'

export class HealthHandler {
  public constructor(private readonly service: EmailService) {}

  public async handle(): Promise<unknown> {
    try {
      await this.service.verify()
      return { status: 'ok', transportReady: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'
      return { status: 'degraded', transportReady: false, error: message }
    }
  }
}
