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
 * Requests the user to switch to another surface during the conversation.
 * Works only for en-* locales.
 *
 * @example
 * ```javascript
 *
 * // Actions SDK
 * const app = actionssdk()
 *
 * const imageResponses = [
 *   `Here's an image of Google`,
 *   new Image({
 *     url: 'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/' +
 *       'Search_GSA.2e16d0ba.fill-300x300.png',
 *     alt: 'Google Logo',
 *   })
 * ]
 *
 * app.intent('actions.intent.MAIN', conv => {
 *   const capability = 'actions.capability.SCREEN_OUTPUT'
 *   if (conv.surface.capabilities.has(capability)) {
 *     conv.close(...imageResponses)
 *   } else {
 *     conv.ask(new NewSurface({
 *       capabilities: capability,
 *       context: 'To show you an image',
 *       notification: 'Check out this image',
 *     }))
 *   }
 * })
 *
 * app.intent('actions.intent.NEW_SURFACE', (conv, input, newSurface) => {
 *   if (newSurface.status === 'OK') {
 *     conv.close(...imageResponses)
 *   } else {
 *     conv.close(`Ok, I understand. You don't want to see pictures. Bye`)
 *   }
 * })
 *
 * // Dialogflow
 * const app = dialogflow()
 *
 * const imageResponses = [
 *   `Here's an image of Google`,
 *   new Image({
 *     url: 'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/' +
 *       'Search_GSA.2e16d0ba.fill-300x300.png',
 *     alt: 'Google Logo',
 *   })
 * ]
 *
 * app.intent('Default Welcome Intent', conv => {
 *   const capability = 'actions.capability.SCREEN_OUTPUT'
 *   if (conv.surface.capabilities.has(capability)) {
 *     conv.close(...imageResponses)
 *   } else {
 *     conv.ask(new NewSurface({
 *       capabilities: capability,
 *       context: 'To show you an image',
 *       notification: 'Check out this image',
 *     }))
 *   }
 * })
 *
 * // Create a Dialogflow intent with the `actions_intent_NEW_SURFACE` event
 * app.intent('Get New Surface', (conv, input, newSurface) => {
 *   if (newSurface.status === 'OK') {
 *     conv.close(...imageResponses)
 *   } else {
 *     conv.close(`Ok, I understand. You don't want to see pictures. Bye`)
 *   }
 * })
 * ```
 *
 * @public
 */
class NewSurface extends helper_1.SoloHelper {
    /**
     * @param options NewSurface options
     * @public
     */
    constructor(options) {
        super({
            intent: 'actions.intent.NEW_SURFACE',
            type: 'type.googleapis.com/google.actions.v2.NewSurfaceValueSpec',
            data: {
                capabilities: common_1.toArray(options.capabilities),
                context: options.context,
                notificationTitle: options.notification,
            },
        });
    }
}
exports.NewSurface = NewSurface;
//# sourceMappingURL=newsurface.js.map