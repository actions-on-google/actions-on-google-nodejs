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
import * as ApiV1 from './api/v1'
import * as ActionsApi from '../actionssdk/api/v2'
import { ServiceBaseApp, AppOptions, AppHandler, attach } from '../../assistant'
import { Conversation, ConversationOptionsInit, ExceptionHandler, Argument } from '../actionssdk'
import { Headers } from '../../framework'
import { debug, stringify, toArray, ProtoAny, Traversed, JsonObject } from '../../common'
import { Contexts, ContextValues } from './context'

const APP_DATA_CONTEXT = '_actions_on_google'
const APP_DATA_CONTEXT_LIFESPAN = 99

export interface SystemIntent {
  intent: string
  data: ProtoAny<string, JsonObject>
}

export interface GoogleAssistantResponse {
  expectUserResponse: boolean
  noInputPrompts?: ActionsApi.GoogleActionsV2SimpleResponse[]
  isSsml?: boolean
  richResponse: ActionsApi.GoogleActionsV2RichResponse
  systemIntent?: SystemIntent
  userStorage?: string
}

export interface PayloadGoogle {
  google: GoogleAssistantResponse
}

/** @public */
export interface Parameters {
  /** @public */
  [parameter: string]: string | Object | undefined
}

/** @public */
export interface DialogflowConversationOptions<TConvData, TUserStorage> {
  /** @public */
  body: Api.GoogleCloudDialogflowV2WebhookRequest | ApiV1.DialogflowV1WebhookRequest

  /** @public */
  headers: Headers

  /** @public */
  init?: DialogflowConversationOptionsInit<TConvData, TUserStorage>
}

/** @public */
export class DialogflowConversation<
  TConvData = {},
  TUserStorage = {},
  TContexts extends Contexts = Contexts,
> extends Conversation<TUserStorage> {
  /** @public */
  body: Api.GoogleCloudDialogflowV2WebhookRequest | ApiV1.DialogflowV1WebhookRequest

  /** @public */
  action: string

  /** @public */
  intent: string

  /** @public */
  parameters: Parameters

  /** @public */
  contexts: ContextValues<TContexts>

  /** @public */
  query: string

  /** @public */
  data: TConvData

  /** @public */
  version: number

  /** @public */
  constructor(options: DialogflowConversationOptions<TConvData, TUserStorage>) {
    super({
      request: DialogflowConversation.getRequest(options.body),
      headers: options.headers,
      init: options.init,
    })

    const { body, init } = options

    this.body = body

    if (DialogflowConversation.isV1(this.body)) {
      this.version = 1

      const { result } = this.body
      const { action, parameters, contexts, resolvedQuery, metadata } = result!
      const { intentName } = metadata!

      this.action = action!
      this.intent = intentName!
      this.parameters = parameters!
      this.contexts = new ContextValues(contexts)
      this.query = resolvedQuery!
    } else {
      this.version = 2

      const { queryResult } = this.body
      const { action, parameters, outputContexts, intent } = queryResult!
      const { displayName } = intent!

      this.action = action!
      this.intent = displayName!
      this.parameters = parameters!
      this.contexts = new ContextValues(outputContexts, this.body.session!)
      this.query = this.body.queryResult!.queryText!
    }

    for (const key in this.parameters) {
      const value = this.parameters[key]
      if (typeof value !== 'object') {
        // Convert all non-objects to strings for consistency
        this.parameters[key] = String(value)
      }
    }

    this.data = (init && init.data) || {} as TConvData

    const context = this.contexts.input[APP_DATA_CONTEXT]
    if (context) {
      const { data } = context.parameters
      if (typeof data === 'string') {
        this.data = JSON.parse(data)
      }
    }

    debug('Conversation', stringify(this, {
      request: null,
      headers: null,
      body: null,
    }))
  }

  private static isV1(
    body: Api.GoogleCloudDialogflowV2WebhookRequest | ApiV1.DialogflowV1WebhookRequest,
  ): body is ApiV1.DialogflowV1WebhookRequest {
    return !!(body as ApiV1.DialogflowV1WebhookRequest).result
  }

  private static getRequest(
    body: Api.GoogleCloudDialogflowV2WebhookRequest | ApiV1.DialogflowV1WebhookRequest,
  ) {
    if (this.isV1(body)) {
      const { originalRequest = {} } = body
      const { data = {} } = originalRequest
      return data
    }
    return body.originalDetectIntentRequest!.payload!
  }

  /** @public */
  serialize(): Api.GoogleCloudDialogflowV2WebhookResponse | ApiV1.DialogflowV1WebhookResponse {
    const {
      richResponse,
      expectUserResponse,
      userStorage,
      expectedIntent,
    } = this.response()
    const google: GoogleAssistantResponse = {
      expectUserResponse,
      richResponse,
      userStorage,
      systemIntent: expectedIntent && {
        intent: expectedIntent.intent!,
        data: expectedIntent.inputValueData as ProtoAny<string, JsonObject>,
      },
    }
    const payload: PayloadGoogle = {
      google,
    }
    this.contexts.set(APP_DATA_CONTEXT, APP_DATA_CONTEXT_LIFESPAN, {
      data: JSON.stringify(this.data),
    })
    if (this.version === 1) {
      const contextOut = this.contexts.serializeV1()
      const response: ApiV1.DialogflowV1WebhookResponse = {
        data: payload,
        contextOut,
      }
      return response
    }
    const outputContexts = this.contexts.serialize()
    const response: Api.GoogleCloudDialogflowV2WebhookResponse = {
      payload,
      outputContexts,
    }
    return response
  }
}

