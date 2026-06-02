import { env } from '../config/env'

export type WhatsAppTemplateName =
  | 'birthday_reminder'
  | 'gift_pool_reminder'
  | 'event_reminder'
  | 'access_approved'
  | 'welcome'
  | 'happy_birthday'

export interface WhatsAppRecipient {
  name: string
  phone?: string
  phoneNumber?: string
}

export interface WhatsAppSendResult {
  success: boolean
  status: 'sent' | 'failed' | 'skipped'
  templateName: WhatsAppTemplateName
  recipientId: string
  recipientPhone?: string
  messageId?: string
  error?: string
  timestamp: string
}

type TemplateContext = Record<string, string | number | undefined>

class WhatsAppService {
  validatePhoneNumber(phoneNumber: string): boolean {
    return /^\+[1-9]\d{7,14}$/.test(String(phoneNumber || '').trim())
  }

  private resolvePhoneNumber(recipient: WhatsAppRecipient): string | null {
    const candidate = String(recipient.phoneNumber || recipient.phone || '').trim()
    if (!candidate) {
      return null
    }

    return this.validatePhoneNumber(candidate) ? candidate : null
  }

  private normalizeWhatsAppRecipient(phoneNumber: string): string {
    return phoneNumber.replace(/\D/g, '')
  }

  private buildParameters(templateName: WhatsAppTemplateName, context: TemplateContext): Array<{ type: 'text'; text: string }> {
    switch (templateName) {
      case 'birthday_reminder':
        return [
          { type: 'text', text: String(context.recipientName ?? '') },
          { type: 'text', text: String(context.birthdayPersonName ?? '') },
          { type: 'text', text: String(context.daysRemaining ?? context.daysUntil ?? '') },
        ]
      case 'gift_pool_reminder':
        return [
          { type: 'text', text: String(context.recipientName ?? '') },
          { type: 'text', text: String(context.birthdayPersonName ?? '') },
        ]
      case 'event_reminder':
        return [
          { type: 'text', text: String(context.recipientName ?? '') },
          { type: 'text', text: String(context.eventName ?? context.eventTitle ?? '') },
          { type: 'text', text: String(context.eventDate ?? '') },
        ]
      case 'access_approved':
      case 'welcome':
      case 'happy_birthday':
        return [{ type: 'text', text: String(context.recipientName ?? '') }]
      default:
        return []
    }
  }

  private logActivity(entry: {
    templateName: WhatsAppTemplateName
    recipientId: string
    recipientName: string
    recipientPhone?: string
    status: 'sent' | 'failed' | 'skipped'
    error?: string
    messageId?: string
  }): void {
    const timestamp = new Date().toISOString()
    const payload = {
      channel: 'whatsapp',
      notificationType: entry.templateName,
      recipient: entry.recipientName,
      recipientId: entry.recipientId,
      recipientPhone: entry.recipientPhone,
      status: entry.status,
      timestamp,
      failureReason: entry.error,
      messageId: entry.messageId,
    }

    if (entry.status === 'failed') {
      console.error('[WhatsApp]', payload)
      return
    }

    console.log('[WhatsApp]', payload)
  }

