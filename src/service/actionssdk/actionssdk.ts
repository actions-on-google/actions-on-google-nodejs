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
import { ServiceBaseApp, AppOptions, AppHandler, attach } from '../../assistant'
import {
  Conversation,
  ConversationOptionsInit,
  ExceptionHandler,
  Argument,
  Intent,
} from './conversation'
import { Headers } from '../../framework'
import { debug, stringify, Traversed } from '../../common'

/** @public */
export interface ActionsSdkConversationOptions<TConvData, TUserStorage> {
  body: Api.GoogleActionsV2AppRequest
  headers: Headers
  init?: ActionsSdkConversationOptionsInit<TConvData, TUserStorage>
}

export interface ActionsSdkConversationOptionsInit<
  TConvData,
  TUserStorage,
> extends ConversationOptionsInit<TUserStorage> {
  data?: TConvData
}

/** @public */
export class ActionsSdkConversation<
  TConvData = {},
  TUserStorage = {}
> extends Conversation<TUserStorage> {
  /** @public */
  body: Api.GoogleActionsV2AppRequest

  /** @public */
  intent: string

  /** @public */
  data: TConvData

  constructor(options: ActionsSdkConversationOptions<TConvData, TUserStorage>) {
    super({
      request: options.body,
      headers: options.headers,
    })

    const { body, init } = options

    this.body = body

    const { intent = '' } = this.body!.inputs![0]
    const { conversation } = this.body
    const { conversationToken } = conversation!

    this.intent = intent

    this.data = conversationToken ? JSON.parse(conversationToken).data : ((init && init.data) || {})

    debug('Conversation', stringify(this, {
      request: null,
      headers: null,
      body: null,
    }))
  }

  serialize(): Api.GoogleActionsV2AppResponse {
    const {
      richResponse,
      expectUserResponse,
      userStorage,
      expectedIntent,
    } = this.response()
    const inputPrompt: Api.GoogleActionsV2InputPrompt = {
      richInitialPrompt: richResponse,
    }
    const possibleIntents: Api.GoogleActionsV2ExpectedIntent[] = [{
      intent: 'actions.intent.TEXT',
    }]
    if (expectedIntent) {
      possibleIntents.push(expectedIntent)
    }
    const expectedInput: Api.GoogleActionsV2ExpectedInput = {
      inputPrompt,
      possibleIntents,
    }
    const conversationToken = JSON.stringify({ data: this.data })
    return {
      expectUserResponse,
      expectedInputs: expectUserResponse ? [expectedInput] : undefined,
      finalResponse: expectUserResponse ? undefined : { richResponse },
      conversationToken,
      userStorage,
    }
  }
}

/** @public */
export interface ActionsSdkIntentHandler<
  TConvData,
  TUserStorage,
  TConversation extends ActionsSdkConversation<TConvData, TUserStorage>,
  TArgument extends Argument,
> {
  // tslint:disable-next-line:no-any allow developer to return any just detect if is promise
  (conv: TConversation, input: string, argument: TArgument): Promise<any> | any
}

export interface ActionSdkIntentHandlers {
  [intent: string]: ActionsSdkIntentHandler<
    {},
    {},
    ActionsSdkConversation<{}, {}>,
    string | Argument
  > | string | undefined
}

/** @public */
export interface ActionsSdkMiddleware<
  TConversationPlugin extends ActionsSdkConversation<{}, {}>
> {
  (
    conv: ActionsSdkConversation<{}, {}>,
  ): ActionsSdkConversation<{}, {}> & TConversationPlugin
}

/** @public */
export interface ActionsSdkApp<
  TConvData,
  TUserStorage,
  TConversation extends ActionsSdkConversation<TConvData, TUserStorage>
