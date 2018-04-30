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
import { Lambda } from '../lambda'
import { JsonObject } from '../../common'
import { StandardResponse } from '..'

interface AvaContext {
  lambda: Lambda
}

const test = ava as RegisterContextual<AvaContext>

test.beforeEach(t => {
  t.context.lambda = new Lambda()
})

test('checks against valid mock request', t => {
  t.true(t.context.lambda.check({
  }, {
    succeed() {},
    // tslint:disable-next-line:no-any mocking context
  } as any, (e: Error, body: JsonObject) => {
  }))
})

test('checks against invalid context', t => {
  t.false(t.context.lambda.check({
  }, {
    // tslint:disable-next-line:no-any mocking context
  } as any, (e: Error, body: JsonObject) => {
  }))
})

test('handles valid body fine', async t => {
  const expectedBody = {
    prop: true,
  }
  const expectedStatus = 123
  const sentBody = {
    a: '1',
  }
  const sentHeaders = {
    key: 'value',
  }
  let receivedBody: string | null = null
  let receivedStatus = -1
  let promise: Promise<StandardResponse> | null = null
  t.context.lambda.handle((body, headers) => {
    t.deepEqual(body, sentBody)
    t.deepEqual(headers, sentHeaders)
    promise = Promise.resolve({
      body: expectedBody,
      status: expectedStatus,
    })
    return promise
  })({
    body: JSON.stringify(sentBody),
    headers: sentHeaders,
  }, {
    succeed() {},
    // tslint:disable-next-line:no-any mocking context
  } as any, (e: Error, body: JsonObject) => {
    receivedStatus = body.statusCode
    receivedBody = body.body
  })
  await promise
  await new Promise(resolve => setTimeout(resolve))
  // tslint:disable-next-line:no-any change to string even if null
  t.deepEqual(JSON.parse(receivedBody as any), expectedBody)
  t.is(receivedStatus, expectedStatus)
})

test('converts headers to lower', async t => {
  const expectedBody = {
    prop: true,
  }
  const expectedStatus = 123
  const sentBody = {
    a: '1',
  }
  const sentHeaders = {
    Key: 'value',
  }
  let receivedBody: string | null = null
  let receivedStatus = -1
  let promise: Promise<StandardResponse> | null = null
  t.context.lambda.handle((body, headers) => {
    t.deepEqual(body, sentBody)
    t.deepEqual(headers, {
      key: 'value',
    })
    promise = Promise.resolve({
      body: expectedBody,
      status: expectedStatus,
    })
    return promise
  })({
    body: JSON.stringify(sentBody),
    headers: sentHeaders,
  }, {
    succeed() {},
    // tslint:disable-next-line:no-any mocking context
  } as any, (e: Error, body: JsonObject) => {
    receivedStatus = body.statusCode
    receivedBody = body.body
  })
  await promise
  await new Promise(resolve => setTimeout(resolve))
  // tslint:disable-next-line:no-any change to string even if null
  t.deepEqual(JSON.parse(receivedBody as any), expectedBody)
  t.is(receivedStatus, expectedStatus)
})

test('handles error', async t => {
  const expectedError = new Error('test')
  const sentBody = {
    a: '1',
  }
  const sentHeaders = {
    key: 'value',
  }
  let receivedError: Error | null = null
  let promise: Promise<StandardResponse> | null = null
  t.context.lambda.handle((body, headers) => {
    t.deepEqual(body, sentBody)
    t.deepEqual(headers, sentHeaders)
    promise = Promise.reject(expectedError)
    return promise
  })({
    body: JSON.stringify(sentBody),
    headers: sentHeaders,
  }, {
    succeed() {},
    // tslint:disable-next-line:no-any mocking context
  } as any, (e: Error) => {
    receivedError = e
  })
  // tslint:disable-next-line:no-any mocking promise
  await (promise as any).catch(() => {})
  await new Promise(resolve => setTimeout(resolve))
  t.is(receivedError, expectedError)
})

test('handles valid headers fine', async t => {
  const expectedHeaders = {
    header1: 'header2',
  }
  const expectedStatus = 123
  let receivedHeaders: Headers | null = null
  let receivedStatus = -1
  let promise: Promise<StandardResponse> | null = null
  t.context.lambda.handle((body, headers) => {
    promise = Promise.resolve({
      body: {},
      status: expectedStatus,
      headers: expectedHeaders,
    })
    return promise
  })({
    body: JSON.stringify({}),
    headers: {},
  }, {
    succeed() {},
    // tslint:disable-next-line:no-any mocking context
  } as any, (e: Error, body: JsonObject) => {
    receivedStatus = body.statusCode
    receivedHeaders = body.headers
  })
  await promise
  await new Promise(resolve => setTimeout(resolve))
  // tslint:disable-next-line:no-any change to string even if null
  t.is(receivedStatus, expectedStatus)
  t.is(receivedHeaders, expectedHeaders)
})
