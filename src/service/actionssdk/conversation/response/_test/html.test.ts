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
import { HtmlResponse } from '../html'
import { RichResponse } from '../rich'
import { DialogflowConversation } from '../../../../dialogflow'
import { ActionsSdkConversation } from '../../../conv'

test('basic complete use case works', t => {
  const immersive = new HtmlResponse({
    url: 'https://example.com',
    data: { test: 'abc' },
    suppress: true,
  })
  const raw: Api.GoogleActionsV2UiElementsHtmlResponse = {
    url: 'https://example.com',
    updatedState: { test: 'abc' },
    suppressMic: true,
  }
  t.deepEqual(common.clone(immersive), raw)
})

test('basic complete non aliased use case works', t => {
  const immersive = new HtmlResponse({
    url: 'https://example.com',
    updatedState: { test: 'abc' },
    suppressMic: true,
  })
  const raw: Api.GoogleActionsV2UiElementsHtmlResponse = {
    url: 'https://example.com',
    updatedState: { test: 'abc' },
    suppressMic: true,
  }
  t.deepEqual(common.clone(immersive), raw)
})

test('only url works', t => {
  const immersive = new HtmlResponse({
    url: 'https://example.com',
  })
  const raw: Api.GoogleActionsV2UiElementsHtmlResponse = {
    url: 'https://example.com',
  }
  t.deepEqual(common.clone(immersive), raw)
})

test('only data works', t => {
  const immersive = new HtmlResponse({
    data: { test: 'abc' },
  })
  const raw: Api.GoogleActionsV2UiElementsHtmlResponse = {
    updatedState: { test: 'abc' },
  }
  t.deepEqual(common.clone(immersive), raw)
})

test('changing aliased suppress works', t => {
  const immersive = new HtmlResponse()
  immersive.suppress = true
  t.is(immersive.suppress, true)

  const raw: Api.GoogleActionsV2UiElementsHtmlResponse = {
    suppressMic: true,
  }
  t.deepEqual(common.clone(immersive), raw)
})

test('changing aliased data works', t => {
  const immersive = new HtmlResponse()
  immersive.data = { test: 'abc' }
  t.deepEqual(immersive.data, { test: 'abc' })

  const raw: Api.GoogleActionsV2UiElementsHtmlResponse = {
    updatedState: { test: 'abc' },
  }
  t.deepEqual(common.clone(immersive), raw)
})

test('works in RichResponse', t => {
  const rich = new RichResponse()

  rich.add(new HtmlResponse({
    url: 'https://example.com',
  }))

  const raw: Api.GoogleActionsV2RichResponse = {
    items: [
      {
        htmlResponse: {
          url: 'https://example.com',
        },
      },
    ],
  }

  t.deepEqual(common.clone(rich), raw)
})

test('DialogflowConversation serialized correctly', t => {
  const conv = new DialogflowConversation()

  conv.ask(new HtmlResponse({
    url: 'https://example.com',
  }))

  const raw = {
    payload: {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              htmlResponse: {
                url: 'https://example.com',
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

  conv.ask(new HtmlResponse({
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
                htmlResponse: {
                  url: 'https://example.com',
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