> extends ServiceBaseApp {
  intents: ActionSdkIntentHandlers
  catcher: ExceptionHandler<TUserStorage, TConversation>

  /** @public */
  intent<TArgument extends Argument>(
    intent: Intent,
    handler: ActionsSdkIntentHandler<TConvData, TUserStorage, TConversation, TArgument> | Intent,
  ): this

  /** @public */
  intent<TArgument extends Argument>(
    intent: string,
    handler: ActionsSdkIntentHandler<TConvData, TUserStorage, TConversation, TArgument> | string,
  ): this

  /** @public */
  catch(catcher: ExceptionHandler<TUserStorage, TConversation>): this

  middlewares: ActionsSdkMiddleware<ActionsSdkConversation<{}, {}>>[]

  /** @public */
  middleware<TConversationPlugin extends ActionsSdkConversation<{}, {}>>(
    middleware: ActionsSdkMiddleware<TConversationPlugin>,
  ): this
}

/** @public */
export interface ActionsSdk {
  /** @public */
  <
    TConvData,
    TUserStorage,
    Conversation extends ActionsSdkConversation<TConvData, TUserStorage> =
      ActionsSdkConversation<TConvData, TUserStorage>,
  >(
    options?: ActionsSdkOptions<TConvData, TUserStorage>,
  ): AppHandler & ActionsSdkApp<
    TConvData,
    TUserStorage,
    Conversation
  >

  /** @public */
  <Conversation extends ActionsSdkConversation<{}, {}> = ActionsSdkConversation<{}, {}>>(
    options?: ActionsSdkOptions<{}, {}>,
  ): AppHandler & ActionsSdkApp<{}, {}, Conversation>
}

/** @public */
export interface ActionsSdkOptions<TConvData, TUserStorage> extends AppOptions {
  /** @public */
  init?: () => ActionsSdkConversationOptionsInit<TConvData, TUserStorage>
}

/** @public */
export const actionssdk: ActionsSdk = <
  TConvData,
  TUserStorage,
  TConversation extends ActionsSdkConversation<TConvData, TUserStorage>
>(
  options: ActionsSdkOptions<TConvData, TUserStorage> = {},
) => attach<ActionsSdkApp<TConvData, TUserStorage, TConversation>>({
  intents: {},
  middlewares: [],
  intent<TInput>(
    this: ActionsSdkApp<TConvData, TUserStorage, TConversation>,
    intent: Intent,
    handler: ActionsSdkIntentHandler<TConvData, TUserStorage, TConversation, TInput> | string,
  ) {
    this.intents[intent] = handler
    return this
  },
  catch(this: ActionsSdkApp<TConvData, TUserStorage, TConversation>, catcher) {
    this.catcher = catcher
    return this
  },
  catcher(conv, e) {
    throw e
  },
  middleware(
    this: ActionsSdkApp<TConvData, TUserStorage, TConversation>,
    middleware,
  ) {
    this.middlewares.push(middleware)
    return this
  },
  async handler(
    this: ActionsSdkApp<TConvData, TUserStorage, TConversation>,
    body: Api.GoogleActionsV2AppRequest,
    headers,
  ) {
    const { init } = options
    let conv = new ActionsSdkConversation({
      body,
      headers,
      init: init && init(),
    })
    for (const middleware of this.middlewares) {
      conv = middleware(conv) as ActionsSdkConversation<TConvData, TUserStorage>
    }
    const { intent } = conv
    const traversed: Traversed = {}
    let handler: typeof this.intents[string] = intent
    while (typeof handler !== 'function') {
      if (typeof handler === 'undefined') {
        throw new Error(`Actions SDK IntentHandler not found for intent: ${intent}`)
      }
      if (traversed[handler]) {
        throw new Error(`Circular intent map detected: "${handler}" traversed twice`)
      }
      traversed[handler] = true
      handler = this.intents[handler]
    }
    try {
      await handler(conv, conv.input.raw, conv.arguments.list[0])
    } catch (e) {
      await this.catcher(conv as TConversation, e)
    }
    return {
      status: 200,
      body: conv.serialize(),
    }
  },
}, options)
