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

import ava, { TestInterface } from 'ava'
import { AppHandler } from '../../../assistant'
import {
  dialogflow,
  DialogflowApp,
  DialogflowMiddleware,
  DialogflowIntentHandler,
} from '../dialogflow'
import { Contexts, Parameters } from '../context'
import { DialogflowConversation } from '../conv'
import * as Api from '../api/v2'
import * as ActionsApi from '../../actionssdk/api/v2'
import { clone } from '../../../common'
import { Argument, UnauthorizedError } from '../../actionssdk'
import { OAuth2Client } from 'google-auth-library'
import { SimpleResponse } from '../../actionssdk'

interface AvaContext {
  app: AppHandler & DialogflowApp<{}, {}, Contexts, DialogflowConversation>
}

const test = ava as TestInterface<AvaContext>

test.beforeEach(t => {
  t.context.app = dialogflow()
})

test('app is a function', t => {
  t.is(typeof t.context.app, 'function')
})

test('app.debug is false when not passed options', t => {
  t.false(t.context.app.debug)
})

test('app.debug is true when passed true', t => {
  const app = dialogflow({ debug: true })
  t.true(app.debug)
})

test('app without any handlers throws error', async t => {
  await t.throwsAsync(t.context.app.handler({
    originalDetectIntentRequest: {
      payload: {
        isInSandbox: true,
      } as ActionsApi.GoogleActionsV2AppRequest,
    },
  } as Api.GoogleCloudDialogflowV2WebhookRequest, {}))
})

test('app sets handler using app.intent', t => {
  const intent = 'abc123'
  const handler = () => {}
  t.context.app.intent(intent, handler)
  t.is(t.context.app._handlers.intents[intent], handler)
})

test('app gets simple response string when using app.intent', async t => {
  const intent = 'abc123'
  const response = 'abcdefg1234567'
  const session = 'abcdefghijk'
  t.context.app.intent(intent, conv => conv.ask(response))
  const res = await t.context.app.handler({
    session,
    queryResult: {
      intent: {
        displayName: intent,
      },
    },
    originalDetectIntentRequest: {
      payload: {
        isInSandbox: true,
      } as ActionsApi.GoogleActionsV2AppRequest,
    },
  } as Api.GoogleCloudDialogflowV2WebhookRequest, {})
  t.is(res.status, 200)
  t.deepEqual(clone(res.body), {
    payload: {
      google: {
        expectUserResponse: true,
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
    },
  })
})

test('app gets simple response string with reprompts when using app.intent', async t => {
  const intent = 'abc123'
  const response = 'abcdefg1234567'
  const reprompt1 = 'reprompt1234567'
  const reprompt2 = 'reprompt7654321'
  const session = 'abcdefghijk'
  t.context.app.intent(intent, conv => {
    conv.ask(response)
    conv.noInputs = [reprompt1, new SimpleResponse(reprompt2)]
  })
  const res = await t.context.app.handler({
    session,
    queryResult: {
      intent: {
        displayName: intent,
      },
    },
    originalDetectIntentRequest: {
      payload: {
        isInSandbox: true,
      } as ActionsApi.GoogleActionsV2AppRequest,
    },
  } as Api.GoogleCloudDialogflowV2WebhookRequest, {})
  t.is(res.status, 200)
  t.deepEqual(clone(res.body), {
    payload: {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              simpleResponse: {
                textToSpeech: response,
              },
            },
          ],
        },
        noInputPrompts: [
          {
            textToSpeech: reprompt1,
          },
          {
            textToSpeech: reprompt2,
          },
        ],
      },
    },
  })
})

test('app throws error when intent handler throws error', async t => {
  const intent = 'abc123'
  const error = 'abcdefg1234567'
  const session = 'abcdefghijk'
  t.context.app.intent(intent, conv => {
    throw new Error(error)
  })
  const res: Error = await t.throwsAsync(t.context.app.handler({
    session,
    queryResult: {
      intent: {
        displayName: intent,
      },
    },
    originalDetectIntentRequest: {
      payload: {
        isInSandbox: true,
      } as ActionsApi.GoogleActionsV2AppRequest,
    },
  } as Api.GoogleCloudDialogflowV2WebhookRequest, {}))
  t.is(res.message, error)
})

test('app sets catcher using app.catch', t => {
  const catcher = () => {}
  t.context.app.catch(catcher)
  t.is(t.context.app._handlers.catcher, catcher)
})

