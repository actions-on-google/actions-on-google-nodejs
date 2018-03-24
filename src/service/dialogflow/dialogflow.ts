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
import { ServiceBaseApp, AppOptions, AppHandler, attach } from '../../assistant'
import { ExceptionHandler, Traversed, Argument } from '../actionssdk'
import { toArray } from '../../common'
import { Contexts, Parameters } from './context'
import { DialogflowConversation, DialogflowConversationOptionsInit } from './conv'

/** @public */
export interface DialogflowIntentHandler<
  TConvData,
  TUserStorage,
  TContexts extends Contexts,
  TConversation extends DialogflowConversation<TConvData, TUserStorage, TContexts>,
  TParameters extends Parameters,
  TArgument extends Argument,
> {
  (
    conv: TConversation,
    params: TParameters,
    argument: TArgument,
    status: ActionsApi.GoogleRpcStatus | undefined,
    // tslint:disable-next-line:no-any allow developer to return any just detect if is promise
  ): Promise<any> | any
}

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
    conv: DialogflowConversation<{}, {}, Contexts>,
  ): (DialogflowConversation<{}, {}, Contexts> & TConversationPlugin) | void
}

/** @public */
export interface DialogflowApp<
  TConvData,
  TUserStorage,
  TContexts extends Contexts,
  TConversation extends DialogflowConversation<TConvData, TUserStorage, TContexts>,
> extends ServiceBaseApp {
  handlers: DialogflowHandlers<TConvData, TUserStorage, TContexts, TConversation>

  /** @public */
  intent<TParameters extends Parameters>(
    intent: string,
    handler: DialogflowIntentHandler<
      TConvData,
      TUserStorage,
      TContexts,
      TConversation,
      TParameters,
      Argument
    > | string,
  ): this

  /** @public */
  intent<TArgument extends Argument>(
    intent: string,
    handler: DialogflowIntentHandler<
      TConvData,
      TUserStorage,
      TContexts,
      TConversation,
      Parameters,
      TArgument
    > | string,
  ): this

  /** @public */
  intent<TParameters extends Parameters, TArgument extends Argument>(
    intent: string,
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
    intent: string,
    handler: DialogflowIntentHandler<
      TConvData,
      TUserStorage,
      TContexts,
      TConversation,
      Parameters,
      Argument
    > | string,
  ): this

  middlewares: DialogflowMiddleware<DialogflowConversation<{}, {}, Contexts>>[]

  /** @public */
  middleware<TConversationPlugin extends DialogflowConversation<{}, {}, Contexts>>(
    middleware: DialogflowMiddleware<TConversationPlugin>,
  ): this

  /** @public */
  init?: () => DialogflowConversationOptionsInit<TConvData, TUserStorage>

  /** @public */
  verification?: DialogflowVerification | DialogflowVerificationHeaders
}

/** @public */
export interface DialogflowVerificationHeaders {
  /** @public */
  [key: string]: string
}

/** @public */
export interface DialogflowVerification {
  /** @public */
  headers: DialogflowVerificationHeaders

  /** @public */
  status?: number

  /** @public */
  error?: string | ((error: string) => string)
}

/** @public */
export interface DialogflowOptions<TConvData, TUserStorage> extends AppOptions {
  /** @public */
  init?: () => DialogflowConversationOptionsInit<TConvData, TUserStorage>

  /** @public */
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

/** @public */
export const dialogflow: Dialogflow = <
  TConvData,
  TUserStorage,
  TContexts extends Contexts,
  TConversation extends DialogflowConversation<TConvData, TUserStorage, TContexts>
>(
  options: DialogflowOptions<TConvData, TUserStorage> = {},
) => attach<DialogflowApp<TConvData, TUserStorage, TContexts, TConversation>>({
  handlers: {
    intents: {},
    catcher: (conv, e) => {
      throw e
    },
  },
  middlewares: [],
  intent<TParameters extends Parameters, TArgument extends Argument>(
    this: DialogflowApp<TConvData, TUserStorage, TContexts, TConversation>,
    intent: string,
    handler: DialogflowIntentHandler<
      TConvData,
      TUserStorage,
      TContexts,
      TConversation,
      TParameters,
      TArgument
    >,
  ) {
    this.handlers.intents[intent] = handler
    return this
  },
  catch(this: DialogflowApp<TConvData, TUserStorage, TContexts, TConversation>, catcher) {
    this.handlers.catcher = catcher
    return this
  },
  fallback(this: DialogflowApp<TConvData, TUserStorage, TContexts, TConversation>, handler) {
    this.handlers.fallback = handler
    return this
  },
  middleware(
    this: DialogflowApp<TConvData, TUserStorage, TContexts, TConversation>,
    middleware,
  ) {
    this.middlewares.push(middleware)
    return this
  },
  init: options.init,
  verification: options.verification,
  async handler(
    this: AppHandler & DialogflowApp<TConvData, TUserStorage, TContexts, TConversation>,
    body: Api.GoogleCloudDialogflowV2WebhookRequest,
    headers,
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
        const checking = toArray(check)
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
    for (const middleware of this.middlewares) {
      conv = (middleware(conv) as DialogflowConversation<TConvData, TUserStorage, TContexts> | void)
        || conv
    }
    const { intent } = conv
    const traversed: Traversed = {}
    let handler: typeof this.handlers.intents[string] = intent
    while (typeof handler !== 'function') {
      if (typeof handler === 'undefined') {
        if (!this.handlers.fallback) {
          throw new Error(`Dialogflow IntentHandler not found for intent: ${intent}`)
        }
        handler = this.handlers.fallback
        continue
      }
      if (traversed[handler]) {
        throw new Error(`Circular intent map detected: "${handler}" traversed twice`)
      }
      traversed[handler] = true
      handler = this.handlers.intents[handler]
    }
    try {
      await handler(
        conv,
        conv.parameters,
        conv.arguments.parsed.list[0],
        conv.arguments.status.list[0],
      )
    } catch (e) {
      await this.handlers.catcher(conv as TConversation, e)
    }
    return {
      status: 200,
      body: conv.serialize(),
    }
  },
}, options)
