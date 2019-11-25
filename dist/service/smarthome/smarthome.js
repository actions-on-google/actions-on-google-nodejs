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
const common = require("../../common");
const googleapis_1 = require("googleapis");
const encoding = 'utf8';
const makeApiCall = (url, data, jwt) => {
    const options = {
        hostname: 'homegraph.googleapis.com',
        port: 443,
        path: url,
        method: 'POST',
        headers: {},
    };
    const apiCall = (options) => {
        if (jwt && !options.headers.Authorization) {
            throw new Error('JWT is defined but Authorization header is not defined '
                + JSON.stringify(options));
        }
        return new Promise((resolve, reject) => {
            const buffers = [];
            const req = common.request(options, (res) => {
                res.on('data', (d) => {
                    buffers.push(typeof d === 'string' ? Buffer.from(d, encoding) : d);
                });
                res.on('end', () => {
                    const apiResponse = Buffer.concat(buffers).toString(encoding);
                    const apiResponseJson = JSON.parse(apiResponse);
                    if (apiResponseJson.error && apiResponseJson.error.code >= 400) {
                        // While the response ended, it contains an error.
                        // In this case, this should reject the Promise.
                        reject(apiResponse);
                        return;
                    }
                    resolve(apiResponse);
                });
            });
            req.on('error', (e) => {
                reject(e);
            });
            // Write data to request body
            req.write(JSON.stringify(data));
            req.end();
        });
    };
    if (jwt) {
        return new Promise((resolve, reject) => {
            // For testing, we do not need to actually authorize
            if (jwt.client_id === 'sample-client-id') {
                options.headers = {
                    Authorization: ` Bearer 1234`,
                };
                resolve(options);
                return;
            }
            // Generate JWT, then make the API call if provided
            const jwtClient = new googleapis_1.google.auth.JWT(jwt.client_email, undefined, jwt.private_key, ['https://www.googleapis.com/auth/homegraph'], undefined);
            jwtClient.authorize((err, tokens) => {
                if (err) {
                    return reject(err);
                }
                options.headers = {
                    Authorization: ` Bearer ${tokens.access_token}`,
                };
                resolve(options);
            });
        })
            .then((options) => {
            return apiCall(options);
        });
    }
    else {
        return apiCall(options);
    }
};
/**
 *
 * @example
 * ```javascript
 *
 * const app = smarthome({
 *   debug: true,
 *   key: '<api-key>',
 *   jwt: require('./key.json')
 * });
 *
 * app.onSync((body, headers) => {
 *   return { ... }
 * });
 *
 * app.onQuery((body, headers) => {
 *   return { ... }
 * });
 *
 * app.onExecute((body, headers) => {
 *   return { ... }
 * });
 *
 * exports.smarthome = functions.https.onRequest(app);
 *
 * ```
 *
 * @public
 */
exports.smarthome = (options = {}) => assistant_1.attach({
    _intents: {},
    _intent(intent, handler) {
        this._intents[intent] = handler;
        return this;
    },
    onSync(handler) {
        return this._intent('action.devices.SYNC', handler);
    },
    onQuery(handler) {
        return this._intent('action.devices.QUERY', handler);
    },
    onExecute(handler) {
        return this._intent('action.devices.EXECUTE', handler);
    },
    onDisconnect(handler) {
        return this._intent('action.devices.DISCONNECT', handler);
    },
    requestSync(agentUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.jwt) {
                return yield makeApiCall('/v1/devices:requestSync', {
                    agent_user_id: agentUserId,
                }, this.jwt);
            }
            if (this.key) {
                return yield makeApiCall(`/v1/devices:requestSync?key=${encodeURIComponent(this.key)}`, {
                    agent_user_id: agentUserId,
                });
            }
            throw new Error(`An API key was not specified. ` +
                `Please visit https://console.cloud.google.com/apis/api/homegraph.googleapis.com/overview`);
        });
    },
    reportState(reportedState) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.jwt) {
                throw new Error(`A JWT was not specified. ` +
                    `Please visit https://console.cloud.google.com/apis/credentials`);
            }
            return yield makeApiCall('/v1/devices:reportStateAndNotification', reportedState, this.jwt);
        });
    },
    key: options.key,
    jwt: options.jwt,
    handler(body, headers, metadata = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const { intent } = body.inputs[0];
            const handler = this._intents[intent];
            return {
                status: 200,
                headers: {},
                body: yield handler(body, headers, metadata),
            };
        });
    },
}, options);
//# sourceMappingURL=smarthome.js.map