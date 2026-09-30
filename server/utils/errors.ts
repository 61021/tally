/** The code is what the client shows a message for; the status is the HTTP answer. */
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number = 409,
    public readonly detail?: Record<string, unknown>,
  ) {
    super(code)
    this.name = 'DomainError'
  }
}

export const badRequest = (code: string, detail?: Record<string, unknown>): DomainError => new DomainError(code, 400, detail)
export const forbidden = (code: string): DomainError => new DomainError(code, 403)
export const tooMany = (code: string, detail?: Record<string, unknown>): DomainError => new DomainError(code, 429, detail)
