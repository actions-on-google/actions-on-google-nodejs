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
import { AppOptions, AppHandler, ServiceBaseApp } from '../../assistant';
import { Headers, BuiltinFrameworkMetadata } from '../../framework';
import * as Api from './api/v1';
/** @public */
export interface SmartHomeJwt {
    type: 'service_account';
    project_id: string;
    private_key_id: string;
    private_key: string;
    client_email: string;
    client_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_x509_cert_url: string;
}
/** @public */
export interface SmartHomeOptions extends AppOptions {
    /**
     * An API key to use the home graph API. See
     * https://console.cloud.google.com/apis/api/homegraph.googleapis.com/overview
     * to learn more.
     * @public
     */
    key?: string;
    /**
     * A JWT (JSON Web Token) that is able to access the home graph API.
     * This is used for report state. See https://jwt.io/. A JWT can be
     * created through the Google Cloud Console: https://console.cloud.google.com/apis/credentials
     * @public
     */
    jwt?: SmartHomeJwt;
}
/** @public */
export interface SmartHomeHandler<TRequest extends Api.SmartHomeV1Request, TResponse extends Api.SmartHomeV1Response> {
    (body: TRequest, headers: Headers, framework: BuiltinFrameworkMetadata): TResponse | Promise<TResponse>;
}
/** @hidden */
export interface SmartHomeHandlers {
    [intent: string]: SmartHomeHandler<Api.SmartHomeV1Request, Api.SmartHomeV1Response>;
}
/** @public */
export interface SmartHomeApp extends ServiceBaseApp {
    /** @hidden */
    _intents: SmartHomeHandlers;
    /** @hidden */
    _intent(intent: Api.SmartHomeV1Intents, handler: SmartHomeHandler<Api.SmartHomeV1Request, Api.SmartHomeV1Response>): this;
    /**
     * Defines a function that will run when a SYNC request is received.
     *
     * @example
     * ```javascript
     *
     * const app = smarthome();
     * app.onSync((body, headers) => {
     *   return {
     *     requestId: 'ff36...',
     *     payload: {
     *       ...
     *     }
     *   }
     * })
     * ```
     *
     * @param handler The function that will run for a SYNC request. It should
     *   return a valid response or a Promise that resolves to valid response.
     *
     * @public
     */
    onSync(handler: SmartHomeHandler<Api.SmartHomeV1SyncRequest, Api.SmartHomeV1SyncResponse>): this;
    /**
     * Defines a function that will run when a QUERY request is received.
     *
     * @example
     * ```javascript
     *
     * const app = smarthome();
     * app.onQuery((body, headers) => {
     *   return {
     *     requestId: 'ff36...',
     *     payload: {
     *       ...
     *     }
     *   }
     * })
     * ```
     *
     * @param handler The function that will run for a QUERY request. It should
     *   return a valid response or a Promise that resolves to valid response.
     *
     * @public
     */
    onQuery(handler: SmartHomeHandler<Api.SmartHomeV1QueryRequest, Api.SmartHomeV1QueryResponse>): this;
    /**
     * Defines a function that will run when an EXECUTE request is received.
     *
     * @example
     * ```javascript
     *
     * const app = smarthome();
     * app.onExecute((body, headers) => {
     *   return {
     *     requestId: 'ff36...',
     *     payload: {
     *       ...
     *     }
     *   }
     * })
     * ```
     * @param handler The function that will run for an EXECUTE request. It should
     *   return a valid response or a Promise that resolves to valid response.
     *
     * @public
     */
    onExecute(handler: SmartHomeHandler<Api.SmartHomeV1ExecuteRequest, Api.SmartHomeV1ExecuteResponse>): this;
    /**
     * Defines a function that will run when a DISCONNECT request is received.
     *
     * @example
     * ```javascript
     *
     * const app = smarthome();
     * app.onDisconnect((body, headers) => {
     *   // User unlinked their account, stop reporting state for user
     *   return {}
     * })
     * ```
     * @param handler The function that will run for an EXECUTE request. It should
     *   return a valid response or a Promise that resolves to valid response.
     *
     * @public
     */
    onDisconnect(handler: SmartHomeHandler<Api.SmartHomeV1DisconnectRequest, Api.SmartHomeV1DisconnectResponse>): this;
    /**
     * Sends a request to the home graph to send a new SYNC request. This should
     * be called when a device is added or removed for a given user id.
     *
     * When calling this function, an API key needs to be provided as an option
     * in the constructor. See https://developers.google.com/actions/smarthome/create-app#request-sync
     * to learn more.
     *
     * @example
     * ```javascript
     *
     * const app = smarthome({
     *   key: "123ABC"
     * });
     *
     * const addNewDevice = () => {
     *   app.requestSync('user-123')
     *     .then((res) => {
     *       // Request sync was successful
     *     })
     *     .catch((res) => {
     *       // Request sync failed
     *     })
     * }
     *
     * // When request sync is called, a SYNC
     * // intent will be received soon after.
     * app.onSync(body => {
     *   // ...
     * })
     * ```
     *
     * @param agentUserId The user identifier.
     *
     * @public
     */
    requestSync(agentUserId: string): Promise<string>;
    /**
     * Reports the current state of a device or set of devices to the home graph.
     * This may be done if the state of the device was changed locally, like a
     * light turning on through a light switch.
     *
     * When calling this function, a JWT (JSON Web Token) needs to be provided
     * as an option in the constructor.
     *
     * @example
     * ```javascript
     * const app = smarthome({
     *   jwt: require('./jwt.json');
     * });
     *
     * const reportState = () => {
     *   app.reportState({
     *     requestId: '123ABC',
     *     agentUserId: 'user-123',
     *     payload: {
     *       devices: {
     *         states: {
     *           "light-123": {
     *             on: true
     *           }
     *         }
     *       }
     *     }
     *   })
     *   .then((res) => {
     *     // Report state was successful
     *   })
     *   .catch((res) => {
     *     // Report state failed
     *   })
     * };
     * ```
     *
     * @param reportedState A payload containing a device or set of devices with their states
     *
     * @public
     */
    reportState(reportedState: Api.SmartHomeV1ReportStateRequest): Promise<string>;
    /** @public */
    key?: string;
    /** @public */
    jwt?: SmartHomeJwt;
}
/** @public */
export interface SmartHome {
    (options?: SmartHomeOptions): AppHandler & SmartHomeApp;
}
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
export declare const smarthome: SmartHome;
