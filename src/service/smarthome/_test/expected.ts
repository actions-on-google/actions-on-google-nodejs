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

// Webhook requests and responses come from this documentation:
// https://developers.google.com/actions/smarthome/create-app

import * as Api from '../api/v1'
import { Headers } from '../../../framework'

export const SYNC_REQUEST: Api.SmartHomeV1SyncRequest = {
  requestId: 'ff36a3cc-ec34-11e6-b1a0-64510650abcf',
  inputs: [{
    intent: 'action.devices.SYNC',
  }],
}

export const SYNC_RESPONSE: Api.SmartHomeV1SyncResponse = {
  requestId: 'ff36a3cc-ec34-11e6-b1a0-64510650abcf',
  payload: {
    agentUserId: '1836.15267389',
    devices: [{
      id: '123',
      type: 'action.devices.types.OUTLET',
      traits: [
        'action.devices.traits.OnOff',
      ],
      name: {
        defaultNames: ['My Outlet 1234'],
        name: 'Night light',
        nicknames: ['wall plug'],
      },
      willReportState: false,
      deviceInfo: {
        manufacturer: 'lights-out-inc',
        model: 'hs1234',
        hwVersion: '3.2',
        swVersion: '11.4',
      },
      customData: {
        fooValue: 74,
        barValue: true,
        bazValue: 'foo',
      },
    }, {
      id: '456',
      type: 'action.devices.types.LIGHT',
      traits: [
        'action.devices.traits.OnOff',
        'action.devices.traits.Brightness',
        'action.devices.traits.ColorTemperature',
        'action.devices.traits.ColorSpectrum',
      ],
      name: {
        defaultNames: ['lights out inc. bulb A19 color hyperglow'],
        name: 'lamp1',
        nicknames: ['reading lamp'],
      },
      willReportState: false,
      attributes: {
        temperatureMinK: 2000,
        temperatureMaxK: 6500,
      },
      deviceInfo: {
        manufacturer: 'lights out inc.',
        model: 'hg11',
        hwVersion: '1.2',
        swVersion: '5.4',
      },
      customData: {
        fooValue: 12,
        barValue: false,
        bazValue: 'bar',
      },
      roomHint: 'Kitchen',
    }, {
      id: '789',
      type: 'action.devices.types.LIGHT',
      traits: [
        'action.devices.traits.OnOff',
        'action.devices.traits.Brightness',
        'action.devices.traits.ColorSetting',
      ],
      name: {
        defaultNames: ['lights out inc. bulb A20 color hyperglow'],
        name: 'lamp2',
        nicknames: ['writing lamp'],
      },
      willReportState: false,
      attributes: {
        colorModel: 'rgb',
        colorTemperatureRange: {
          temperatureMinK: 2000,
          temperatureMaxK: 9000,
        },
        commandOnlyColorSetting: false,
      },
      deviceInfo: {
        manufacturer: 'lights out inc.',
        model: 'hg11',
        hwVersion: '1.2',
        swVersion: '5.4',
      },
      customData: {
        fooValue: 12,
        barValue: false,
        bazValue: 'baz',
      },
      roomHint: 'Living Room',
      otherDeviceIds: [{
        deviceId: '789-but-local',
      }],
    }],
  },
}

export const QUERY_REQUEST: Api.SmartHomeV1QueryRequest = {
  requestId: 'ff36a3cc-ec34-11e6-b1a0-64510650abcf',
  inputs: [{
    intent: 'action.devices.QUERY',
    payload: {
      devices: [{
        id: '123',
        customData: {
          fooValue: 74,
          barValue: true,
          bazValue: 'foo',
        },
      }, {
        id: '456',
        customData: {
          fooValue: 12,
          barValue: false,
          bazValue: 'bar',
        },
      }],
    },
  }],
}

export const QUERY_RESPONSE: Api.SmartHomeV1QueryResponse = {
  requestId: 'ff36a3cc-ec34-11e6-b1a0-64510650abcf',
  payload: {
    devices: {
      123: {
        on: true,
        online: true,
      },
      456: {
        on: true,
        online: true,
        brightness: 80,
        color: {
          name: 'cerulean',
          spectrumRGB: 31655,
        },
      },
    },
  },
}

export const EXECUTE_REQUEST: Api.SmartHomeV1ExecuteRequest = {
  requestId: 'ff36a3cc-ec34-11e6-b1a0-64510650abcf',
  inputs: [{
    intent: 'action.devices.EXECUTE',
    payload: {
      commands: [{
        devices: [{
          id: '123',
          customData: {
            fooValue: 74,
            barValue: true,
            bazValue: 'sheepdip',
          },
        }, {
          id: '456',
          customData: {
            fooValue: 36,
            barValue: false,
            bazValue: 'moarsheep',
          },
        }],
        execution: [{
          command: 'action.devices.commands.OnOff',
          params: {
            on: true,
          },
        }],
      }],
    },
  }],
}

