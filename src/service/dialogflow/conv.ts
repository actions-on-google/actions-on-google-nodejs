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
import { Conversation, ConversationBaseOptions, ConversationOptionsInit } from '../actionssdk'
import { ProtoAny, JsonObject } from '../../common'
import { Contexts, ContextValues, Parameters } from './context'
import { Incoming } from './incoming'

const CONV_DATA_CONTEXT = '_actions_on_google'
const CONV_DATA_CONTEXT_LIFESPAN = 99
const SIMULATOR_WARNING = 'Cannot display response in Dialogflow simulator. ' +
  'Please test on the Google Assistant simulator instead.'

/** @hidden */
export interface SystemIntent {
  intent: string
  data: ProtoAny<string, JsonObject>
}

/** @hidden */
export interface GoogleAssistantResponse {
  expectUserResponse?: boolean
  noInputPrompts?: ActionsApi.GoogleActionsV2SimpleResponse[]
  isSsml?: boolean
  richResponse?: ActionsApi.GoogleActionsV2RichResponse
  systemIntent?: SystemIntent
  userStorage?: string
  speechBiasingHints?: string[]
}

/** @hidden */
export interface PayloadGoogle {
  google: GoogleAssistantResponse
}

/** @public */
export interface DialogflowConversationOptions<
  TConvData,
  TUserStorage
> extends ConversationBaseOptions<TConvData, TUserStorage> {
  /** @public */
  body?: Api.GoogleCloudDialogflowV2WebhookRequest | ApiV1.DialogflowV1WebhookRequest
}

const isV1 = (
  body: Api.GoogleCloudDialogflowV2WebhookRequest | ApiV1.DialogflowV1WebhookRequest,
): body is ApiV1.DialogflowV1WebhookRequest => !!(body as ApiV1.DialogflowV1WebhookRequest).result

const isSimulator = (
  body: Api.GoogleCloudDialogflowV2WebhookRequest | ApiV1.DialogflowV1WebhookRequest,
) => {
  if (isV1(body)) {
    return !body.originalRequest
  }
  if (!body.originalDetectIntentRequest) {
    return false
  }
  return Object.keys(body.originalDetectIntentRequest.payload!).length === 0 &&
    !!body.responseId
}

const getRequest = (
  body: Api.GoogleCloudDialogflowV2WebhookRequest | ApiV1.DialogflowV1WebhookRequest,
): ActionsApi.GoogleActionsV2AppRequest => {
  if (isV1(body)) {
    const { originalRequest = {} } = body
    const { data = {} } = originalRequest
    return data
  }
  const { originalDetectIntentRequest = {} } = body
  const { payload = {} } = originalDetectIntentRequest
  return payload
}

const serializeData = <TConvData>(data: TConvData) =>
  JSON.stringify(data)

const deserializeData = <TContexts extends Contexts, TConvData>(
  contexts: ContextValues<TContexts>, defaultData?: TConvData,
): TConvData => {
  const context = contexts.get(CONV_DATA_CONTEXT)
  if (context) {
    const { data } = context.parameters
    if (typeof data === 'string') {
      return JSON.parse(data)
    }
  }

  return defaultData || {} as TConvData
}

/** @public */
export class DialogflowConversation<
  TConvData = {},
  TUserStorage = {},
  TContexts extends Contexts = Contexts,
