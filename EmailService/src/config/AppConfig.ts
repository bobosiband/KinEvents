export class AppConfig {
  public static readonly gmailUser: string = (process.env.GMAIL_USER ?? '').trim()
  public static readonly gmailAppPassword: string = (process.env.GMAIL_APP_PASSWORD ?? '').trim()
  public static readonly emailFromName: string = (process.env.EMAIL_FROM_NAME ?? 'KinEvents').trim()
  public static readonly emailServiceApiKey: string = (process.env.EMAIL_SERVICE_API_KEY ?? '').trim()
  public static readonly emailLogsTable: string = (process.env.EMAIL_LOGS_TABLE ?? 'EmailLogs').trim()
  public static readonly emailLogsRetentionDays: number = Number(process.env.EMAIL_LOGS_RETENTION_DAYS ?? 30)
  public static readonly awsRegion: string = (process.env.AWS_REGION ?? 'ap-southeast-2').trim()
  public static readonly maxRetries: number = Number(process.env.EMAIL_MAX_RETRIES ?? 3)
  public static readonly retryBaseDelayMs: number = Number(process.env.EMAIL_RETRY_BASE_MS ?? 400)
  public static readonly isTest: boolean = process.env.NODE_ENV === 'test'

  public static assertReady(): void {
    const missing: string[] = []
    if (!this.gmailUser) missing.push('GMAIL_USER')
    if (!this.gmailAppPassword) missing.push('GMAIL_APP_PASSWORD')
    if (!this.emailServiceApiKey) missing.push('EMAIL_SERVICE_API_KEY')
    if (missing.length > 0) {
      throw new Error(`EmailService misconfigured — missing env vars: ${missing.join(', ')}`)
    }
  }
}