/** @public */
export interface DialogflowIntentHandler<
  TConvData,
  TUserStorage,
  TContexts extends Contexts,
  TConversation extends DialogflowConversation<TConvData, TUserStorage, TContexts>,
  TParameters extends Parameters,
  TArgument extends Argument,
> {
  // tslint:disable-next-line:no-any allow developer to return any just detect if is promise
  (conv: TConversation, params: TParameters, argument: TArgument): Promise<any> | any
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

/** @public */
export interface DialogflowMiddleware<
  TConversationPlugin extends DialogflowConversation<{}, {}, Contexts>
> {
  (
    conv: DialogflowConversation<{}, {}, Contexts>,
  ): DialogflowConversation<{}, {}, Contexts> & TConversationPlugin
}

/** @public */
export interface DialogflowApp<
  TConvData,
  TUserStorage,
  TContexts extends Contexts,
  TConversation extends DialogflowConversation<TConvData, TUserStorage, TContexts>,
> extends ServiceBaseApp {
  intents: DialogflowIntentHandlers

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

  catcher: ExceptionHandler<TUserStorage, TConversation>

  /** @public */
  catch(catcher: ExceptionHandler<TUserStorage, TConversation>): this

  middlewares: DialogflowMiddleware<DialogflowConversation<{}, {}, Contexts>>[]

  /** @public */
  middleware<TConversationPlugin extends DialogflowConversation<{}, {}, Contexts>>(
    middleware: DialogflowMiddleware<TConversationPlugin>,
  ): this
}

export interface DialogflowConversationOptionsInit<
  TConvData,
  TUserStorage
> extends ConversationOptionsInit<TUserStorage> {
  data?: TConvData
}

/** @public */
export interface DialogflowVerification {
  /** @public */
  [key: string]: string
}

/** @public */
export interface DialogflowOptions<TConvData, TUserStorage> extends AppOptions {
  init?: () => DialogflowConversationOptionsInit<TConvData, TUserStorage>
  verification?: DialogflowVerification
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

/** @public */
export const dialogflow: Dialogflow = <
  TConvData,
  TUserStorage,
  TContexts extends Contexts,
  TConversation extends DialogflowConversation<TConvData, TUserStorage, TContexts>
>(
  options: DialogflowOptions<TConvData, TUserStorage> = {},
) => attach<DialogflowApp<TConvData, TUserStorage, TContexts, TConversation>>({
  intents: {},
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
    this.intents[intent] = handler
    return this
  },
  catch(this: DialogflowApp<TConvData, TUserStorage, TContexts, TConversation>, catcher) {
    this.catcher = catcher
    return this
  },
  catcher(conv, e) {
    throw e
  },
  middleware(
    this: DialogflowApp<TConvData, TUserStorage, TContexts, TConversation>,
    middleware,
  ) {
    this.middlewares.push(middleware)
    return this
  },
  async handler(
    this: DialogflowApp<TConvData, TUserStorage, TContexts, TConversation>,
    body: Api.GoogleCloudDialogflowV2WebhookRequest,
    headers,
  ) {
    const { init, verification } = options
    if (verification) {
      for (const key in verification) {
        const check = headers[key.toLowerCase()]
        if (!check) {
          throw new Error('A verification header key was not found')
        }
        const value = verification[key]
        const checking = toArray(check)
        if (checking.indexOf(value) < 0) {
          throw new Error('A verification header value was invalid')
        }
      }
    }
    let conv = new DialogflowConversation<TConvData, TUserStorage, TContexts>({
      body,
      headers,
      init: init && init(),
    })
    for (const middleware of this.middlewares) {
      conv = middleware(conv) as DialogflowConversation<TConvData, TUserStorage, TContexts>
    }
    const { intent } = conv
    const traversed: Traversed = {}
    let handler: typeof this.intents[string] = intent
    while (typeof handler !== 'function') {
      if (typeof handler === 'undefined') {
        throw new Error(`Dialogflow IntentHandler not found for intent: ${intent}`)
      }
      if (traversed[handler]) {
        throw new Error(`Circular intent map detected: "${handler}" traversed twice`)
      }
      traversed[handler] = true
      handler = this.intents[handler]
    }
    try {
      await handler(conv, conv.parameters, conv.arguments.list[0])
    } catch (e) {
      await this.catcher(conv as TConversation, e)
    }
    return {
      status: 200,
      body: conv.serialize(),
    }
  },
}, options)