> extends Conversation<TUserStorage> {
  /** @public */
  body: Api.GoogleCloudDialogflowV2WebhookRequest | ApiV1.DialogflowV1WebhookRequest

  /**
   * Get the current Dialogflow action name.
   *
   * @example
   * ```javascript
   *
   * app.intent('Default Welcome Intent', conv => {
   *   const action = conv.action
   * })
   * ```
   *
   * @public
   */
  action: string

  /**
   * Get the current Dialogflow intent name.
   *
   * @example
   * ```javascript
   *
   * app.intent('Default Welcome Intent', conv => {
   *   const intent = conv.intent // will be 'Default Welcome Intent'
   * })
   * ```
   *
   * @public
   */
  intent: string

  /**
   * The Dialogflow parameters from the current intent.
   * Values will only be a string, an Object, or undefined if not included.
   *
   * Will also be sent via intent handler 3rd argument which is the encouraged method to retrieve.
   *
   * @example
   * ```javascript
   *
   * // Encouraged method through intent handler
   * app.intent('Tell Greeting', (conv, params) => {
   *   const color = params.color
   *   const num = params.num
   * })
   *
   * // Encouraged method through destructuring in intent handler
   * app.intent('Tell Greeting', (conv, { color, num }) => {
   *   // now use color and num as variables
   * }))
   *
   * // Using conv.parameters
   * app.intent('Tell Greeting', conv => {
   *   const parameters = conv.parameters
   *   // or destructed
   *   const { color, num } = conv.parameters
   * })
   * ```
   *
   * @public
   */
  parameters: Parameters

  /** @public */
  contexts: ContextValues<TContexts>

  /** @public */
  incoming: Incoming

  /**
   * The user's raw input query.
   *
   * @example
   * ```javascript
   *
   * app.intent('User Input', conv => {
   *   conv.close(`You said ${conv.query}`)
   * })
   * ```
   *
   * @public
   */
  query: string

  /**
   * The session data in JSON format.
   * Stored using contexts.
   *
   * @example
   * ```javascript
   *
   * app.intent('Default Welcome Intent', conv => {
   *   conv.data.someProperty = 'someValue'
   * })
   * ```
   *
   * @public
   */
  data: TConvData

  /** @public */
  version: number

  /** @hidden */
  _followup?: Api.GoogleCloudDialogflowV2EventInput | ApiV1.DialogflowV1FollowupEvent

  /** @hidden */
  _init: ConversationOptionsInit<TConvData, TUserStorage>

  /** @public */
  constructor(options: DialogflowConversationOptions<TConvData, TUserStorage> = {}) {
    const { body = {} } = options

    super({
      request: getRequest(body),
      headers: options.headers,
      init: options.init,
    })

    this.body = body

    if (isV1(this.body)) {
      this.version = 1

      const { result = {} } = this.body
      const {
        action = '',
        parameters = {},
        contexts,
        resolvedQuery = '',
        metadata = {},
        fulfillment,
      } = result
      const { intentName = '' } = metadata

      this.action = action
      this.intent = intentName
      this.parameters = parameters
      this.contexts = new ContextValues(contexts)
      this.incoming = new Incoming(fulfillment)
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
        fulfillmentMessages,
      } = queryResult
      const { displayName = '' } = intent

      this.action = action
      this.intent = displayName
      this.parameters = parameters
      this.contexts = new ContextValues(outputContexts, this.body.session)
      this.incoming = new Incoming(fulfillmentMessages)
      this.query = queryText
    }

    for (const key in this.parameters) {
      const value = this.parameters[key]
      if (typeof value !== 'object') {
        // Convert all non-objects to strings for consistency
        this.parameters[key] = String(value)
      }
    }

    this.data = deserializeData(this.contexts, this._init.data)
  }

  /**
   * Triggers an intent of your choosing by sending a followup event from the webhook.
   * Final response can theoretically include responses but these will not be handled
   * by Dialogflow. Dialogflow will not pass anything back to Google Assistant, therefore
   * Google Assistant specific information, most notably conv.user.storage, is ignored.
   *
   * @example
   * ```javascript
   *
   * const app = dialogflow()
   *
   * // Create a Dialogflow intent with event 'apply-for-license-event'
   *
   * app.intent('Default Welcome Intent', conv => {
   *   conv.followup('apply-for-license-event', {
   *     date: new Date().toISOString(),
   *   })
   *   // The dialogflow intent with the 'apply-for-license-event' event
   *   // will be triggered with the given parameters `date`
   * })
   * ```
   *
   * @param event Name of the event
   * @param parameters Parameters to send with the event
   * @param lang The language of this query.
   *     See {@link https://dialogflow.com/docs/languages|Language Support}
   *     for a list of the currently supported language codes.
   *     Note that queries in the same session do not necessarily need to specify the same language.
   *     By default, it is the languageCode sent with Dialogflow's queryResult.languageCode
   * @public
   */
  followup(event: string, parameters?: Parameters, lang?: string) {
    this._responded = true
    if (this.version === 1) {
      this._followup = {
          name: event,
          data: parameters,
      }
      return this
    }
    const body = this.body as Api.GoogleCloudDialogflowV2WebhookRequest
    this._followup = {
      name: event,
      parameters,
      languageCode: lang || body.queryResult!.languageCode,
    }
    return this
  }

  /** @public */
  serialize(): Api.GoogleCloudDialogflowV2WebhookResponse | ApiV1.DialogflowV1WebhookResponse {
    if (this._raw) {
      return this._raw
    }
    let payload: PayloadGoogle | undefined
    if (this._followup) {
      this.digested = true
    } else {
      const {
        richResponse,
        expectUserResponse,
        userStorage,
        expectedIntent,
        noInputPrompts,
        speechBiasingHints,
      } = this.response()
      const google: GoogleAssistantResponse = {
        expectUserResponse,
        systemIntent: expectedIntent && {
          intent: expectedIntent.intent!,
          data: expectedIntent.inputValueData as ProtoAny<string, JsonObject>,
        },
        noInputPrompts,
        speechBiasingHints,
      }
      if (richResponse.items!.length) {
        google.richResponse = richResponse
      }
      if (userStorage) {
        google.userStorage = userStorage
      }
      payload = { google }
    }
    const convDataDefault = deserializeData<TContexts, TConvData>(this.contexts, this._init.data)
    const convDataIn = serializeData(convDataDefault)
    const convDataOut = serializeData(this.data)
    if (convDataOut !== convDataIn) {
      // Previously was setting every webhook call
      // But now will only set if different so lifespan does not get reset
      this.contexts.set(CONV_DATA_CONTEXT, CONV_DATA_CONTEXT_LIFESPAN, {
        data: convDataOut,
      })
    }
    const simulator = isSimulator(this.body)
    if (this.version === 1) {
      const response: ApiV1.DialogflowV1WebhookResponse = {
        data: payload,
        followupEvent: this._followup,
      }
      const contextOut = this.contexts._serializeV1()
      if (contextOut.length) {
        response.contextOut = contextOut
      }
      if (simulator && payload) {
        const { richResponse = {} } = payload.google
        const { items = [] } = richResponse
        // Simulator only shows speech response
        // Since this is only shown to the simulator as text, the speech is the displayText
        response.speech = SIMULATOR_WARNING
        if (!payload.google.systemIntent && items.length < 2) {
          for (const { simpleResponse } of items) {
            if (simpleResponse) {
              response.speech = simpleResponse.displayText ||
              simpleResponse.textToSpeech
              break
            }
          }
        }
      }
      return response
    }
    const response: Api.GoogleCloudDialogflowV2WebhookResponse = {
      payload,
      followupEventInput: this._followup,
    }
    const outputContexts = this.contexts._serialize()
    if (outputContexts.length) {
      response.outputContexts = outputContexts
    }
    if (simulator && payload) {
      const { richResponse = {} } = payload.google
      const { items = [] } = richResponse
      response.fulfillmentText = SIMULATOR_WARNING
      if (!payload.google.systemIntent && items.length < 2) {
        for (const { simpleResponse } of items) {
          if (simpleResponse) {
            response.fulfillmentText = simpleResponse.displayText ||
            simpleResponse.textToSpeech
            break
          }
        }
      }
    }
    return response
  }
}
