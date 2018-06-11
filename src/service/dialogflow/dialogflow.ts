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

import * as Api from './api/v2'
import * as ActionsApi from '../actionssdk/api/v2'
import { AppHandler, attach } from '../../assistant'
import {
  ExceptionHandler,
  Traversed,
  Argument,
  ConversationApp,
  ConversationAppOptions,
} from '../actionssdk'
import * as common from '../../common'
import { Contexts, Parameters } from './context'
import { DialogflowConversation } from './conv'
import { OAuth2Client } from 'google-auth-library'
import { BuiltinFrameworkMetadata } from '../../framework'

/** @public */
export interface DialogflowIntentHandler<
  TConvData,
  TUserStorage,
  TContexts extends Contexts,
  TConversation extends DialogflowConversation<TConvData, TUserStorage, TContexts>,
  TParameters extends Parameters,
  TArgument extends Argument,
> {
  /** @public */
  (
    conv: TConversation,
    params: TParameters,
    /**
     * The first argument value from the current intent.
     * See {@link Arguments#get|Arguments.get}
     * Same as `conv.arguments.parsed.list[0]`
     */
    argument: TArgument,
    /**
     * The first argument status from the current intent.
     * See {@link Arguments#status|Arguments.status}
     * Same as `conv.arguments.status.list[0]`
     */
    status: ActionsApi.GoogleRpcStatus | undefined,
    // tslint:disable-next-line:no-any allow developer to return any just detect if is promise
  ): Promise<any> | any
}

/** @hidden */
export interface DialogflowIntentHandlers {
  [event: string]: DialogflowIntentHandler<
    Contexts,
    {},
    {},
    DialogflowConversation<{}, {}>,
    Parameters,
    Argument
  > | string | undefined
}

/** @hidden */
export interface DialogflowHandlers<
  TConvData,
  TUserStorage,
  TContexts extends Contexts,
  TConversation extends DialogflowConversation<TConvData, TUserStorage, TContexts>,
> {
  intents: DialogflowIntentHandlers
  catcher: ExceptionHandler<TUserStorage, TConversation>
  fallback?: DialogflowIntentHandler<
    Contexts,
    {},
    {},
    DialogflowConversation<{}, {}>,
    Parameters,
    Argument
  > | string
}

/** @public */
export interface DialogflowMiddleware<
  TConversationPlugin extends DialogflowConversation<{}, {}, Contexts>
> {
  (
    /** @public */
    conv: DialogflowConversation<{}, {}, Contexts>,

    /** @public */
    framework: BuiltinFrameworkMetadata,
  ): (DialogflowConversation<{}, {}, Contexts> & TConversationPlugin) |
    void |
    Promise<DialogflowConversation<{}, {}, Contexts> & TConversationPlugin> |
    Promise<void>
}

/** @public */
export interface DialogflowApp<
  TConvData,
  TUserStorage,
  TContexts extends Contexts,
  TConversation extends DialogflowConversation<TConvData, TUserStorage, TContexts>,
