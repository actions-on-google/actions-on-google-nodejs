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
import * as sinon from 'sinon'

import * as common from '../../../common'
import { clone } from '../../../common'

import * as Api from '../api/v2'

import {
  ActionsSdkConversationOptions,
  ActionsSdkConversation,
} from '../conv'
import { Permission } from '..'

const CONVERSATION_ID = '1234'
const USER_ID = 'abcd'

function buildRequest(
  convType: string, intent: string, data?: {}): Api.GoogleActionsV2AppRequest {
  const appRequest = {
    conversation: {
      conversationId: CONVERSATION_ID,
      type: convType,
      conversationToken: data,
    },
    user: {
      userId: USER_ID,
      locale: 'en_US',
    },
    inputs: [
      {
        intent,
        rawInputs: [
          {
            inputType: 'KEYBOARD',
            query: 'Talk to my test app',
          },
        ],
      },
    ],
    surface: {
      capabilities: [
        {
          name: 'actions.capability.SCREEN_OUTPUT',
        },
        {
          name: 'actions.capability.MEDIA_RESPONSE_AUDIO',
        },
        {
          name: 'actions.capability.WEB_BROWSER',
        },
        {
          name: 'actions.capability.AUDIO_OUTPUT',
        },
      ],
    },
    availableSurfaces: [
      {
        capabilities: [
          {
            name: 'actions.capability.SCREEN_OUTPUT',
          },
          {
            name: 'actions.capability.AUDIO_OUTPUT',
          },
        ],
      },
    ],
  } as Api.GoogleActionsV2AppRequest
  return appRequest
}

test('new conversation', t => {
  const intent = 'actions.intent.MAIN'
  const appRequest = buildRequest('NEW', intent, '')
  const options = {
    body: appRequest,
    headers: {},
  } as ActionsSdkConversationOptions<{}, {}>
  const conv = new ActionsSdkConversation(options)

  t.is(conv.body, appRequest)
  t.is(conv.intent, intent)
  t.is(conv.id, CONVERSATION_ID)
  const stub = sinon.stub(common, 'deprecate')
  t.is(conv.user.id, USER_ID)
  t.true(stub.called)
  stub.restore()
  t.is(conv.type, 'NEW')
  t.false(conv.digested)

  t.deepEqual(conv.data, {})
})

test('data is parsed from init', t => {
  const intent = 'example.intent.foo'
  const sessionData = {
    foo: 'bar',
  }
  const appRequest = buildRequest('ACTIVE', intent)
  const options = {
    body: appRequest,
    headers: {},
    init: {
      data: sessionData,
    },
  } as ActionsSdkConversationOptions<{}, {}>
  const conv = new ActionsSdkConversation(options)

  t.deepEqual(conv.data, sessionData)
})

test('data is parsed from conversation token', t => {
  const intent = 'example.intent.foo'
  const sessionData = {
    foo: 'bar',
  }
  const data = {
    data: sessionData,
  }
  const appRequest = buildRequest('ACTIVE', intent,
    JSON.stringify(data))
  const options = {
    body: appRequest,
    headers: {},
  } as ActionsSdkConversationOptions<{}, {}>
  const conv = new ActionsSdkConversation(options)

  t.deepEqual(conv.data, sessionData)
})

test('conv.data is parsed correctly', t => {
  const data = {
    a: '1',
    b: '2',
    c: {
      d: '3',
      e: '4',
    },
  }
  const conv = new ActionsSdkConversation({
    body: {
      conversation: {
        conversationToken: JSON.stringify({ data }),
      },
    } as Api.GoogleActionsV2AppRequest,
  })
  t.deepEqual(conv.data, data)
})

test('conv generates no conversationToken from empty conv.data', t => {
  const response = `What's up?`
  const conv = new ActionsSdkConversation()
  t.deepEqual(conv.data, {})
  conv.ask(response)
  t.deepEqual(clone(conv.serialize()), {
    expectUserResponse: true,
    expectedInputs: [
      {
        inputPrompt: {
          richInitialPrompt: {
            items: [
              {
                simpleResponse: {
                  textToSpeech: response,
                },
              },
            ],
          },
        },
        possibleIntents: [
          {
            intent: 'actions.intent.TEXT',
          },
        ],
      },
    ],
  })
})

