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

import {
  actionssdk,
  ActionsSdkMiddleware,
  ActionsSdkIntentHandler,
} from '../actionssdk'
import { ActionsSdkConversation, Argument } from '..'
import * as Api from '../api/v2'
import { OAuth2Client } from 'google-auth-library'
import { clone } from '../../../common'
import { UnauthorizedError } from '../conversation'

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

test('intent handler is invoked', (t) => {
  const app = actionssdk()
  let invoked = false

  app.intent('intent.foo', (conv) => {
    invoked = true
    return conv.ask('hello')
  })

  const promise = app.handler(buildRequest('NEW', 'intent.foo'), {})

  return promise.then((result) => {
    t.is(result.status, 200)
    t.true(invoked)
  })
})

test('fallback handler is invoked', t => {
  const app = actionssdk()
  let intentInvoked = false
  let fallbackInvoked = false

  app.intent('intent.foo', (conv) => {
    intentInvoked = true
    return conv.ask('hello')
  })
  app.intent('intent.bar', (conv) => {
    intentInvoked = true
    return conv.ask('hello')
  })
  app.fallback((conv) => {
    fallbackInvoked = true
    return conv.ask('fallback')
  })

  const promise = app.handler(buildRequest('NEW', 'some.other.intent'), {})

  return promise.then((result) => {
    t.is(result.status, 200)
    t.false(intentInvoked)
    t.true(fallbackInvoked)
  })
})

test('middleware is used', t => {
  const app = actionssdk()
  let middlewareUsed = false

  app.intent('intent.foo', (conv) => {
    return conv.close('hello')
  })
  app.use(() => {
    middlewareUsed = true
  })

  const promise = app.handler(buildRequest('NEW', 'intent.foo'), {})

  return promise.then((result) => {
    t.is(result.status, 200)
    t.true(middlewareUsed)
  })
})

test('app.intent using array sets intent handlers for each', t => {
  const app = actionssdk()
  const intents = ['intent1', 'intent2']
  const handler: ActionsSdkIntentHandler<{}, {}, ActionsSdkConversation, Argument> = conv => {
  }
  app.intent(intents, handler)
  t.is(app._handlers.intents[intents[0]], handler)
  t.is(app._handlers.intents[intents[1]], handler)
})

test('auth config is set correctly with clientId', t => {
  const id = 'test'
  const app = actionssdk({
    clientId: id,
  })
  t.true(app._client instanceof OAuth2Client)
  t.is(app.auth!.client.id, id)
})

test('auth config is not set with no clientId', t => {
  const app = actionssdk()
  t.is(typeof app._client, 'undefined')
  t.is(typeof app.auth, 'undefined')
})

test('app gives middleware framework metadata', async t => {
  const metadata = {
    custom: {
      request: 'test',
    },
  }
  const response = 'abcdefg1234567'
  let called = false
  const middleware: ActionsSdkMiddleware<ActionsSdkConversation<{}, {}>
  > = (conv, framework) => {
    called = true
    t.is(framework, metadata)
  }
  const app = actionssdk<ActionsSdkConversation<{}, {}>>()
  app._middlewares.push(middleware)
  app.fallback(conv => {
    conv.ask(response)
  })
  await app.handler(buildRequest('NEW', 'intent.foo'), {}, metadata)
  t.true(called)
})

test('app uses async middleware using Object.assign', async t => {
  const response = 'abcdefg1234567'
  interface TestMiddleware {
    test(): void
  }
  const middleware: ActionsSdkMiddleware<
    TestMiddleware & ActionsSdkConversation<{}, {}>
  > = async conv => Object.assign(conv, {
    test() {
      conv.ask(response)
    },
  })
  const app = actionssdk<TestMiddleware & ActionsSdkConversation<{}, {}>>()
  app._middlewares.push(middleware)
  app.fallback(conv => {
    conv.test()
  })
  const res = await app.handler({}, {})
  t.is(res.status, 200)
  t.deepEqual(clone(res.body), {
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

test('app uses async middleware returning void', async t => {
  const response = 'abcdefg1234567'
  interface TestMiddleware {
    test(): void
  }
  const middleware: ActionsSdkMiddleware<
    TestMiddleware & ActionsSdkConversation<{}, {}>
  > = async conv => {
    (conv as TestMiddleware & TestMiddleware & ActionsSdkConversation<{}, {}>)
      .test = () => conv.ask(response)
  }
  const app = actionssdk<TestMiddleware & ActionsSdkConversation<{}, {}>>()
  app._middlewares.push(middleware)
  app.fallback(conv => {
    conv.test()
  })
  const res = await app.handler({}, {})
  t.is(res.status, 200)
  t.deepEqual(clone(res.body), {
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

test('app uses async middleware returning promise', async t => {
  const response = 'abcdefg1234567'
  interface TestMiddleware {
    test(): void
  }
  const middleware: ActionsSdkMiddleware<
    TestMiddleware & ActionsSdkConversation<{}, {}>
  > = conv => Promise.resolve(Object.assign(conv, {
    test() {
      conv.ask(response)
    },
  }))
  const app = actionssdk<TestMiddleware & ActionsSdkConversation<{}, {}>>()
  app._middlewares.push(middleware)
  app.fallback(conv => {
    conv.test()
  })
  const res = await app.handler({}, {})
  t.is(res.status, 200)
  t.deepEqual(clone(res.body), {
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

test('throwing an UnauthorizedError makes library respond with 401', async t => {
  const app = actionssdk()
  app.fallback(() => {
    throw new UnauthorizedError()
  })
  const result = await app.handler({}, {})
  t.is(result.status, 401)
  t.deepEqual(result.body, {})
})

test('throwing an UnauthorizedError in catch makes library respond with 401', async t => {
  const app = actionssdk()
  app.fallback(() => {
    throw new Error()
  })
  app.catch(() => {
    throw new UnauthorizedError()
  })
  const result = await app.handler({}, {})
  t.is(result.status, 401)
  t.deepEqual(result.body, {})
})

test('throwing an Error in catch makes library propogate error', async t => {
  const message = 'test'

  const app = actionssdk()
  app.fallback(() => {
    throw new Error()
  })
  app.catch(() => {
    throw new Error(message)
  })
  await t.throwsAsync(app.handler({}, {}), message)
})
