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
const permission_1 = require("./permission");
/**
 * Prompts the user for permission to send proactive updates at any time.
 *
 * @example
 * ```javascript
 *
 * // Actions SDK
 * const app = actionssdk()
 *
 * app.intent('actions.intent.MAIN', conv => {
 *   conv.ask(new UpdatePermission({
 *     intent: 'show.image',
 *     arguments: [{
 *       name: 'image_to_show',
 *       textValue: 'image_type_1',
 *     }
 *   ))
 * })
 *
 * app.intent('actions.intent.PERMISSION', conv => {
 *   const granted = conv.arguments.get('PERMISSION')
 *   if (granted) {
 *     conv.close(`Great, I'll send an update whenever I notice a change`)
 *   } else {
 *     // Response shows that user did not grant permission
 *     conv.close('Alright, just let me know whenever you need the weather!')
 *   }
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
 *   conv.ask(new UpdatePermission({
 *     intent: 'Show Image',
 *     arguments: [{
 *       name: 'image_to_show',
 *       textValue: 'image_type_1',
 *     }
 *   ))
 * })
 *
 * // Create a Dialogflow intent with the `actions_intent_PERMISSION` event
 * app.intent('Get Permission', conv => {
 *   const granted = conv.arguments.get('PERMISSION')
 *   if (granted) {
 *     conv.close(`Great, I'll send an update whenever I notice a change`)
 *   } else {
 *     // Response shows that user did not grant permission
 *     conv.close('Alright, just let me know whenever you need the weather!')
 *   }
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
class UpdatePermission extends permission_1.Permission {
    /**
     * @param options UpdatePermission options
     * @public
     */
    constructor(options) {
        super({
            permissions: 'UPDATE',
            extra: {
                updatePermissionValueSpec: {
                    arguments: options.arguments,
                    intent: options.intent,
                },
            },
        });
    }
}
exports.UpdatePermission = UpdatePermission;
//# sourceMappingURL=update.js.map