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
import { Incoming } from '../incoming'
import { clone } from '../../../common'
import * as ActionsApi from '../../actionssdk/api/v2'
import { Suggestions } from '../../actionssdk'

test('incoming parse when undefined input', t => {
  const incoming = new Incoming(undefined)
  t.deepEqual(incoming.parsed, [])
})

test('incoming parse when empty array', t => {
  const incoming = new Incoming([])
  t.deepEqual(incoming.parsed, [])
})

test('incoming parse when one text', t => {
  const text1 = 'text1'
  const incoming = new Incoming([{
    text: {
      text: [text1],
    },
  }])
  t.deepEqual(incoming.parsed, [text1])
})

test('incoming parse when two text', t => {
  const text1 = 'text1'
  const text2 = 'text2'
  const incoming = new Incoming([{
    text: {
      text: [text1, text2],
    },
  }])
  t.deepEqual(incoming.parsed, [text1, text2])
})

test('incoming parse when image', t => {
  const url = 'text1'
  const alt = 'alt1'
  const incoming = new Incoming([{
    image: {
      accessibilityText: alt,
      imageUri: url,
    },
  }])
  t.deepEqual(clone(incoming.parsed[0]), {
    accessibilityText: alt,
    url,
  } as ActionsApi.GoogleActionsV2UiElementsImage)
})

test('incoming parse when quickReplies', t => {
  const suggestions = ['1', '2', '3']
  const incoming = new Incoming([{
    quickReplies: {
      quickReplies: suggestions,
    },
  }])
  const parsed = incoming.parsed[0] as Suggestions
  t.true(parsed instanceof Suggestions)
  t.deepEqual(parsed.suggestions, [{
    title: suggestions[0],
  }, {
    title: suggestions[1],
  }, {
    title: suggestions[2],
  }])
})

test('incoming.get string', t => {
  const text1 = 'text1'
  const incoming = new Incoming(undefined)
  incoming.parsed.push(text1)
  t.is(incoming.get('string'), text1)
})

test('incoming.get Suggestions', t => {
  const texts = ['1', '2', '3']
  const incoming = new Incoming([{
    quickReplies: {
      quickReplies: texts,
    },
  }])
  const suggestions = incoming.get(Suggestions)
  const parsed = incoming.parsed[0] as Suggestions
  t.is(suggestions, parsed)
  t.true(suggestions instanceof Suggestions)
  t.deepEqual(suggestions.suggestions, texts.map(t => ({ title: t })))
})
