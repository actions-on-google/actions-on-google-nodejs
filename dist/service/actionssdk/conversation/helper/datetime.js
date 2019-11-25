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
 * Asks user for a timezone-agnostic date and time.
 *
 * @example
 * ```javascript
 *
 * // Actions SDK
 * const app = actionssdk()
 *
 * app.intent('actions.intent.MAIN', conv => {
 *   conv.ask(new DateTime({
 *     prompts: {
 *       initial: 'When do you want to come in?',
 *       date: 'Which date works best for you?',
 *       time: 'What time of day works best for you?',
 *     }
 *   }))
 * })
 *
 * app.intent('actions.intent.DATETIME', (conv, input, datetime) => {
 *   const { month, day } = datetime.date
 *   const { hours, minutes } = datetime.time
 *   conv.close(new SimpleResponse({
 *     speech: 'Great see you at your appointment!',
 *     text: `Great, we will see you on ${month}/${day} at ${hours} ${minutes || ''}`
 *   }))
 * })
 *
 * // Dialogflow
 * const app = dialogflow()
 *
 * app.intent('Default Welcome Intent', conv => {
 *   conv.ask(new DateTime({
 *     prompts: {
 *       initial: 'When do you want to come in?',
 *       date: 'Which date works best for you?',
 *       time: 'What time of day works best for you?',
 *     }
 *   }))
 * })
 *
 * // Create a Dialogflow intent with the `actions_intent_DATETIME` event
 * app.intent('Get Datetime', (conv, params, datetime) => {
 *   const { month, day } = datetime.date
 *   const { hours, minutes } = datetime.time
 *   conv.close(new SimpleResponse({
 *     speech: 'Great see you at your appointment!',
 *     text: `Great, we will see you on ${month}/${day} at ${hours} ${minutes || ''}`
 *   }))
 * })
 * ```
 *
 * @public
 */
class DateTime extends helper_1.SoloHelper {
    /**
     * @param options DateTime options
     * @public
     */
    constructor(options) {
        const { prompts = {} } = options;
        super({
            intent: 'actions.intent.DATETIME',
            type: 'type.googleapis.com/google.actions.v2.DateTimeValueSpec',
            data: {
                dialogSpec: {
                    requestDatetimeText: prompts.initial,
                    requestDateText: prompts.date,
                    requestTimeText: prompts.time,
                },
            },
        });
    }
}
exports.DateTime = DateTime;
//# sourceMappingURL=datetime.js.map