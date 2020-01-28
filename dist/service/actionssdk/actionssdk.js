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
const conversation_1 = require("./conversation");
const conv_1 = require("./conv");
const google_auth_library_1 = require("google-auth-library");
const common = require("../../common");
/**
 * This is the function that creates the app instance which on new requests,
 * creates a way to interact with the conversation API directly from Assistant,
 * providing implementation for all the methods available in the API.
 *
 * Only supports Actions SDK v2.
 *
 * @example
 * ```javascript
 *
 * const app = actionssdk()
 *
 * app.intent('actions.intent.MAIN', conv => {
 *   conv.ask('How are you?')
 * })
 * ```
 *
 * @public
 */
exports.actionssdk = (options = {}) => assistant_1.attach({
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
    _client: (options.verification || options.clientId) ?
        new google_auth_library_1.OAuth2Client(options.clientId) : undefined,
    auth: options.clientId ? {
        client: {
            id: options.clientId,
        },
    } : undefined,
    ordersv3: options.ordersv3 || false,
    handler(body, headers, metadata = {}) {

        console.log("BODY: ", JSON.stringify(body))
        console.log("HEADERS: ", JSON.stringify(headers))
        //console.log("METADATA: ", JSON.stringify(metadata))

        return __awaiter(this, void 0, void 0, function* () {
            const { debug, init, verification, ordersv3 } = this;
            if (verification) {
                const { project, status = 403, error = (e) => e, } = typeof verification === 'string' ? { project: verification } : verification;
                const token = headers['authorization'];
                try {
                    yield this._client.verifyIdToken({
                        idToken: token,
                        audience: project,
                    });
                }
                catch (e) {
                    return {
                        status,
                        body: {
                            error: typeof error === 'string' ? error :
                                error(`ID token verification failed: ${e.stack || e.message || e}`),
                        },
                    };
                }
            }
            console.log("AFTER VERIFICATION");
            let conv = new conv_1.ActionsSdkConversation({
                body,
                headers,
                init: init && init(),
                debug,
                ordersv3,
            });
            console.log("CONV CREATED");
            for (const middleware of this._middlewares) {
                const result = middleware(conv, metadata);
                conv = (result instanceof conv_1.ActionsSdkConversation ? result : ((yield result) || conv));
            }
            console.log("MIDDLEWARE DONE");
            if (conv.user.profile.token) {
                yield conv.user._verifyProfile(new google_auth_library_1.OAuth2Client(conv.clientId), conv.clientId);
            }
            console.log("CLIENT ID VERIFIED");
            
            const log = debug ? common.info : common.debug;
            log('Conversation', common.stringify(conv, 'request', 'headers', 'body'));
            const { intent } = conv;
            const traversed = {};
            let handler = intent;
            while (typeof handler !== 'function') {
                console.log("HANDLER: ", handler);
                if (typeof handler === 'undefined') {
                    if (!this._handlers.fallback) {
                        throw new Error(`Actions SDK IntentHandler not found for intent: ${intent}`);
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
                    yield handler(conv, conv.input.raw, conv.arguments.parsed.list[0], conv.arguments.status.list[0]);
                }
                catch (e) {
                    yield this._handlers.catcher(conv, e);
                }
            }
            catch (e) {
                if (e instanceof conversation_1.UnauthorizedError) {
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
//# sourceMappingURL=actionssdk.js.map