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
import { Conversation, ConversationOptionsInit } from '../actionssdk'
import { Headers } from '../../framework'
import { info, debug, stringify, ProtoAny, JsonObject } from '../../common'
import { Contexts, ContextValues, Parameters } from './context'

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

export interface DialogflowConversationOptionsInit<
  TConvData,
  TUserStorage
> extends ConversationOptionsInit<TUserStorage> {
  data?: TConvData
}

/** @public */
export interface DialogflowConversationOptions<TConvData, TUserStorage> {
  /** @public */
  body: Api.GoogleCloudDialogflowV2WebhookRequest | ApiV1.DialogflowV1WebhookRequest

  /** @public */
  headers: Headers

  /** @public */
  init?: DialogflowConversationOptionsInit<TConvData, TUserStorage>

  /** @public */
  debug?: boolean
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

      const { result = {} } = this.body
      const { action = '', parameters = {}, contexts, resolvedQuery = '', metadata = {} } = result
      const { intentName = '' } = metadata

      this.action = action
      this.intent = intentName
      this.parameters = parameters
      this.contexts = new ContextValues(contexts)
      this.query = resolvedQuery
    } else {
      this.version = 2

      const { queryResult = {} } = this.body
      const {
        action = '',
        parameters = {},
        outputContexts,
        intent = {},
        queryText = '',
      } = queryResult
      const { displayName = '' } = intent

      this.action = action
      this.intent = displayName
      this.parameters = parameters
      this.contexts = new ContextValues(outputContexts, this.body.session)
      this.query = queryText
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

    const log = debug ? info : debug
    log('Conversation', stringify(this, {
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
    if (this.raw) {
      return this.raw
    }
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