  async sendTemplate(
    templateName: WhatsAppTemplateName,
    context: TemplateContext,
    recipient: WhatsAppRecipient,
    recipientId: string
  ): Promise<WhatsAppSendResult> {
    const timestamp = new Date().toISOString()
    const resolvedPhone = this.resolvePhoneNumber(recipient)
    const phoneId = process.env.WHATSAPP_PHONE_ID?.trim()
    const token = process.env.WHATSAPP_TOKEN?.trim()

    if (!resolvedPhone) {
      const error = 'Invalid or missing phone number'
      this.logActivity({
        templateName,
        recipientId,
        recipientName: recipient.name,
        status: 'failed',
        error,
      })
      return {
        success: false,
        status: 'failed',
        templateName,
        recipientId,
        error,
        timestamp,
      }
    }

    if (!phoneId || !token) {
      const error = 'WhatsApp Cloud API is not configured'
      this.logActivity({
        templateName,
        recipientId,
        recipientName: recipient.name,
        recipientPhone: resolvedPhone,
        status: 'skipped',
        error,
      })
      return {
        success: false,
        status: 'skipped',
        templateName,
        recipientId,
        recipientPhone: resolvedPhone,
        error,
        timestamp,
      }
    }

    try {
      const response = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: this.normalizeWhatsAppRecipient(resolvedPhone),
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: 'en_US',
            },
            components: [
              {
                type: 'body',
                parameters: this.buildParameters(templateName, context),
              },
            ],
          },
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        const error = payload?.error?.message || `WhatsApp API request failed with status ${response.status}`
        this.logActivity({
          templateName,
          recipientId,
          recipientName: recipient.name,
          recipientPhone: resolvedPhone,
          status: 'failed',
          error,
        })
        return {
          success: false,
          status: 'failed',
          templateName,
          recipientId,
          recipientPhone: resolvedPhone,
          error,
          timestamp,
        }
      }

      const messageId = payload?.messages?.[0]?.id
      this.logActivity({
        templateName,
        recipientId,
        recipientName: recipient.name,
        recipientPhone: resolvedPhone,
        status: 'sent',
        messageId,
      })

      return {
        success: true,
        status: 'sent',
        templateName,
        recipientId,
        recipientPhone: resolvedPhone,
        messageId,
        timestamp,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown WhatsApp error'
      this.logActivity({
        templateName,
        recipientId,
        recipientName: recipient.name,
        recipientPhone: resolvedPhone,
        status: 'failed',
        error: errorMessage,
      })
      return {
        success: false,
        status: 'failed',
        templateName,
        recipientId,
        recipientPhone: resolvedPhone,
        error: errorMessage,
        timestamp,
      }
    }
  }

  async sendBirthdayReminder(
    recipient: WhatsAppRecipient,
    birthdayPersonName: string,
    daysRemaining: number,
    recipientId: string
  ): Promise<WhatsAppSendResult> {
    return this.sendTemplate(
      'birthday_reminder',
      {
        recipientName: recipient.name,
        birthdayPersonName,
        daysRemaining,
      },
      recipient,
      recipientId
    )
  }

  async sendGiftPoolReminder(
    recipient: WhatsAppRecipient,
    birthdayPersonName: string,
    recipientId: string
  ): Promise<WhatsAppSendResult> {
    return this.sendTemplate(
      'gift_pool_reminder',
      {
        recipientName: recipient.name,
        birthdayPersonName,
      },
      recipient,
      recipientId
    )
  }

  async sendEventReminder(
    recipient: WhatsAppRecipient,
    eventName: string,
    eventDate: string,
    recipientId: string
  ): Promise<WhatsAppSendResult> {
    return this.sendTemplate(
      'event_reminder',
      {
        recipientName: recipient.name,
        eventName,
        eventDate,
      },
      recipient,
      recipientId
    )
  }

  async sendWelcomeMessage(recipient: WhatsAppRecipient, recipientId: string): Promise<WhatsAppSendResult> {
    return this.sendTemplate(
      'welcome',
      {
        recipientName: recipient.name,
      },
      recipient,
      recipientId
    )
  }

  async sendHappyBirthday(recipient: WhatsAppRecipient, recipientId: string): Promise<WhatsAppSendResult> {
    return this.sendTemplate(
      'happy_birthday',
      {
        recipientName: recipient.name,
      },
      recipient,
      recipientId
    )
  }

  async sendAccessApproved(recipient: WhatsAppRecipient, recipientId: string): Promise<WhatsAppSendResult> {
    return this.sendTemplate(
      'access_approved',
      {
        recipientName: recipient.name,
      },
      recipient,
      recipientId
    )
  }
}

export const whatsappService = new WhatsAppService()