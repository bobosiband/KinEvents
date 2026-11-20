import { TemplateRegistry } from '../src/templates/TemplateRegistry'
import { NotFoundError, ValidationError } from '../src/errors/DomainError'

describe('TemplateRegistry', () => {
  const registry = TemplateRegistry.default()

  it('exposes every expected template name', () => {
    const names = registry.names().slice().sort()
    expect(names).toContain('welcome')
    expect(names).toContain('access-approved')
    expect(names).toContain('access-rejected')
    expect(names).toContain('access-request')
    expect(names).toContain('event-created')
    expect(names).toContain('event-reminder')
    expect(names).toContain('birthday-today')
    expect(names).toContain('birthday-reminder')
    expect(names).toContain('login-pin')
    expect(names).toContain('new-device-alert')
  })

  it('throws NotFoundError for an unknown template', () => {
    expect(() => registry.get('does-not-exist')).toThrow(NotFoundError)
  })

  it('renders access-approved with required fields', () => {
    const rendered = registry.get('access-approved').render({ recipientName: 'Alex', loginUrl: 'https://app.test/login' })
    expect(rendered.subject).toMatch(/Approved/i)
    expect(rendered.html).toContain('Alex')
    expect(rendered.html).toContain('https://app.test/login')
    expect(rendered.text).toContain('Alex')
  })

  it('escapes HTML in template data', () => {
    const rendered = registry.get('access-approved').render({
      recipientName: '<script>alert(1)</script>',
      loginUrl: 'https://app.test/login',
    })
    expect(rendered.html).not.toContain('<script>alert(1)</script>')
    expect(rendered.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
  })

  it('throws ValidationError when required fields are missing', () => {
    expect(() => registry.get('access-approved').render({ recipientName: 'Alex' })).toThrow(ValidationError)
  })

  it('renders login-pin with a code', () => {
    const rendered = registry.get('login-pin').render({ recipientName: 'Admin', code: '123456', expiresInMinutes: '10' })
    expect(rendered.html).toContain('123456')
    expect(rendered.text).toContain('123456')
  })
})