export const EXECUTE_RESPONSE: Api.SmartHomeV1ExecuteResponse = {
  requestId: 'ff36a3cc-ec34-11e6-b1a0-64510650abcf',
  payload: {
    commands: [{
      ids: ['123'],
      status: 'SUCCESS',
      states: {
        on: true,
        online: true,
      },
    }, {
      ids: ['456'],
      status: 'ERROR',
      errorCode: 'deviceTurnedOff',
    }],
  },
}

export const EXECUTE_REQUEST_2FA_ACK: Api.SmartHomeV1ExecuteRequest = {
  requestId: 'ff36a3cc-ec34-11e6-b1a0-64510650abcf',
  inputs: [{
    intent: 'action.devices.EXECUTE',
    payload: {
      commands: [{
        devices: [{
          id: '123',
        }],
        execution: [{
          command: 'action.devices.commands.TemperatureSetting',
          params: {
            thermostatMode: 'heat',
          },
          challenge: {
            ack: true,
          },
        }],
      }],
    },
  }],
}

export const EXECUTE_RESPONSE_2FA_ACK: Api.SmartHomeV1ExecuteResponse = {
  requestId: 'ff36a3cc-ec34-11e6-b1a0-64510650abcf',
  payload: {
    commands: [{
      ids: ['123'],
      status: 'ERROR',
      states: {
        thermostatMode: 'heat',
        thermostatTemperatureSetpoint: 28,
      },
      errorCode: 'challengeNeeded',
      challengeNeeded: {
        type: 'ackNeeded',
      },
    }],
  },
}

export const EXECUTE_REQUEST_2FA_PIN: Api.SmartHomeV1ExecuteRequest = {
  requestId: 'ff36a3cc-ec34-11e6-b1a0-64510650abcf',
  inputs: [{
    intent: 'action.devices.EXECUTE',
    payload: {
      commands: [{
        devices: [{
          id: '123',
        }],
        execution: [{
          command: 'action.devices.commands.LockUnlock',
          params: {
            lock: false,
          },
          challenge: {
            pin: '333222',
          },
        }],
      }],
    },
  }],
}

export const EXECUTE_RESPONSE_2FA_PIN_FAIL: Api.SmartHomeV1ExecuteResponse = {
  requestId: 'ff36a3cc-ec34-11e6-b1a0-64510650abcf',
  payload: {
    commands: [{
      ids: ['123'],
      status: 'ERROR',
      errorCode: 'challengeNeeded',
      challengeNeeded: {
        type: 'challengeFailedPinNeeded',
      },
    }],
  },
}

export const DISCONNECT_REQUEST: Api.SmartHomeV1DisconnectRequest = {
  requestId: 'ff36a3cc-ec34-11e6-b1a0-64510650abcf', /* Any unique ID */
  inputs: [{
    intent: 'action.devices.DISCONNECT',
  }],
}

export const DISCONNECT_RESPONSE: Api.SmartHomeV1DisconnectResponse = {}

export const REPORT_STATE_REQUEST: Api.SmartHomeV1ReportStateRequest = {
  requestId: 'ff36a3cc', /* Any unique ID */
  agentUserId: '123', /* Hardcoded user ID */
  payload: {
    devices: {
      states: {
        washer: {
          on: true,
          isPaused: true,
          isRunning: true,
          currentRunCycle: [{
            currentCycle: 'rinse',
            nextCycle: 'spin',
            lang: 'en',
          }],
          currentTotalRemainingTime: 1212,
          currentCycleRemainingTime: 301,
          currentModeSettings: {
            load: 'large',
          },
          currentToggleSettings: {
            Turbo: false,
          },
        },
      },
    },
  },
}

export const SMART_HOME_HEADERS: Headers = {
  'content-type': 'application/json;charset=UTF-8',
  'google-assistant-api-version': 'v1',
  authorization: 'Bearer TOKEN',
  host: 'example.com',
  'content-length': '283',
  'user-agent': 'Mozilla/5.0 (compatible; Google-Cloud-Functions/2.1; ' +
    '+http://www.google.com/bot.html)',
  'accept-encoding': 'gzip,deflate,br',
  'x-forwarded-proto': 'https',
  'x-forwarded-for': '0.0.0.0',
}

export const FRAMEWORK_METADATA = {
  custom: {
    request: 'test',
  },
}

export const REPORT_STATE_RESPONSE_SUCCESS = {
  requestId: '8947781099822982',
}

export const REPORT_STATE_RESPONSE_ERROR = {
  error: {
    code: 403,
    message: 'HomeGraph API Error.',
    status: 'PERMISSION_DENIED',
    details: [
      {
        '@type': 'type.googleapis.com/google.rpc.Help',
        links: [
          {
            description: 'Link error',
            url: 'https://console.developers.google.com/apis/api/homegraph.googleapis.com/',
          },
        ],
      },
    ],
  },
}
