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

import ava, { RegisterContextual } from 'ava'
import { DialogflowConversation } from '../conv'
import * as ApiV1 from '../api/v1'

interface AvaContext {
  conv: DialogflowConversation
}

const test = ava as RegisterContextual<AvaContext>

test.beforeEach(t => {
  t.context.conv = new DialogflowConversation({
    body: {
      result: {},
      originalRequest: {
        data: {},
      },
    } as ApiV1.DialogflowV1WebhookRequest,
    headers: {},
  })
})

test('conv can be instantiated', t => {
  t.true(t.context.conv instanceof DialogflowConversation)
})
