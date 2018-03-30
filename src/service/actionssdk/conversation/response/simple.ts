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

import * as Api from '../../api/v2'

/** @public */
export interface SimpleResponseOptions {
  /**
   * Speech to be spoken to user. SSML allowed.
   * @public
   */
  speech: string

  /**
   * Optional text to be shown to user
   * @public
   */
  text?: string
}

/**
 * Simple Response type.
 * @public
 */
export interface SimpleResponse extends Api.GoogleActionsV2SimpleResponse { }
export class SimpleResponse implements Api.GoogleActionsV2SimpleResponse {
  /**
   * @param options SimpleResponse options
   * @public
   */
  constructor(options: SimpleResponseOptions | string) {
    if (typeof options === 'string') {
      this.textToSpeech = options
      return
    }
    this.textToSpeech = options.speech
    this.displayText = options.text
  }
}