> extends ConversationApp<TConvData, TUserStorage> {
  /** @hidden */
  _handlers: DialogflowHandlers<TConvData, TUserStorage, TContexts, TConversation>

  /**
   * Sets the IntentHandler to be execute when the fulfillment is called
   * with a given Dialogflow intent name.
   *
   * @param intent The Dialogflow intent name to match.
   *     When given an array, sets the IntentHandler for any intent name in the array.
   * @param handler The IntentHandler to be executed when the intent name is matched.
   *     When given a string instead of a function, the intent fulfillment will be redirected
   *     to the IntentHandler of the redirected intent name.
   * @public
   */
  intent<TParameters extends Parameters>(
    intent: string | string[],
    handler: DialogflowIntentHandler<
      TConvData,
      TUserStorage,
      TContexts,
      TConversation,
      TParameters,
      Argument
    > | string,
  ): this

  /**
   * Sets the IntentHandler to be execute when the fulfillment is called
   * with a given Dialogflow intent name.
   *
   * @param intent The Dialogflow intent name to match.
   *     When given an array, sets the IntentHandler for any intent name in the array.
   * @param handler The IntentHandler to be executed when the intent name is matched.
   *     When given a string instead of a function, the intent fulfillment will be redirected
   *     to the IntentHandler of the redirected intent name.
   * @public
   */
  intent<TArgument extends Argument>(
    intent: string | string[],
    handler: DialogflowIntentHandler<
      TConvData,
      TUserStorage,
      TContexts,
      TConversation,
      Parameters,
      TArgument
    > | string,
  ): this

  /**
   * Sets the IntentHandler to be execute when the fulfillment is called
   * with a given Dialogflow intent name.
   *
   * @param intent The Dialogflow intent name to match.
   *     When given an array, sets the IntentHandler for any intent name in the array.
   * @param handler The IntentHandler to be executed when the intent name is matched.
   *     When given a string instead of a function, the intent fulfillment will be redirected
   *     to the IntentHandler of the redirected intent name.
   * @public
   */
  intent<TParameters extends Parameters, TArgument extends Argument>(
    intent: string | string[],
    handler: DialogflowIntentHandler<
      TConvData,
      TUserStorage,
      TContexts,
      TConversation,
      TParameters,
      TArgument
    > | string,
  ): this

  /** @public */
  catch(catcher: ExceptionHandler<TUserStorage, TConversation>): this

  /** @public */
  fallback(
    handler: DialogflowIntentHandler<
      TConvData,
      TUserStorage,
      TContexts,
      TConversation,
      Parameters,
      Argument
    > | string,
  ): this

  _middlewares: DialogflowMiddleware<DialogflowConversation<{}, {}, Contexts>>[]

  /** @public */
  middleware<TConversationPlugin extends DialogflowConversation<{}, {}, Contexts>>(
    middleware: DialogflowMiddleware<TConversationPlugin>,
  ): this

  /** @public */
  verification?: DialogflowVerification | DialogflowVerificationHeaders
}

/** @public */
export interface DialogflowVerificationHeaders {
  /**
   * A header key value pair to check against.
   * @public
   */
  [key: string]: string
}

/** @public */
export interface DialogflowVerification {
  /**
   * An object representing the header key to value map to check against,
   * @public
   */
  headers: DialogflowVerificationHeaders

  /**
   * Custom status code to return on verification error.
   * @public
   */
  status?: number

  /**
   * Custom error message as a string or a function that returns a string
   * given the original error message set by the library.
   *
   * The message will get sent back in the JSON top level `error` property.
   * @public
   */
  error?: string | ((error: string) => string)
}

/** @public */
export interface DialogflowOptions<
  TConvData,
  TUserStorage
> extends ConversationAppOptions<TConvData, TUserStorage> {
  /**
   * Verifies whether the request comes from Dialogflow.
   * Uses header keys and values to check against ones specified by the developer
   * in the Dialogflow Fulfillment settings of the app.
   *
   * HTTP Code 403 will be thrown by default on verification error.
   *
   * @public
   */
  verification?: DialogflowVerification | DialogflowVerificationHeaders
}

/** @public */
export interface Dialogflow {
  /** @public */
  <
    TConvData,
    TUserStorage,
    TContexts extends Contexts = Contexts,
    Conversation extends DialogflowConversation<TConvData, TUserStorage, TContexts> =
      DialogflowConversation<TConvData, TUserStorage, TContexts>,
  >(
    options?: DialogflowOptions<TConvData, TUserStorage>,
  ): AppHandler & DialogflowApp<
    TConvData,
    TUserStorage,
    TContexts,
    Conversation
  >

  /** @public */
  <
    TContexts extends Contexts,
    Conversation extends DialogflowConversation<{}, {}, TContexts> =
      DialogflowConversation<{}, {}, TContexts>,
  >(
    options?: DialogflowOptions<{}, {}>,
  ): AppHandler & DialogflowApp<
    {},
    {},
    TContexts,
    Conversation
  >

  /** @public */
  <TConversation extends DialogflowConversation<{}, {}> = DialogflowConversation<{}, {}>>(
    options?: DialogflowOptions<{}, {}>,
  ): AppHandler & DialogflowApp<{}, {}, Contexts, TConversation>
}

const isVerification =
  (verification: DialogflowVerification | DialogflowVerificationHeaders):
    verification is DialogflowVerification =>
      typeof (verification as DialogflowVerification).headers === 'object'

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
export const dialogflow: Dialogflow = <
  TConvData,
  TUserStorage,
  TContexts extends Contexts,
  TConversation extends DialogflowConversation<TConvData, TUserStorage, TContexts>
