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
 * @file Add built in plug and play web framework support for express using body-parser
 */

import {Framework, StandardHandler} from './framework';
import {Request, Response} from 'express';
import * as common from '../common';

export interface ExpressHandler {
  /** @public */
  (request: Request, response: Response): void;
}

export interface ExpressMetadata {
  /** @public */
  request: Request;

  /** @public */
  response: Response;
}

/** @hidden */
export class Express implements Framework<ExpressHandler> {
  handle(standard: StandardHandler) {
    return (request: Request, response: Response) => {
      const metadata: ExpressMetadata = {
        request,
        response,
      };
      standard(request.body, request.headers, {express: metadata})
        .then(({status, body, headers}) => {
          if (headers) {
            for (const key in headers) {
              response.setHeader(key, headers[key]!);
            }
          }
          response.status(status).send(body);
        })
        .catch((e: Error) => {
          common.error(e.stack || e);
          response.status(500).send({error: e.message || e});
        });
    };
  }

  isResponse(second: {}): second is Response {
    return typeof (second as Response).send === 'function';
  }
  isRequest(first: {}): first is Request {
    return typeof (first as Request).get === 'function';
  }

  check(first: {}, second: {}) {
    return this.isRequest(first) && this.isResponse(second);
  }
}

/** @hidden */
export const express = new Express();
