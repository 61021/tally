import type { EventHandler, EventHandlerRequest, H3Event } from 'h3'
import { createError, defineEventHandler, isError } from 'h3'
import { DomainError } from './errors'

function isZodFailure(error: unknown): error is { data: { issues: unknown[] } } {
  if (!isError(error) || error.statusCode !== 400)
    return false
  const data = error.data as { issues?: unknown } | undefined
  return Array.isArray(data?.issues)
}

export function toHttpError(error: unknown): unknown {
  if (error instanceof DomainError)
    return createError({ statusCode: error.status, statusMessage: error.code, data: { code: error.code, ...error.detail } })
  if (isZodFailure(error))
    return createError({ statusCode: 400, statusMessage: 'invalid_input', data: { code: 'invalid_input', issues: error.data.issues } })
  return error
}

export function defineApiHandler<T>(handler: (event: H3Event) => Promise<T>): EventHandler<EventHandlerRequest, Promise<T>> {
  return defineEventHandler(async (event) => {
    try {
      return await handler(event)
    }
    catch (error) {
      throw toHttpError(error)
    }
  })
}
