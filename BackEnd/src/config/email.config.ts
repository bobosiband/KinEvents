import nodemailer from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'

let transport: Mail | null = null

/**
 * Creates a Nodemailer transport for Gmail SMTP if credentials are configured.
 * Returns null if EMAIL_USER or EMAIL_PASS is missing.
 */
function createTransport(): Mail | null {
  const user = process.env.EMAIL_USER?.trim()
  const pass = process.env.EMAIL_PASS?.trim()

  if (!user || !pass) {
    console.warn('[EMAIL] SMTP credentials not configured — email sending disabled')
    return null
  }

  try {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // STARTTLS
      auth: {
        user,
        pass,
      },
    })
  } catch (error) {
    console.error('[EMAIL] Failed to create transport:', error)
    return null
  }
}

/**
 * Lazy-loads and returns the Nodemailer transport singleton.
 * Initializes on first call, reuses on subsequent calls.
 */
export function getTransport(): Mail | null {
  if (!transport) {
    transport = createTransport()
  }
  return transport
}
