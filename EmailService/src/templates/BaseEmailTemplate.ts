import { ValidationError } from '../errors/DomainError'
import type { RenderedEmail } from '../types/EmailTypes'

export abstract class BaseEmailTemplate {
  public abstract readonly name: string
  public abstract render(data: Record<string, unknown>): RenderedEmail

  protected requireString(data: Record<string, unknown>, key: string): string {
    const value = data[key]
    if (typeof value !== 'string' || value.length === 0) {
      throw new ValidationError(`Template data missing required string field '${key}'`)
    }
    return value
  }

  protected optionalString(data: Record<string, unknown>, key: string): string | undefined {
    const value = data[key]
    return typeof value === 'string' && value.length > 0 ? value : undefined
  }
}
