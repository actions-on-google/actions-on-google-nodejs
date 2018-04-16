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

import {actionssdk} from '../actionssdk';
import { Conversation } from '..';
import * as Api from '../api/v2';

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

test('intent handler is invoked', (t) => {
  const app = actionssdk();
  let invoked = false;

  const intentHandler = (conv: Conversation<{}>) => {
    invoked = true;
    return conv.ask('hello');
  };
  app.intent('intent.foo', intentHandler);

  const promise = app.handler(buildRequest('NEW', 'intent.foo'), {});

  return promise.then((result) => {
    t.is(result.status, 200);
    t.true(invoked);
  });
});

test('fallback handler is invoked', t => {
  const app = actionssdk();
  let intentInvoked = false;
  let fallbackInvoked = false;

  const intentHandler = (conv: Conversation<{}>) => {
    intentInvoked = true;
    return conv.ask('hello');
  };
  const fallbackHandler = (conv: Conversation<{}>) => {
    fallbackInvoked = true;
    return conv.ask('fallback');
  };

  app.intent('intent.foo', intentHandler);
  app.intent('intent.bar', intentHandler);
  app.fallback(fallbackHandler);

  const promise = app.handler(buildRequest('NEW', 'some.other.intent'), {});

  return promise.then((result) => {
    t.is(result.status, 200);
    t.false(intentInvoked);
    t.true(fallbackInvoked);
  });
});

test('middleware is used', t => {
  const app = actionssdk();
  let middlewareUsed = false;

  app.intent('intent.foo', (conv) => {
    return conv.close('hello');
  });
  app.use(() => {
    middlewareUsed = true;
  });

  const promise = app.handler(buildRequest('NEW', 'intent.foo'), {});

  return promise.then((result) => {
    t.is(result.status, 200);
    t.true(middlewareUsed);
  });
});
