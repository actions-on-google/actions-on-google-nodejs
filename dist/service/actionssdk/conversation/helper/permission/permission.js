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
const helper_1 = require("../helper");
const common_1 = require("../../../../../common");
/**
 * Asks the Assistant to guide the user to grant a permission. For example,
 * if you want your app to get access to the user's name, you would invoke
 * `conv.ask(new Permission)` with the context containing the reason for the request,
 * and the {@link GoogleActionsV2PermissionValueSpecPermissions} permission.
 * With this, the Assistant will ask the user, in your agent's voice,
 * the following: '[Context with reason for the request],
 * I'll just need to get your name from Google, is that OK?'.
 *
 * Once the user accepts or denies the request, the Assistant will fire another intent:
 * `actions.intent.PERMISSION` with a boolean argument: `PERMISSION`
 * and, if granted, the information that you requested.
 *
 * Notes for multiple permissions:
 * * The order in which you specify the permission prompts does not matter -
 *   it is controlled by the Assistant to provide a consistent user experience.
 * * The user will be able to either accept all permissions at once, or none.
 *   If you wish to allow them to selectively accept one or other, make several
 *   dialog turns asking for each permission independently with `conv.ask(new Permission)`.
 * * Asking for `DEVICE_COARSE_LOCATION` and `DEVICE_PRECISE_LOCATION` at once is
 *   equivalent to just asking for `DEVICE_PRECISE_LOCATION`
 *
 * @example
 * ```javascript
 *
 * // Actions SDK
 * const app = actionssdk()
 *
 * app.intent('actions.intent.MAIN', conv => {
 *   conv.ask(new Permission({
 *     context: 'To read your mind',
 *     permissions: 'NAME',
 *   }))
 * })
 *
 * app.intent('actions.intent.PERMISSION', (conv, input, granted) => {
 *   // granted: inferred first (and only) argument value, boolean true if granted, false if not
 *   const explicit = conv.arguments.get('PERMISSION') // also retrievable w/ explicit arguments.get
 *   const name = conv.user.name
 * })
 *
 * // Dialogflow
 * const app = dialogflow()
 *
 * app.intent('Default Welcome Intent', conv => {
 *   conv.ask(new Permission({
 *     context: 'To read your mind',
 *     permissions: 'NAME',
 *   }))
 * })
 *
 * // Create a Dialogflow intent with the `actions_intent_PERMISSION` event
 * app.intent('Get Permission', (conv, params, granted) => {
 *   // granted: inferred first (and only) argument value, boolean true if granted, false if not
 *   const explicit = conv.arguments.get('PERMISSION') // also retrievable w/ explicit arguments.get
 *   const name = conv.user.name
 * })
 * ```
 *
 * Read more:
 * * {@link GoogleActionsV2PermissionValueSpecPermissions|Supported Permissions}
 * * Check if the permission has been granted with `conv.arguments.get('PERMISSION')`
 * * {@link Device#location|conv.device.location}
 * * {@link User#name|conv.user.name}
 * * {@link Place|conv.ask(new Place)} which also can ask for Location permission to get a place
 * @public
 */
class Permission extends helper_1.SoloHelper {
    /**
     * @param options Permission options
     * @public
     */
    constructor(options) {
        super({
            intent: 'actions.intent.PERMISSION',
            type: 'type.googleapis.com/google.actions.v2.PermissionValueSpec',
            data: Object.assign({ optContext: options.context, permissions: common_1.toArray(options.permissions) }, options.extra),
        });
    }
}
exports.Permission = Permission;
//# sourceMappingURL=permission.js.map