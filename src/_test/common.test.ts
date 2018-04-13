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
import { values, clone, stringify, toArray } from '../common'

test('values correctly gets the values of an object', t => {
  const expected = [1, 2, 3]
  expected.sort()
  const obj = {
    a: 1,
    b: 2,
    c: 3,
  }
  const actual = values(obj)
  actual.sort()
  t.deepEqual(actual, expected)
})

test('clone deepEquals original', t => {
  const original = {
    a: 1,
    b: 2,
    c: {
      d: 3,
      e: 4,
    },
  }
  const cloned = clone(original)
  t.deepEqual(cloned, original)
})

test('clone creates an object not the same ref as original', t => {
  const original = {
    a: 1,
    b: 2,
    c: {
      d: 3,
      e: 4,
    },
  }
  const cloned = clone(original)
  t.not(cloned, original)
})

test('stringify results in a string', t => {
  const original = {
    a: 1,
    b: 2,
    c: {
      d: 3,
      e: 4,
    },
  }
  t.is(typeof stringify(original), 'string')
})

test('stringify parsed back is deepEqual to original', t => {
  const original = {
    a: 1,
    b: 2,
    c: {
      d: 3,
      e: 4,
    },
  }
  t.deepEqual(JSON.parse(stringify(original)), original)
})

test('toArray results in same array when passed in array', t => {
  const original = [1, 2, 3]
  t.is(toArray(original), original)
})

test('toArray results in an array when passed in a single element', t => {
  const original = 1
  t.true(Array.isArray(toArray(original)))
})

test('toArray results in a correct array when passed in a single element', t => {
  const original = 1
  t.deepEqual(toArray(original), [1])
})
