import type { NextFunction, Request, Response } from 'express'
import type { ZodSchema } from 'zod'

type ValidationTarget = 'body' | 'params' | 'query'

/**
 * Validates a request target with a Zod schema and replaces it with parsed data.
 * @param schema Zod schema used to validate the target.
 * @param target Request section to validate.
 */
export function validate<T>(schema: ZodSchema<T>, target: ValidationTarget = 'body') {
  return (request: Request, response: Response, next: NextFunction) => {
    const result = schema.safeParse(request[target])

    if (!result.success) {
      response.status(400).json({
        success: false,
        message: 'Validation failed',
        details: result.error.flatten(),
      })
      return
    }

    request[target] = result.data as Request[typeof target]
    next()
  }
}