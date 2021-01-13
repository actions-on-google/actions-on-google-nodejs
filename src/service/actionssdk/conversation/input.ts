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

import * as Api from '../api/v2';

export class Input {
  /**
   * Gets the user's raw input query.
   *
   * Will also be sent via intent handler 2nd argument which is the encouraged method to retrieve.
   *
   * @example
   * ```javascript
   *
   * // Encouraged method through intent handler
   * app.intent('actions.intent.TEXT', (conv, input) => {
   *  conv.close(`You said ${input}`)
   * })
   *
   * // Using conv.input.raw
   * app.intent('actions.intent.TEXT', conv => {
   *  conv.close(`You said ${conv.input.raw}`)
   * })
   * ```
   *
   * @public
   */
  raw: string;

  /**
   * Gets type of input used for this request.
   * @public
   */
  type: Api.GoogleActionsV2RawInputInputType;

  /** @hidden */
  constructor(input: Api.GoogleActionsV2RawInput = {}) {
    this.raw = input.query!;
    this.type = input.inputType!;
  }
}
