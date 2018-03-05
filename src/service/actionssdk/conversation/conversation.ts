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
  SimpleResponse,
} from './response'
import { Question, SoloQuestion } from './question'
import { Arguments } from './argument'
import { Device } from './device'
import { Input } from './input'

/** @public */
export type Response =
  RichResponse |
  string |
  SimpleResponse |
  BasicCard |
  Suggestions |
  Image |
  Question

export interface ConversationResponse {
  richResponse: Api.GoogleActionsV2RichResponse
  expectUserResponse: boolean
  userStorage: string
  expectedIntent?: Api.GoogleActionsV2ExpectedIntent
}

export interface ConversationOptionsInit<TUserStorage> {
  storage?: TUserStorage
}

export interface ConversationOptions<TUserStorage> {
  request: Api.GoogleActionsV2AppRequest
  headers: Headers
  init?: ConversationOptionsInit<TUserStorage>
}

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

  /** @public */
  sandbox: boolean

  /** @public */
  input: Input

  /** @public */
  user: User<TUserStorage>

  /** @public */
  arguments: Arguments

  /** @public */
  device: Device

  constructor(options: ConversationOptions<TUserStorage>) {
    const { request, headers, init } = options

    this.request = request
    this.headers = headers

    this.sandbox = !!this.request.isInSandbox

    const { inputs = [] } = this.request
    const [input = {}] = inputs
    const { rawInputs = [] } = input

    this.input = new Input(rawInputs[0])
    this.surface = new Surface(this.request.surface)
    this.available = new Available(this.request.availableSurfaces)

    this.user = new User(this.request.user, init && init.storage)

    this.arguments = new Arguments(input.arguments)

    this.device = new Device(this.request.device)
  }

  /** @public */
  add(...responses: Response[]) {
    if (this.digested) {
      throw new Error('Response has already been sent. ' +
        'Is this being used in an async call that was not ' +
        'returned as a promise to the action/intent handler?')
    }
    this.responses.push(...responses)
    return this
  }

  /** @public */
  ask(...responses: Response[]) {
    this.expectUserResponse = true
    return this.add(...responses)
  }

  /** @public */
  close(...responses: Response[]) {
    this.expectUserResponse = false
    return this.add(...responses)
  }

  /** @public */
  response(): ConversationResponse {
    if (this.digested) {
      throw new Error('Response has already been digested')
    }
    this.digested = true
    const { expectUserResponse } = this
    let richResponse = new RichResponse()
    let expectedIntent: Api.GoogleActionsV2ExpectedIntent | undefined
    for (const response of this.responses) {
      if (typeof response === 'string') {
        richResponse.add(response)
        continue
      }
      if (response instanceof Question) {
        expectedIntent = response
        if (response instanceof SoloQuestion) {
          // SoloQuestions don't require a SimpleResponse
          // but API still requires a SimpleResponse
          // so a placeholder is added to not error

          // It won't show up to the user as PLACEHOLDER
          richResponse.add('PLACEHOLDER')
        }
        continue
      }
      if (response instanceof RichResponse) {
        richResponse = response
        continue
      }
      if (response instanceof Suggestions) {
        if (!richResponse.suggestions) {
          richResponse.suggestions = []
        }
        richResponse.suggestions.push(...response.suggestions)
        continue
      }
      if (response instanceof Image) {
        richResponse.add(new BasicCard({ image: response }))
        continue
      }
      richResponse.add(response)
    }
    const userStorage = this.user.serialize()
    return {
      expectUserResponse,
      richResponse,
      userStorage,
      expectedIntent,
    }
  }
}

export interface ExceptionHandler<
  TUserStorage,
  TConversation extends Conversation<TUserStorage>
> {
  // tslint:disable-next-line:no-any allow developer to return any just detect if is promise
  (conv: TConversation, error: Error): Promise<any> | any
}
