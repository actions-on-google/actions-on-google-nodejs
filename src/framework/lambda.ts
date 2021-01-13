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

import {Framework, StandardHandler, Headers} from './framework';
import {JsonObject} from '../common';
import * as common from '../common';
import {Context, Callback} from 'aws-lambda';

export interface LambdaHandler {
  /** @public */
  (event: JsonObject, context: Context, callback: Callback): Promise<void>;
}

export interface LambdaMetadata {
  /** @public */
  event: JsonObject;

  /** @public */
  context: Context;
}

/** @hidden */
export class Lambda implements Framework<LambdaHandler> {
  handle(standard: StandardHandler) {
    return async (event: JsonObject, context: Context, callback: Callback) => {
      const metadata: LambdaMetadata = {
        context,
        event,
      };
      const entireBodyFormat =
        typeof event.headers !== 'object' || Array.isArray(event.headers);
      // convert header keys to lowercase for case insensitive header retrieval
      const headers = entireBodyFormat
        ? ({} as Headers)
        : Object.keys(event.headers).reduce((o, k) => {
            o[k.toLowerCase()] = event.headers[k];
            return o;
          }, {} as Headers);
      const body = entireBodyFormat
        ? event
        : typeof event.body === 'string'
        ? JSON.parse(event.body)
        : event.body;
      const result = await standard(body, headers, {lambda: metadata}).catch(
        (e: Error) => {
          common.error(e.stack || e);
          callback(e);
        }
      );
      if (!result) {
        return;
      }
      const {status} = result;
      callback(null, {
        statusCode: status,
        body: JSON.stringify(result.body),
        headers: result.headers,
      });
    };
  }

  isContext(second: {}): second is Context {
    return typeof (second as Context).succeed === 'function';
  }

  isCallback(third: {}): third is Callback {
    return typeof third === 'function';
  }

  check(first: {}, second: {}, third: {}) {
    return this.isContext(second) && this.isCallback(third);
  }
}

/** @hidden */
export const lambda = new Lambda();
