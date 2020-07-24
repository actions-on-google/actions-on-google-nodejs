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

import * as Api from '../api/v2'
import { Headers } from '../../../framework'
import { Surface, Available } from './surface'
import { User } from './user'
import {
  Image,
  BasicCard,
  RichResponse,
  Suggestions,
  RichResponseItem,
  MediaObject,
  MediaResponse,
  SimpleResponse,
  Table,
  BrowseCarousel,
  OrderUpdate,
  LinkOutSuggestion,
} from './response'
import { Helper, SoloHelper, TransactionDecision, TransactionRequirements } from './helper'
import { Arguments } from './argument'
import { Device } from './device'
import { Input } from './input'
import { JsonObject } from '../../../common'
import { ServiceBaseApp, AppOptions } from '../../../assistant'
import { OAuth2Client } from 'google-auth-library'
import { Canvas } from './canvas'

/** @public */
export type Intent =
  'actions.intent.MAIN' |
  'actions.intent.TEXT' |
  'actions.intent.PERMISSION' |
  'actions.intent.OPTION' |
  'actions.intent.TRANSACTION_REQUIREMENTS_CHECK' |
  'actions.intent.DELIVERY_ADDRESS' |
  'actions.intent.TRANSACTION_DECISION' |
  'actions.intent.CONFIRMATION' |
  'actions.intent.DATETIME' |
  'actions.intent.SIGN_IN' |
  'actions.intent.NO_INPUT' |
  'actions.intent.CANCEL' |
  'actions.intent.NEW_SURFACE' |
  'actions.intent.REGISTER_UPDATE' |
  'actions.intent.CONFIGURE_UPDATES' |
  'actions.intent.PLACE' |
  'actions.intent.LINK' |
  'actions.intent.MEDIA_STATUS' |
  'actions.intent.COMPLETE_PURCHASE' |
  'actions.intent.DIGITAL_PURCHASE_CHECK'

/** @hidden */
export type InputValueSpec =
  'type.googleapis.com/google.actions.v2.PermissionValueSpec' |
  'type.googleapis.com/google.actions.v2.OptionValueSpec' |
  'type.googleapis.com/google.actions.v2.TransactionRequirementsCheckSpec' |
  'type.googleapis.com/google.actions.v2.DeliveryAddressValueSpec' |
  'type.googleapis.com/google.actions.v2.TransactionDecisionValueSpec' |
  'type.googleapis.com/google.actions.v2.ConfirmationValueSpec' |
  'type.googleapis.com/google.actions.v2.DateTimeValueSpec' |
  'type.googleapis.com/google.actions.v2.NewSurfaceValueSpec' |
  'type.googleapis.com/google.actions.v2.RegisterUpdateValueSpec' |
  'type.googleapis.com/google.actions.v2.SignInValueSpec' |
  'type.googleapis.com/google.actions.v2.PlaceValueSpec' |
  'type.googleapis.com/google.actions.v2.LinkValueSpec' |
  'type.googleapis.com/google.actions.transactions.v3.CompletePurchaseValueSpec' |
  'type.googleapis.com/google.actions.transactions.v3.TransactionDecisionValueSpec' |
  'type.googleapis.com/google.actions.transactions.v3.TransactionRequirementsCheckSpec' |
  'type.googleapis.com/google.actions.transactions.v3.DigitalPurchaseCheckSpec'

/** @hidden */
export type DialogSpec =
  'type.googleapis.com/google.actions.v2.PlaceValueSpec.PlaceDialogSpec' |
  'type.googleapis.com/google.actions.v2.LinkValueSpec.LinkDialogSpec'

/** @public */
export type Response =
  RichResponse |
  RichResponseItem |
  Image |
  Suggestions |
  MediaObject |
  Helper<Intent, JsonObject>

/** @hidden */
export interface ConversationResponse {
  richResponse: Api.GoogleActionsV2RichResponse
  expectUserResponse: boolean
  userStorage: string
  expectedIntent?: Api.GoogleActionsV2ExpectedIntent
  noInputPrompts?: Api.GoogleActionsV2SimpleResponse[]
  speechBiasingHints?: string[]
}

export interface ConversationOptionsInit<TConvData, TUserStorage> {
  /** @public */
  data?: TConvData

  /** @public */
  storage?: TUserStorage
}

