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

/* tslint:disable:no-any written like auto generated types from protobufs */

import { ApiClientObjectMap } from '../../../common'
import * as ActionsApi from '../../actionssdk/api/v2'

export interface DialogflowV1OriginalRequest {
  source?: string
  version?: string
  data?: ActionsApi.GoogleActionsV2AppRequest
}

export interface DialogflowV1Parameters {
  [parameter: string]: string | Object | undefined
}

export interface DialogflowV1Context {
  name?: string
  parameters?: DialogflowV1Parameters
  lifespan?: number
}

export interface DialogflowV1Metadata {
  intentId?: string
  webhookUsed?: string
  webhookForSlotFillingUsed?: string
  nluResponseTime?: number
  intentName?: string
}

export interface DialogflowV1Button {
  text: string
  postback: string
}


export interface DialogflowV1Message {
  type?: number
  speech?: string
  title?: string
  subtitle?: string
  imageUrl?: string
  platform?: string
  buttons?: DialogflowV1Button[]
  payload?: ApiClientObjectMap<any>
  displayText?: string
}

export interface DialogflowV1Fulfillment {
  speech?: string
  messages?: DialogflowV1Message[]
}

export interface DialogflowV1Result {
  source?: string
  resolvedQuery?: string
  speech?: string
  action?: string
  actionIncomplete?: boolean
  parameters?: DialogflowV1Parameters
  contexts?: DialogflowV1Context[]
  metadata?: DialogflowV1Metadata
  fulfillment?: DialogflowV1Fulfillment
  score?: number
}

export interface DialogflowV1Status {
  code?: number
  errorType?: string
  webhookTimedOut?: boolean
}

export interface DialogflowV1WebhookRequest {
  originalRequest?: DialogflowV1OriginalRequest
  id?: string
  sessionId?: string
  timestamp?: string
  timezone?: string
  lang?: string
  result?: DialogflowV1Result
  status?: DialogflowV1Status
}

export interface DialogflowV1FollowupEvent {
  name?: string
  parameters?: DialogflowV1Parameters
}

export interface DialogflowV1WebhookResponse {
  speech?: string
  displayText?: string
  messages?: DialogflowV1Message[]
  data?: ApiClientObjectMap<any>
  contextOut?: DialogflowV1Context[]
  source?: string
  followupEvent?: DialogflowV1FollowupEvent
}
