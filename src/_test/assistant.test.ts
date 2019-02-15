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
import * as sinon from 'sinon'

import * as common from '../common'
import { JsonObject } from '../common'

import { attach, AppHandler } from '../assistant'
import { Headers, StandardResponse, BuiltinFrameworkMetadata } from '../framework'

interface AvaContext {
  app: AppHandler
}

const test = ava as TestInterface<AvaContext>

test.beforeEach(t => {
  t.context.app = attach({})
})

test('app is a function', t => {
  t.is(typeof t.context.app, 'function')
})

test('app.frameworks is an object', t => {
  t.is(typeof t.context.app.frameworks, 'object')
})

test('app.handler throws error by default', async t => {
  const stub = sinon.stub(common, 'error')
  await t.throwsAsync(t.context.app.handler({}, {}))
  t.true(stub.called)
  stub.restore()
})

test('app.debug is false when not passed options', t => {
  t.false(t.context.app.debug)
})

test('app.debug is false when not passed debug in options', t => {
  const app = attach({}, {})
  t.false(app.debug)
})

test('app.debug is true when passed true', t => {
  const app = attach({}, { debug: true })
  t.true(app.debug)
})

test('app.debug is false when passed false', t => {
  const app = attach({}, { debug: false })
  t.false(app.debug)
})

test('app.use overrides the app object when plugin returns', t => {
  const override = {
    prop: true,
  }
  const app = t.context.app.use<{}, typeof override>(app => Object.assign(app, override))
  t.true(app.prop)
})

test('app.use returns the same app object when plugin returns void', t => {
  t.is(t.context.app.use(() => {}), t.context.app)
})

test('app.use returns the same app object with properties when plugin returns void', t => {
  interface TestPlugin {
    prop?: boolean
  }
  const app = t.context.app.use<{}, TestPlugin>(app => {
    (app as AppHandler & TestPlugin).prop = true
  })
  t.is(app, t.context.app)
  t.true(app.prop)
})

test('app.handler can process requests', async t => {
  const mock = {
    key: 'value',
  }
  const body = {
    body1: 'body2',
  }
  const headers = {
    headers1: 'headers2',
  }
  const app = attach({
    handler: async (body: JsonObject, headers: Headers): Promise<StandardResponse> => {
      return {
        body: {
          body,
          headers,
          mock,
        },
        status: 123,
      }
    },
  })
  t.is(typeof app.handler, 'function')
  const res = await app.handler(body, headers)
  t.is(res.status, 123)
  t.is(res.body.body, body)
  t.is(res.body.headers, headers)
  t.is(res.body.mock, mock)
})

test('app is callable as a StandardHandler', async t => {
  const mock = {
    key: 'value',
  }
  const body = {
    body1: 'body2',
  }
  const headers = {
    headers1: 'headers2',
  }
  const app = attach({
    handler: async (body: JsonObject, headers: Headers): Promise<StandardResponse> => {
      return {
        body: {
          body,
          headers,
          mock,
        },
        status: 123,
      }
    },
  })
  t.is(typeof app, 'function')
  const res = await app(body, headers)
  t.is(res.status, 123)
  t.is(res.body.body, body)
  t.is(res.body.headers, headers)
  t.is(res.body.mock, mock)
})

test('app is callable as a StandardHandler when debug is true', async t => {
  const mock = {
    key: 'value',
  }
  const body = {
    body1: 'body2',
  }
  const headers = {
    headers1: 'headers2',
  }
  const app = attach({
    handler: async (body: JsonObject, headers: Headers): Promise<StandardResponse> => {
      return {
        body: {
          body,
          headers,
          mock,
        },
        status: 123,
      }
    },
  }, {
    debug: true,
  })
  t.is(typeof app, 'function')
  const stub = sinon.stub(common, 'info')
  const res = await app(body, headers)
  t.true(stub.called)
  stub.restore()
  t.is(res.status, 123)
  t.is(res.body.body, body)
  t.is(res.body.headers, headers)
  t.is(res.body.mock, mock)
})

test('app is callable as an Express request', async t => {
  const mock = {
    key: 'value',
  }
  const body = {
    body1: 'body2',
  }
  const headers = {
    headers1: 'headers2',
  }
  const app = attach({
    handler: async (
      body: JsonObject,
      headers: Headers,
      metadata: BuiltinFrameworkMetadata,
    ): Promise<StandardResponse> => {
      t.not(typeof metadata.express!.request, 'undefined')
      t.not(typeof metadata.express!.response, 'undefined')
      return {
        body: {
          body,
          headers,
          mock,
        },
        status: 123,
      }
    },
  })
  t.is(typeof app, 'function')

  let resStatus = -1

  app({
    body,
    headers,
    get() {},
  }, {
    send(resBody: JsonObject) {
      t.is(resStatus, 123)
      t.is(resBody.body, body)
      t.is(resBody.headers, headers)
      t.is(resBody.mock, mock)
    },
    status(status: number) {
      resStatus = status
      return this
    },
  })
})

test('app.handler can process requests and response with response headers', async t => {
  const expectedHeaders = {
    headers3: 'headers4',
  }
  const app = attach({
    handler: async (body: JsonObject, headers: Headers): Promise<StandardResponse> => {
      return {
        body: {},
        status: 123,
        headers: expectedHeaders,
      }
    },
  })
  t.is(typeof app.handler, 'function')
  const res = await app.handler({}, {})
  t.is(res.status, 123)
  t.is(res.headers!.headers3, expectedHeaders.headers3)
})

test('app.handler adds content-type headers', async t => {
  const app = attach({
    handler: async (body: JsonObject, headers: Headers): Promise<StandardResponse> => {
      return {
        body: {},
        status: 123,
      }
    },
  })
  t.is(typeof app.handler, 'function')
  const res = await app.handler({}, {})
  t.is(res.status, 123)
  t.is(res.headers!['content-type'], 'application/json;charset=utf-8')
})
