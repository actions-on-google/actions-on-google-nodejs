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

import test from 'ava';
import * as Api from '../../api/v2'

import {
  ActionsSdkConversationOptions,
  ActionsSdkConversation
} from '../../conv';
import { BasicCard, Button, Suggestions } from '..';

const CONVERSATION_ID = '1234';
const USER_ID = 'abcd';

function buildRequest(
  convType: string, intent: string, data?: {}): Api.GoogleActionsV2AppRequest {
  const appRequest = {
    conversation: {
      conversationId: CONVERSATION_ID,
      type: convType,
      conversationToken: data
    },
    user: {
      userId: USER_ID,
      locale: 'en_US'
    },
    "inputs": [
      {
        "intent": intent,
        "rawInputs": [
          {
            "inputType": "KEYBOARD",
            "query": "Talk to my test app"
          }
        ]
      }
    ],
    surface: {
      capabilities: [
        {
          "name": "actions.capability.SCREEN_OUTPUT"
        },
        {
          "name": "actions.capability.MEDIA_RESPONSE_AUDIO"
        },
        {
          "name": "actions.capability.WEB_BROWSER"
        },
        {
          "name": "actions.capability.AUDIO_OUTPUT"
        }
      ]
    },
    availableSurfaces: [
      {
        "capabilities": [
          {
            "name": "actions.capability.SCREEN_OUTPUT"
          },
          {
            "name": "actions.capability.AUDIO_OUTPUT"
          }
        ]
      }
    ]
  } as Api.GoogleActionsV2AppRequest;
  return appRequest;
}


test('new conversation', t => {
  const intent = 'actions.intent.MAIN';
  const appRequest = buildRequest('NEW', intent, '');
  const options = {
    body: appRequest,
    headers: {}
  } as ActionsSdkConversationOptions<{}, {}>;
  const conv = new ActionsSdkConversation(options);

  t.is(conv.body, appRequest);
  t.is(conv.intent, intent);
  t.is(conv.id, CONVERSATION_ID);
  t.is(conv.user.id, USER_ID);
  t.is(conv.type, 'NEW');
  t.false(conv.digested);

  t.deepEqual(conv.data, {});
});

test('data is parsed from init', t => {
  const intent = 'example.intent.foo';
  const sessionData = {
    foo: 'bar'
  };
  const appRequest = buildRequest('ACTIVE', intent);
  const options = {
    body: appRequest,
    headers: {},
    init: {
      data: sessionData
    }
  } as ActionsSdkConversationOptions<{}, {}>;
  const conv = new ActionsSdkConversation(options);

  t.deepEqual(conv.data, sessionData);
});

test('data is parsed from conversation token', t => {
  const intent = 'example.intent.foo';
  const sessionData = {
    foo: 'bar'
  };
  const data = {
    data: sessionData
  };
  const appRequest = buildRequest('ACTIVE', intent,
    JSON.stringify(data));
  const options = {
    body: appRequest,
    headers: {}
  } as ActionsSdkConversationOptions<{}, {}>;
  const conv = new ActionsSdkConversation(options);

  t.deepEqual(conv.data, sessionData);
});

test('ask with simple text', t => {
  const appRequest = buildRequest('ACTIVE', 'example.foo');
  const options = {
    body: appRequest
  } as ActionsSdkConversationOptions<{}, {}>;
  const conv = new ActionsSdkConversation(options);

  conv.ask('hello');

  t.true(conv.expectUserResponse);
  t.is(conv.responses.length, 1);
  t.false(conv.digested);
  t.true(conv._responded);
});

test('ask with multiple responses', t => {
  const appRequest = buildRequest('ACTIVE', 'example.foo');
  const options = {
    body: appRequest
  } as ActionsSdkConversationOptions<{}, {}>;
  const conv = new ActionsSdkConversation(options);

  conv.ask('hello', 'world', '<speak>hello world</speak>');

  t.true(conv.expectUserResponse);
  t.is(conv.responses.length, 3);
  t.false(conv.digested);
  t.true(conv._responded);
});

test('close with multiple responses', t => {
  const appRequest = buildRequest('ACTIVE', 'example.foo');
  const options = {
    body: appRequest
  } as ActionsSdkConversationOptions<{}, {}>;
  const conv = new ActionsSdkConversation(options);

  conv.close('hello', 'world', '<speak>hello world</speak>');

  t.false(conv.expectUserResponse);
  t.is(conv.responses.length, 3);
  t.false(conv.digested);
  t.true(conv._responded);
});

test('basic conversation response', t => {
  const appRequest = buildRequest('ACTIVE', 'example.foo');
  const options = {
    body: appRequest
  } as ActionsSdkConversationOptions<{}, {}>;
  const conv = new ActionsSdkConversation(options);

  conv.ask('hello', '<speak>world</speak>');
  const response = conv.response();

  console.log('richResponse = ', response.richResponse.items![1]);

  t.is(response.richResponse.items!.length, 2);
  t.deepEqual(response.richResponse.items![0].simpleResponse!.textToSpeech,
    'hello');
  t.deepEqual(response.richResponse.items![1].simpleResponse!.textToSpeech,
    '<speak>world</speak>');
  t.true(response.expectUserResponse);
  t.true(conv.digested);
  t.true(conv._responded);
});

test('basic card with suggestions conversation response', t => {
  const appRequest = buildRequest('ACTIVE', 'example.foo');
  const options = {
    body: appRequest
  } as ActionsSdkConversationOptions<{}, {}>;
  const conv = new ActionsSdkConversation(options);

  conv.ask(
    'hello',
    new BasicCard({
      title: 'Title',
      subtitle: 'This is a subtitle',
      text: 'This is a sample text',
      image: {
        url: 'http://url/to/image',
        height: 200,
        width: 300
      },
      buttons: new Button({
        title: 'Learn more',
        url: 'http://url/to/open'
      })
    }),
    new Suggestions('suggestion one', 'suggestion two'));

  const response = conv.response();

  console.log('richResponse = ', response.richResponse.items![1]);

  t.is(response.richResponse.items!.length, 2);
  t.deepEqual(response.richResponse.items![1].basicCard!.formattedText,
    'This is a sample text');
  t.deepEqual(response.richResponse.suggestions![0].title, 'suggestion one');
  t.true(response.expectUserResponse);
  t.true(conv.digested);
  t.true(conv._responded);
});