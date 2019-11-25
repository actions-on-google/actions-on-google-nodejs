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
const common_1 = require("../../../../common");
/**
 * Requests the user to transfer to a linked out Android app intent. Using this feature
 * requires verifying the linked app in the [Actions console](console.actions.google.com).
 *
 * @deprecated Access will be by request only
 *
 * @example
 * ```javascript
 *
 * // Actions SDK
 * const app = actionssdk()
 *
 * app.intent('actions.intent.MAIN', conv => {
 *   conv.ask('Great! Looks like we can do that in the app.')
 *   conv.ask(new DeepLink({
 *     destination: 'Google',
 *     url: 'example://gizmos',
 *     package: 'com.example.gizmos',
 *     reason: 'handle this for you',
 *   }))
 * })
 *
 * app.intent('actions.intent.LINK', (conv, input, arg, status) => {
 *   // possibly do something with status
 *   conv.close('Okay maybe we can take care of that another time.')
 * })
 *
 * // Dialogflow
 * const app = dialogflow()
 *
 * app.intent('Default Welcome Intent', conv => {
 *   conv.ask('Great! Looks like we can do that in the app.')
 *   conv.ask(new DeepLink({
 *     destination: 'Google',
 *     url: 'example://gizmos',
 *     package: 'com.example.gizmos',
 *     reason: 'handle this for you',
 *   }))
 * })
 *
 * // Create a Dialogflow intent with the `actions_intent_LINK` event
 * app.intent('Get Link Status', (conv, input, arg, status) => {
 *   // possibly do something with status
 *   conv.close('Okay maybe we can take care of that another time.')
 * })
 * ```
 *
 * @public
 */
class DeepLink extends helper_1.Helper {
    /**
     * @param options DeepLink options
     * @deprecated
     * @public
     */
    constructor(options) {
        common_1.deprecate('DeepLink', 'Access will be by request only');
        const extension = {
            '@type': 'type.googleapis.com/google.actions.v2.LinkValueSpec.LinkDialogSpec',
            destinationName: options.destination,
            requestLinkReason: options.reason,
        };
        super({
            intent: 'actions.intent.LINK',
            type: 'type.googleapis.com/google.actions.v2.LinkValueSpec',
            data: {
                openUrlAction: {
                    url: options.url,
                    androidApp: {
                        packageName: options.package,
                    },
                },
                dialogSpec: {
                    extension,
                },
            },
        });
    }
}
exports.DeepLink = DeepLink;
//# sourceMappingURL=deeplink.js.map