/** @hidden */
export interface ConversationBaseOptions<TConvData, TUserStorage> {
  /** @public */
  headers?: Headers

  /** @public */
  init?: ConversationOptionsInit<TConvData, TUserStorage>

  /** @public */
  debug?: boolean

  /** @public */
  ordersv3?: boolean
}

/** @hidden */
export interface ConversationOptions<TUserStorage> {
  /** @public */
  request?: Api.GoogleActionsV2AppRequest

  /** @public */
  headers?: Headers

  /** @public */
  init?: ConversationOptionsInit<{}, TUserStorage>

  /** @public */
  ordersv3?: boolean
}

/**
 * Throw an UnauthorizedError in an intent handler to make the library
 * respond with a HTTP 401 Status Code.
 *
 * @example
 * ```javascript
 * const app = dialogflow()
 *
 * // If using Actions SDK:
 * // const app = actionssdk()
 *
 * app.intent('intent', conv => {
 *   // ...
 *
 *   // given a function to check if a user auth is still valid
 *   const valid = checkUserAuthValid(conv)
 *   if (!valid) {
 *     throw new UnauthorizedError()
 *   }
 *
 *   // ...
 * })
 *
 * ```
 *
 * @public
 */
export class UnauthorizedError extends Error { }

/** @public */
export class Conversation<TUserStorage> {
  /** @public */
  request: Api.GoogleActionsV2AppRequest

  /** @public */
  headers: Headers

  /** @public */
  responses: Response[] = []

  /** @public */
  expectUserResponse = true

  /** @public */
  surface: Surface

  /** @public */
  available: Available

  /** @public */
  digested = false

  /**
   * True if the app is being tested in sandbox mode. Enable sandbox
   * mode in the [Actions console](console.actions.google.com) to test
   * transactions.
   * @public
   */
  sandbox: boolean

  /** @public */
  input: Input

  /**
   * Gets the {@link User} object.
   * The user object contains information about the user, including
   * a string identifier and personal information (requires requesting permissions,
   * see {@link Permission|conv.ask(new Permission)}).
   * @public
   */
  user: User<TUserStorage>

  /** @public */
  arguments: Arguments

  /** @public */
  device: Device

  /** @public */
  canvas: Canvas

  /**
   * Gets the unique conversation ID. It's a new ID for the initial query,
   * and stays the same until the end of the conversation.
   *
   * @example
   * ```javascript
   *
   * app.intent('actions.intent.MAIN', conv => {
   *   const conversationId = conv.id
   * })
   * ```
   *
   * @public
   */
  id: string

  /** @public */
  type: Api.GoogleActionsV2ConversationType

  /**
   * Shortcut for
   * {@link Capabilities|conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')}
   * @public
   */
  screen: boolean

  /**
   * Set reprompts when users don't provide input to this action (no-input errors).
   * Each reprompt represents as the {@link SimpleResponse}, but raw strings also can be specified
   * for convenience (they're passed to the constructor of {@link SimpleResponse}).
   * Notice that this value is not kept over conversations. Thus, it is necessary to set
   * the reprompts per each conversation response.
   *
   * @example
   * ```javascript
   *
   * app.intent('actions.intent.MAIN', conv => {
   *   conv.noInputs = [
   *     'Are you still there?',
   *     'Hello?',
   *     new SimpleResponse({
   *       text: 'Talk to you later. Bye!',
   *       speech: '<speak>Talk to you later. Bye!</speak>'
   *     })
   *   ]
   *   conv.ask('What's your favorite color?')
   * })
   * ```
   *
   * @public
   */
  noInputs: (string | SimpleResponse)[] = []

  /**
   * Sets speech biasing options.
   *
   * @example
   * ``` javascript
   *
   * app.intent('actions.intent.MAIN', conv => {
   *   conv.speechBiasing = ['red', 'blue', 'green']
   *   conv.ask('What is your favorite color out of red, blue, and green?')
   * })
   * ```
   *
   * @public
   */
  speechBiasing: string[] = []

  /** @hidden */
  _raw?: JsonObject

  /** @hidden */
  _responded = false

  /** @hidden */
  _init: ConversationOptionsInit<{}, TUserStorage>

  /** @hidden */
  _ordersv3 = false

