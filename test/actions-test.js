/**
 * Copyright 2016 Google Inc. All Rights Reserved.
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

'use strict';

// Enable actions-on-google debug logging
process.env.DEBUG = 'actions-on-google:*';

/**
 * Test suite for the actions client library.
 */
let winston = require('winston');
let expect = require('chai').expect;
let ApiAiAssistant = require('.././actions-on-google').ApiAiAssistant;

// Default logger
winston.loggers.add('DEFAULT_LOGGER', {
  console: {
    level: 'error',
    colorize: true,
    label: 'Default logger',
    json: true,
    timestamp: true
  }
});

function MockRequest (headers, body) {
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
MockRequest.prototype.get = function (header) {
  return this.headers[header];
};

function MockResponse () {
  this.statusCode = 200;
  this.headers = {};
}
MockResponse.prototype.status = function (statusCode) {
  this.statusCode = statusCode;
  return this;
};
MockResponse.prototype.send = function (body) {
  this.body = body;
  return this;
};
MockResponse.prototype.append = function (header, value) {
  this.headers[header] = value;
  return this;
};

/**
 * Describes the behavior for tell method.
 */
describe('assistant#tell', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid JSON in the response object for the success case.', function () {
    let headers = {'Content-Type': 'application/json', 'google-assistant-api-version': 'v1'};
    let body = {
      'id': 'ce7295cc-b042-42d8-8d72-14b83597ac1e',
      'timestamp': '2016-10-28T03:05:34.288Z',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'start guess a number game',
        'speech': '',
        'action': 'generate_answer',
        'actionIncomplete': false,
        'parameters': {

        },
        'contexts': [
          {
            'name': 'game',
            'lifespan': 5
          }
        ],
        'metadata': {
          'intentId': '56da4637-0419-46b2-b851-d7bf726b1b1b',
          'webhookUsed': 'true',
          'intentName': 'start_game'
        },
        'fulfillment': {
          'speech': ''
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': 'e420f007-501d-4bc8-b551-5d97772bc50c',
      'originalRequest': null
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const assistant = new ApiAiAssistant({request: mockRequest, response: mockResponse});

    function handler (assistant) {
      return new Promise(function (resolve, reject) {
        resolve(assistant.tell('hello'));
      });
    }

    let actionMap = new Map();
    actionMap.set('generate_answer', handler);

    assistant.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'speech': 'hello',
      'data': {
        'google': {
          'expect_user_response': false,
          'is_ssml': false,
          'no_input_prompts': [

          ],
          speech_biasing_hints: []
        }
      },
      contextOut: [

      ]
    };
    expect(mockResponse.body).to.deep.equal(expectedResponse);
  });
});

/**
 * Describes the behavior for ask method.
 */
describe('assistant#ask', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid JSON in the response object for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'google-assistant-api-version': 'v1'
    };
    let body = {
      'id': '9c4394e3-4f5a-4e68-b1af-088b75ad3071',
      'timestamp': '2016-10-28T03:41:39.957Z',
      'result': {
        'source': 'agent',
        'resolvedQuery': '50',
        'speech': '',
        'action': 'check_guess',
        'actionIncomplete': false,
        'parameters': {
          'guess': '50'
        },
        'contexts': [
          {
            'name': 'game',
            'parameters': {
              'guess.original': '50',
              'guess': '50'
            },
            'lifespan': 5
          },
          {
            'name': '_assistant_',
            'parameters': {
              'answer': 68,
              'guess.original': '50',
              'guess': '50'
            },
            'lifespan': 99
          }
        ],
        'metadata': {
          'intentId': '1e46ffc2-651f-4ac0-a54e-9698feb88880',
          'webhookUsed': 'true',
          'intentName': 'provide_guess'
        },
        'fulfillment': {
          'speech': ''
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': 'e420f007-501d-4bc8-b551-5d97772bc50c',
      'originalRequest': null
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const assistant = new ApiAiAssistant({
      request: mockRequest,
      response: mockResponse
    });

    function handler (assistant) {
      return new Promise(function (resolve, reject) {
        resolve(assistant.ask('hello'));
      });
    }

    let actionMap = new Map();
    actionMap.set('check_guess', handler);

    assistant.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'speech': 'hello',
      'data': {
        'google': {
          'expect_user_response': true,
          'is_ssml': false,
          'no_input_prompts': [],
          speech_biasing_hints: []
        }
      },
      'contextOut': [
        {
          'name': '_actions_on_google_',
          'lifespan': 100,
          'parameters': {}
        }
      ]
    };
    expect(mockResponse.body).to.deep.equal(expectedResponse);
  });
});

/**
 * Describes the behavior for askForPermissions method.
 */
describe('assistant#askForPermissions', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid JSON in the response object for the success case.', function () {
    let headers = {'Content-Type': 'application/json', 'google-assistant-api-version': 'v1'};
    let body = {
      'id': '9c4394e3-4f5a-4e68-b1af-088b75ad3071',
      'timestamp': '2016-10-28T03:41:39.957Z',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'Where am I?',
        'speech': '',
        'action': 'get_permission',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [],
        'metadata': {
          'intentId': '1e46ffc2-651f-4ac0-a54e-9698feb88880',
          'webhookUsed': 'true',
          'intentName': 'give_permission'
        },
        'fulfillment': {
          'speech': ''
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': 'e420f007-501d-4bc8-b551-5d97772bc50c',
      'originalRequest': null
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const assistant = new ApiAiAssistant({request: mockRequest, response: mockResponse});

    function handler (assistant) {
      return new Promise(function (resolve, reject) {
        resolve(assistant.askForPermissions('To test', ['NAME', 'DEVICE_PRECISE_LOCATION']));
      });
    }

    let actionMap = new Map();
    actionMap.set('get_permission', handler);

    assistant.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'speech': 'PLACEHOLDER_FOR_PERMISSION',
      'data': {
        'google': {
          'expect_user_response': true,
          'is_ssml': false,
          'no_input_prompts': [],
          'speech_biasing_hints': ['$SchemaOrg_YesNo'],
          'permissions_request': {
            'opt_context': 'To test',
            'permissions': ['NAME', 'DEVICE_PRECISE_LOCATION']
          }
        }
      },
      'contextOut': [
        {
          'name': '_actions_on_google_',
          'lifespan': 100,
          'parameters': {}
        }
      ]
    };
    expect(mockResponse.body).to.deep.equal(expectedResponse);
  });
});
