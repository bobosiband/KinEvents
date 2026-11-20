import { PhoneValidator, PhoneValidationError } from '../src/phone/PhoneValidator'

describe('PhoneValidator', () => {
  it('normalizes AU national to +61 E.164', () => {
    expect(PhoneValidator.normalize('0412 345 678')).toBe('+61412345678')
    expect(PhoneValidator.normalize('0412345678')).toBe('+61412345678')
    expect(PhoneValidator.normalize('(04) 1234 5678')).toBe('+61412345678')
  })

  it('leaves valid international numbers alone', () => {
    expect(PhoneValidator.normalize('+447123456789')).toBe('+447123456789')
    expect(PhoneValidator.normalize('+27712345678')).toBe('+27712345678')
  })

  it('throws PhoneValidationError on invalid input', () => {
    expect(() => PhoneValidator.normalize('12345')).toThrow(PhoneValidationError)
    expect(() => PhoneValidator.normalize('not a phone')).toThrow(PhoneValidationError)
    expect(() => PhoneValidator.normalize('')).toThrow(PhoneValidationError)
  })

  it('isValid returns false for bad input and true for good', () => {
    expect(PhoneValidator.isValid('12345')).toBe(false)
    expect(PhoneValidator.isValid('')).toBe(false)
    expect(PhoneValidator.isValid(undefined)).toBe(false)
    expect(PhoneValidator.isValid(null)).toBe(false)
    expect(PhoneValidator.isValid('+61412345678')).toBe(true)
    expect(PhoneValidator.isValid('0412345678')).toBe(true)
  })

  it('normalizeOptional returns undefined for empty input', () => {
    expect(PhoneValidator.normalizeOptional(undefined)).toBeUndefined()
    expect(PhoneValidator.normalizeOptional(null)).toBeUndefined()
    expect(PhoneValidator.normalizeOptional('')).toBeUndefined()
    expect(PhoneValidator.normalizeOptional('0412345678')).toBe('+61412345678')
  })
})
