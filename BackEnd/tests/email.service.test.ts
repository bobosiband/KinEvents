import { EmailService } from '../src/services/email.service'
import { EmailServiceClient } from '../src/services/EmailServiceClient'
import type { EmailAddress } from '../src/interfaces/email.interface'

describe('EmailService', () => {
  const recipient: EmailAddress = { name: 'Test User', email: 'user@example.com' }

  describe('without EMAIL_SERVICE_URL / API_KEY', () => {
    const previousUrl = process.env.EMAIL_SERVICE_URL
    const previousKey = process.env.EMAIL_SERVICE_API_KEY
    const previousNodeEnv = process.env.NODE_ENV

    beforeAll(() => {
      delete process.env.EMAIL_SERVICE_URL
      delete process.env.EMAIL_SERVICE_API_KEY
      process.env.NODE_ENV = 'production'
    })
    afterAll(() => {
      process.env.NODE_ENV = previousNodeEnv ?? 'test'
      if (previousUrl) process.env.EMAIL_SERVICE_URL = previousUrl
      if (previousKey) process.env.EMAIL_SERVICE_API_KEY = previousKey
    })

    it('sendTemplate returns false and does not throw', async () => {
      const service = new EmailService()
      await expect(
        service.sendTemplate('welcome', { recipientName: 'A' }, recipient, 'user-1'),
      ).resolves.toBe(false)
    })

    it('getEmailLogs returns an empty list', async () => {
      const service = new EmailService()
      await expect(service.getEmailLogs()).resolves.toEqual([])
    })
  })

  describe('in NODE_ENV=test', () => {
    it('sendTemplate is a no-op returning true', async () => {
      const service = new EmailService()
      await expect(
        service.sendTemplate('welcome', { recipientName: 'A' }, recipient, 'user-1'),
      ).resolves.toBe(true)
    })
  })

  describe('with client (unreachable network)', () => {
    const previousUrl = process.env.EMAIL_SERVICE_URL
    const previousKey = process.env.EMAIL_SERVICE_API_KEY
    const previousNodeEnv = process.env.NODE_ENV

    beforeAll(() => {
      process.env.EMAIL_SERVICE_URL = 'http://127.0.0.1:1'
      process.env.EMAIL_SERVICE_API_KEY = 'test-key'
      process.env.NODE_ENV = 'production'
    })
    afterAll(() => {
      process.env.NODE_ENV = previousNodeEnv ?? 'test'
      if (previousUrl) process.env.EMAIL_SERVICE_URL = previousUrl
      else delete process.env.EMAIL_SERVICE_URL
      if (previousKey) process.env.EMAIL_SERVICE_API_KEY = previousKey
      else delete process.env.EMAIL_SERVICE_API_KEY
    })

    it('sendTemplate returns false on network failure, never throws', async () => {
      const service = new EmailService()
      await expect(
        service.sendTemplate('welcome', { recipientName: 'A' }, recipient, 'user-1'),
      ).resolves.toBe(false)
    })

    it('getEmailLogs returns [] on network failure, never throws', async () => {
      const service = new EmailService()
      await expect(service.getEmailLogs()).resolves.toEqual([])
    })
  })
})

describe('EmailServiceClient.fromEnv', () => {
  const previousUrl = process.env.EMAIL_SERVICE_URL
  const previousKey = process.env.EMAIL_SERVICE_API_KEY

  afterEach(() => {
    if (previousUrl) process.env.EMAIL_SERVICE_URL = previousUrl
    else delete process.env.EMAIL_SERVICE_URL
    if (previousKey) process.env.EMAIL_SERVICE_API_KEY = previousKey
    else delete process.env.EMAIL_SERVICE_API_KEY
  })

  it('returns null when EMAIL_SERVICE_URL is missing', () => {
    delete process.env.EMAIL_SERVICE_URL
    process.env.EMAIL_SERVICE_API_KEY = 'x'
    expect(EmailServiceClient.fromEnv()).toBeNull()
  })

  it('returns null when EMAIL_SERVICE_API_KEY is missing', () => {
    process.env.EMAIL_SERVICE_URL = 'https://example.com'
    delete process.env.EMAIL_SERVICE_API_KEY
    expect(EmailServiceClient.fromEnv()).toBeNull()
  })

  it('returns a client when both are set', () => {
    process.env.EMAIL_SERVICE_URL = 'https://example.com'
    process.env.EMAIL_SERVICE_API_KEY = 'x'
    expect(EmailServiceClient.fromEnv()).toBeInstanceOf(EmailServiceClient)
  })
})
