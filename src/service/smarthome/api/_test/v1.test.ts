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

import test from 'ava'
import * as Api from '../v1'

test('api is an object', t => {
  t.is(typeof Api, 'object')
})

test('only command field is mandatory in SmartHomeV1ExecuteRequestExecution', t => {
  const dockExecuteRequest: Api.SmartHomeV1ExecuteRequest = {
    requestId: 'ff36a3cc-ec34-11e6-b1a0-64510650abcf',
    inputs: [
      {
        intent: 'action.devices.EXECUTE',
        payload: {
          commands: [
            {
              devices: [
                {
                  id: '123',
                  customData: {
                    fooValue: 74,
                    barValue: true,
                    bazValue: 'sheepdip',
                  },
                },
              ],
              execution: [
                {
                  command: 'action.devices.commands.Dock',
                },
              ],
            },
          ],
        },
      },
    ],
  }
  t.is(typeof dockExecuteRequest, 'object')
})