  /** @hidden */
  constructor(options: ConversationOptions<TUserStorage> = {}) {
    const { request = {}, headers = {}, init = {}, ordersv3 = false } = options

    this.request = request
    this.headers = headers
    this._init = init
    this._ordersv3 = ordersv3

    this.sandbox = !!this.request.isInSandbox

    const { inputs = [], conversation = {} } = this.request
    const [input = {}] = inputs
    const { rawInputs = [] } = input

    this.input = new Input(rawInputs[0])
    this.surface = new Surface(this.request.surface)
    this.available = new Available(this.request.availableSurfaces)

    this.user = new User(this.request.user, this._init.storage)

    this.arguments = new Arguments(input.arguments)

    this.device = new Device(this.request.device)

    this.canvas = new Canvas(input)

    this.id = conversation.conversationId!

    this.type = conversation.type!

    this.screen = this.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
  }

  /** @public */
  json<T = JsonObject>(json: T) {
    this._raw = json
    this._responded = true
    return this
  }

  /** @public */
  add(...responses: Response[]) {
    if (this.digested) {
      throw new Error('Response has already been sent. ' +
        'Is this being used in an async call that was not ' +
        'returned as a promise to the intent handler?')
    }
    this.responses.push(...responses)
    this._responded = true
    return this
  }

  /**
   * Asks to collect user's input. All user's queries need to be sent to the app.
   * {@link https://developers.google.com/actions/policies/general-policies#user_experience|
   *     The guidelines when prompting the user for a response must be followed at all times}.
   *
   * @example
   * ```javascript
   *
   * // Actions SDK
   * const app = actionssdk()
   *
   * app.intent('actions.intent.MAIN', conv => {
   *   const ssml = '<speak>Hi! <break time="1"/> ' +
   *     'I can read out an ordinal like <say-as interpret-as="ordinal">123</say-as>. ' +
   *     'Say a number.</speak>'
   *   conv.ask(ssml)
   * })
   *
   * app.intent('actions.intent.TEXT', (conv, input) => {
   *   if (input === 'bye') {
   *     return conv.close('Goodbye!')
   *   }
   *   const ssml = `<speak>You said, <say-as interpret-as="ordinal">${input}</say-as></speak>`
   *   conv.ask(ssml)
   * })
   *
   * // Dialogflow
   * const app = dialogflow()
   *
   * app.intent('Default Welcome Intent', conv => {
   *   conv.ask('Welcome to action snippets! Say a number.')
   * })
   *
   * app.intent('Number Input', (conv, {num}) => {
   *   conv.close(`You said ${num}`)
   * })
   * ```
   *
   * @param responses A response fragment for the library to construct a single complete response
   * @public
   */
  ask(...responses: Response[]) {
    this.expectUserResponse = true
    return this.add(...responses)
  }

  /**
   * Have Assistant render the speech response and close the mic.
   *
   * @example
   * ```javascript
   *
   * // Actions SDK
   * const app = actionssdk()
   *
   * app.intent('actions.intent.MAIN', conv => {
   *   const ssml = '<speak>Hi! <break time="1"/> ' +
   *     'I can read out an ordinal like <say-as interpret-as="ordinal">123</say-as>. ' +
   *     'Say a number.</speak>'
   *   conv.ask(ssml)
   * })
   *
   * app.intent('actions.intent.TEXT', (conv, input) => {
   *   if (input === 'bye') {
   *     return conv.close('Goodbye!')
   *   }
   *   const ssml = `<speak>You said, <say-as interpret-as="ordinal">${input}</say-as></speak>`
   *   conv.ask(ssml)
   * })
   *
   * // Dialogflow
   * const app = dialogflow()
   *
   * app.intent('Default Welcome Intent', conv => {
   *   conv.ask('Welcome to action snippets! Say a number.')
   * })
   *
   * app.intent('Number Input', (conv, {num}) => {
   *   conv.close(`You said ${num}`)
   * })
   * ```
   *
   * @param responses A response fragment for the library to construct a single complete response
   * @public
   */
  close(...responses: Response[]) {
    this.expectUserResponse = false
    return this.add(...responses)
  }

