import sgMail from '@sendgrid/mail'

type SendMailOptions = {
  from: string
  to: string | string[]
  subject: string
  html?: string
  text?: string
  replyTo?: string
}

type SendGridTransport = {
  sendMail: (options: SendMailOptions) => Promise<unknown>
}

let transport: SendGridTransport | null = null

/**
 * Creates a SendGrid-backed transport if the API key is configured.
 * Returns null if SENDGRID_API_KEY is missing.
 */
function createTransport(): SendGridTransport | null {
  const apiKey = process.env.SENDGRID_API_KEY?.trim()

  if (!apiKey) {
    console.warn('[EMAIL] SENDGRID_API_KEY not configured — email sending disabled')
    return null
  }

  try {
    sgMail.setApiKey(apiKey)

    return {
      async sendMail(options: SendMailOptions): Promise<unknown> {
        return sgMail.send({
          from: options.from,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text ?? '',
          replyTo: options.replyTo,
        })
      },
    }
  } catch (error) {
    console.error('[EMAIL] Failed to create SendGrid transport:', error)
    return null
  }
}

/**
 * Lazy-loads and returns the Nodemailer transport singleton.
 * Initializes on first call, reuses on subsequent calls.
 */
export function getTransport(): SendGridTransport | null {
  if (!transport) {
    transport = createTransport()
  }
  return transport
}
