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
const conversation_1 = require("./conversation");
const serializeData = (data) => JSON.stringify({ data });
const deserializeData = (body, defaultData) => {
    const { conversation = {} } = body;
    const { conversationToken } = conversation;
    const data = conversationToken ?
        JSON.parse(conversationToken).data : Object.assign({}, defaultData);
    return data;
};
/** @public */
class ActionsSdkConversation extends conversation_1.Conversation {
    /** @public */
    constructor(options = {}) {
        const { body = {} } = options;
        super({
            request: body,
            headers: options.headers,
            init: options.init,
            ordersv3: options.ordersv3,
        });
        this.body = body;
        const { inputs = [] } = body;
        const [firstInput = {}] = inputs;
        const { intent = '' } = firstInput;
        this.intent = intent;
        this.data = deserializeData(this.body, this._init.data);
    }
    /** @public */
    serialize() {
        if (this._raw) {
            return this._raw;
        }
        const { richResponse, expectUserResponse, userStorage, expectedIntent, noInputPrompts, speechBiasingHints, } = this.response();
        const inputPrompt = {
            noInputPrompts,
        };
        if (richResponse.items.length) {
            inputPrompt.richInitialPrompt = richResponse;
        }
        const possibleIntents = [expectedIntent || {
                intent: 'actions.intent.TEXT',
            }];
        const expectedInput = {
            possibleIntents,
            speechBiasingHints,
        };
        if (inputPrompt.richInitialPrompt || inputPrompt.noInputPrompts) {
            expectedInput.inputPrompt = inputPrompt;
        }
        const response = {
            expectUserResponse,
        };
        if (expectUserResponse) {
            response.expectedInputs = [expectedInput];
        }
        else {
            response.finalResponse = { richResponse };
        }
        const convDataDefault = deserializeData({}, this._init.data);
        const convDataDefaultSerialized = serializeData(convDataDefault);
        const convDataDefaulted = deserializeData(this.body, this._init.data);
        const convDataIn = serializeData(convDataDefaulted);
        const convDataOut = serializeData(this.data);
        if (convDataOut !== convDataDefaultSerialized || convDataOut !== convDataIn) {
            response.conversationToken = convDataOut;
        }
        if (userStorage) {
            response.userStorage = userStorage;
        }
        return response;
    }
}
exports.ActionsSdkConversation = ActionsSdkConversation;
//# sourceMappingURL=conv.js.map