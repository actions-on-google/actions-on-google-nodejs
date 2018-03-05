/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @file Example custom framework plugin to add additional plug and play support for koa
 */

import { Context } from 'koa'
import { Plugin, Framework, StandardHandler } from '../../../src'

export interface KoaHandler {
  (ctx: Context, next: Function): void
}

export class Koa implements Framework<KoaHandler> {
  handle(standard: StandardHandler) {
    return (ctx: Context, next: Function) => {
      standard(ctx.body, ctx.headers)
        .then(({ status, body }) => {
          ctx.status = status
          ctx.body = body
          next()
        })
        .catch((e: Error) => {
          console.error(e)
          ctx.status = 500
          ctx.body = { error: e.message }
          next()
        })
    }
  }

  isContext(first: {}): first is Context {
    return typeof (first as Context).is === 'function'
  }

  isNext(second: {}): second is Function {
    return typeof second === 'function'
  }

  check(first: {}, second: {}) {
    return this.isContext(first) && this.isNext(second)
  }
}

export const koa: Plugin<{}, {}> = app => {
  app.frameworks.koa = new Koa()
  return app
}
