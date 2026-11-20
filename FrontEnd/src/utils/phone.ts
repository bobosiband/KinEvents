import parsePhoneNumberFromString, { AsYouType } from 'libphonenumber-js'

const DefaultRegion = 'AU' as const

export function isValidPhone(raw: string | undefined | null): boolean {
  if (!raw) return false
  const parsed = parsePhoneNumberFromString(raw, DefaultRegion)
  return Boolean(parsed?.isValid())
}

export function normalizePhone(raw: string): string {
  const parsed = parsePhoneNumberFromString(raw, DefaultRegion)
  if (!parsed || !parsed.isValid()) {
    throw new Error(`Invalid phone number: ${raw}`)
  }
  return parsed.number
}

export function normalizePhoneOptional(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined
  return normalizePhone(raw)
}

export function formatPhoneAsYouType(raw: string): string {
  if (!raw) return ''
  return new AsYouType(DefaultRegion).input(raw)
}
