export abstract class DomainError extends Error {
  public abstract readonly statusCode: number
  public constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class ValidationError extends DomainError {
  public readonly statusCode: number = 400
}

export class UnauthorizedError extends DomainError {
  public readonly statusCode: number = 401
}

export class ForbiddenError extends DomainError {
  public readonly statusCode: number = 403
}

export class NotFoundError extends DomainError {
  public readonly statusCode: number = 404
}

export class EmailDispatchError extends DomainError {
  public readonly statusCode: number = 502
}
