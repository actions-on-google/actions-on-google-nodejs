"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("./helper");
/**
 * Asks user to provide a geo-located place, possibly using contextual information,
 * like a store near the user's location or a contact's address.
 *
 * Developer provides custom text prompts to tailor the request handled by Google.
 *
 * @example
 * ```javascript
 *
 * // Actions SDK
 * const app = actionssdk()
 *
 * app.intent('actions.intent.MAIN', conv => {
 *   conv.ask(new Place({
 *     prompt: 'Where do you want to get picked up?',
 *     context: 'To find a place to pick you up',
 *   }))
 * })
 *
 * app.intent('actions.intent.PLACE', (conv, input, place, status) => {
 *   if (place) {
 *     conv.close(`Ah, I see. You want to get picked up at ${place.formattedAddress}`)
 *   } else {
 *     // Possibly do something with status
 *     conv.close(`Sorry, I couldn't find where you want to get picked up`)
 *   }
 * })
 *
 * // Dialogflow
 * const app = dialogflow()
 *
 * app.intent('Default Welcome Intent', conv => {
 *   conv.ask(new Place({
 *     prompt: 'Where do you want to get picked up?',
 *     context: 'To find a place to pick you up',
 *   }))
 * })
 *
 * // Create a Dialogflow intent with the `actions_intent_PLACE` event
 * app.intent('Get Place', (conv, params, place, status) => {
 *   if (place) {
 *     conv.close(`Ah, I see. You want to get picked up at ${place.formattedAddress}`)
 *   } else {
 *     // Possibly do something with status
 *     conv.close(`Sorry, I couldn't find where you want to get picked up`)
 *   }
 * })
 * ```
 *
 * @public
 */
class Place extends helper_1.SoloHelper {
    /**
     * @param options Place options
     * @public
     */
    constructor(options) {
        const extension = {
            '@type': 'type.googleapis.com/google.actions.v2.PlaceValueSpec.PlaceDialogSpec',
            permissionContext: options.context,
            requestPrompt: options.prompt,
        };
        super({
            intent: 'actions.intent.PLACE',
            type: 'type.googleapis.com/google.actions.v2.PlaceValueSpec',
            data: {
                dialogSpec: {
                    extension,
                },
            },
        });
    }
}
exports.Place = Place;
//# sourceMappingURL=place.js.map