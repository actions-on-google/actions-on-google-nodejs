/**
 * @file Add built in plug and play web framework support for koa using koa-bodyparser
 */

import { StandardHandler, Framework } from './framework'
import { Context, Response, Request } from 'koa'

export interface KoaHandler {
  /** @public */
  (ctx: Context): void
}

export interface KoaMetaData {
  /** @public */
  request: Request

  /** @public */
  response: Response
}

export class Koa implements Framework<KoaHandler> {
  handle(standard: StandardHandler) {
    return (ctx: Context) => {
      const { request, response } = ctx
      const metadata: KoaMetaData = {
        request,
        response,
      }

      standard(request.body, request.headers, { koa: metadata })
        .then(({ status, body, headers }) => {
          if (headers) {
            for (const key in headers) {
              const header = headers[key]

              if (header) {
                ctx.set(key, header)
              }
            }
          }

          ctx.status = status
          ctx.body = body
        })
        .catch(error => {
          ctx.status = 500
          ctx.body = { error: error.message || error }
        })
    }
  }

  check(ctx: Context) {
    return (
      typeof ctx === 'object' &&
      typeof ctx.request === 'object' &&
      typeof ctx.response === 'object' &&
      typeof ctx.state === 'object'
    )
  }
}

export const koa = new Koa()
