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
import * as Api from '../../../api/v2';
import { Helper } from '../helper';
import { OptionArgument, OptionItems } from './option';
/** @public */
export declare type ListArgument = OptionArgument;
/** @public */
export interface ListOptions {
    /** @public */
    title?: string;
    /** @public */
    items: OptionItems | Api.GoogleActionsV2UiElementsListSelectListItem[];
}
/**
 * Asks to collect user's input with a list.
 *
 * @example
 * ```javascript
 *
 * // Actions SDK
 * const app = actionssdk()
 *
 * app.intent('actions.intent.MAIN', conv => {
 *   conv.ask('Which of these looks good?')
 *   conv.ask(new List({
 *     items: {
 *       [SELECTION_KEY_ONE]: {
 *         title: 'Number one',
 *         synonyms: ['synonym of KEY_ONE 1', 'synonym of KEY_ONE 2'],
 *       },
 *       [SELECTION_KEY_TWO]: {
 *         title: 'Number two',
 *         synonyms: ['synonym of KEY_TWO 1', 'synonym of KEY_TWO 2'],
 *       }
 *     }
 *   }))
 * })
 *
 * app.intent('actions.intent.OPTION', (conv, input, option) => {
 *   if (option === SELECTION_KEY_ONE) {
 *     conv.close('Number one is a great choice!')
 *   } else {
 *     conv.close('Number two is also a great choice!')
 *   }
 * })
 *
 * // Dialogflow
 * const app = dialogflow()
 *
 * app.intent('Default Welcome Intent', conv => {
 *   conv.ask('Which of these looks good?')
 *   conv.ask(new List({
 *     items: {
 *       [SELECTION_KEY_ONE]: {
 *         title: 'Number one',
 *         synonyms: ['synonym of KEY_ONE 1', 'synonym of KEY_ONE 2'],
 *       },
 *       [SELECTION_KEY_TWO]: {
 *         title: 'Number two',
 *         synonyms: ['synonym of KEY_TWO 1', 'synonym of KEY_TWO 2'],
 *       }
 *     }
 *   }))
 * })
 *
 * // Create a Dialogflow intent with the `actions_intent_OPTION` event
 * app.intent('Get Option', (conv, input, option) => {
 *   if (option === SELECTION_KEY_ONE) {
 *     conv.close('Number one is a great choice!')
 *   } else {
 *     conv.close('Number two is also a great choice!')
 *   }
 * })
 * ```
 *
 * @public
 */
export declare class List extends Helper<'actions.intent.OPTION', Api.GoogleActionsV2OptionValueSpec> {
    /**
     * @param options List options
     * @public
     */
    constructor(options: ListOptions);
}
