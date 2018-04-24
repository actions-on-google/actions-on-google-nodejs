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
 * @file Add built in plug and play web framework support for lambda API gateway
 */

import { Framework, StandardHandler } from './framework'
import { JsonObject, error } from '../common'
import { Context, Callback } from 'aws-lambda'

export interface LambdaHandler {
  /** @public */
  (event: JsonObject, context: Context, callback: Callback): Promise<void>
}

export class Lambda implements Framework<LambdaHandler> {
  handle(standard: StandardHandler) {
    return async (event: JsonObject, context: Context, callback: Callback) => {
      const result = await standard(JSON.parse(event.body), event.headers).catch((e: Error) => {
        error(e.stack || e)
        callback(e)
      })
      if (!result) {
        return
      }
      const { status, body } = result
      callback(null, {
        statusCode: status,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(body),
      })
    }
  }

  isContext(second: {}): second is Context {
    return typeof (second as Context).succeed === 'function'
  }

  isCallback(third: {}): third is Callback {
    return typeof third === 'function'
  }

  check(first: {}, second: {}, third: {}) {
    return this.isContext(second) && this.isCallback(third)
  }
}

export const lambda = new Lambda()