test('app uses catcher when intent handler throws error', async t => {
  const intent = 'abc123'
  const response = 'abcdefg1234567'
  const session = 'abcdefghijk'
  const error = 'abcdefg1234567abc'
  t.context.app.intent(intent, conv => {
    throw new Error(error)
  })
  t.context.app.catch((conv, e) => {
    t.is(e.message, error)
    conv.ask(response)
  })
  const res = await t.context.app.handler({
    session,
    queryResult: {
      intent: {
        displayName: intent,
      },
    },
    originalDetectIntentRequest: {
      payload: {
        isInSandbox: true,
      } as ActionsApi.GoogleActionsV2AppRequest,
    },
  } as Api.GoogleCloudDialogflowV2WebhookRequest, {})
  t.is(res.status, 200)
  t.deepEqual(clone(res.body), {
    payload: {
      google: {
        expectUserResponse: true,
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
    },
  })
})

test('app sets fallback using app.fallback', t => {
  const fallback = () => {}
  t.context.app.fallback(fallback)
  t.is(t.context.app._handlers.fallback, fallback)
})

test('app uses fallback when no intent handler', async t => {
  const response = 'abcdefg1234567'
  const session = 'abcdefghijk'
  t.context.app.fallback(conv => {
    conv.ask(response)
  })
  const res = await t.context.app.handler({
    session,
    queryResult: {},
    originalDetectIntentRequest: {
      payload: {
        isInSandbox: true,
      } as ActionsApi.GoogleActionsV2AppRequest,
    },
  } as Api.GoogleCloudDialogflowV2WebhookRequest, {})
  t.is(res.status, 200)
  t.deepEqual(clone(res.body), {
    payload: {
      google: {
        expectUserResponse: true,
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
    },
  })
})

test('app adds middleware using app.middleware', t => {
  const middleware = () => {}
  t.context.app.middleware(middleware)
  t.deepEqual(t.context.app._middlewares, [middleware])
})

test('app uses middleware using Object.assign', async t => {
  const response = 'abcdefg1234567'
  interface TestMiddleware {
    test(): void
  }
  const middleware: DialogflowMiddleware<
    TestMiddleware & DialogflowConversation<{}, {}, Contexts>
  > = conv => Object.assign(conv, {
    test() {
      conv.ask(response)
    },
  })
  const app = dialogflow<TestMiddleware & DialogflowConversation<{}, {}, Contexts>>()
  app._middlewares.push(middleware)
  const session = 'abcdefghijk'
  app.fallback(conv => {
    conv.test()
  })
  const res = await app.handler({
    session,
    queryResult: {},
    originalDetectIntentRequest: {
      payload: {
        isInSandbox: true,
      } as ActionsApi.GoogleActionsV2AppRequest,
    },
  } as Api.GoogleCloudDialogflowV2WebhookRequest, {})
  t.is(res.status, 200)
  t.deepEqual(clone(res.body), {
    payload: {
      google: {
        expectUserResponse: true,
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
    },
  })
})

test('app uses async middleware using Object.assign', async t => {
  const response = 'abcdefg1234567'
  interface TestMiddleware {
    test(): void
  }
  const middleware: DialogflowMiddleware<
    TestMiddleware & DialogflowConversation<{}, {}, Contexts>
  > = async conv => Object.assign(conv, {
    test() {
      conv.ask(response)
    },
  })
  const app = dialogflow<TestMiddleware & DialogflowConversation<{}, {}, Contexts>>()
  app._middlewares.push(middleware)
  const session = 'abcdefghijk'
  app.fallback(conv => {
    conv.test()
  })
  const res = await app.handler({ session } as Api.GoogleCloudDialogflowV2WebhookRequest, {})
  t.is(res.status, 200)
  t.deepEqual(clone(res.body), {
    payload: {
      google: {
        expectUserResponse: true,
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
    },
  })
})

test('app uses async middleware returning void', async t => {
  const response = 'abcdefg1234567'
  interface TestMiddleware {
    test(): void
  }
  const middleware: DialogflowMiddleware<
    TestMiddleware & DialogflowConversation<{}, {}, Contexts>
  > = async conv => {
    (conv as TestMiddleware & DialogflowConversation<{}, {}, Contexts>)
      .test = () => conv.ask(response)
  }
  const app = dialogflow<TestMiddleware & DialogflowConversation<{}, {}, Contexts>>()
  app._middlewares.push(middleware)
  const session = 'abcdefghijk'
  app.fallback(conv => {
    conv.test()
  })
  const res = await app.handler({ session } as Api.GoogleCloudDialogflowV2WebhookRequest, {})
  t.is(res.status, 200)
  t.deepEqual(clone(res.body), {
    payload: {
      google: {
        expectUserResponse: true,
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
    },
  })
})

test('app uses async middleware returning promise', async t => {
  const response = 'abcdefg1234567'
  interface TestMiddleware {
    test(): void
  }
  const middleware: DialogflowMiddleware<
    TestMiddleware & DialogflowConversation<{}, {}, Contexts>
  > = conv => Promise.resolve(Object.assign(conv, {
    test() {
      conv.ask(response)
    },
  }))
  const app = dialogflow<TestMiddleware & DialogflowConversation<{}, {}, Contexts>>()
  app._middlewares.push(middleware)
  const session = 'abcdefghijk'
  app.fallback(conv => {
    conv.test()
  })
  const res = await app.handler({ session } as Api.GoogleCloudDialogflowV2WebhookRequest, {})
  t.is(res.status, 200)
  t.deepEqual(clone(res.body), {
    payload: {
      google: {
        expectUserResponse: true,
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
    },
  })
})

test('app gives middleware framework metadata', async t => {
  const metadata = {
    custom: {
      request: 'test',
    },
  }
  const response = 'abcdefg1234567'
  let called = false
  const middleware: DialogflowMiddleware<DialogflowConversation<{}, {}, Contexts>
  > = (conv, framework) => {
    called = true
    t.is(framework, metadata)
  }
  const app = dialogflow<DialogflowConversation<{}, {}, Contexts>>()
  app._middlewares.push(middleware)
  const session = 'abcdefghijk'
  app.fallback(conv => {
    conv.ask(response)
  })
  const res = await app.handler({
    session,
    queryResult: {},
    originalDetectIntentRequest: {
      payload: {
        isInSandbox: true,
      } as ActionsApi.GoogleActionsV2AppRequest,
    },
  } as Api.GoogleCloudDialogflowV2WebhookRequest, {}, metadata)
  t.true(called)
  t.is(res.status, 200)
  t.deepEqual(clone(res.body), {
    payload: {
      google: {
        expectUserResponse: true,
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
    },
  })
})

test('app works when validation is valid headers', async t => {
  const response = 'abcdefg1234567'
  const session = 'abcdefghijk'
  const verification = {
    key: 'value',
  }
  const app = dialogflow({
    verification,
  })
  app.fallback(conv => {
    conv.ask(response)
  })
  const res = await app.handler({
    session,
    queryResult: {},
    originalDetectIntentRequest: {
      payload: {
        isInSandbox: true,
      } as ActionsApi.GoogleActionsV2AppRequest,
    },
  } as Api.GoogleCloudDialogflowV2WebhookRequest, verification)
  t.is(res.status, 200)
  t.deepEqual(clone(res.body), {
    payload: {
      google: {
        expectUserResponse: true,
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
    },
  })
})

test('app throws error when verification headers is not provided', async t => {
  const response = 'abcdefg1234567'
  const session = 'abcdefghijk'
  const verification = {
    key: 'value',
  }
  const app = dialogflow({
    verification,
  })
  app.fallback(conv => {
    conv.ask(response)
  })
  const res = await app.handler({
    session,
    queryResult: {},
    originalDetectIntentRequest: {
      payload: {
        isInSandbox: true,
      } as ActionsApi.GoogleActionsV2AppRequest,
    },
  } as Api.GoogleCloudDialogflowV2WebhookRequest, {})
  t.is(res.body.error, 'A verification header key was not found')
})

test('app.intent using array sets intent handlers for each', t => {
  const intents = ['intent1', 'intent2']
  const handler: DialogflowIntentHandler<
    {},
    {},
    Contexts,
    DialogflowConversation,
    Parameters,
    Argument
  > = conv => {
  }
  t.context.app.intent(intents, handler)
  t.is(t.context.app._handlers.intents[intents[0]], handler)
  t.is(t.context.app._handlers.intents[intents[1]], handler)
})

test('auth config is set correctly with clientId', t => {
  const id = 'test'
  const app = dialogflow({
    clientId: id,
  })
  t.true(app._client instanceof OAuth2Client)
  t.is(app.auth!.client.id, id)
})

test('auth config is not set with no clientId', t => {
  const app = dialogflow()
  t.is(typeof app._client, 'undefined')
  t.is(typeof app.auth, 'undefined')
})

test('throwing an UnauthorizedError makes library respond with 401', async t => {
  const app = dialogflow()
  app.fallback(() => {
    throw new UnauthorizedError()
  })
  const result = await app.handler({}, {})
  t.is(result.status, 401)
  t.deepEqual(result.body, {})
})

test('throwing an UnauthorizedError in catch makes library respond with 401', async t => {
  const app = dialogflow()
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

  const app = dialogflow()
  app.fallback(() => {
    throw new Error()
  })
  app.catch(() => {
    throw new Error(message)
  })
  await t.throwsAsync(app.handler({}, {}), message)
})
