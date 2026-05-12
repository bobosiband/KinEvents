import nodemailer from 'nodemailer'

type SendMailOptions = {
  from: string
  to: string | string[]
  subject: string
  html?: string
  text?: string
  replyTo?: string
}

type EmailTransport = {
  sendMail: (options: SendMailOptions) => Promise<unknown>
}

const GMAIL_USER = process.env.GMAIL_USER?.trim() || process.env.EMAIL_USER?.trim() || ''
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD?.trim() || process.env.EMAIL_PASS?.trim() || ''
const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim() || ''

let transport: EmailTransport | null = null

function createGmailTransport(): EmailTransport | null {
  if (!GMAIL_USER || !GMAIL_PASS) return null

  const nodemailerTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  })

  return {
    async sendMail(options: SendMailOptions) {
      return nodemailerTransport.sendMail(options)
    },
  }
}

function createResendTransport(): EmailTransport | null {
  if (!RESEND_API_KEY) return null

  return {
    async sendMail(options: SendMailOptions) {
      const to = Array.isArray(options.to) ? options.to : [options.to]
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: options.from,
          to,
          subject: options.subject,
          html: options.html,
          text: options.text,
          reply_to: options.replyTo,
        }),
      })
      if (!response.ok) {
        const body = await response.text()
        throw new Error(`Resend API error ${response.status}: ${body}`)
      }
      return response.json()
    },
  }
}

export function getTransport(): EmailTransport | null {
  if (!transport) {
    transport = createGmailTransport() ?? createResendTransport()
    if (!transport) {
      console.warn('[EMAIL] No transport configured — set GMAIL_USER+GMAIL_APP_PASSWORD or RESEND_API_KEY')
    }
  }
  return transport
}

export function getFromAddress(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    GMAIL_USER ||
    process.env.RESEND_FROM?.trim() ||
    'noreply@kinevents.app'
  )
}