test('conv generates first conv.data replaced correctly', t => {
  const response = `What's up?`
  const data = {
    a: '1',
    b: '2',
    c: {
      d: '3',
      e: '4',
    },
  }
  const conv = new ActionsSdkConversation()
  t.deepEqual(conv.data, {})
  conv.ask(response)
  conv.data = data
  t.deepEqual(clone(conv.serialize()), {
    expectUserResponse: true,
    expectedInputs: [
      {
        inputPrompt: {
          richInitialPrompt: {
            items: [
              {
                simpleResponse: {
                  textToSpeech: response,
                },
              },
            ],
          },
        },
        possibleIntents: [
          {
            intent: 'actions.intent.TEXT',
          },
        ],
      },
    ],
    conversationToken: JSON.stringify({ data }),
  })
})

test('conv generates first conv.data mutated correctly', t => {
  const response = `What's up?`
  const a = '7'
  const conv = new ActionsSdkConversation<{ a: string }>()
  t.deepEqual(conv.data, {})
  conv.ask(response)
  conv.data.a = a
  t.deepEqual(clone(conv.serialize()), {
    expectUserResponse: true,
    expectedInputs: [
      {
        inputPrompt: {
          richInitialPrompt: {
            items: [
              {
                simpleResponse: {
                  textToSpeech: response,
                },
              },
            ],
          },
        },
        possibleIntents: [
          {
            intent: 'actions.intent.TEXT',
          },
        ],
      },
    ],
    conversationToken: JSON.stringify({ data: { a } }),
  })
})

test('conv generates different conv.data correctly', t => {
  const response = `What's up?`
  const data = {
    a: '1',
    b: '2',
    c: {
      d: '3',
      e: '4',
    },
  }
  const e = '6'
  const conv = new ActionsSdkConversation<typeof data>({
    body: {
      conversation: {
        conversationToken: JSON.stringify({ data }),
      },
    } as Api.GoogleActionsV2AppRequest,
  })
  t.deepEqual(conv.data, data)
  conv.ask(response)
  conv.data.c.e = e
  t.deepEqual(clone(conv.serialize()), {
    expectUserResponse: true,
    expectedInputs: [
      {
        inputPrompt: {
          richInitialPrompt: {
            items: [
              {
                simpleResponse: {
                  textToSpeech: response,
                },
              },
            ],
          },
        },
        possibleIntents: [
          {
            intent: 'actions.intent.TEXT',
          },
        ],
      },
    ],
    conversationToken: JSON.stringify({
      data: {
        a: '1',
        b: '2',
        c: {
          d: '3',
          e,
        },
      },
    }),
  })
})

test('conv generates different conv.data correctly when only with init data', t => {
  const response = `What's up?`
  const data = {
    a: '1',
    b: '2',
    c: {
      d: '3',
      e: '4',
    },
  }
  const a = '7'
  const conv = new ActionsSdkConversation<typeof data>({
    body: {
      conversation: {
        conversationToken: JSON.stringify({ data }),
      },
    } as Api.GoogleActionsV2AppRequest,
    init: {
      data,
    },
  })
  t.deepEqual(conv.data, data)
  conv.ask(response)
  conv.data.a = a
  t.deepEqual(clone(conv.serialize()), {
    expectUserResponse: true,
    expectedInputs: [
      {
        inputPrompt: {
          richInitialPrompt: {
            items: [
              {
                simpleResponse: {
                  textToSpeech: response,
                },
              },
            ],
          },
        },
        possibleIntents: [
          {
            intent: 'actions.intent.TEXT',
          },
        ],
      },
    ],
    conversationToken: JSON.stringify({
      data: {
        a,
        b: '2',
        c: {
          d: '3',
          e: '4',
        },
      },
    }),
  })
})

