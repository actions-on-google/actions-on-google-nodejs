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
/** @public */
export declare type RegisterUpdateArgument = Api.GoogleActionsV2RegisterUpdateValue;
/** @public */
export interface RegisterUpdateOptions {
    /**
     * The Dialogflow/Actions SDK intent name to be triggered when the update is received.
     * @public
     */
    intent: string;
    /**
     * The necessary arguments to fulfill the intent triggered on update.
     * These can be retrieved using {@link Arguments#get|conv.arguments.get}.
     * @public
     */
    arguments: Api.GoogleActionsV2Argument[];
    /**
     * The high-level frequency of the recurring update.
     * @public
     */
    frequency: Api.GoogleActionsV2TriggerContextTimeContextFrequency;
}
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
export declare class RegisterUpdate extends SoloHelper<'actions.intent.REGISTER_UPDATE', Api.GoogleActionsV2RegisterUpdateValueSpec> {
    /**
     * @param options RegisterUpdate options
     * @public
     */
    constructor(options: RegisterUpdateOptions);
}