>(
  options: DialogflowOptions<TConvData, TUserStorage> = {},
) => attach<DialogflowApp<TConvData, TUserStorage, TContexts, TConversation>>({
  _handlers: {
    intents: {},
    catcher: (conv, e) => {
      throw e
    },
  },
  _middlewares: [],
  intent<TParameters extends Parameters, TArgument extends Argument>(
    this: DialogflowApp<TConvData, TUserStorage, TContexts, TConversation>,
    intents: string | string[],
    handler: DialogflowIntentHandler<
      TConvData,
      TUserStorage,
      TContexts,
      TConversation,
      TParameters,
      TArgument
    >,
  ) {
    for (const intent of common.toArray(intents)) {
      this._handlers.intents[intent] = handler
    }
    return this
  },
  catch(this: DialogflowApp<TConvData, TUserStorage, TContexts, TConversation>, catcher) {
    this._handlers.catcher = catcher
    return this
  },
  fallback(this: DialogflowApp<TConvData, TUserStorage, TContexts, TConversation>, handler) {
    this._handlers.fallback = handler
    return this
  },
  middleware(
    this: DialogflowApp<TConvData, TUserStorage, TContexts, TConversation>,
    middleware,
  ) {
    this._middlewares.push(middleware)
    return this
  },
  init: options.init,
  verification: options.verification,
  _client: options.clientId ? new OAuth2Client(options.clientId) : undefined,
  auth: options.clientId ? {
    client: {
      id: options.clientId,
    },
  } : undefined,
  async handler(
    this: AppHandler & DialogflowApp<TConvData, TUserStorage, TContexts, TConversation>,
    body: Api.GoogleCloudDialogflowV2WebhookRequest,
    headers,
    metadata = {},
  ) {
    const { debug, init, verification } = this
    if (verification) {
      const {
        headers: verificationHeaders,
        status = 403,
        error = (e: string) => e,
      } = isVerification(verification) ? verification :
        { headers: verification } as DialogflowVerification
      for (const key in verification) {
        const check = headers[key.toLowerCase()]
        if (!check) {
          return {
            status,
            body: {
              error: typeof error === 'string' ? error :
                error('A verification header key was not found'),
            },
          }
        }
        const value = verificationHeaders[key]
        const checking = common.toArray(check)
        if (checking.indexOf(value) < 0) {
          return {
            status,
            body: {
              error: typeof error === 'string' ? error :
                error('A verification header value was invalid'),
            },
          }
        }
      }
    }
    let conv = new DialogflowConversation<TConvData, TUserStorage, TContexts>({
      body,
      headers,
      init: init && init(),
      debug,
    })
    if (conv.user.profile.token) {
      await conv.user._verifyProfile(this._client!, this.auth!.client.id)
    }
    for (const middleware of this._middlewares) {
      const result = middleware(conv, metadata)
      conv = (result instanceof DialogflowConversation ? result : ((await result) || conv)) as (
        DialogflowConversation<TConvData, TUserStorage, TContexts>
      )
    }
    const log = debug ? common.info : common.debug
    log('Conversation', common.stringify(conv, 'request', 'headers', 'body'))
    const { intent } = conv
    const traversed: Traversed = {}
    let handler: typeof this._handlers.intents[string] = intent
    while (typeof handler !== 'function') {
      if (typeof handler === 'undefined') {
        if (!this._handlers.fallback) {
          throw new Error(`Dialogflow IntentHandler not found for intent: ${intent}`)
        }
        handler = this._handlers.fallback
        continue
      }
      if (traversed[handler]) {
        throw new Error(`Circular intent map detected: "${handler}" traversed twice`)
      }
      traversed[handler] = true
      handler = this._handlers.intents[handler]
    }
    try {
      await handler(
        conv,
        conv.parameters,
        conv.arguments.parsed.list[0],
        conv.arguments.status.list[0],
      )
    } catch (e) {
      await this._handlers.catcher(conv as TConversation, e)
    }
    return {
      status: 200,
      headers: {},
      body: conv.serialize(),
    }
  },
}, options)
