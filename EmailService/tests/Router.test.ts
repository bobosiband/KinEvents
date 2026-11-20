import { Router } from '../src/api/Router'
import { EmailService } from '../src/services/EmailService'
import { InMemoryEmailLogRepository } from '../src/repositories/InMemoryEmailLogRepository'
import { TemplateRegistry } from '../src/templates/TemplateRegistry'
import type { ISendMailOptions, ITransport } from '../src/services/ITransport'

class FakeTransport implements ITransport {
  public readonly sent: ISendMailOptions[] = []
  public async send(options: ISendMailOptions): Promise<void> {
    this.sent.push(options)
  }
  public async verify(): Promise<void> {
    /* ok */
  }
}

describe('Router', () => {
  const buildRouter = () => {
    const transport = new FakeTransport()
    const repo = new InMemoryEmailLogRepository()
    const service = new EmailService(transport, repo, TemplateRegistry.default())
    return { transport, repo, router: new Router(service) }
  }

  const apiKey = 'test-api-key'

  it('rejects POST /emails without API key', async () => {
    const { router } = buildRouter()
    const res = await router.route({
      method: 'POST',
      path: '/emails',
      headers: {},
      queryString: {},
      body: JSON.stringify({
        templateName: 'welcome',
        recipient: { name: 'Alex', email: 'alex@test.com' },
        recipientId: 'u1',
        data: { recipientName: 'Alex', loginUrl: 'https://app.test' },
      }),
    })
    expect(res.statusCode).toBe(401)
  })

  it('accepts POST /emails with valid API key', async () => {
    const { router, transport } = buildRouter()
    const res = await router.route({
      method: 'POST',
      path: '/emails',
      headers: { 'x-api-key': apiKey },
      queryString: {},
      body: JSON.stringify({
        templateName: 'welcome',
        recipient: { name: 'Alex', email: 'alex@test.com' },
        recipientId: 'u1',
        data: { recipientName: 'Alex', loginUrl: 'https://app.test' },
      }),
    })
    expect(res.statusCode).toBe(200)
    expect(transport.sent).toHaveLength(1)
    const body = JSON.parse(res.body)
    expect(body.success).toBe(true)
  })

  it('returns health without API key', async () => {
    const { router } = buildRouter()
    const res = await router.route({
      method: 'GET',
      path: '/health',
      headers: {},
      queryString: {},
      body: null,
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.status).toBe('ok')
    expect(body.transportReady).toBe(true)
  })

  it('returns logs with API key', async () => {
    const { router } = buildRouter()
    await router.route({
      method: 'POST',
      path: '/emails',
      headers: { 'x-api-key': apiKey },
      queryString: {},
      body: JSON.stringify({
        templateName: 'welcome',
        recipient: { name: 'Alex', email: 'alex@test.com' },
        recipientId: 'u1',
        data: { recipientName: 'Alex', loginUrl: 'https://app.test' },
      }),
    })
    const res = await router.route({
      method: 'GET',
      path: '/emails/logs',
      headers: { 'x-api-key': apiKey },
      queryString: {},
      body: null,
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.count).toBe(1)
    expect(body.logs[0].status).toBe('sent')
  })

  it('returns 400 for a missing template field', async () => {
    const { router } = buildRouter()
    const res = await router.route({
      method: 'POST',
      path: '/emails',
      headers: { 'x-api-key': apiKey },
      queryString: {},
      body: JSON.stringify({
        templateName: 'welcome',
        recipient: { name: 'Alex', email: 'alex@test.com' },
        recipientId: 'u1',
        data: {},
      }),
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 404 for unknown route', async () => {
    const { router } = buildRouter()
    const res = await router.route({
      method: 'GET',
      path: '/nope',
      headers: {},
      queryString: {},
      body: null,
    })
    expect(res.statusCode).toBe(404)
  })
})
