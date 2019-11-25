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
import * as Api from '../../api/v2';
import { SoloHelper } from './helper';
import { SurfaceCapability } from '../surface';
/** @public */
export declare type NewSurfaceArgument = Api.GoogleActionsV2NewSurfaceValue;
/** @public */
export interface NewSurfaceOptions {
    /**
     * Context why new surface is requested.
     * It's the TTS prompt prefix (action phrase) we ask the user.
     * @public
     */
    context: string;
    /**
     * Title of the notification appearing on new surface device.
     * @public
     */
    notification: string;
    /**
     * The list of capabilities required in the surface.
     * @public
     */
    capabilities: SurfaceCapability | SurfaceCapability[];
}
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
export declare class NewSurface extends SoloHelper<'actions.intent.NEW_SURFACE', Api.GoogleActionsV2NewSurfaceValueSpec> {
    /**
     * @param options NewSurface options
     * @public
     */
    constructor(options: NewSurfaceOptions);
}
