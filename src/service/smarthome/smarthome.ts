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

import { AppOptions, AppHandler, ServiceBaseApp, attach } from '../../assistant'
import { JsonObject } from '../../common'
import * as common from '../../common'
import { Headers, BuiltinFrameworkMetadata } from '../../framework'
import * as Api from './api/v1'
import { google } from 'googleapis'

const encoding = 'utf8'

/** @public */
export interface SmartHomeJwt {
  type: 'service_account',
  project_id: string,
  private_key_id: string,
  private_key: string,
  client_email: string,
  client_id: string,
  auth_uri: string,
  token_uri: string,
  auth_provider_x509_cert_url: string,
  client_x509_cert_url: string,
}

/** @public */
export interface SmartHomeOptions extends AppOptions {
  /**
   * An API key to use the home graph API. See
   * https://console.cloud.google.com/apis/api/homegraph.googleapis.com/overview
   * to learn more.
   * @public
   */
  key?: string

  /**
   * A JWT (JSON Web Token) that is able to access the home graph API.
   * This is used for report state. See https://jwt.io/. A JWT can be
   * created through the Google Cloud Console: https://console.cloud.google.com/apis/credentials
   * @public
   */
  jwt?: SmartHomeJwt
}

/** @public */
export interface SmartHomeHandler<
  TRequest extends Api.SmartHomeV1Request,
  TResponse extends Api.SmartHomeV1Response,
  > {
  (
    body: TRequest,
    headers: Headers,
    framework: BuiltinFrameworkMetadata,
  ): TResponse | Promise<TResponse>
}

/** @hidden */
export interface SmartHomeHandlers {
  [intent: string]: SmartHomeHandler<Api.SmartHomeV1Request, Api.SmartHomeV1Response>
}

/** @public */
export interface SmartHomeApp extends ServiceBaseApp {
  /** @hidden */
  _intents: SmartHomeHandlers

  /** @hidden */
  _intent(
    intent: Api.SmartHomeV1Intents,
    handler: SmartHomeHandler<Api.SmartHomeV1Request, Api.SmartHomeV1Response>,
  ): this

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
  onSync(
    handler: SmartHomeHandler<Api.SmartHomeV1SyncRequest, Api.SmartHomeV1SyncResponse>,
  ): this

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
  onQuery(
    handler: SmartHomeHandler<Api.SmartHomeV1QueryRequest, Api.SmartHomeV1QueryResponse>,
  ): this

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
  onExecute(
    handler: SmartHomeHandler<Api.SmartHomeV1ExecuteRequest, Api.SmartHomeV1ExecuteResponse>,
  ): this

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
  onDisconnect(
    handler: SmartHomeHandler<Api.SmartHomeV1DisconnectRequest, Api.SmartHomeV1DisconnectResponse>,
  ): this

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
  requestSync(agentUserId: string): Promise<string>

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
  reportState(reportedState: Api.SmartHomeV1ReportStateRequest): Promise<string>

  /** @public */
  key?: string

  /** @public */
  jwt?: SmartHomeJwt
}

/** @public */
export interface SmartHome {
  (options?: SmartHomeOptions): AppHandler & SmartHomeApp
}

const makeApiCall = (url: string, data: JsonObject, jwt?: SmartHomeJwt): Promise<string> => {
  const options = {
    hostname: 'homegraph.googleapis.com',
    port: 443,
    path: url,
    method: 'POST',
    headers: {},
  }

  const apiCall = (options: JsonObject) => {
    if (jwt && !options.headers.Authorization) {
      throw new Error('JWT is defined but Authorization header is not defined '
        + JSON.stringify(options))
    }
    return new Promise<string>((resolve, reject) => {
      const buffers: Buffer[] = []
      const req = common.request(options, (res) => {
        res.on('data', (d) => {
          buffers.push(typeof d === 'string' ? Buffer.from(d, encoding) : d)
        })

        res.on('end', () => {
          const apiResponse: string = Buffer.concat(buffers).toString(encoding)
          const apiResponseJson = JSON.parse(apiResponse)
          if (apiResponseJson.error && apiResponseJson.error.code >= 400) {
            // While the response ended, it contains an error.
            // In this case, this should reject the Promise.
            reject(apiResponse)
            return
          }
          resolve(apiResponse)
        })
      })

      req.on('error', (e) => {
        reject(e)
      })
      // Write data to request body
      req.write(JSON.stringify(data))
      req.end()
    })
  }

  if (jwt) {
    return new Promise<JsonObject>((resolve, reject) => {
      // For testing, we do not need to actually authorize
      if (jwt.client_id === 'sample-client-id') {
        options.headers = {
          Authorization: ` Bearer 1234`,
        }
        resolve(options)
        return
      }
      // Generate JWT, then make the API call if provided
      const jwtClient = new google.auth.JWT(
        jwt.client_email,
        undefined,
        jwt.private_key,
        ['https://www.googleapis.com/auth/homegraph'],
        undefined,
      )
      jwtClient.authorize((err: Error, tokens: JsonObject) => {
        if (err) {
          return reject(err)
        }
        options.headers = {
          Authorization: ` Bearer ${tokens.access_token}`,
        }
        resolve(options)
      })
    })
      .then((options) => {
        return apiCall(options)
      })
  } else {
    return apiCall(options)
  }
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
export const smarthome: SmartHome = (options = {}) => attach<SmartHomeApp>({
  _intents: {},
  _intent(this: SmartHomeApp, intent, handler) {
    this._intents[intent] = handler
    return this
  },
  onSync(this: SmartHomeApp, handler) {
    return this._intent('action.devices.SYNC', handler)
  },
  onQuery(this: SmartHomeApp, handler) {
    return this._intent('action.devices.QUERY', handler)
  },
  onExecute(this: SmartHomeApp, handler) {
    return this._intent('action.devices.EXECUTE', handler)
  },
  onDisconnect(this: SmartHomeApp, handler) {
    return this._intent('action.devices.DISCONNECT', handler)
  },
  async requestSync(this: SmartHomeApp, agentUserId) {
    if (this.jwt) {
      return await makeApiCall('/v1/devices:requestSync', {
        agent_user_id: agentUserId,
      }, this.jwt)
    }
    if (this.key) {
      return await makeApiCall(`/v1/devices:requestSync?key=${encodeURIComponent(this.key)}`, {
        agent_user_id: agentUserId,
      })
    }
    throw new Error(`An API key was not specified. ` +
        `Please visit https://console.cloud.google.com/apis/api/homegraph.googleapis.com/overview`)
  },
  async reportState(this: SmartHomeApp, reportedState) {
    if (!this.jwt) {
      throw new Error(`A JWT was not specified. ` +
        `Please visit https://console.cloud.google.com/apis/credentials`)
    }
    return await makeApiCall('/v1/devices:reportStateAndNotification',
      reportedState, this.jwt)
  },
  key: options.key,
  jwt: options.jwt,
  async handler(
    this: SmartHomeApp,
    body: Api.SmartHomeV1Request,
    headers,
    metadata = {},
  ) {
    const { intent } = body.inputs[0]
    const handler = this._intents[intent]

    return {
      status: 200,
      headers: {},
      body: await handler(body, headers, metadata),
    }
  },
}, options)
