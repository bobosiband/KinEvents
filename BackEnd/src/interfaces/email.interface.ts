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

export interface EmailAddress {
  name: string
  email: string
}

export interface EmailPayload {
  to: EmailAddress | EmailAddress[]
  subject: string
  html: string
  text: string
  replyTo?: string
}

export interface EmailLogEntry {
  id: string
  templateName: EmailTemplateName
  recipientId: string
  recipientEmail: string
  subject: string
  status: 'sent' | 'failed' | 'skipped'
  error?: string
  sentAt?: string
  createdAt: string
  retryCount: number
}

export interface TemplateContext {
  recipientName?: string
  [key: string]: unknown
}
