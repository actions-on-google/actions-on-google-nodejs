/**
 * Copyright 2019 Google Inc. All Rights Reserved.
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
import * as Api from '../../../api/v2'
import * as common from '../../../../../common'
import { ImmersiveResponse } from '../canvas'
import { RichResponse } from '../rich'
import { DialogflowConversation } from '../../../../dialogflow'
import { ActionsSdkConversation } from '../../../conv'

test('basic complete use case works', t => {
  const immersive = new ImmersiveResponse({
    url: 'https://example.com',
    state: { test: 'abc' },
    suppress: true,
  })
  const raw: Api.GoogleActionsV2UiElementsImmersiveResponse = {
    loadImmersiveUrl: 'https://example.com',
    updatedState: { test: 'abc' },
    suppressMic: true,
  }
  t.deepEqual(common.clone(immersive), raw)
})

test('basic complete non aliased use case works', t => {
  const immersive = new ImmersiveResponse({
    loadImmersiveUrl: 'https://example.com',
    updatedState: { test: 'abc' },
    suppressMic: true,
  })
  const raw: Api.GoogleActionsV2UiElementsImmersiveResponse = {
    loadImmersiveUrl: 'https://example.com',
    updatedState: { test: 'abc' },
    suppressMic: true,
  }
  t.deepEqual(common.clone(immersive), raw)
})

test('only url works', t => {
  const immersive = new ImmersiveResponse({
    url: 'https://example.com',
  })
  const raw: Api.GoogleActionsV2UiElementsImmersiveResponse = {
    loadImmersiveUrl: 'https://example.com',
  }
  t.deepEqual(common.clone(immersive), raw)
})

test('only state works', t => {
  const immersive = new ImmersiveResponse({
    state: { test: 'abc' },
  })
  const raw: Api.GoogleActionsV2UiElementsImmersiveResponse = {
    updatedState: { test: 'abc' },
  }
  t.deepEqual(common.clone(immersive), raw)
})

test('changing aliased url works', t => {
  const immersive = new ImmersiveResponse()
  immersive.url = 'https://example.com'
  t.is(immersive.url, 'https://example.com')

  const raw: Api.GoogleActionsV2UiElementsImmersiveResponse = {
    loadImmersiveUrl: 'https://example.com',
  }
  t.deepEqual(common.clone(immersive), raw)
})

test('changing aliased suppress works', t => {
  const immersive = new ImmersiveResponse()
  immersive.suppress = true
  t.is(immersive.suppress, true)

  const raw: Api.GoogleActionsV2UiElementsImmersiveResponse = {
    suppressMic: true,
  }
  t.deepEqual(common.clone(immersive), raw)
})

test('changing aliased state works', t => {
  const immersive = new ImmersiveResponse()
  immersive.state = { test: 'abc' }
  t.deepEqual(immersive.state, { test: 'abc' })

  const raw: Api.GoogleActionsV2UiElementsImmersiveResponse = {
    updatedState: { test: 'abc' },
  }
  t.deepEqual(common.clone(immersive), raw)
})

test('works in RichResponse', t => {
  const rich = new RichResponse()

  rich.add(new ImmersiveResponse({
    url: 'https://example.com',
  }))

  const raw: Api.GoogleActionsV2RichResponse = {
    items: [
      {
        immersiveResponse: {
          loadImmersiveUrl: 'https://example.com',
        },
      },
    ],
  }

  t.deepEqual(common.clone(rich), raw)
})

test('DialogflowConversation serialized correctly', t => {
  const conv = new DialogflowConversation()

  conv.ask(new ImmersiveResponse({
    url: 'https://example.com',
  }))

  const raw = {
    payload: {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              immersiveResponse: {
                loadImmersiveUrl: 'https://example.com',
              },
            },
          ],
        },
      },
    },
  }

  t.deepEqual(common.clone(conv.serialize()), raw)
})

test('ActionsSdkConversation serialized correctly', t => {
  const conv = new ActionsSdkConversation()

  conv.ask(new ImmersiveResponse({
    url: 'https://example.com',
  }))

  const raw = {
    expectUserResponse: true,
    expectedInputs: [
      {
        possibleIntents: [
          {
            intent: 'actions.intent.TEXT',
          },
        ],
        inputPrompt: {
          richInitialPrompt: {
            items: [
              {
                immersiveResponse: {
                  loadImmersiveUrl: 'https://example.com',
                },
              },
            ],
          },
        },
      },
    ],
  }

  t.deepEqual(common.clone(conv.serialize()), raw)
})
