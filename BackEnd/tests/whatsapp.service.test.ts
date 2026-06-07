import { whatsappService } from '../src/services/whatsapp.service'
import { resetDb } from './helpers/db.helper'

describe('WhatsAppService', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    resetDb()
    process.env.WHATSAPP_PHONE_ID = '1179468255241846'
    process.env.WHATSAPP_TOKEN = 'test-whatsapp-token'
    global.fetch = jest.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  it('validates E.164 phone numbers', () => {
    expect(whatsappService.validatePhoneNumber('+61412345678')).toBe(true)
    expect(whatsappService.validatePhoneNumber('+27712345678')).toBe(true)
    expect(whatsappService.validatePhoneNumber('+447123456789')).toBe(true)
    expect(whatsappService.validatePhoneNumber('0412345678')).toBe(false)
    expect(whatsappService.validatePhoneNumber('12345')).toBe(false)
    expect(whatsappService.validatePhoneNumber('abc123')).toBe(false)
  })

  it.each([
    [
      'birthday_reminder',
      () => whatsappService.sendBirthdayReminder({ name: 'Alex', phone: '+61412345678' }, 'Taylor', 3, 'user-1'),
      ['Alex', 'Taylor', '3'],
    ],
    [
      'gift_pool_reminder',
      () => whatsappService.sendGiftPoolReminder({ name: 'Alex', phone: '+61412345678' }, 'Taylor', 'user-1'),
      ['Alex', 'Taylor'],
    ],
    [
      'event_reminder',
      () => whatsappService.sendEventReminder({ name: 'Alex', phone: '+61412345678' }, 'Family Dinner', '2026-06-10', 'user-1'),
      ['Alex', 'Family Dinner', '2026-06-10'],
    ],
    [
      'welcome',
      () => whatsappService.sendWelcomeMessage({ name: 'Alex', phone: '+61412345678' }, 'user-1'),
      ['Alex'],
    ],
    [
      'access_approved',
      () => whatsappService.sendAccessApproved({ name: 'Alex', phone: '+61412345678' }, 'user-1'),
      ['Alex'],
    ],
    [
      'happy_birthday',
      () => whatsappService.sendHappyBirthday({ name: 'Alex', phone: '+61412345678' }, 'user-1'),
      ['Alex'],
    ],
  ])('builds the %s template payload', async (templateName, action, expectedParameters) => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [{ id: 'msg-1' }] }),
    })

    const result = await action()

    expect(result.success).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(1)

    const [, requestInit] = (global.fetch as jest.Mock).mock.calls[0]
    const body = JSON.parse(requestInit.body)

    expect(body.template.name).toBe(templateName)
    expect(body.to).toBe('61412345678')
    expect(body.template.components[0].parameters.map((parameter: { text: string }) => parameter.text)).toEqual(expectedParameters)
  })

  it('returns a failure for invalid phone numbers without calling Meta', async () => {
    const result = await whatsappService.sendWelcomeMessage({ name: 'Alex', phone: '0412345678' }, 'user-1')

    expect(result.success).toBe(false)
    expect(result.status).toBe('failed')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('handles API failures gracefully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: 'Invalid template' } }),
    })

    const result = await whatsappService.sendAccessApproved({ name: 'Alex', phone: '+61412345678' }, 'user-1')

    expect(result.success).toBe(false)
    expect(result.status).toBe('failed')
    expect(result.error).toContain('Invalid template')
  })
})