export class DomainError extends Error {
  constructor(code: string, message?: string) {
    super(message || code)
    this.name = code
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string) { super('NOT_FOUND', `${entity} not found`) }
}

export class ValidationError extends DomainError {
  constructor(message: string) { super('VALIDATION_ERROR', message) }
}