test('conv generates same conv.data persisted', t => {
  const response = `What's up?`
  const data = {
    a: '1',
    b: '2',
    c: {
      d: '3',
      e: '4',
    },
  }
  const conv = new ActionsSdkConversation<typeof data>({
    body: {
      conversation: {
        conversationToken: JSON.stringify({ data }),
      },
    } as Api.GoogleActionsV2AppRequest,
  })
  t.deepEqual(conv.data, data)
  conv.ask(response)
  t.deepEqual(clone(conv.serialize()), {
    expectUserResponse: true,
    expectedInputs: [
      {
        inputPrompt: {
          richInitialPrompt: {
            items: [
              {
                simpleResponse: {
                  textToSpeech: response,
                },
              },
            ],
          },
        },
        possibleIntents: [
          {
            intent: 'actions.intent.TEXT',
          },
        ],
      },
    ],
    conversationToken: JSON.stringify({ data }),
  })
})

test('conv sends userStorage when it is not empty', t => {
  const response = `What's up?`
  const data = {
    a: '1',
    b: '2',
    c: {
      d: '3',
      e: '4',
    },
  }
  const conv = new ActionsSdkConversation()
  t.deepEqual(conv.user.storage, {})
  conv.user.storage = data
  conv.ask(response)
  t.deepEqual(clone(conv.serialize()), {
    expectUserResponse: true,
    expectedInputs: [
      {
        inputPrompt: {
          richInitialPrompt: {
            items: [
              {
                simpleResponse: {
                  textToSpeech: response,
                },
              },
            ],
          },
        },
        possibleIntents: [
          {
            intent: 'actions.intent.TEXT',
          },
        ],
      },
    ],
    userStorage: JSON.stringify({ data }),
  })
})

test('conv does not send userStorage when it is empty', t => {
  const response = `What's up?`
  const conv = new ActionsSdkConversation()
  t.deepEqual(conv.user.storage, {})
  conv.ask(response)
  t.deepEqual(clone(conv.serialize()), {
    expectUserResponse: true,
    expectedInputs: [
      {
        inputPrompt: {
          richInitialPrompt: {
            items: [
              {
                simpleResponse: {
                  textToSpeech: response,
                },
              },
            ],
          },
        },
        possibleIntents: [
          {
            intent: 'actions.intent.TEXT',
          },
        ],
      },
    ],
  })
})

test('conv sends correct ask response', t => {
  const response = `What's up?`
  const conv = new ActionsSdkConversation()
  conv.ask(response)
  t.deepEqual(clone(conv.serialize()), {
    expectUserResponse: true,
    expectedInputs: [
      {
        inputPrompt: {
          richInitialPrompt: {
            items: [
              {
                simpleResponse: {
                  textToSpeech: response,
                },
              },
            ],
          },
        },
        possibleIntents: [
          {
            intent: 'actions.intent.TEXT',
          },
        ],
      },
    ],
  })
})

test('conv sends correct close response', t => {
  const response = 'Bye'
  const conv = new ActionsSdkConversation()
  conv.close(response)
  t.deepEqual(clone(conv.serialize()), {
    expectUserResponse: false,
    finalResponse: {
      richResponse: {
        items: [
          {
            simpleResponse: {
              textToSpeech: response,
            },
          },
        ],
      },
    },
  })
})

test('conv sends speechBiasingHints when set', t => {
  const response = 'What is your favorite color out of red, blue, and green?'
  const biasing = ['red', 'blue', 'green']
  const conv = new ActionsSdkConversation()
  conv.speechBiasing = biasing
  conv.ask(response)
  t.deepEqual(clone(conv.serialize()), {
    expectUserResponse: true,
    expectedInputs: [
      {
        inputPrompt: {
          richInitialPrompt: {
            items: [
              {
                simpleResponse: {
                  textToSpeech: response,
                },
              },
            ],
          },
        },
        possibleIntents: [
          {
            intent: 'actions.intent.TEXT',
          },
        ],
        speechBiasingHints: biasing,
      },
    ],
  })
})

test('conv does not send inputPrompt when items are empty', t => {
  const conv = new ActionsSdkConversation()
  conv.ask(new Permission({ permissions: 'NAME' }))
  t.deepEqual(clone(conv.serialize()), {
    expectUserResponse: true,
    expectedInputs: [
      {
        possibleIntents: [
          {
            inputValueData: {
              '@type': 'type.googleapis.com/google.actions.v2.PermissionValueSpec',
              permissions: [
                'NAME',
              ],
            },
            intent: 'actions.intent.PERMISSION',
          },
        ],
      },
    ],
  })
})
