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
 * Requests the user to register for daily updates.
 *
 * @example
 * ```javascript
 *
 * // Actions SDK
 * const app = actionssdk()
 *
 * app.intent('actions.intent.MAIN', conv => {
 *   conv.ask(new RegisterUpdate({
 *     frequency: 'DAILY',
 *     intent: 'show.image',
 *     arguments: [{
 *       name: 'image_to_show',
 *       textValue: 'image_type_1',
 *     }],
 *   }))
 * })
 *
 * app.intent('show.image', conv => {
 *   const arg = conv.arguments.get('image_to_show') // will be 'image_type_1'
 *   // do something with arg
 * })
 *
 * // Dialogflow
 * const app = dialogflow()
 *
 * app.intent('Default Welcome Intent', conv => {
 *   conv.ask(new RegisterUpdate({
 *     frequency: 'DAILY',
 *     intent: 'Show Image',
 *     arguments: [{
 *       name: 'image_to_show',
 *       textValue: 'image_type_1',
 *     }],
 *   }))
 * })
 *
 * app.intent('Show Image', conv => {
 *   const arg = conv.arguments.get('image_to_show') // will be 'image_type_1'
 *   // do something with arg
 * })
 * ```
 *
 * @public
 */
class RegisterUpdate extends helper_1.SoloHelper {
    /**
     * @param options RegisterUpdate options
     * @public
     */
    constructor(options) {
        super({
            intent: 'actions.intent.REGISTER_UPDATE',
            type: 'type.googleapis.com/google.actions.v2.RegisterUpdateValueSpec',
            data: {
                intent: options.intent,
                arguments: options.arguments,
                triggerContext: {
                    timeContext: {
                        frequency: options.frequency,
                    },
                },
            },
        });
    }
}
exports.RegisterUpdate = RegisterUpdate;
//# sourceMappingURL=registerupdate.js.map