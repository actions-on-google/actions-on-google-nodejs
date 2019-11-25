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
const surface_1 = require("./surface");
const user_1 = require("./user");
const response_1 = require("./response");
const helper_1 = require("./helper");
const argument_1 = require("./argument");
const device_1 = require("./device");
const input_1 = require("./input");
/**
 * Throw an UnauthorizedError in an intent handler to make the library
 * respond with a HTTP 401 Status Code.
 *
 * @example
 * ```javascript
 * const app = dialogflow()
 *
 * // If using Actions SDK:
 * // const app = actionssdk()
 *
 * app.intent('intent', conv => {
 *   // ...
 *
 *   // given a function to check if a user auth is still valid
 *   const valid = checkUserAuthValid(conv)
 *   if (!valid) {
 *     throw new UnauthorizedError()
 *   }
 *
 *   // ...
 * })
 *
 * ```
 *
 * @public
 */
class UnauthorizedError extends Error {
}
exports.UnauthorizedError = UnauthorizedError;
/** @public */
class Conversation {
    /** @hidden */
    constructor(options = {}) {
        /** @public */
        this.responses = [];
        /** @public */
        this.expectUserResponse = true;
        /** @public */
        this.digested = false;
        /**
         * Set reprompts when users don't provide input to this action (no-input errors).
         * Each reprompt represents as the {@link SimpleResponse}, but raw strings also can be specified
         * for convenience (they're passed to the constructor of {@link SimpleResponse}).
         * Notice that this value is not kept over conversations. Thus, it is necessary to set
         * the reprompts per each conversation response.
         *
         * @example
         * ```javascript
         *
         * app.intent('actions.intent.MAIN', conv => {
         *   conv.noInputs = [
         *     'Are you still there?',
         *     'Hello?',
         *     new SimpleResponse({
         *       text: 'Talk to you later. Bye!',
         *       speech: '<speak>Talk to you later. Bye!</speak>'
         *     })
         *   ]
         *   conv.ask('What's your favorite color?')
         * })
         * ```
         *
         * @public
         */
        this.noInputs = [];
        /**
         * Sets speech biasing options.
         *
         * @example
         * ``` javascript
         *
         * app.intent('actions.intent.MAIN', conv => {
         *   conv.speechBiasing = ['red', 'blue', 'green']
         *   conv.ask('What is your favorite color out of red, blue, and green?')
         * })
         * ```
         *
         * @public
         */
        this.speechBiasing = [];
        /** @hidden */
        this._responded = false;
        /** @hidden */
        this._ordersv3 = false;
        const { request = {}, headers = {}, init = {}, ordersv3 = false } = options;
        this.request = request;
        this.headers = headers;
        this._init = init;
        this._ordersv3 = ordersv3;
        this.sandbox = !!this.request.isInSandbox;
        const { inputs = [], conversation = {} } = this.request;
        const [input = {}] = inputs;
        const { rawInputs = [] } = input;
        this.input = new input_1.Input(rawInputs[0]);
        this.surface = new surface_1.Surface(this.request.surface);
        this.available = new surface_1.Available(this.request.availableSurfaces);
        this.user = new user_1.User(this.request.user, this._init.storage);
        this.arguments = new argument_1.Arguments(input.arguments);
        this.device = new device_1.Device(this.request.device);
        this.id = conversation.conversationId;
        this.type = conversation.type;
        this.screen = this.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
    }
    /** @public */
    json(json) {
        this._raw = json;
        this._responded = true;
        return this;
    }
    /** @public */
    add(...responses) {
        if (this.digested) {
            throw new Error('Response has already been sent. ' +
                'Is this being used in an async call that was not ' +
                'returned as a promise to the intent handler?');
        }
        this.responses.push(...responses);
        this._responded = true;
        return this;
    }
    /**
     * Asks to collect user's input. All user's queries need to be sent to the app.
     * {@link https://developers.google.com/actions/policies/general-policies#user_experience|
     *     The guidelines when prompting the user for a response must be followed at all times}.
     *
     * @example
     * ```javascript
     *
     * // Actions SDK
     * const app = actionssdk()
     *
     * app.intent('actions.intent.MAIN', conv => {
     *   const ssml = '<speak>Hi! <break time="1"/> ' +
     *     'I can read out an ordinal like <say-as interpret-as="ordinal">123</say-as>. ' +
     *     'Say a number.</speak>'
     *   conv.ask(ssml)
     * })
     *
     * app.intent('actions.intent.TEXT', (conv, input) => {
     *   if (input === 'bye') {
     *     return conv.close('Goodbye!')
     *   }
     *   const ssml = `<speak>You said, <say-as interpret-as="ordinal">${input}</say-as></speak>`
     *   conv.ask(ssml)
     * })
     *
     * // Dialogflow
     * const app = dialogflow()
     *
     * app.intent('Default Welcome Intent', conv => {
     *   conv.ask('Welcome to action snippets! Say a number.')
     * })
     *
     * app.intent('Number Input', (conv, {num}) => {
     *   conv.close(`You said ${num}`)
     * })
     * ```
     *
     * @param responses A response fragment for the library to construct a single complete response
     * @public
     */
    ask(...responses) {
        this.expectUserResponse = true;
        return this.add(...responses);
    }
    /**
     * Have Assistant render the speech response and close the mic.
     *
     * @example
     * ```javascript
     *
     * // Actions SDK
     * const app = actionssdk()
     *
     * app.intent('actions.intent.MAIN', conv => {
     *   const ssml = '<speak>Hi! <break time="1"/> ' +
     *     'I can read out an ordinal like <say-as interpret-as="ordinal">123</say-as>. ' +
     *     'Say a number.</speak>'
     *   conv.ask(ssml)
     * })
     *
     * app.intent('actions.intent.TEXT', (conv, input) => {
     *   if (input === 'bye') {
     *     return conv.close('Goodbye!')
     *   }
     *   const ssml = `<speak>You said, <say-as interpret-as="ordinal">${input}</say-as></speak>`
     *   conv.ask(ssml)
     * })
     *
     * // Dialogflow
     * const app = dialogflow()
     *
     * app.intent('Default Welcome Intent', conv => {
     *   conv.ask('Welcome to action snippets! Say a number.')
     * })
     *
     * app.intent('Number Input', (conv, {num}) => {
     *   conv.close(`You said ${num}`)
     * })
     * ```
     *
     * @param responses A response fragment for the library to construct a single complete response
     * @public
     */
    close(...responses) {
        this.expectUserResponse = false;
        return this.add(...responses);
    }
    /** @public */
    response() {
        if (!this._responded) {
            throw new Error('No response has been set. ' +
                'Is this being used in an async call that was not ' +
                'returned as a promise to the intent handler?');
        }
        if (this.digested) {
            throw new Error('Response has already been digested');
        }
        this.digested = true;
        const { expectUserResponse } = this;
        let richResponse = new response_1.RichResponse();
        let expectedIntent;
        let requireSimpleResponse = false;
        for (const response of this.responses) {
            if (typeof response === 'string') {
                richResponse.add(response);
                continue;
            }
            if (response instanceof helper_1.Helper) {
                if (!(response instanceof helper_1.SoloHelper)) {
                    requireSimpleResponse = true;
                }
                if (this._ordersv3) {
                    let type = null;
                    if (response instanceof helper_1.TransactionDecision) {
                        type = 'type.googleapis.com/google.actions.transactions.v3.TransactionDecisionValueSpec';
                    }
                    else if (response instanceof helper_1.TransactionRequirements) {
                        type =
                            'type.googleapis.com/google.actions.transactions.v3.TransactionRequirementsCheckSpec';
                    }
                    if (type !== null) {
                        response.inputValueData['@type'] = type;
                    }
                }
                expectedIntent = response;
                continue;
            }
            if (response instanceof response_1.RichResponse) {
                richResponse = response;
                continue;
            }
            if (response instanceof response_1.Suggestions) {
                requireSimpleResponse = true;
                richResponse.addSuggestion(response);
                continue;
            }
            if (response instanceof response_1.Image) {
                requireSimpleResponse = true;
                richResponse.add(new response_1.BasicCard({ image: response }));
                continue;
            }
            if (response instanceof response_1.MediaObject) {
                requireSimpleResponse = true;
                richResponse.add(new response_1.MediaResponse(response));
                continue;
            }
            if (response instanceof response_1.BasicCard ||
                response instanceof response_1.Table ||
                response instanceof response_1.BrowseCarousel ||
                response instanceof response_1.MediaResponse ||
                response instanceof response_1.OrderUpdate ||
                response instanceof response_1.LinkOutSuggestion) {
                requireSimpleResponse = true;
                richResponse.add(response);
                continue;
            }
            richResponse.add(response);
        }
        if (this._ordersv3) {
            for (const response of richResponse.items) {
                const { structuredResponse } = response;
                if (structuredResponse && structuredResponse.orderUpdate) {
                    response.structuredResponse = { orderUpdateV3: structuredResponse.orderUpdate };
                }
            }
        }
        let hasSimpleResponse = false;
        for (const response of richResponse.items) {
            if (response.simpleResponse) {
                hasSimpleResponse = true;
                break;
            }
        }
        if (requireSimpleResponse && !hasSimpleResponse) {
            throw new Error('A simple response is required in addition to this type of response');
        }
        const userStorageIn = (new user_1.User(this.user.raw, this._init.storage))._serialize();
        const userStorageOut = this.user._serialize();
        const userStorage = userStorageOut === userStorageIn ? '' : userStorageOut;
        const response = {
            expectUserResponse,
            richResponse,
            userStorage,
            expectedIntent,
        };
        if (this.noInputs.length > 0) {
            response.noInputPrompts = this.noInputs.map(prompt => {
                return (typeof prompt === 'string') ? new response_1.SimpleResponse(prompt) : prompt;
            });
        }
        if (this.speechBiasing.length > 0) {
            response.speechBiasingHints = this.speechBiasing;
        }
        return response;
    }
}
exports.Conversation = Conversation;
//# sourceMappingURL=conversation.js.map