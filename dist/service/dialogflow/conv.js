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
const actionssdk_1 = require("../actionssdk");
const context_1 = require("./context");
const incoming_1 = require("./incoming");
const CONV_DATA_CONTEXT = '_actions_on_google';
const CONV_DATA_CONTEXT_LIFESPAN = 99;
const SIMULATOR_WARNING = 'Cannot display response in Dialogflow simulator. ' +
    'Please test on the Google Assistant simulator instead.';
const isV1 = (body) => !!body.result;
const isSimulator = (body) => {
    if (isV1(body)) {
        return !body.originalRequest;
    }
    if (!body.originalDetectIntentRequest) {
        return false;
    }
    return Object.keys(body.originalDetectIntentRequest.payload).length === 0 &&
        !!body.responseId;
};
const getRequest = (body) => {
    if (isV1(body)) {
        const { originalRequest = {} } = body;
        const { data = {} } = originalRequest;
        return data;
    }
    const { originalDetectIntentRequest = {} } = body;
    const { payload = {} } = originalDetectIntentRequest;
    return payload;
};
const serializeData = (data) => JSON.stringify(data);
const deserializeData = (contexts, defaultData) => {
    const context = contexts.get(CONV_DATA_CONTEXT);
    if (context) {
        const { data } = context.parameters;
        if (typeof data === 'string') {
            return JSON.parse(data);
        }
    }
    return Object.assign({}, defaultData);
};
/** @public */
class DialogflowConversation extends actionssdk_1.Conversation {
    /** @public */
    constructor(options = {}) {
        const { body = {} } = options;
        super({
            request: getRequest(body),
            headers: options.headers,
            init: options.init,
            ordersv3: options.ordersv3,
        });
        this.body = body;
        if (isV1(this.body)) {
            this.version = 1;
            const { result = {} } = this.body;
            const { action = '', parameters = {}, contexts, resolvedQuery = '', metadata = {}, fulfillment, } = result;
            const { intentName = '' } = metadata;
            this.action = action;
            this.intent = intentName;
            this.parameters = parameters;
            this.contexts = new context_1.ContextValues(contexts);
            this.incoming = new incoming_1.Incoming(fulfillment);
            this.query = resolvedQuery;
        }
        else {
            this.version = 2;
            const { queryResult = {} } = this.body;
            const { action = '', parameters = {}, outputContexts, intent = {}, queryText = '', fulfillmentMessages, } = queryResult;
            const { displayName = '' } = intent;
            this.action = action;
            this.intent = displayName;
            this.parameters = parameters;
            this.contexts = new context_1.ContextValues(outputContexts, this.body.session);
            this.incoming = new incoming_1.Incoming(fulfillmentMessages);
            this.query = queryText;
        }
        for (const key in this.parameters) {
            const value = this.parameters[key];
            if (typeof value !== 'object') {
                // Convert all non-objects to strings for consistency
                this.parameters[key] = String(value);
            }
        }
        this.data = deserializeData(this.contexts, this._init.data);
    }
    /**
     * Triggers an intent of your choosing by sending a followup event from the webhook.
     * Final response can theoretically include responses but these will not be handled
     * by Dialogflow. Dialogflow will not pass anything back to Google Assistant, therefore
     * Google Assistant specific information, most notably conv.user.storage, is ignored.
     *
     * @example
     * ```javascript
     *
     * const app = dialogflow()
     *
     * // Create a Dialogflow intent with event 'apply-for-license-event'
     *
     * app.intent('Default Welcome Intent', conv => {
     *   conv.followup('apply-for-license-event', {
     *     date: new Date().toISOString(),
     *   })
     *   // The dialogflow intent with the 'apply-for-license-event' event
     *   // will be triggered with the given parameters `date`
     * })
     * ```
     *
     * @param event Name of the event
     * @param parameters Parameters to send with the event
     * @param lang The language of this query.
     *     See {@link https://dialogflow.com/docs/languages|Language Support}
     *     for a list of the currently supported language codes.
     *     Note that queries in the same session do not necessarily need to specify the same language.
     *     By default, it is the languageCode sent with Dialogflow's queryResult.languageCode
     * @public
     */
    followup(event, parameters, lang) {
        this._responded = true;
        if (this.version === 1) {
            this._followup = {
                name: event,
                data: parameters,
            };
            return this;
        }
        const body = this.body;
        this._followup = {
            name: event,
            parameters,
            languageCode: lang || body.queryResult.languageCode,
        };
        return this;
    }
    /** @public */
    serialize() {
        if (this._raw) {
            return this._raw;
        }
        let payload;
        if (this._followup) {
            this.digested = true;
        }
        else {
            const { richResponse, expectUserResponse, userStorage, expectedIntent, noInputPrompts, speechBiasingHints, } = this.response();
            const google = {
                expectUserResponse,
                systemIntent: expectedIntent && {
                    intent: expectedIntent.intent,
                    data: expectedIntent.inputValueData,
                },
                noInputPrompts,
                speechBiasingHints,
            };
            if (richResponse.items.length) {
                google.richResponse = richResponse;
            }
            if (userStorage) {
                google.userStorage = userStorage;
            }
            payload = { google };
        }
        const convDataDefault = deserializeData(this.contexts, this._init.data);
        const convDataIn = serializeData(convDataDefault);
        const convDataOut = serializeData(this.data);
        if (convDataOut !== convDataIn) {
            // Previously was setting every webhook call
            // But now will only set if different so lifespan does not get reset
            this.contexts.set(CONV_DATA_CONTEXT, CONV_DATA_CONTEXT_LIFESPAN, {
                data: convDataOut,
            });
        }
        const simulator = isSimulator(this.body);
        if (this.version === 1) {
            const response = {
                data: payload,
                followupEvent: this._followup,
            };
            const contextOut = this.contexts._serializeV1();
            if (contextOut.length) {
                response.contextOut = contextOut;
            }
            if (simulator && payload) {
                const { richResponse = {} } = payload.google;
                const { items = [] } = richResponse;
                // Simulator only shows speech response
                // Since this is only shown to the simulator as text, the speech is the displayText
                response.speech = SIMULATOR_WARNING;
                if (!payload.google.systemIntent && items.length < 2) {
                    for (const { simpleResponse } of items) {
                        if (simpleResponse) {
                            response.speech = simpleResponse.displayText ||
                                simpleResponse.textToSpeech;
                            break;
                        }
                    }
                }
            }
            return response;
        }
        const response = {
            payload,
            followupEventInput: this._followup,
        };
        const outputContexts = this.contexts._serialize();
        if (outputContexts.length) {
            response.outputContexts = outputContexts;
        }
        if (simulator && payload) {
            const { richResponse = {} } = payload.google;
            const { items = [] } = richResponse;
            response.fulfillmentText = SIMULATOR_WARNING;
            if (!payload.google.systemIntent && items.length < 2) {
                for (const { simpleResponse } of items) {
                    if (simpleResponse) {
                        response.fulfillmentText = simpleResponse.displayText ||
                            simpleResponse.textToSpeech;
                        break;
                    }
                }
            }
        }
        return response;
    }
}
exports.DialogflowConversation = DialogflowConversation;
//# sourceMappingURL=conv.js.map