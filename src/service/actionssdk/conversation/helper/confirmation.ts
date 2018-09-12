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
import { SoloHelper } from './helper'

/** @public */
export type ConfirmationArgument = boolean

/**
 * Asks user for a confirmation.
 *
 * @example
 * ```javascript
 *
 * // Actions SDK
 * const app = actionssdk()
 *
 * app.intent('actions.intent.MAIN', conv => {
 *   conv.ask(new Confirmation('Are you sure you want to do that?'))
 * })
 *
 * app.intent('actions.intent.CONFIRMATION', (conv, input, confirmation) => {
 *   if (confirmation) {
 *     conv.close(`Great! I'm glad you want to do it!`)
 *   } else {
 *     conv.close(`That's okay. Let's not do it now.`)
 *   }
 * })
 *
 * // Dialogflow
 * const app = dialogflow()
 *
 * app.intent('Default Welcome Intent', conv => {
 *   conv.ask(new Confirmation('Are you sure you want to do that?'))
 * })
 *
 * // Create a Dialogflow intent with the `actions_intent_CONFIRMATION` event
 * app.intent('Get Confirmation', (conv, input, confirmation) => {
 *   if (confirmation) {
 *     conv.close(`Great! I'm glad you want to do it!`)
 *   } else {
 *     conv.close(`That's okay. Let's not do it now.`)
 *   }
 * })
 * ```
 *
 * @public
 */
export class Confirmation extends SoloHelper<
  'actions.intent.CONFIRMATION',
  Api.GoogleActionsV2ConfirmationValueSpec
> {
  /**
   * @param text The confirmation prompt presented to the user to
   *     query for an affirmative or negative response.
   * @public
   */
  constructor(text: string) {
    super({
      intent: 'actions.intent.CONFIRMATION',
      type: 'type.googleapis.com/google.actions.v2.ConfirmationValueSpec',
      data: {
        dialogSpec: {
          requestConfirmationText: text,
        },
      },
    })
  }
}
