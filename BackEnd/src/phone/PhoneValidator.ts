import parsePhoneNumberFromString from 'libphonenumber-js'

export class PhoneValidator {
  private static readonly DefaultRegion: 'AU' = 'AU'

  public static isValid(raw: string | undefined | null): boolean {
    if (!raw) return false
    const parsed = parsePhoneNumberFromString(raw, PhoneValidator.DefaultRegion)
    return Boolean(parsed?.isValid())
  }

  public static normalize(raw: string): string {
    const parsed = parsePhoneNumberFromString(raw, PhoneValidator.DefaultRegion)
    if (!parsed || !parsed.isValid()) {
      throw new PhoneValidationError(`Invalid phone number: ${raw}`)
    }
    return parsed.number
  }

  public static normalizeOptional(raw: string | undefined | null): string | undefined {
    if (!raw) return undefined
    return PhoneValidator.normalize(raw)
  }
}

export class PhoneValidationError extends Error {
  public readonly statusCode: number = 400
  public constructor(message: string) {
    super(message)
    this.name = 'PhoneValidationError'
  }
}
