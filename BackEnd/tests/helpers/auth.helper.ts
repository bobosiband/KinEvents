import jwt from 'jsonwebtoken'

type TestJwtPayload = Record<string, unknown>

/**
 * Creates a signed JWT for tests.
 * @param payload JWT payload to sign.
 * @returns A signed token string.
 */
export function createTestToken(payload: TestJwtPayload = {}): string {
  const secret = process.env.JWT_SECRET ?? 'test-secret'
  return jwt.sign(payload, secret, { expiresIn: '1h' })
}

/**
 * Builds an authorization header for test requests.
 * @param payload JWT payload to embed in the test token.
 * @returns A bearer authorization header.
 */
export function createAuthHeader(payload: TestJwtPayload = {}): Record<string, string> {
  return {
    authorization: `Bearer ${createTestToken(payload)}`,
  }
}