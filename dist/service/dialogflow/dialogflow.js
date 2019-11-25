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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const assistant_1 = require("../../assistant");
const actionssdk_1 = require("../actionssdk");
const common = require("../../common");
const conv_1 = require("./conv");
const google_auth_library_1 = require("google-auth-library");
const isVerification = (verification) => typeof verification.headers === 'object';
/**
 * This is the function that creates the app instance which on new requests,
 * creates a way to handle the communication with Dialogflow's fulfillment API.
 *
 * Supports Dialogflow v1 and v2.
 *
 * @example
 * ```javascript
 *
 * const app = dialogflow()
 *
 * app.intent('Default Welcome Intent', conv => {
 *   conv.ask('How are you?')
 * })
 * ```
 *
 * @public
 */
exports.dialogflow = (options = {}) => assistant_1.attach({
    _handlers: {
        intents: {},
        catcher: (conv, e) => {
            throw e;
        },
    },
    _middlewares: [],
    intent(intents, handler) {
        for (const intent of common.toArray(intents)) {
            this._handlers.intents[intent] = handler;
        }
        return this;
    },
    catch(catcher) {
        this._handlers.catcher = catcher;
        return this;
    },
    fallback(handler) {
        this._handlers.fallback = handler;
        return this;
    },
    middleware(middleware) {
        this._middlewares.push(middleware);
        return this;
    },
    init: options.init,
    verification: options.verification,
    _client: options.clientId ? new google_auth_library_1.OAuth2Client(options.clientId) : undefined,
    auth: options.clientId ? {
        client: {
            id: options.clientId,
        },
    } : undefined,
    ordersv3: options.ordersv3 || false,
    handler(body, headers, metadata = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const { debug, init, verification, ordersv3 } = this;
            if (verification) {
                const { headers: verificationHeaders, status = 403, error = (e) => e, } = isVerification(verification) ? verification :
                    { headers: verification };
                for (const key in verification) {
                    const check = headers[key.toLowerCase()];
                    if (!check) {
                        return {
                            status,
                            body: {
                                error: typeof error === 'string' ? error :
                                    error('A verification header key was not found'),
                            },
                        };
                    }
                    const value = verificationHeaders[key];
                    const checking = common.toArray(check);
                    if (checking.indexOf(value) < 0) {
                        return {
                            status,
                            body: {
                                error: typeof error === 'string' ? error :
                                    error('A verification header value was invalid'),
                            },
                        };
                    }
                }
            }
            let conv = new conv_1.DialogflowConversation({
                body,
                headers,
                init: init && init(),
                debug,
                ordersv3,
            });
            if (conv.user.profile.token) {
                yield conv.user._verifyProfile(this._client, this.auth.client.id);
            }
            for (const middleware of this._middlewares) {
                // tslint:disable-next-line:no-any genericize Conversation type
                const result = middleware(conv, metadata);
                conv = (result instanceof conv_1.DialogflowConversation ? result : ((yield result) || conv));
            }
            const log = debug ? common.info : common.debug;
            log('Conversation', common.stringify(conv, 'request', 'headers', 'body'));
            const { intent } = conv;
            const traversed = {};
            let handler = intent;
            while (typeof handler !== 'function') {
                if (typeof handler === 'undefined') {
                    if (!this._handlers.fallback) {
                        if (!intent) {
                            throw new Error('No intent was provided and fallback handler is not defined.');
                        }
                        throw new Error(`Dialogflow IntentHandler not found for intent: ${intent}`);
                    }
                    handler = this._handlers.fallback;
                    continue;
                }
                if (traversed[handler]) {
                    throw new Error(`Circular intent map detected: "${handler}" traversed twice`);
                }
                traversed[handler] = true;
                handler = this._handlers.intents[handler];
            }
            try {
                try {
                    yield handler(conv, conv.parameters, conv.arguments.parsed.list[0], conv.arguments.status.list[0]);
                }
                catch (e) {
                    yield this._handlers.catcher(conv, e);
                }
            }
            catch (e) {
                if (e instanceof actionssdk_1.UnauthorizedError) {
                    return {
                        status: 401,
                        headers: {},
                        body: {},
                    };
                }
                throw e;
            }
            return {
                status: 200,
                headers: {},
                body: conv.serialize(),
            };
        });
    },
}, options);
//# sourceMappingURL=dialogflow.js.map