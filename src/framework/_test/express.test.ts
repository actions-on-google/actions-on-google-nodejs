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
import { Express } from '../express'
import { JsonObject } from '../../common'
import { StandardResponse, Headers } from '../framework'

interface AvaContext {
  express: Express
}

const test = ava as RegisterContextual<AvaContext>

test.beforeEach(t => {
  t.context.express = new Express()
})

test('checks against valid mock request', t => {
  t.true(t.context.express.check({
    get() {},
    // tslint:disable-next-line:no-any mocking request
  } as any, {
    status(status: number) {},
    send(body: JsonObject) {},
    // tslint:disable-next-line:no-any mocking response
  } as any))
})

test('checks against invalid mock Express request', t => {
  t.false(t.context.express.check({
    // tslint:disable-next-line:no-any mocking request
  } as any, {
    status(status: number) {},
    send(body: JsonObject) {},
    // tslint:disable-next-line:no-any mocking response
  } as any))
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
  let receivedBody: JsonObject | null = null
  let receivedStatus = -1
  let promise: Promise<StandardResponse> | null = null
  t.context.express.handle((body, headers) => {
    t.is(body, sentBody)
    t.is(headers, sentHeaders)
    promise = Promise.resolve({
      body: expectedBody,
      status: expectedStatus,
    })
    return promise
  })({
    body: sentBody,
    headers: sentHeaders,
    get() {},
    // tslint:disable-next-line:no-any mocking request
  } as any, {
    status(status: number) {
      receivedStatus = status
      return this
    },
    send(body: JsonObject) {
      receivedBody = body
      return this
    },
    // tslint:disable-next-line:no-any mocking response
  } as any)
  await promise
  t.is(receivedBody, expectedBody)
  t.is(receivedStatus, expectedStatus)
})

test('handles error', async t => {
  const expectedError = new Error('test')
  const expectedBody = {
    error: expectedError.message,
  }
  const expectedStatus = 500
  const sentBody = {
    a: '1',
  }
  const sentHeaders = {
    key: 'value',
  }
  let receivedStatus = -1
  let receivedBody: JsonObject | null = null
  let promise: Promise<StandardResponse> | null = null
  t.context.express.handle((body, headers) => {
    t.is(body, sentBody)
    t.is(headers, sentHeaders)
    promise = Promise.reject(expectedError)
    return promise
  })({
    body: sentBody,
    headers: sentHeaders,
    get() {},
    // tslint:disable-next-line:no-any mocking request
  } as any, {
    status(status: number) {
      receivedStatus = status
      return this
    },
    send(body: JsonObject) {
      receivedBody = body
      return this
    },
    // tslint:disable-next-line:no-any mocking response
  } as any)
  // tslint:disable-next-line:no-any mocking promise
  await (promise as any).catch(() => {})
  t.deepEqual(receivedBody, expectedBody)
  t.is(receivedStatus, expectedStatus)
})

test('handles valid headers fine', async t => {
  const expectedHeaders = {
    header1: 'header2',
  }
  const expectedStatus = 123
  const receivedHeaders: Headers = {}
  let receivedStatus = -1
  let promise: Promise<StandardResponse> | null = null
  t.context.express.handle((body, headers) => {
    promise = Promise.resolve({
      body: {},
      status: expectedStatus,
      headers: expectedHeaders,
    })
    return promise
  })({
    body: {},
    headers: {},
    get() {},
    // tslint:disable-next-line:no-any mocking request
  } as any, {
    status(status: number) {
      receivedStatus = status
      return this
    },
    setHeader(key: string, value: string) {
      receivedHeaders[key] = value
    },
    send() {
      return this
    },
    // tslint:disable-next-line:no-any mocking response
  } as any)
  await promise
  t.is(receivedStatus, expectedStatus)
  t.deepEqual(receivedHeaders, expectedHeaders)
})
