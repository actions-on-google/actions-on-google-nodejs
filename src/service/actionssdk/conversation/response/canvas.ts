/**
 * Copyright 2019 Google Inc. All Rights Reserved.
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
import { JsonObject } from '../../../../common'

/** @public */
export interface ImmersiveResponseOptions<TState extends JsonObject = JsonObject> {
  /**
   * The url of the web app.
   *
   * Alias of `loadImmersiveUrl`
   * @public
   */
  url?: string

  /**
   * Configure if the mic is closed after this immersive response.
   *
   * Alias of `suppressMic`
   * @public
   */
  suppress?: boolean

  /**
   * Communicate the following JSON object to the web app.
   *
   * Alias of `updatedState`
   * @public
   */
  state?: TState
}

/**
 * Immersive Canvas Response
 * @public
 */
export interface ImmersiveResponse extends Api.GoogleActionsV2UiElementsImmersiveResponse { }
export class ImmersiveResponse<TState extends JsonObject = JsonObject>
  implements Api.GoogleActionsV2UiElementsImmersiveResponse {
  /**
   * @param options Canvas options
   * @public
   */
  constructor(options: ImmersiveResponseOptions<TState> |
      Api.GoogleActionsV2UiElementsImmersiveResponse = {}) {
    const abstracted = options as ImmersiveResponseOptions
    const raw = options as Api.GoogleActionsV2UiElementsImmersiveResponse
    this.loadImmersiveUrl = raw.loadImmersiveUrl || abstracted.url
    this.suppressMic = typeof raw.suppressMic !== 'undefined' ?
      raw.suppressMic : abstracted.suppress
    this.updatedState = raw.updatedState || abstracted.state
  }

  /** @public */
  get url() {
    return this.loadImmersiveUrl
  }

  /** @public */
  set url(url) {
    this.loadImmersiveUrl = url
  }

  /** @public */
  get suppress() {
    return !!this.suppressMic
  }

  /** @public */
  set suppress(suppress) {
    this.suppressMic = suppress
  }

  /** @public */
  get state() {
    return this.updatedState as TState
  }

  /** @public */
  set state(state) {
    this.updatedState = state
  }
}
