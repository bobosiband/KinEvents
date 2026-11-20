import { EmailService } from '../src/services/EmailService'
import { EmailDispatchError } from '../src/errors/DomainError'
import { InMemoryEmailLogRepository } from '../src/repositories/InMemoryEmailLogRepository'
import { TemplateRegistry } from '../src/templates/TemplateRegistry'
import type { ISendMailOptions, ITransport } from '../src/services/ITransport'

class SpyTransport implements ITransport {
  public readonly sendCalls: ISendMailOptions[] = []
  public failTimes: number = 0
  public verifyResult: Error | null = null
  public async send(options: ISendMailOptions): Promise<void> {
    if (this.failTimes > 0) {
      this.failTimes--
      this.sendCalls.push(options)
      throw new Error('simulated smtp failure')
    }
    this.sendCalls.push(options)
  }
  public async verify(): Promise<void> {
    if (this.verifyResult) throw this.verifyResult
  }
}

describe('EmailService', () => {
  const buildService = () => {
    const transport = new SpyTransport()
    const repo = new InMemoryEmailLogRepository()
    const service = new EmailService(transport, repo, TemplateRegistry.default())
    return { transport, repo, service }
  }

  it('sends an email on first try and logs it', async () => {
    const { transport, repo, service } = buildService()
    const result = await service.send({
      templateName: 'welcome',
      recipient: { name: 'Alex', email: 'alex@test.com' },
      recipientId: 'user-1',
      data: { recipientName: 'Alex', loginUrl: 'https://app.test' },
    })
    expect(result.success).toBe(true)
    expect(result.status).toBe('sent')
    expect(result.retryCount).toBe(0)
    expect(transport.sendCalls).toHaveLength(1)
    const logs = await repo.listAll(10)
    expect(logs).toHaveLength(1)
    expect(logs[0]?.status).toBe('sent')
    expect(logs[0]?.recipientId).toBe('user-1')
  })

  it('retries up to 3 times and succeeds on the third', async () => {
    const { transport, repo, service } = buildService()
    transport.failTimes = 2
    const result = await service.send({
      templateName: 'welcome',
      recipient: { name: 'Alex', email: 'alex@test.com' },
      recipientId: 'user-2',
      data: { recipientName: 'Alex', loginUrl: 'https://app.test' },
    })
    expect(result.success).toBe(true)
    expect(result.retryCount).toBe(2)
    expect(transport.sendCalls).toHaveLength(3)
    const logs = await repo.listAll(10)
    expect(logs[0]?.status).toBe('sent')
    expect(logs[0]?.retryCount).toBe(2)
  })

  it('records a failure after exhausting retries', async () => {
    const { transport, repo, service } = buildService()
    transport.failTimes = 999
    await expect(
      service.send({
        templateName: 'welcome',
        recipient: { name: 'Alex', email: 'alex@test.com' },
        recipientId: 'user-3',
        data: { recipientName: 'Alex', loginUrl: 'https://app.test' },
      }),
    ).rejects.toBeInstanceOf(EmailDispatchError)
    const logs = await repo.listAll(10)
    expect(logs[0]?.status).toBe('failed')
    expect(logs[0]?.retryCount).toBe(2)
  })

  it('verify() delegates to the transport and reports errors', async () => {
    const { transport, service } = buildService()
    transport.verifyResult = new Error('smtp down')
    await expect(service.verify()).rejects.toThrow('smtp down')
  })
})
