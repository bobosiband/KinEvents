export interface EmailAddress {
  readonly name: string
  readonly email: string
}

export type EmailTemplateName =
  | 'welcome'
  | 'access-approved'
  | 'access-rejected'
  | 'access-request'
  | 'account-updated'
  | 'role-changed'
  | 'event-created'
  | 'event-updated'
  | 'event-cancelled'
  | 'event-reminder'
  | 'rsvp-confirmation'
  | 'birthday-today'
  | 'birthday-reminder'
  | 'announcement'
  | 'login-pin'
  | 'new-device-alert'

export type EmailStatus = 'sent' | 'failed' | 'skipped'

export interface RenderedEmail {
  readonly subject: string
  readonly html: string
  readonly text: string
}

export interface SendEmailRequest {
  readonly templateName: EmailTemplateName
  readonly recipient: EmailAddress
  readonly recipientId: string
  readonly data: Record<string, unknown>
  readonly replyTo?: string
}

export interface EmailLogRecord {
  readonly id: string
  readonly templateName: EmailTemplateName
  readonly recipientId: string
  readonly recipientEmail: string
  readonly subject: string
  readonly status: EmailStatus
  readonly error?: string
  readonly sentAt?: string
  readonly createdAt: string
  readonly retryCount: number
  readonly expiresAt: number
}

export interface SendEmailResult {
  readonly success: boolean
  readonly logId: string
  readonly status: EmailStatus
  readonly retryCount: number
}
