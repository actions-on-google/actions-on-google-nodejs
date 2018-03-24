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
import { Conversation, ConversationOptionsInit } from './conversation'
import { Headers } from '../../framework'
import { info, debug, stringify } from '../../common'

/** @public */
export interface ActionsSdkConversationOptions<TConvData, TUserStorage> {
  body: Api.GoogleActionsV2AppRequest
  headers: Headers
  init?: ActionsSdkConversationOptionsInit<TConvData, TUserStorage>
  debug?: boolean
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

    this.body = options.body

    const { body = {}, init } = options

    const { inputs = [] } = body
    const [firstInput = {}] = inputs

    const { intent = '' } = firstInput
    const { conversation = {} } = body
    const { conversationToken } = conversation

    this.intent = intent

    this.data = conversationToken ? JSON.parse(conversationToken).data : ((init && init.data) || {})

    const log = debug ? info : debug
    log('Conversation', stringify(this, {
      request: null,
      headers: null,
      body: null,
    }))
  }

  serialize(): Api.GoogleActionsV2AppResponse {
    if (this.raw) {
      return this.raw
    }
    const {
      richResponse,
      expectUserResponse,
      userStorage,
      expectedIntent,
    } = this.response()
    const inputPrompt: Api.GoogleActionsV2InputPrompt = {
      richInitialPrompt: richResponse,
    }
    const possibleIntents: Api.GoogleActionsV2ExpectedIntent[] = [expectedIntent || {
      intent: 'actions.intent.TEXT',
    }]
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