  /** @public */
  response(): ConversationResponse {
    if (!this._responded) {
      throw new Error('No response has been set. ' +
        'Is this being used in an async call that was not ' +
        'returned as a promise to the intent handler?')
    }
    if (this.digested) {
      throw new Error('Response has already been digested')
    }
    this.digested = true
    const { expectUserResponse } = this
    let richResponse = new RichResponse()
    let expectedIntent: Api.GoogleActionsV2ExpectedIntent | undefined
    let requireSimpleResponse = false
    for (const response of this.responses) {
      if (typeof response === 'string') {
        richResponse.add(response)
        continue
      }
      if (response instanceof Helper) {
        if (!(response instanceof SoloHelper)) {
          requireSimpleResponse = true
        }
        if (this._ordersv3) {
          let type: InputValueSpec | null = null
          if (response instanceof TransactionDecision) {
            type = 'type.googleapis.com/google.actions.transactions.v3.TransactionDecisionValueSpec'
          } else if (response instanceof TransactionRequirements) {
            type =
              'type.googleapis.com/google.actions.transactions.v3.TransactionRequirementsCheckSpec'
          }
          if (type !== null) {
            response.inputValueData['@type'] = type
          }
        }
        expectedIntent = response
        continue
      }
      if (response instanceof RichResponse) {
        richResponse = response
        continue
      }
      if (response instanceof Suggestions) {
        requireSimpleResponse = true
        richResponse.addSuggestion(response)
        continue
      }
      if (response instanceof Image) {
        requireSimpleResponse = true
        richResponse.add(new BasicCard({ image: response }))
        continue
      }
      if (response instanceof MediaObject) {
        requireSimpleResponse = true
        richResponse.add(new MediaResponse(response))
        continue
      }
      if (
        response instanceof BasicCard ||
        response instanceof Table ||
        response instanceof BrowseCarousel ||
        response instanceof MediaResponse ||
        response instanceof OrderUpdate ||
        response instanceof LinkOutSuggestion
      ) {
        requireSimpleResponse = true
        richResponse.add(response)
        continue
      }
      richResponse.add(response)
    }
    if (this._ordersv3) {
      for (const response of richResponse.items!) {
        const { structuredResponse } = response
        if (structuredResponse && structuredResponse.orderUpdate) {
          response.structuredResponse = { orderUpdateV3: structuredResponse.orderUpdate }
        }
      }
    }
    let hasSimpleResponse = false
    for (const response of richResponse.items!) {
      if (response.simpleResponse) {
        hasSimpleResponse = true
        break
      }
    }
    if (requireSimpleResponse && !hasSimpleResponse) {
      throw new Error('A simple response is required in addition to this type of response')
    }
    const userStorageIn = (new User(this.user.raw, this._init.storage))._serialize()
    const userStorageOut = this.user._serialize()
    const userStorage = userStorageOut === userStorageIn ? '' : userStorageOut
    const response: ConversationResponse = {
      expectUserResponse,
      richResponse,
      userStorage,
      expectedIntent,
    }
    if (this.noInputs.length > 0) {
      response.noInputPrompts = this.noInputs.map(prompt => {
        return (typeof prompt === 'string') ? new SimpleResponse(prompt) : prompt
      })
    }
    if (this.speechBiasing.length > 0) {
      response.speechBiasingHints = this.speechBiasing
    }
    return response
  }
}

export interface ExceptionHandler<
  TUserStorage,
  TConversation extends Conversation<TUserStorage>
> {
  /** @public */
  // tslint:disable-next-line:no-any allow to return any just detect if is promise
  (conv: TConversation, error: Error): Promise<any> | any
}

/** @hidden */
export interface Traversed {
  [key: string]: boolean
}

/** @hidden */
export interface ConversationAppOptions<TConvData, TUserStorage> extends AppOptions {
  /** @public */
  init?: () => ConversationOptionsInit<TConvData, TUserStorage>

  /**
   * Client ID for User Profile Payload Verification
   * See {@link Profile#payload|conv.user.profile.payload}
   * @public
   */
  clientId?: string

  /** @public */
  ordersv3?: boolean
}

export interface OAuth2ConfigClient {
  /** @public */
  id: string
}

export interface OAuth2Config {
  /** @public */
  client: OAuth2ConfigClient
}

export interface ConversationApp<TConvData, TUserStorage> extends ServiceBaseApp {
  /** @public */
  init?: () => ConversationOptionsInit<TConvData, TUserStorage>

  /** @public */
  auth?: OAuth2Config

  /** @public */
  ordersv3: boolean

  /** @hidden */
  _client?: OAuth2Client
}
