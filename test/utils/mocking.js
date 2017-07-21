/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
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

'use strict';

const MockRequest = class {
  constructor (headers, body) {
    if (headers) {
      this.headers = headers;
    } else {
      this.headers = {};
    }
    if (body) {
      this.body = body;
    } else {
      this.body = {};
    }
  }

  get (header) {
    return this.headers[header];
  }
};

const MockResponse = class {
  constructor () {
    this.statusCode = 200;
    this.headers = {};
  }

  status (statusCode) {
    this.statusCode = statusCode;
    return this;
  }

  send (body) {
    this.body = body;
    return this;
  }

  append (header, value) {
    this.headers[header] = value;
    return this;
  }
};

const headerV1 = {
  'Content-Type': 'application/json',
  'google-assistant-api-version': 'v1'
};

const headerV2 = {
  'Content-Type': 'application/json',
  'Google-Actions-API-Version': '2'
};
const fakeTimeStamp = '2017-01-01T12:00:00';
const fakeSessionId = '0123456789101112';
const fakeIntentId = '1a2b3c4d-5e6f-7g8h-9i10-11j12k13l14m15n16o';
const fakeApiAiBodyRequestId = '1a2b3c4d-5e6f-7g8h-9i10-11j12k13l14m15n16o';
const fakeUserId = 'user123';
const fakeConversationId = '0123456789';

// Body of the ApiAi request that starts a new session
// new session is originalRequest.data.conversation.type == 1
const apiAiAppRequestBodyNewSessionMock = {
  'lang': 'en',
  'status': {
    'errorType': 'success',
    'code': 200
  },
  'timestamp': fakeTimeStamp,
  'sessionId': fakeSessionId,
  'result': {
    'parameters': {
      'city': 'Rome',
      'name': 'Ana'
    },
    'contexts': [],
    'resolvedQuery': 'my name is Ana and I live in Rome',
    'source': 'agent',
    'score': 1.0,
    'speech': '',
    'fulfillment': {
      'messages': [
        {
          'speech': 'Hi Ana! Nice to meet you!',
          'type': 0
        }
      ],
      'speech': 'Hi Ana! Nice to meet you!'
    },
    'actionIncomplete': false,
    'action': 'greetings',
    'metadata': {
      'intentId': fakeIntentId,
      'webhookForSlotFillingUsed': 'false',
      'intentName': 'greetings',
      'webhookUsed': 'true'
    }
  },
  'id': fakeApiAiBodyRequestId,
  'originalRequest': {
    'source': 'google',
    'data': {
      'inputs': [
        {
          'raw_inputs': [
            {
              'query': 'my name is Ana and I live in Rome',
              'input_type': 2
            }
          ],
          'intent': 'assistant.intent.action.TEXT',
          'arguments': [
            {
              'text_value': 'my name is Ana and I live in Rome',
              'raw_text': 'my name is Ana and I live in Rome',
              'name': 'text'
            }
          ]
        }
      ],
      'user': {
        'user_id': fakeUserId,
        'locale': 'en-US'
      },
      'conversation': {
        'conversation_id': fakeConversationId,
        'type': 1,
        'conversation_token': '[]'
      }
    }
  }
};

const apiAiAppRequestBodyLiveSessionMock = {
  'lang': 'en',
  'status': {
    'errorType': 'success',
    'code': 200
  },
  'timestamp': fakeTimeStamp,
  'sessionId': fakeSessionId,
  'result': {
    'parameters': {
      'city': 'Rome',
      'name': 'Ana'
    },
    'contexts': [],
    'resolvedQuery': 'my name is Ana and I live in Rome',
    'source': 'agent',
    'score': 1.0,
    'speech': '',
    'fulfillment': {
      'messages': [
        {
          'speech': 'Hi Ana! Nice to meet you!',
          'type': 0
        }
      ],
      'speech': 'Hi Ana! Nice to meet you!'
    },
    'actionIncomplete': false,
    'action': 'greetings',
    'metadata': {
      'intentId': fakeIntentId,
      'webhookForSlotFillingUsed': 'false',
      'intentName': 'greetings',
      'webhookUsed': 'true'
    }
  },
  'id': fakeApiAiBodyRequestId,
  'originalRequest': {
    'source': 'google',
    'data': {
      'inputs': [
        {
          'raw_inputs': [
            {
              'query': 'my name is Ana and I live in Rome',
              'input_type': 2
            }
          ],
          'intent': 'assistant.intent.action.TEXT',
          'arguments': [
            {
              'text_value': 'my name is Ana and I live in Rome',
              'raw_text': 'my name is Ana and I live in Rome',
              'name': 'text'
            }
          ]
        }
      ],
      'user': {
        'user_id': fakeUserId,
        'locale': 'en-US'
      },
      'conversation': {
        'conversation_id': fakeConversationId,
        'type': 2,
        'conversation_token': '[]'
      }
    }
  }
};

const actionsSdkAppRequestBodyNewSessionMock = {
  'user': {
    'user_id': fakeUserId
  },
  'conversation': {
    'conversation_id': '1480373842830',
    'type': 1
  },
  'inputs': [
    {
      'intent': 'assistant.intent.action.MAIN',
      'raw_inputs': [
        {
          'input_type': 2,
          'query': 'talk to hello action'
        }
      ],
      'arguments': [
        {
          'name': 'agent_info'
        }
      ]
    }
  ]
};

const actionsSdkAppRequestBodyLiveSessionMock = {
  'user': {
    'user_id': fakeUserId
  },
  'conversation': {
    'conversation_id': '1480373842830',
    'type': 2
  },
  'inputs': [
    {
      'intent': 'assistant.intent.action.MAIN',
      'raw_inputs': [
        {
          'input_type': 2,
          'query': 'talk to hello action'
        }
      ],
      'arguments': [
        {
          'name': 'agent_info'
        }
      ]
    }
  ]
};

module.exports = {
  apiAiAppRequestBodyLiveSessionMock,
  apiAiAppRequestBodyNewSessionMock,
  MockRequest,
  MockResponse,
  headerV2,
  headerV1,
  actionsSdkAppRequestBodyNewSessionMock,
  actionsSdkAppRequestBodyLiveSessionMock,
  fakeConversationId,
  fakeUserId
};
