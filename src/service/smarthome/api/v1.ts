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

// See https://developers.google.com/actions/smarthome/

export type SmartHomeV1Intents = 'action.devices.SYNC' | 'action.devices.QUERY'
  | 'action.devices.EXECUTE' | 'action.devices.DISCONNECT'

export type SmartHomeV1ExecuteStatus = 'SUCCESS' | 'PENDING' | 'OFFLINE' | 'ERROR'

// See an extensive list of error codes at
// https://developers.google.com/actions/reference/smarthome/errors-exceptions
export type SmartHomeV1ExecuteErrors = string

export interface SmartHomeV1SyncRequestInputs {
  intent: SmartHomeV1Intents,
}

export interface SmartHomeV1SyncRequest {
  requestId: string,
  inputs: SmartHomeV1SyncRequestInputs[]
}

export interface SmartHomeV1QueryRequestDevices {
  id: string,
  customData?: ApiClientObjectMap<any>
}

export interface SmartHomeV1QueryRequestPayload {
  devices: SmartHomeV1QueryRequestDevices[]
}

export interface SmartHomeV1QueryRequestInputs {
  intent: SmartHomeV1Intents,
  payload: SmartHomeV1QueryRequestPayload
}

export interface SmartHomeV1QueryRequest {
  requestId: string,
  inputs: SmartHomeV1QueryRequestInputs[]
}

export interface SmartHomeV1ExecuteRequestExecution {
  command: string,
  params?: ApiClientObjectMap<any>,
  challenge?: {
    pin?: string,
    ack?: boolean,
  }
}

export interface SmartHomeV1ExecuteRequestCommands {
  devices: SmartHomeV1QueryRequestDevices[],
  execution: SmartHomeV1ExecuteRequestExecution[],
}

export interface SmartHomeV1ExecuteRequestPayload {
  commands: SmartHomeV1ExecuteRequestCommands[]
}

export interface SmartHomeV1ExecuteRequestInputs {
  intent: SmartHomeV1Intents,
  payload: SmartHomeV1ExecuteRequestPayload
}

export interface SmartHomeV1ExecuteRequest {
  requestId: string,
  inputs: SmartHomeV1ExecuteRequestInputs[]
}

export interface SmartHomeV1DisconnectRequest {
  requestId: string,
  inputs: {
    intent: 'action.devices.DISCONNECT',
  }[]
}

export type SmartHomeV1Request = SmartHomeV1SyncRequest | SmartHomeV1QueryRequest |
  SmartHomeV1ExecuteRequest | SmartHomeV1DisconnectRequest

export interface SmartHomeV1SyncName {
  defaultNames: string[],
  name: string,
  nicknames: string[]
}

export interface SmartHomeV1SyncDeviceInfo {
  manufacturer: string,
  model: string,
  hwVersion: string,
  swVersion: string
}

export interface SmartHomeV1SyncOtherDeviceIds {
  agentId?: string
  deviceId: string
}

export interface SmartHomeV1SyncDevices {
  id: string,
  type: string,
  traits: string[],
  name: SmartHomeV1SyncName,
  willReportState: boolean,
  deviceInfo?: SmartHomeV1SyncDeviceInfo,
  attributes?: ApiClientObjectMap<any>,
  customData?: ApiClientObjectMap<any>,
  roomHint?: string,
  otherDeviceIds?: SmartHomeV1SyncOtherDeviceIds[],
}

export interface SmartHomeV1SyncPayload {
  agentUserId?: string,
  errorCode?: string,
  debugString?: string,
  devices: SmartHomeV1SyncDevices[]
}

export interface SmartHomeV1SyncResponse {
  requestId: string,
  payload: SmartHomeV1SyncPayload
}

export interface SmartHomeV1QueryPayload {
  devices: ApiClientObjectMap<any>
}

export interface SmartHomeV1QueryResponse {
  requestId: string,
  payload: SmartHomeV1QueryPayload
}

export interface SmartHomeV1ExecuteResponseCommands {
  ids: string[],
  status: SmartHomeV1ExecuteStatus,
  errorCode?: SmartHomeV1ExecuteErrors,
  debugString?: string,
  states?: ApiClientObjectMap<any>,
  challengeNeeded?: {
    type: challengeType,
  },
}

export type challengeType = 'ackNeeded' | 'pinNeeded' | 'challengeFailedPinNeeded'

export interface SmartHomeV1ExecutePayload {
  commands: SmartHomeV1ExecuteResponseCommands[],
  errorCode?: SmartHomeV1ExecuteErrors,
  debugString?: string,
}

export interface SmartHomeV1ExecuteResponse {
  requestId: string,
  payload: SmartHomeV1ExecutePayload
}

export interface SmartHomeV1DisconnectResponse { }

export type SmartHomeV1Response = SmartHomeV1SyncResponse | SmartHomeV1QueryResponse |
  SmartHomeV1ExecuteResponse | SmartHomeV1DisconnectResponse

export interface SmartHomeV1ReportStateRequest {
  requestId: string,
  agentUserId: string,
  payload: {
    devices: {
      states: ApiClientObjectMap<any>,
    },
  }
}
