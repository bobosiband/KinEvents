# 1.8 — Phone number validation

**Branch:** `bongani/phone-validation`  
**Scope:** validation and storage normalization only. No SMS verification.

## Library

- Add `libphonenumber-js` to both frontend and backend `package.json`.
- Default region: `AU`.
- Store the normalized international form (e.g. `+61412345678`). Never store the raw user input.

## Backend

Create `src/phone/PhoneValidator.ts`:

```ts
import parsePhoneNumberFromString from 'libphonenumber-js'
import { ValidationError } from '../errors/DomainError'

export class PhoneValidator {
  public static normalize(raw: string): string {
    const parsed = parsePhoneNumberFromString(raw, 'AU')
    if (!parsed || !parsed.isValid()) {
      throw new ValidationError(`Invalid phone number: ${raw}`)
    }
    return parsed.number // +E.164
  }

  public static isValid(raw: string): boolean {
    const parsed = parsePhoneNumberFromString(raw, 'AU')
    return Boolean(parsed?.isValid())
  }
}
```

Every write path (user create, user update, access request if phone collected) passes raw input through `PhoneValidator.normalize`. The repository layer rejects unformatted values with a Mongo schema validator too so bad values can't sneak in via scripts.

## Frontend

- Reuse the same library on the frontend for client-side validation on blur. Same failure message copy as backend.
- Phone inputs use `inputmode="tel"`, `type="tel"`, and format as the user types (library's `AsYouType('AU')`).

## Admin list of existing invalids

- Add `GET /api/admin/phone-numbers/invalid` — iterates `users`, parses each `phone`, returns the ones where `PhoneValidator.isValid` is false. Includes `{ id, name, email, phone, reason }`.
- Admin UI page `/admin/invalid-phones` lists them with an "edit" link.

## Tests

- Unit tests for normalize / isValid, including AU local (`0412345678`), international (`+61412345678`), UK, invalid.
- Handler test for the admin endpoint.
