/**
 * Copyright 2016 Google Inc. All Rights Reserved.
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

// Enable actions-on-google debug logging
process.env.DEBUG = 'actions-on-google:*';

/**
 * Test suite for the actions client library.
 */
const winston = require('winston');
const chai = require('chai');
const expect = chai.expect;
const spies = require('chai-spies');
const Actions = require('.././actions-on-google');
const ApiAiApp = Actions.ApiAiApp;
const ActionsSdkApp = Actions.ActionsSdkApp;
const RichResponse = require('.././response-builder').RichResponse;
const BasicCard = require('.././response-builder').BasicCard;
const List = require('.././response-builder').List;
const Carousel = require('.././response-builder').Carousel;
const OptionItem = require('.././response-builder').OptionItem;

chai.use(spies);

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

// ---------------------------------------------------------------------------
//                   App helpers
// ---------------------------------------------------------------------------

/**
 * Describes the behavior for Assistant isNotApiVersionOne_ method.
 */
describe('ApiAiApp#isNotApiVersionOne_', function () {
  it('Should detect Proto2 when header isn\'t present', function () {
    let headers = {
      'Content-Type': 'application/json',
      'google-assistant-api-version': 'v1'
    };
    const mockRequest = new MockRequest(headers, {});
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({request: mockRequest, response: mockResponse});

    expect(app.isNotApiVersionOne_()).to.equal(false);
  });
  it('Should detect v1 when header is present', function () {
    let headers = {
      'Content-Type': 'application/json',
      'google-assistant-api-version': 'v1',
      'Google-Actions-API-Version': '1'
    };
    const mockRequest = new MockRequest(headers, {});
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({request: mockRequest, response: mockResponse});

    expect(app.isNotApiVersionOne_()).to.equal(false);
  });
  it('Should detect v2 when version is present in APIAI req', function () {
    let headers = {
      'Content-Type': 'application/json',
      'google-assistant-api-version': 'v1',
      'Google-Actions-API-Version': '2'
    };
    const mockRequest = new MockRequest(headers, {
      'originalRequest': {
        'version': 1
      }
    });
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({request: mockRequest, response: mockResponse});

    expect(app.isNotApiVersionOne_()).to.equal(false);
  });
  it('Should detect v2 when header is present', function () {
    let headers = {
      'Content-Type': 'application/json',
      'google-assistant-api-version': 'v1',
      'Google-Actions-API-Version': '2'
    };
    const mockRequest = new MockRequest(headers, {});
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({request: mockRequest, response: mockResponse});

    expect(app.isNotApiVersionOne_()).to.equal(true);
  });
  it('Should detect v2 when version is present in APIAI req', function () {
    let headers = {
      'Content-Type': 'application/json',
      'google-assistant-api-version': 'v1',
      'Google-Actions-API-Version': '2'
    };
    const mockRequest = new MockRequest(headers, {
      'originalRequest': {
        'version': 2
      }
    });
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({request: mockRequest, response: mockResponse});

    expect(app.isNotApiVersionOne_()).to.equal(true);
  });
});

/**
 * Describes the behavior for AssistantApp isSsml_ method.
 */
describe('ApiAiApp#isSsml_', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate SSML syntax.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'google-assistant-api-version': 'v1'
    };
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
      'originalRequest': {
        'data': {
          'conversation': {
            'type': 2
          }
        }
      }
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({request: mockRequest, response: mockResponse});

    expect(app.isSsml_('<speak></speak>')).to.equal(true);
    expect(app.isSsml_('<SPEAK></SPEAK>')).to.equal(true);
    expect(app.isSsml_('  <speak></speak>  ')).to.equal(false);
    expect(app.isSsml_('<speak>  </speak>')).to.equal(true);
    expect(app.isSsml_('<speak version="1.0"></speak>')).to.equal(true);
    expect(app.isSsml_('<speak version="1.0">Hello world!</speak>')).to.equal(true);
    expect(app.isSsml_('<speak>')).to.equal(false);
    expect(app.isSsml_('</speak>')).to.equal(false);
    expect(app.isSsml_('')).to.equal(false);
    expect(app.isSsml_('bla bla bla')).to.equal(false);
    expect(app.isSsml_('<html></html>')).to.equal(false);
    expect(app.isSsml_('bla bla bla<speak></speak>')).to.equal(false);
    expect(app.isSsml_('<speak></speak> bla bla bla')).to.equal(false);
    expect(app.isSsml_('<speak>my SSML content</speak>')).to.equal(true);
    expect(app.isSsml_('<speak>Line 1\nLine 2</speak>')).to.equal(true);
    expect(app.isSsml_('<speak>Step 1, take a deep breath. <break time="2s" />Step 2, exhale.</speak>')).to.equal(true);
    expect(app.isSsml_('<speak><say-as interpret-as="cardinal">12345</say-as></speak>')).to.equal(true);
    expect(app.isSsml_('<speak><say-as interpret-as="ordinal">1</say-as></speak>')).to.equal(true);
    expect(app.isSsml_('<speak><say-as interpret-as="characters">can</say-as></speak>')).to.equal(true);
    expect(app.isSsml_('<speak><say-as interpret-as="date" format="ymd">1960-09-10</say-as></speak>')).to.equal(true);
    expect(app.isSsml_('<speak><say-as interpret-as="date" format="yyyymmdd" detail="1">1960-09-10</say-as></speak>')).to.equal(true);
    expect(app.isSsml_('<speak><say-as interpret-as="date" format="dm">10-9</say-as></speak>')).to.equal(true);
    expect(app.isSsml_('<speak><say-as interpret-as="date" format="dmy" detail="2">10-9-1960</say-as></speak>')).to.equal(true);
    expect(app.isSsml_('<speak><say-as interpret-as="time" format="hms12">2:30pm</say-as></speak>')).to.equal(true);
    expect(app.isSsml_('<speak><audio src="https://somesite.bla/meow.mp3">a cat meowing</audio></speak>')).to.equal(true);
    expect(app.isSsml_('<speak><p><s>This is sentence one.</s><s>This is sentence two.</s></p></speak>')).to.equal(true);
    expect(app.isSsml_('<speak><sub alias="World Wide Web Consortium">W3C</sub></speak>')).to.equal(true);
  });
});

// ---------------------------------------------------------------------------
//                   API.ai support
// ---------------------------------------------------------------------------

/**
 * Describes the behavior for ApiAiApp constructor method.
 */
describe('ApiAiApp#constructor', function () {
  // Calls sessionStarted when provided
  it('Calls sessionStarted when new session', function () {
    let headers = {
      'Content-Type': 'application/json',
      'google-assistant-api-version': 'v1'
    };
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
      'originalRequest': {
        'data': {
          'conversation': {
            'type': 1
          }
        }
      }
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const sessionStartedSpy = chai.spy();

    const app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse,
      sessionStarted: sessionStartedSpy
    });

    app.handleRequest();

    expect(sessionStartedSpy).to.have.been.called();
  });

  // Does not call sessionStarted when not new sessoin
  it('Does not call sessionStarted when not new session ', function () {
    let headers = {
      'Content-Type': 'application/json',
      'google-assistant-api-version': 'v1'
    };
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
      'originalRequest': {
        'data': {
          'conversation': {
            'type': 2
          }
        }
      }
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const sessionStartedSpy = chai.spy();

    const app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse,
      sessionStarted: sessionStartedSpy
    });

    app.handleRequest();

    expect(sessionStartedSpy).to.not.have.been.called();
  });

  // Test a change made for backwards compatibility with legacy sample code
  it('Does initialize StandardIntents without an options object', function () {
    const app = new ApiAiApp();

    expect(app.StandardIntents.MAIN).to.equal('assistant.intent.action.MAIN');
    expect(app.StandardIntents.TEXT).to.equal('assistant.intent.action.TEXT');
    expect(app.StandardIntents.PERMISSION).to
      .equal('assistant.intent.action.PERMISSION');
  });

  it('Does not detect v2 and transform originalRequest when version not present', function () {
    let headers = {
      'Content-Type': 'application/json',
      'google-assistant-api-version': 'v1'
    };
    const mockRequest = new MockRequest(headers, {
      'id': '1234',
      'timestamp': '2017-05-19T22:08:53.363Z',
      'lang': 'en',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'blue',
        'action': 'ask.me',
        'actionIncomplete': false,
        'parameters': {
          'foo-param': 'blue'
        },
        'contexts': [
          {
            'name': '_actions_on_google_',
            'parameters': {},
            'lifespan': 100
          }
        ],
        'metadata': {
          'intentId': '1234',
          'webhookUsed': 'true',
          'webhookForSlotFillingUsed': 'false',
          'webhookResponseTime': 555,
          'intentName': 'welcome'
        },
        'fulfillment': {
          'speech': 'Welcome!',
          'messages': [
            {
              'type': 0,
              'speech': 'Welcome!',
              'foo_message': 'bar_val'
            }
          ],
          'data': {
            'google': {
              'expect_user_response': true,
              'is_ssml': false,
              'no_input_prompts': []
            }
          }
        },
        'score': 1
      },
      'originalRequest': {
        'foo_prop': 'bar_val'
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': '1234',
      'foo_field': 'bar_val'
    });
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({request: mockRequest, response: mockResponse});

    expect(app.isNotApiVersionOne_()).to.equal(false);
    expect(app.body_['foo_field']).to.equal('bar_val');
    expect(app.body_.result.parameters['foo-param']).to.equal('blue');
    expect(app.body_.result.fulfillment.messages[0]['foo_message']).to.equal('bar_val');
    expect(app.body_.originalRequest['fooProp']).to.equal('bar_val');
  });

  it('Does detect v2 and not transform originalRequest when version is present', function () {
    let headers = {
      'Content-Type': 'application/json',
      'google-assistant-api-version': 'v1'
    };
    const mockRequest = new MockRequest(headers, {
      'id': '1234',
      'timestamp': '2017-05-19T22:08:53.363Z',
      'lang': 'en',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'blue',
        'action': 'ask.me',
        'actionIncomplete': false,
        'parameters': {
          'foo-param': 'blue'
        },
        'contexts': [
          {
            'name': '_actions_on_google_',
            'parameters': {},
            'lifespan': 100
          }
        ],
        'metadata': {
          'intentId': '1234',
          'webhookUsed': 'true',
          'webhookForSlotFillingUsed': 'false',
          'webhookResponseTime': 555,
          'intentName': 'welcome'
        },
        'fulfillment': {
          'speech': 'Welcome!',
          'messages': [
            {
              'type': 0,
              'speech': 'Welcome!',
              'foo_message': 'bar_val'
            }
          ],
          'data': {
            'google': {
              'expect_user_response': true,
              'is_ssml': false,
              'no_input_prompts': []
            }
          }
        },
        'score': 1
      },
      'originalRequest': {
        'version': '2',
        'foo_prop': 'bar_val'
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': '1234',
      'foo_field': 'bar_val'
    });
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({request: mockRequest, response: mockResponse});

    expect(app.isNotApiVersionOne_()).to.equal(true);
    expect(app.body_['foo_field']).to.equal('bar_val');
    expect(app.body_.result.parameters['foo-param']).to.equal('blue');
    expect(app.body_.result.fulfillment.messages[0]['foo_message']).to.equal('bar_val');
    expect(app.body_.originalRequest['foo_prop']).to.equal('bar_val');
  });
});

/**
 * Describes the behavior for ApiAiApp tell method.
 */
describe('ApiAiApp#tell', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid JSON in the response object for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'google-assistant-api-version': 'v1'
    };
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
      'originalRequest': {
        'data': {
          'conversation': {
            'type': 2
          }
        }
      }
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({request: mockRequest, response: mockResponse});

    function handler (app) {
      return new Promise(function (resolve, reject) {
        resolve(app.tell('hello'));
      });
    }

    let actionMap = new Map();
    actionMap.set('generate_answer', handler);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'speech': 'hello',
      'data': {
        'google': {
          'expect_user_response': false,
          'is_ssml': false,
          'no_input_prompts': [

          ]
        }
      },
      contextOut: [

      ]
    };
    expect(mockResponse.body).to.deep.equal(expectedResponse);
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid simple response JSON in the response object for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
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
      'originalRequest': {
        'data': {
          'conversation': {
            'type': 2
          }
        }
      }
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    function handler (app) {
      return new Promise(function (resolve, reject) {
        resolve(app.tell({
          speech: 'hello',
          displayText: 'hi'
        }));
      });
    }

    let actionMap = new Map();
    actionMap.set('check_guess', handler);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'speech': 'hello',
      'data': {
        'google': {
          'expect_user_response': false,
          'rich_response': {
            'items': [
              {
                'simple_response': {
                  'text_to_speech': 'hello',
                  'display_text': 'hi'
                }
              }
            ],
            'suggestions': []
          }
        }
      },
      'contextOut': []
    };
    expect(JSON.parse(JSON.stringify(mockResponse.body)))
      .to.deep.equal(expectedResponse);
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid rich response JSON in the response object for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
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
      'originalRequest': {
        'data': {
          'conversation': {
            'type': 2
          }
        }
      }
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    function handler (app) {
      return new Promise(function (resolve, reject) {
        resolve(app.tell(app.buildRichResponse()
          .addSimpleResponse({ speech: 'hello', displayText: 'hi' })
          .addSuggestions(['Say this', 'or this'])));
      });
    }

    let actionMap = new Map();
    actionMap.set('check_guess', handler);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'speech': 'hello',
      'data': {
        'google': {
          'expect_user_response': false,
          'rich_response': {
            'items': [
              {
                'simple_response': {
                  'text_to_speech': 'hello',
                  'display_text': 'hi'
                }
              }
            ],
            'suggestions': [
              {
                'title': 'Say this'
              },
              {
                'title': 'or this'
              }
            ]
          }
        }
      },
      'contextOut': []
    };
    expect(JSON.parse(JSON.stringify(mockResponse.body)))
      .to.deep.equal(expectedResponse);
  });

  // Failure test, when the API returns a 400 response with the response object
  it('Should send failure response for rich response without simple response', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
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
      'originalRequest': {
        'data': {
          'conversation': {
            'type': 2
          }
        }
      }
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    function handler (app) {
      return new Promise(function (resolve, reject) {
        resolve(app.tell(app.buildRichResponse()));
      });
    }

    let actionMap = new Map();
    actionMap.set('check_guess', handler);

    app.handleRequest(actionMap);

    expect(mockResponse.statusCode).to.equal(400);
  });
});

/**
 * Describes the behavior for ApiAiApp ask method.
 */
describe('ApiAiApp#ask', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid speech JSON in the response object for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
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
      'originalRequest': {
        'data': {
          'conversation': {
            'type': 2
          }
        }
      }
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    function handler (app) {
      return new Promise(function (resolve, reject) {
        resolve(app.ask('hello'));
      });
    }

    let actionMap = new Map();
    actionMap.set('check_guess', handler);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'speech': 'hello',
      'data': {
        'google': {
          'expect_user_response': true,
          'is_ssml': false,
          'no_input_prompts': []
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

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid simple response JSON in the response object for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
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
      'originalRequest': {
        'data': {
          'conversation': {
            'type': 2
          }
        }
      }
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    function handler (app) {
      return new Promise(function (resolve, reject) {
        resolve(app.ask({
          speech: 'hello',
          displayText: 'hi'
        }));
      });
    }

    let actionMap = new Map();
    actionMap.set('check_guess', handler);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'speech': 'hello',
      'data': {
        'google': {
          'expect_user_response': true,
          'rich_response': {
            'items': [
              {
                'simple_response': {
                  'text_to_speech': 'hello',
                  'display_text': 'hi'
                }
              }
            ],
            'suggestions': []
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
    expect(JSON.parse(JSON.stringify(mockResponse.body)))
      .to.deep.equal(expectedResponse);
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid rich response JSON in the response object for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
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
      'originalRequest': {
        'data': {
          'conversation': {
            'type': 2
          }
        }
      }
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    function handler (app) {
      return new Promise(function (resolve, reject) {
        resolve(app.ask(app.buildRichResponse()
          .addSimpleResponse({ speech: 'hello', displayText: 'hi' })
          .addSuggestions(['Say this', 'or this'])));
      });
    }

    let actionMap = new Map();
    actionMap.set('check_guess', handler);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'speech': 'hello',
      'data': {
        'google': {
          'expect_user_response': true,
          'rich_response': {
            'items': [
              {
                'simple_response': {
                  'text_to_speech': 'hello',
                  'display_text': 'hi'
                }
              }
            ],
            'suggestions': [
              {
                'title': 'Say this'
              },
              {
                'title': 'or this'
              }
            ]
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
    expect(JSON.parse(JSON.stringify(mockResponse.body)))
      .to.deep.equal(expectedResponse);
  });

  // Failure test, when the API returns a 400 response with the response object
  it('Should send failure response for rich response without simple response', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
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
      'originalRequest': {
        'data': {
          'conversation': {
            'type': 2
          }
        }
      }
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    function handler (app) {
      return new Promise(function (resolve, reject) {
        resolve(app.ask(app.buildRichResponse()));
      });
    }

    let actionMap = new Map();
    actionMap.set('check_guess', handler);

    app.handleRequest(actionMap);

    expect(mockResponse.statusCode).to.equal(400);
  });
});

/**
 * Describes the behavior for ApiAiApp askWithList method.
 */
describe('ApiAiApp#askWithList', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid list JSON in the response object for the success case.', function () {
    let headers = {'Content-Type': 'application/json'};
    let body = {
      'id': '9c4394e3-4f5a-4e68-b1af-088b75ad3071',
      'timestamp': '2016-10-28T03:41:39.957Z',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'Show me a list',
        'speech': '',
        'action': 'show_list',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [],
        'metadata': {
          'intentId': '1e46ffc2-651f-4ac0-a54e-9698feb88880',
          'webhookUsed': 'true',
          'intentName': 'show_list'
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
      'originalRequest': {
        'version': 2,
        'data': {
          'conversation': {
            'type': 2
          }
        }
      }
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({request: mockRequest, response: mockResponse});

    function handler (app) {
      return new Promise(function (resolve, reject) {
        resolve(app.askWithList('Here is a list', app.buildList()
          .addItems([
            app.buildOptionItem('key_1', 'key one'),
            app.buildOptionItem('key_2', 'key two')
          ])
        ));
      });
    }

    let actionMap = new Map();
    actionMap.set('show_list', handler);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'speech': 'Here is a list',
      'data': {
        'google': {
          'expectUserResponse': true,
          'isSsml': false,
          'noInputPrompts': [],
          'systemIntent': {
            'intent': 'actions.intent.OPTION',
            'data': {
              '@type': 'type.googleapis.com/google.actions.v2.OptionValueSpec',
              'listSelect': {
                'items': [
                  {
                    'optionInfo': {
                      'key': 'key_1',
                      'synonyms': [
                        'key one'
                      ]
                    },
                    'title': ''
                  },
                  {
                    'optionInfo': {
                      'key': 'key_2',
                      'synonyms': [
                        'key two'
                      ]
                    },
                    'title': ''
                  }
                ]
              }
            }
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
    expect(JSON.parse(JSON.stringify(mockResponse.body))).to
      .deep.equal(expectedResponse);
  });

  it('Should return the an error JSON in the response when list has <2 items.', function () {
    let headers = {'Content-Type': 'application/json'};
    let body = {
      'id': '9c4394e3-4f5a-4e68-b1af-088b75ad3071',
      'timestamp': '2016-10-28T03:41:39.957Z',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'Show me a list',
        'speech': '',
        'action': 'show_list',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [],
        'metadata': {
          'intentId': '1e46ffc2-651f-4ac0-a54e-9698feb88880',
          'webhookUsed': 'true',
          'intentName': 'show_list'
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
      'originalRequest': {
        'version': 2,
        'data': {
          'conversation': {
            'type': 2
          }
        }
      }
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({request: mockRequest, response: mockResponse});

    function handler (app) {
      return new Promise(function (resolve, reject) {
        resolve(app.askWithList('Here is a list', app.buildList()));
      });
    }

    let actionMap = new Map();
    actionMap.set('show_list', handler);

    app.handleRequest(actionMap);

    expect(mockResponse.statusCode).to.equal(400);
  });
});

/**
 * Describes the behavior for ApiAiApp askWithCarousel method.
 */
describe('ApiAiApp#askWithCarousel', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid carousel JSON in the response object for the success case.', function () {
    let headers = {'Content-Type': 'application/json'};
    let body = {
      'id': '9c4394e3-4f5a-4e68-b1af-088b75ad3071',
      'timestamp': '2016-10-28T03:41:39.957Z',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'Show me a carousel',
        'speech': '',
        'action': 'show_carousel',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [],
        'metadata': {
          'intentId': '1e46ffc2-651f-4ac0-a54e-9698feb88880',
          'webhookUsed': 'true',
          'intentName': 'show_carousel'
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
      'originalRequest': {
        'version': 2,
        'data': {
          'conversation': {
            'type': 2
          }
        }
      }
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({request: mockRequest, response: mockResponse});

    function handler (app) {
      return new Promise(function (resolve, reject) {
        resolve(app.askWithCarousel('Here is a carousel',
          app.buildCarousel()
            .addItems([
              app.buildOptionItem('key_1', 'key one'),
              app.buildOptionItem('key_2', 'key two')
            ])
        ));
      });
    }

    let actionMap = new Map();
    actionMap.set('show_carousel', handler);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'speech': 'Here is a carousel',
      'data': {
        'google': {
          'expectUserResponse': true,
          'isSsml': false,
          'noInputPrompts': [],
          'systemIntent': {
            'intent': 'actions.intent.OPTION',
            'data': {
              '@type': 'type.googleapis.com/google.actions.v2.OptionValueSpec',
              'carouselSelect': {
                'items': [
                  {
                    'optionInfo': {
                      'key': 'key_1',
                      'synonyms': [
                        'key one'
                      ]
                    },
                    'title': ''
                  },
                  {
                    'optionInfo': {
                      'key': 'key_2',
                      'synonyms': [
                        'key two'
                      ]
                    },
                    'title': ''
                  }
                ]
              }
            }
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
    expect(JSON.parse(JSON.stringify(mockResponse.body))).to
      .deep.equal(expectedResponse);
  });

  it('Should return the an error JSON in the response when carousel has <2 items.', function () {
    let headers = {'Content-Type': 'application/json'};
    let body = {
      'id': '9c4394e3-4f5a-4e68-b1af-088b75ad3071',
      'timestamp': '2016-10-28T03:41:39.957Z',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'Show me a carousel',
        'speech': '',
        'action': 'show_carousel',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [],
        'metadata': {
          'intentId': '1e46ffc2-651f-4ac0-a54e-9698feb88880',
          'webhookUsed': 'true',
          'intentName': 'show_carousel'
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
      'originalRequest': {
        'version': 2,
        'data': {
          'conversation': {
            'type': 2
          }
        }
      }
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({request: mockRequest, response: mockResponse});

    function handler (app) {
      return new Promise(function (resolve, reject) {
        resolve(app.askWithCarousel('Here is a carousel',
          app.buildCarousel()
        ));
      });
    }

    let actionMap = new Map();
    actionMap.set('show_carousel', handler);

    app.handleRequest(actionMap);

    expect(mockResponse.statusCode).to.equal(400);
  });
});

/**
 * Describes the behavior for ApiAiApp askForPermissions method in v1.
 */
describe('ApiAiApp#askForPermissions', function () {
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
      'originalRequest': {
        'data': {
          'conversation': {
            'type': 2
          }
        }
      }
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({request: mockRequest, response: mockResponse});

    function handler (app) {
      return new Promise(function (resolve, reject) {
        resolve(app.askForPermissions('To test', ['NAME', 'DEVICE_PRECISE_LOCATION']));
      });
    }

    let actionMap = new Map();
    actionMap.set('get_permission', handler);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'speech': 'PLACEHOLDER_FOR_PERMISSION',
      'data': {
        'google': {
          'expect_user_response': true,
          'is_ssml': false,
          'no_input_prompts': [],
          'system_intent': {
            'intent': 'assistant.intent.action.PERMISSION',
            'spec': {
              'permission_value_spec': {
                'opt_context': 'To test',
                'permissions': ['NAME', 'DEVICE_PRECISE_LOCATION']
              }
            }
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

/**
 * Describes the behavior for ApiAiApp askForPermissions method in v2.
 */
describe('ApiAiApp#askForPermissions', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid JSON in the response object for the success case.', function () {
    let headers = {'Content-Type': 'application/json'};
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
      'originalRequest': {
        'version': 2,
        'data': {
          'conversation': {
            'type': 2
          }
        }
      }
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({request: mockRequest, response: mockResponse});

    function handler (app) {
      return new Promise(function (resolve, reject) {
        resolve(app.askForPermissions('To test', ['NAME', 'DEVICE_PRECISE_LOCATION']));
      });
    }

    let actionMap = new Map();
    actionMap.set('get_permission', handler);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'speech': 'PLACEHOLDER_FOR_PERMISSION',
      'data': {
        'google': {
          'expectUserResponse': true,
          'isSsml': false,
          'noInputPrompts': [],
          'systemIntent': {
            'intent': 'actions.intent.PERMISSION',
            'data': {
              '@type': 'type.googleapis.com/google.actions.v2.PermissionValueSpec',
              'optContext': 'To test',
              'permissions': ['NAME', 'DEVICE_PRECISE_LOCATION']
            }
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

/**
 * Describes the behavior for ApiAiApp getUser method.
 */
describe('ApiAiApp#getUser', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request user.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'google-assistant-api-version': 'v1'
    };
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
      'originalRequest': {
        'data': {
          'conversation': {
            'type': 2
          },
          'user': {
            'user_id': '11112226094657824893'
          }
        }
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    // Test new and old API
    expect(app.getUser().user_id).to.equal('11112226094657824893');
    expect(app.getUser().userId).to.equal('11112226094657824893');
  });
});

/**
 * Describes the behavior for ApiAiApp getUserName method.
 */
describe('ApiAiApp#getUserName', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request user.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'google-assistant-api-version': 'v1'
    };
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
      'originalRequest': {
        'data': {
          'conversation': {
            'type': 2
          },
          'user': {
            'user_id': '11112226094657824893',
            'profile': {
              'display_name': 'John Smith',
              'given_name': 'John',
              'family_name': 'Smith'
            }
          }
        }
      }
    };
    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getUserName().displayName).to.equal('John Smith');
    expect(app.getUserName().givenName).to.equal('John');
    expect(app.getUserName().familyName).to.equal('Smith');

    // Test the false case

    body.originalRequest.data.user.profile = undefined;

    mockRequest = new MockRequest(headers, body);
    mockResponse = new MockResponse();

    app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getUserName()).to.equal(null);
  });
});

/**
 * Describes the behavior for ApiAiApp getDeviceLocation method.
 */
describe('ApiAiApp#getDeviceLocation', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request user.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'google-assistant-api-version': 'v1'
    };
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
      'originalRequest': {
        'data': {
          'conversation': {
            'type': 2
          },
          'user': {
            'user_id': '11112226094657824893'
          },
          'device': {
            'location': {
              'coordinates': {
                'latitude': 37.3861,
                'longitude': 122.0839
              },
              'formatted_address': '123 Main St, Anytown, CA 12345, United States',
              'zip_code': '12345',
              'city': 'Anytown'
            }
          }
        }
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getDeviceLocation().coordinates).to.deep.equal({
      latitude: 37.3861,
      longitude: 122.0839
    });
    expect(app.getDeviceLocation().address)
      .to.equal('123 Main St, Anytown, CA 12345, United States');
    expect(app.getDeviceLocation().zipCode).to.equal('12345');
    expect(app.getDeviceLocation().city).to.equal('Anytown');

    // Test the false case

    body.originalRequest.data.device = undefined;

    mockRequest = new MockRequest(headers, body);
    mockResponse = new MockResponse();

    app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getDeviceLocation()).to.equal(null);
  });
});

/**
 * Describes the behavior for ApiAiApp getTransactionRequirementsResult method.
 */
describe('ApiAiApp#getTransactionRequirementsResult', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request transaction result.', function () {
    let headers = {
      'Content-Type': 'application/json'
    };
    let body = {
      'originalRequest': {
        'source': 'google',
        'version': '2',
        'data': {
          'isInSandbox': true,
          'surface': {
            'capabilities': [
              {
                'name': 'actions.capability.AUDIO_OUTPUT'
              },
              {
                'name': 'actions.capability.SCREEN_OUTPUT'
              }
            ]
          },
          'inputs': [
            {
              'rawInputs': [
                {
                  'query': 'check transaction',
                  'inputType': 'VOICE'
                }
              ],
              'arguments': [
                {
                  'extension': {
                    'canTransact': true,
                    '@type': 'type.googleapis.com/google.actions.v2.TransactionRequirementsCheckResult',
                    'resultType': 'OK'
                  },
                  'name': 'TRANSACTION_REQUIREMENTS_CHECK_RESULT'
                }
              ],
              'intent': 'actions.intent.TRANSACTION_REQUIREMENTS_CHECK'
            }
          ],
          'user': {
            'userId': 'user123'
          },
          'device': {
            'locale': 'en-US'
          },
          'conversation': {
            'conversationId': '1494603963782',
            'type': 'ACTIVE',
            'conversationToken': '["_actions_on_google_"]'
          }
        }
      },
      'id': 'e169144c-9d31-4a9d-82a0-b14922ce21a7',
      'timestamp': '2017-05-12T15:46:08.594Z',
      'lang': 'en',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'actions_intent_TRANSACTION_REQUIREMENTS_CHECK',
        'speech': '',
        'action': 'transaction.check.complete',
        'actionIncomplete': false,
        'parameters': {
          'test': '@test'
        },
        'metadata': {
          'intentId': 'fd16d86b-60db-4d19-a683-5b52a22f4795',
          'webhookUsed': 'true',
          'webhookForSlotFillingUsed': 'false',
          'nluResponseTime': 19,
          'intentName': 'transactioncheck_complete'
        },
        'fulfillment': {
          'speech': '',
          'messages': [
            {
              'type': 0,
              'speech': ''
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': '1494603963782'
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getTransactionRequirementsResult()).to.equal('OK');
  });
});

/**
 * Describes the behavior for ApiAiApp getDeliveryAddress method.
 */
describe('ApiAiApp#getDeliveryAddress', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request delivery address', function () {
    let headers = {
      'Content-Type': 'application/json'
    };
    let body = {
      'originalRequest': {
        'source': 'google',
        'version': '2',
        'data': {
          'isInSandbox': true,
          'surface': {
            'capabilities': [
              {
                'name': 'actions.capability.AUDIO_OUTPUT'
              },
              {
                'name': 'actions.capability.SCREEN_OUTPUT'
              }
            ]
          },
          'inputs': [
            {
              'rawInputs': [
                {
                  'query': '1600 Amphitheatre Parkway',
                  'inputType': 'VOICE'
                }
              ],
              'arguments': [
                {
                  'extension': {
                    'userDecision': 'ACCEPTED',
                    '@type': 'type.googleapis.com/google.actions.v2.DeliveryAddressValue',
                    'location': {
                      'zipCode': '94043',
                      'postalAddress': {
                        'regionCode': 'US',
                        'recipients': [
                          'Jane Smith'
                        ],
                        'postalCode': '94043',
                        'locality': 'Mountain View',
                        'addressLines': [
                          '1600 Amphitheatre Parkway'
                        ],
                        'administrativeArea': 'CA'
                      },
                      'phoneNumber': '+1 415-555-1234',
                      'city': 'Mountain View'
                    }
                  },
                  'name': 'DELIVERY_ADDRESS_VALUE'
                }
              ],
              'intent': 'actions.intent.DELIVERY_ADDRESS'
            }
          ],
          'user': {
            'userId': 'user123'
          },
          'device': {
            'locale': 'en-US'
          },
          'conversation': {
            'conversationId': '1494606917128',
            'type': 'ACTIVE',
            'conversationToken': '["_actions_on_google_"]'
          }
        }
      },
      'id': '8032dc31-9627-4fbe-9ffd-8e5cfb20cebf',
      'timestamp': '2017-05-12T16:35:38.131Z',
      'lang': 'en',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'actions_intent_DELIVERY_ADDRESS',
        'speech': '',
        'action': 'delivery.address.complete',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [
        ],
        'metadata': {
          'intentId': 'a15ac3ff-1a84-43d0-94e9-37862a3d89cf',
          'webhookUsed': 'true',
          'webhookForSlotFillingUsed': 'false',
          'nluResponseTime': 2,
          'intentName': 'deliveryaddress_complete'
        },
        'fulfillment': {
          'speech': '',
          'messages': [
            {
              'type': 0,
              'speech': ''
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': '1494606917128'
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getDeliveryAddress()).to.deep.equal({
      zipCode: '94043',
      postalAddress: {
        regionCode: 'US',
        recipients: [
          'Jane Smith'
        ],
        postalCode: '94043',
        locality: 'Mountain View',
        addressLines: [
          '1600 Amphitheatre Parkway'
        ],
        administrativeArea: 'CA'
      },
      phoneNumber: '+1 415-555-1234',
      city: 'Mountain View'
    });
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request delivery address for txn decision', function () {
    let headers = {
      'Content-Type': 'application/json'
    };
    let body = {
      'originalRequest': {
        'source': 'google',
        'version': '2',
        'data': {
          'isInSandbox': true,
          'surface': {
            'capabilities': [
              {
                'name': 'actions.capability.AUDIO_OUTPUT'
              },
              {
                'name': 'actions.capability.SCREEN_OUTPUT'
              }
            ]
          },
          'inputs': [
            {
              'rawInputs': [
                {
                  'query': '1600 Amphitheatre Parkway',
                  'inputType': 'VOICE'
                }
              ],
              'arguments': [
                {
                  'extension': {
                    'userDecision': 'ACCEPTED',
                    '@type': 'type.googleapis.com/google.actions.v2.TransactionDecisionValue',
                    'location': {
                      'zipCode': '94043',
                      'postalAddress': {
                        'regionCode': 'US',
                        'recipients': [
                          'Jane Smith'
                        ],
                        'postalCode': '94043',
                        'locality': 'Mountain View',
                        'addressLines': [
                          '1600 Amphitheatre Parkway'
                        ],
                        'administrativeArea': 'CA'
                      },
                      'phoneNumber': '+1 415-555-1234',
                      'city': 'Mountain View'
                    }
                  },
                  'name': 'TRANSACTION_DECISION_VALUE'
                }
              ],
              'intent': 'actions.intent.TRANSACTION_DECISION'
            }
          ],
          'user': {
            'userId': 'user123'
          },
          'device': {
            'locale': 'en-US'
          },
          'conversation': {
            'conversationId': '1494606917128',
            'type': 'ACTIVE',
            'conversationToken': '["_actions_on_google_"]'
          }
        }
      },
      'id': '8032dc31-9627-4fbe-9ffd-8e5cfb20cebf',
      'timestamp': '2017-05-12T16:35:38.131Z',
      'lang': 'en',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'actions_intent_DELIVERY_ADDRESS',
        'speech': '',
        'action': 'delivery.address.complete',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [
        ],
        'metadata': {
          'intentId': 'a15ac3ff-1a84-43d0-94e9-37862a3d89cf',
          'webhookUsed': 'true',
          'webhookForSlotFillingUsed': 'false',
          'nluResponseTime': 2,
          'intentName': 'deliveryaddress_complete'
        },
        'fulfillment': {
          'speech': '',
          'messages': [
            {
              'type': 0,
              'speech': ''
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': '1494606917128'
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getDeliveryAddress()).to.deep.equal({
      zipCode: '94043',
      postalAddress: {
        regionCode: 'US',
        recipients: [
          'Jane Smith'
        ],
        postalCode: '94043',
        locality: 'Mountain View',
        addressLines: [
          '1600 Amphitheatre Parkway'
        ],
        administrativeArea: 'CA'
      },
      phoneNumber: '+1 415-555-1234',
      city: 'Mountain View'
    });
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return null when user rejects', function () {
    let headers = {
      'Content-Type': 'application/json'
    };
    let body = {
      'originalRequest': {
        'source': 'google',
        'version': '2',
        'data': {
          'isInSandbox': true,
          'surface': {
            'capabilities': [
              {
                'name': 'actions.capability.AUDIO_OUTPUT'
              },
              {
                'name': 'actions.capability.SCREEN_OUTPUT'
              }
            ]
          },
          'inputs': [
            {
              'rawInputs': [
                {
                  'query': '1600 Amphitheatre Parkway',
                  'inputType': 'VOICE'
                }
              ],
              'arguments': [
                {
                  'extension': {
                    'userDecision': 'REJECTED',
                    '@type': 'type.googleapis.com/google.actions.v2.DeliveryAddressValue',
                    'location': {
                      'zipCode': '94043',
                      'postalAddress': {
                        'regionCode': 'US',
                        'recipients': [
                          'Jane Smith'
                        ],
                        'postalCode': '94043',
                        'locality': 'Mountain View',
                        'addressLines': [
                          '1600 Amphitheatre Parkway'
                        ],
                        'administrativeArea': 'CA'
                      },
                      'phoneNumber': '+1 415-555-1234',
                      'city': 'Mountain View'
                    }
                  },
                  'name': 'DELIVERY_ADDRESS_VALUE'
                }
              ],
              'intent': 'actions.intent.DELIVERY_ADDRESS'
            }
          ],
          'user': {
            'userId': 'user123'
          },
          'device': {
            'locale': 'en-US'
          },
          'conversation': {
            'conversationId': '1494606917128',
            'type': 'ACTIVE',
            'conversationToken': '["_actions_on_google_"]'
          }
        }
      },
      'id': '8032dc31-9627-4fbe-9ffd-8e5cfb20cebf',
      'timestamp': '2017-05-12T16:35:38.131Z',
      'lang': 'en',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'actions_intent_DELIVERY_ADDRESS',
        'speech': '',
        'action': 'delivery.address.complete',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [
        ],
        'metadata': {
          'intentId': 'a15ac3ff-1a84-43d0-94e9-37862a3d89cf',
          'webhookUsed': 'true',
          'webhookForSlotFillingUsed': 'false',
          'nluResponseTime': 2,
          'intentName': 'deliveryaddress_complete'
        },
        'fulfillment': {
          'speech': '',
          'messages': [
            {
              'type': 0,
              'speech': ''
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': '1494606917128'
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getDeliveryAddress()).to.equal(null);
  });
});

/**
 * Describes the behavior for ApiAiApp getTransactionDecision method.
 */
describe('ApiAiApp#getTransactionDecision', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request delivery address', function () {
    let headers = {
      'Content-Type': 'application/json'
    };
    let body = {
      'originalRequest': {
        'source': 'google',
        'version': '2',
        'data': {
          'isInSandbox': true,
          'surface': {
            'capabilities': [
              {
                'name': 'actions.capability.AUDIO_OUTPUT'
              },
              {
                'name': 'actions.capability.SCREEN_OUTPUT'
              }
            ]
          },
          'inputs': [
            {
              'rawInputs': [
                {
                  'query': '1600 Amphitheatre Parkway',
                  'inputType': 'VOICE'
                }
              ],
              'arguments': [
                {
                  'extension': {
                    'userDecision': 'ORDER_ACCEPTED',
                    'checkResult': {
                      'resultType': 'OK',
                      'order': {
                        'finalOrder': { 'fakeOrder': 'fake_order' },
                        'googleOrderId': 'goog_123',
                        'actionOrderId': 'action_123',
                        'orderDate': {
                          'seconds': 40,
                          'nanos': 880000000
                        },
                        'paymentInfo': { 'fakePayment': 'fake_payment' },
                        'customerInfo': {
                          'email': 'username@example.com'
                        }
                      }
                    }
                  },
                  'name': 'TRANSACTION_DECISION_VALUE'
                }
              ],
              'intent': 'actions.intent.TRANSACTION_DECISION'
            }
          ],
          'user': {
            'userId': 'user123'
          },
          'device': {
            'locale': 'en-US'
          },
          'conversation': {
            'conversationId': '1494606917128',
            'type': 'ACTIVE',
            'conversationToken': '["_actions_on_google_"]'
          }
        }
      },
      'id': '8032dc31-9627-4fbe-9ffd-8e5cfb20cebf',
      'timestamp': '2017-05-12T16:35:38.131Z',
      'lang': 'en',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'actions_intent_DELIVERY_ADDRESS',
        'speech': '',
        'action': 'delivery.address.complete',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [],
        'metadata': {
          'intentId': 'a15ac3ff-1a84-43d0-94e9-37862a3d89cf',
          'webhookUsed': 'true',
          'webhookForSlotFillingUsed': 'false',
          'nluResponseTime': 2,
          'intentName': 'deliveryaddress_complete'
        },
        'fulfillment': {
          'speech': '',
          'messages': [
            {
              'type': 0,
              'speech': ''
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': '1494606917128'
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getTransactionDecision()).to.deep.equal({
      'userDecision': 'ORDER_ACCEPTED',
      'checkResult': {
        'resultType': 'OK',
        'order': {
          'finalOrder': { 'fakeOrder': 'fake_order' },
          'googleOrderId': 'goog_123',
          'actionOrderId': 'action_123',
          'orderDate': {
            'seconds': 40,
            'nanos': 880000000
          },
          'paymentInfo': { 'fakePayment': 'fake_payment' },
          'customerInfo': {
            'email': 'username@example.com'
          }
        }
      }
    });
  });
});

/**
 * Describes the behavior for ApiAiApp getUserConfirmation method.
 */
describe('ApiAiApp#getUserConfirmation', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request positive user confirmation', function () {
    let headers = {
      'Content-Type': 'application/json'
    };
    let body = {
      'originalRequest': {
        'source': 'google',
        'version': '2',
        'data': {
          'isInSandbox': true,
          'surface': {
            'capabilities': [
              {
                'name': 'actions.capability.AUDIO_OUTPUT'
              },
              {
                'name': 'actions.capability.SCREEN_OUTPUT'
              }
            ]
          },
          'inputs': [
            {
              'rawInputs': [
                {
                  'query': 'i think so',
                  'inputType': 'VOICE'
                }
              ],
              'arguments': [
                {
                  'name': 'CONFIRMATION',
                  'boolValue': true
                }
              ],
              'intent': 'actions.intent.CONFIRMATION'
            }
          ],
          'user': {
            'userId': 'user123'
          },
          'device': {
            'locale': 'en-US'
          },
          'conversation': {
            'conversationId': '1494606917128',
            'type': 'ACTIVE',
            'conversationToken': '["_actions_on_google_"]'
          }
        }
      },
      'id': '8032dc31-9627-4fbe-9ffd-8e5cfb20cebf',
      'timestamp': '2017-05-12T16:35:38.131Z',
      'lang': 'en',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'actions_intent_CONFIRMATION',
        'speech': '',
        'action': 'confirmation.complete',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [],
        'metadata': {
          'intentId': 'a15ac3ff-1a84-43d0-94e9-37862a3d89cf',
          'webhookUsed': 'true',
          'webhookForSlotFillingUsed': 'false',
          'nluResponseTime': 2,
          'intentName': 'confirmation_complete'
        },
        'fulfillment': {
          'speech': '',
          'messages': [
            {
              'type': 0,
              'speech': ''
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': '1494606917128'
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getUserConfirmation()).to.equal(true);
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request negative user confirmation', function () {
    let headers = {
      'Content-Type': 'application/json'
    };
    let body = {
      'originalRequest': {
        'source': 'google',
        'version': '2',
        'data': {
          'isInSandbox': true,
          'surface': {
            'capabilities': [
              {
                'name': 'actions.capability.AUDIO_OUTPUT'
              },
              {
                'name': 'actions.capability.SCREEN_OUTPUT'
              }
            ]
          },
          'inputs': [
            {
              'rawInputs': [
                {
                  'query': 'i think so',
                  'inputType': 'VOICE'
                }
              ],
              'arguments': [
                {
                  'name': 'CONFIRMATION',
                  'boolValue': false
                }
              ],
              'intent': 'actions.intent.CONFIRMATION'
            }
          ],
          'user': {
            'userId': 'user123'
          },
          'device': {
            'locale': 'en-US'
          },
          'conversation': {
            'conversationId': '1494606917128',
            'type': 'ACTIVE',
            'conversationToken': '["_actions_on_google_"]'
          }
        }
      },
      'id': '8032dc31-9627-4fbe-9ffd-8e5cfb20cebf',
      'timestamp': '2017-05-12T16:35:38.131Z',
      'lang': 'en',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'actions_intent_CONFIRMATION',
        'speech': '',
        'action': 'confirmation.complete',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [],
        'metadata': {
          'intentId': 'a15ac3ff-1a84-43d0-94e9-37862a3d89cf',
          'webhookUsed': 'true',
          'webhookForSlotFillingUsed': 'false',
          'nluResponseTime': 2,
          'intentName': 'confirmation_complete'
        },
        'fulfillment': {
          'speech': '',
          'messages': [
            {
              'type': 0,
              'speech': ''
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': '1494606917128'
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getUserConfirmation()).to.equal(false);
  });
});

/**
 * Describes the behavior for ApiAiApp getDateTime method.
 */
describe('ApiAiApp#getDateTime', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant datetime information', function () {
    let headers = {
      'Content-Type': 'application/json'
    };
    let body = {
      'originalRequest': {
        'source': 'google',
        'version': '2',
        'data': {
          'isInSandbox': true,
          'surface': {
            'capabilities': [
              {
                'name': 'actions.capability.AUDIO_OUTPUT'
              },
              {
                'name': 'actions.capability.SCREEN_OUTPUT'
              }
            ]
          },
          'inputs': [
            {
              'rawInputs': [
                {
                  'query': 'i think so',
                  'inputType': 'VOICE'
                }
              ],
              'arguments': [
                {
                  'datetimeValue': {
                    'date': {
                      'month': 5,
                      'year': 2017,
                      'day': 26
                    },
                    'time': {
                      'hours': 9
                    }
                  },
                  'name': 'DATETIME'
                }
              ],
              'intent': 'actions.intent.DATETIME'
            }
          ],
          'user': {
            'userId': 'user123'
          },
          'device': {
            'locale': 'en-US'
          },
          'conversation': {
            'conversationId': '1494606917128',
            'type': 'ACTIVE',
            'conversationToken': '["_actions_on_google_"]'
          }
        }
      },
      'id': '8032dc31-9627-4fbe-9ffd-8e5cfb20cebf',
      'timestamp': '2017-05-12T16:35:38.131Z',
      'lang': 'en',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'actions_intent_CONFIRMATION',
        'speech': '',
        'action': 'confirmation.complete',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [],
        'metadata': {
          'intentId': 'a15ac3ff-1a84-43d0-94e9-37862a3d89cf',
          'webhookUsed': 'true',
          'webhookForSlotFillingUsed': 'false',
          'nluResponseTime': 2,
          'intentName': 'confirmation_complete'
        },
        'fulfillment': {
          'speech': '',
          'messages': [
            {
              'type': 0,
              'speech': ''
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': '1494606917128'
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getDateTime()).to.deep.equal({
      date: {
        month: 5,
        year: 2017,
        day: 26
      },
      time: {
        hours: 9
      }
    });
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request missing date/time information', function () {
    let headers = {
      'Content-Type': 'application/json'
    };
    let body = {
      'originalRequest': {
        'source': 'google',
        'version': '2',
        'data': {
          'isInSandbox': true,
          'surface': {
            'capabilities': [
              {
                'name': 'actions.capability.AUDIO_OUTPUT'
              },
              {
                'name': 'actions.capability.SCREEN_OUTPUT'
              }
            ]
          },
          'inputs': [
            {
              'rawInputs': [
                {
                  'query': 'i think so',
                  'inputType': 'VOICE'
                }
              ],
              'arguments': [ ],
              'intent': 'actions.intent.CONFIRMATION'
            }
          ],
          'user': {
            'userId': 'user123'
          },
          'device': {
            'locale': 'en-US'
          },
          'conversation': {
            'conversationId': '1494606917128',
            'type': 'ACTIVE',
            'conversationToken': '["_actions_on_google_"]'
          }
        }
      },
      'id': '8032dc31-9627-4fbe-9ffd-8e5cfb20cebf',
      'timestamp': '2017-05-12T16:35:38.131Z',
      'lang': 'en',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'actions_intent_DATETIME',
        'speech': '',
        'action': 'datetime.complete',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [],
        'metadata': {
          'intentId': 'a15ac3ff-1a84-43d0-94e9-37862a3d89cf',
          'webhookUsed': 'true',
          'webhookForSlotFillingUsed': 'false',
          'nluResponseTime': 2,
          'intentName': 'confirmation_complete'
        },
        'fulfillment': {
          'speech': '',
          'messages': [
            {
              'type': 0,
              'speech': ''
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': '1494606917128'
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getDateTime()).to.equal(null);
  });
});

/**
 * Describes the behavior for ApiAiApp getSignInStatus method.
 */
describe('ApiAiApp#getSignInStatus', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant sign in status', function () {
    let headers = {
      'Content-Type': 'application/json'
    };
    let body = {
      'originalRequest': {
        'source': 'google',
        'version': '2',
        'data': {
          'isInSandbox': true,
          'surface': {
            'capabilities': [
              {
                'name': 'actions.capability.AUDIO_OUTPUT'
              },
              {
                'name': 'actions.capability.SCREEN_OUTPUT'
              }
            ]
          },
          'inputs': [
            {
              'rawInputs': [
                {
                  'query': 'i think so',
                  'inputType': 'VOICE'
                }
              ],
              'arguments': [
                {
                  'name': 'SIGN_IN',
                  'extension': {
                    '@type': 'type.googleapis.com/google.actions.v2.SignInValue',
                    'status': 'foo_status'
                  }
                }
              ],
              'intent': 'actions.intent.SIGN_IN'
            }
          ],
          'user': {
            'userId': 'user123'
          },
          'device': {
            'locale': 'en-US'
          },
          'conversation': {
            'conversationId': '1494606917128',
            'type': 'ACTIVE',
            'conversationToken': '["_actions_on_google_"]'
          }
        }
      },
      'id': '8032dc31-9627-4fbe-9ffd-8e5cfb20cebf',
      'timestamp': '2017-05-12T16:35:38.131Z',
      'lang': 'en',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'actions_intent_SIGN_IN',
        'speech': '',
        'action': 'confirmation.complete',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [],
        'metadata': {
          'intentId': 'a15ac3ff-1a84-43d0-94e9-37862a3d89cf',
          'webhookUsed': 'true',
          'webhookForSlotFillingUsed': 'false',
          'nluResponseTime': 2,
          'intentName': 'confirmation_complete'
        },
        'fulfillment': {
          'speech': '',
          'messages': [
            {
              'type': 0,
              'speech': ''
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': '1494606917128'
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getSignInStatus()).to.equal('foo_status');
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request missing sign in status', function () {
    let headers = {
      'Content-Type': 'application/json'
    };
    let body = {
      'originalRequest': {
        'source': 'google',
        'version': '2',
        'data': {
          'isInSandbox': true,
          'surface': {
            'capabilities': [
              {
                'name': 'actions.capability.AUDIO_OUTPUT'
              },
              {
                'name': 'actions.capability.SCREEN_OUTPUT'
              }
            ]
          },
          'inputs': [
            {
              'rawInputs': [
                {
                  'query': 'i think so',
                  'inputType': 'VOICE'
                }
              ],
              'arguments': [ ],
              'intent': 'actions.intent.SIGN_IN'
            }
          ],
          'user': {
            'userId': 'user123'
          },
          'device': {
            'locale': 'en-US'
          },
          'conversation': {
            'conversationId': '1494606917128',
            'type': 'ACTIVE',
            'conversationToken': '["_actions_on_google_"]'
          }
        }
      },
      'id': '8032dc31-9627-4fbe-9ffd-8e5cfb20cebf',
      'timestamp': '2017-05-12T16:35:38.131Z',
      'lang': 'en',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'actions_intent_DATETIME',
        'speech': '',
        'action': 'datetime.complete',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [],
        'metadata': {
          'intentId': 'a15ac3ff-1a84-43d0-94e9-37862a3d89cf',
          'webhookUsed': 'true',
          'webhookForSlotFillingUsed': 'false',
          'nluResponseTime': 2,
          'intentName': 'confirmation_complete'
        },
        'fulfillment': {
          'speech': '',
          'messages': [
            {
              'type': 0,
              'speech': ''
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': '1494606917128'
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getSignInStatus()).to.equal(null);
  });
});

/**
 * Describes the behavior for ApiAiApp askForTransactionRequirements method.
 */
describe('ApiAiApp#askForTransactionRequirements', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON transaction requirements with Google payment options', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
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
      'originalRequest': {
        'version': 2,
        'data': {
          'conversation': {
            'type': 2
          },
          'user': {
            'user_id': '11112226094657824893'
          }
        }
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    let transactionConfig = {
      deliveryAddressRequired: true,
      tokenizationParameters: {
        myParam: 'myParam'
      },
      cardNetworks: [
        'VISA',
        'MASTERCARD'
      ],
      prepaidCardDisallowed: false
    };

    app.handleRequest((app) => {
      app.askForTransactionRequirements(transactionConfig);
    });

    let expectedResponse = {
      'speech': 'PLACEHOLDER_FOR_TXN_REQUIREMENTS',
      'data': {
        'google': {
          'expectUserResponse': true,
          'isSsml': false,
          'noInputPrompts': [],
          'systemIntent': {
            'intent': 'actions.intent.TRANSACTION_REQUIREMENTS_CHECK',
            'data': {
              '@type': 'type.googleapis.com/google.actions.v2.TransactionRequirementsCheckSpec',
              'orderOptions': {
                'requestDeliveryAddress': true
              },
              'paymentOptions': {
                'googleProvidedOptions': {
                  'tokenizationParameters': {
                    'tokenizationType': 'PAYMENT_GATEWAY',
                    'parameters': {
                      'myParam': 'myParam'
                    }
                  },
                  'supportedCardNetworks': [
                    'VISA',
                    'MASTERCARD'
                  ],
                  'prepaidCardDisallowed': false
                }
              }
            }
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

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON transaction requirements with Action payment options', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
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
      'originalRequest': {
        'version': 2,
        'data': {
          'conversation': {
            'type': 2
          },
          'user': {
            'user_id': '11112226094657824893'
          }
        }
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    let transactionConfig = {
      deliveryAddressRequired: true,
      type: 'BANK',
      displayName: 'Checking-4773'
    };

    app.handleRequest((app) => {
      app.askForTransactionRequirements(transactionConfig);
    });

    let expectedResponse = {
      'speech': 'PLACEHOLDER_FOR_TXN_REQUIREMENTS',
      'data': {
        'google': {
          'expectUserResponse': true,
          'isSsml': false,
          'noInputPrompts': [],
          'systemIntent': {
            'intent': 'actions.intent.TRANSACTION_REQUIREMENTS_CHECK',
            'data': {
              '@type': 'type.googleapis.com/google.actions.v2.TransactionRequirementsCheckSpec',
              'orderOptions': {
                'requestDeliveryAddress': true
              },
              'paymentOptions': {
                'actionProvidedOptions': {
                  'paymentType': 'BANK',
                  'displayName': 'Checking-4773'
                }
              }
            }
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

/**
 * Describes the behavior for ApiAiApp askForDeliveryAddress method.
 */
describe('ApiAiApp#askForDeliveryAddress', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON delivery address', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
    let body = {
      'id': 'ce7295cc-b042-42d8-8d72-14b83597ac1e',
      'timestamp': '2016-10-28T03:05:34.288Z',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'start guess a number game',
        'speech': '',
        'action': 'generate_answer',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [],
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
      'originalRequest': {
        'version': 2,
        'data': {
          'conversation': {
            'type': 2
          },
          'user': {
            'user_id': '11112226094657824893'
          }
        }
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    app.handleRequest((app) => { app.askForDeliveryAddress('Just because'); });

    let expectedResponse = {
      'speech': 'PLACEHOLDER_FOR_DELIVERY_ADDRESS',
      'data': {
        'google': {
          'expectUserResponse': true,
          'isSsml': false,
          'noInputPrompts': [],
          'systemIntent': {
            'intent': 'actions.intent.DELIVERY_ADDRESS',
            'data': {
              '@type': 'type.googleapis.com/google.actions.v2.DeliveryAddressValueSpec',
              'addressOptions': {
                'reason': 'Just because'
              }
            }
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

/**
 * Describes the behavior for ApiAiApp askForTransactionDecision method.
 */
describe('ApiAiApp#askForTransactionDecision', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON transaction decision with Google payment options', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
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
      'originalRequest': {
        'version': 2,
        'data': {
          'conversation': {
            'type': 2
          },
          'user': {
            'user_id': '11112226094657824893'
          }
        }
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    let transactionConfig = {
      deliveryAddressRequired: true,
      tokenizationParameters: {
        myParam: 'myParam'
      },
      cardNetworks: [
        'VISA',
        'MASTERCARD'
      ],
      prepaidCardDisallowed: false
    };

    app.handleRequest((app) => {
      app.askForTransactionDecision({ fakeOrderId: 'order_id' }, transactionConfig);
    });

    let expectedResponse = {
      'speech': 'PLACEHOLDER_FOR_TXN_DECISION',
      'data': {
        'google': {
          'expectUserResponse': true,
          'isSsml': false,
          'noInputPrompts': [],
          'systemIntent': {
            'intent': 'actions.intent.TRANSACTION_DECISION',
            'data': {
              '@type': 'type.googleapis.com/google.actions.v2.TransactionDecisionValueSpec',
              'proposedOrder': { 'fakeOrderId': 'order_id' },
              'orderOptions': {
                'requestDeliveryAddress': true
              },
              'paymentOptions': {
                'googleProvidedOptions': {
                  'tokenizationParameters': {
                    'tokenizationType': 'PAYMENT_GATEWAY',
                    'parameters': {
                      'myParam': 'myParam'
                    }
                  },
                  'supportedCardNetworks': [
                    'VISA',
                    'MASTERCARD'
                  ],
                  'prepaidCardDisallowed': false
                }
              }
            }
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

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON transaction decision with Action payment options', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
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
      'originalRequest': {
        'version': 2,
        'data': {
          'conversation': {
            'type': 2
          },
          'user': {
            'user_id': '11112226094657824893'
          }
        }
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    let transactionConfig = {
      deliveryAddressRequired: true,
      type: 'BANK',
      displayName: 'Checking-4773'
    };

    app.handleRequest((app) => {
      app.askForTransactionDecision({ fakeOrderId: 'order_id' }, transactionConfig);
    });

    let expectedResponse = {
      'speech': 'PLACEHOLDER_FOR_TXN_DECISION',
      'data': {
        'google': {
          'expectUserResponse': true,
          'isSsml': false,
          'noInputPrompts': [],
          'systemIntent': {
            'intent': 'actions.intent.TRANSACTION_DECISION',
            'data': {
              '@type': 'type.googleapis.com/google.actions.v2.TransactionDecisionValueSpec',
              'proposedOrder': { 'fakeOrderId': 'order_id' },
              'orderOptions': {
                'requestDeliveryAddress': true
              },
              'paymentOptions': {
                'actionProvidedOptions': {
                  'paymentType': 'BANK',
                  'displayName': 'Checking-4773'
                }
              }
            }
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

/**
 * Describes the behavior for ApiAiApp askForConfirmation method.
 */
describe('ApiAiApp#askForConfirmation', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON confirmation request', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
    let body = {
      'id': 'ce7295cc-b042-42d8-8d72-14b83597ac1e',
      'timestamp': '2016-10-28T03:05:34.288Z',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'start guess a number game',
        'speech': '',
        'action': 'generate_answer',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [],
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
      'originalRequest': {
        'version': 2,
        'data': {
          'conversation': {
            'type': 2
          },
          'user': {
            'user_id': '11112226094657824893'
          }
        }
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    app.handleRequest((app) => { app.askForConfirmation('You want to do that?'); });

    let expectedResponse = {
      'speech': 'PLACEHOLDER_FOR_CONFIRMATION',
      'data': {
        'google': {
          'expectUserResponse': true,
          'isSsml': false,
          'noInputPrompts': [],
          'systemIntent': {
            'intent': 'actions.intent.CONFIRMATION',
            'data': {
              '@type': 'type.googleapis.com/google.actions.v2.ConfirmationValueSpec',
              'dialogSpec': {
                'requestConfirmationText': 'You want to do that?'
              }
            }
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

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON confirmation request without prompt', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
    let body = {
      'id': 'ce7295cc-b042-42d8-8d72-14b83597ac1e',
      'timestamp': '2016-10-28T03:05:34.288Z',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'start guess a number game',
        'speech': '',
        'action': 'generate_answer',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [],
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
      'originalRequest': {
        'version': 2,
        'data': {
          'conversation': {
            'type': 2
          },
          'user': {
            'user_id': '11112226094657824893'
          }
        }
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    app.handleRequest((app) => { app.askForConfirmation(); });

    let expectedResponse = {
      'speech': 'PLACEHOLDER_FOR_CONFIRMATION',
      'data': {
        'google': {
          'expectUserResponse': true,
          'isSsml': false,
          'noInputPrompts': [],
          'systemIntent': {
            'intent': 'actions.intent.CONFIRMATION',
            'data': {
              '@type': 'type.googleapis.com/google.actions.v2.ConfirmationValueSpec'
            }
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

/**
 * Describes the behavior for ApiAiApp askForDateTime method.
 */
describe('ApiAiApp#askForDateTime', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON datetime request', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
    let body = {
      'id': 'ce7295cc-b042-42d8-8d72-14b83597ac1e',
      'timestamp': '2016-10-28T03:05:34.288Z',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'start guess a number game',
        'speech': '',
        'action': 'generate_answer',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [],
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
      'originalRequest': {
        'version': 2,
        'data': {
          'conversation': {
            'type': 2
          },
          'user': {
            'user_id': '11112226094657824893'
          }
        }
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    app.handleRequest((app) => {
      app.askForDateTime('When do you want to come in?',
        'What is the best date for you?',
        'What time of day works best for you?');
    });

    let expectedResponse = {
      'speech': 'PLACEHOLDER_FOR_DATETIME',
      'data': {
        'google': {
          'expectUserResponse': true,
          'isSsml': false,
          'noInputPrompts': [],
          'systemIntent': {
            'intent': 'actions.intent.DATETIME',
            'data': {
              '@type': 'type.googleapis.com/google.actions.v2.DateTimeValueSpec',
              'dialogSpec': {
                'requestDatetimeText': 'When do you want to come in?',
                'requestDateText': 'What is the best date for you?',
                'requestTimeText': 'What time of day works best for you?'
              }
            }
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

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON datetime request with partial prompts', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
    let body = {
      'id': 'ce7295cc-b042-42d8-8d72-14b83597ac1e',
      'timestamp': '2016-10-28T03:05:34.288Z',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'start guess a number game',
        'speech': '',
        'action': 'generate_answer',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [],
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
      'originalRequest': {
        'version': 2,
        'data': {
          'conversation': {
            'type': 2
          },
          'user': {
            'user_id': '11112226094657824893'
          }
        }
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    app.handleRequest((app) => {
      app.askForDateTime('When do you want to come in?', null);
    });

    let expectedResponse = {
      'speech': 'PLACEHOLDER_FOR_DATETIME',
      'data': {
        'google': {
          'expectUserResponse': true,
          'isSsml': false,
          'noInputPrompts': [],
          'systemIntent': {
            'intent': 'actions.intent.DATETIME',
            'data': {
              '@type': 'type.googleapis.com/google.actions.v2.DateTimeValueSpec',
              'dialogSpec': {
                'requestDatetimeText': 'When do you want to come in?'
              }
            }
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

    expect(JSON.parse(JSON.stringify(mockResponse.body))).to.deep.equal(expectedResponse);
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON datetime request withouts prompt', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
    let body = {
      'id': 'ce7295cc-b042-42d8-8d72-14b83597ac1e',
      'timestamp': '2016-10-28T03:05:34.288Z',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'start guess a number game',
        'speech': '',
        'action': 'generate_answer',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [],
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
      'originalRequest': {
        'version': 2,
        'data': {
          'conversation': {
            'type': 2
          },
          'user': {
            'user_id': '11112226094657824893'
          }
        }
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    app.handleRequest((app) => { app.askForDateTime(); });

    let expectedResponse = {
      'speech': 'PLACEHOLDER_FOR_DATETIME',
      'data': {
        'google': {
          'expectUserResponse': true,
          'isSsml': false,
          'noInputPrompts': [],
          'systemIntent': {
            'intent': 'actions.intent.DATETIME',
            'data': {
              '@type': 'type.googleapis.com/google.actions.v2.DateTimeValueSpec'
            }
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

/**
 * Describes the behavior for ApiAiApp askForSignIn method.
 */
describe('ApiAiApp#askForSignIn', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON sign in request', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
    let body = {
      'id': 'ce7295cc-b042-42d8-8d72-14b83597ac1e',
      'timestamp': '2016-10-28T03:05:34.288Z',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'start guess a number game',
        'speech': '',
        'action': 'generate_answer',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [],
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
      'originalRequest': {
        'version': 2,
        'data': {
          'conversation': {
            'type': 2
          },
          'user': {
            'user_id': '11112226094657824893'
          }
        }
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    app.handleRequest((app) => {
      app.askForSignIn();
    });

    let expectedResponse = {
      'speech': 'PLACEHOLDER_FOR_SIGN_IN',
      'data': {
        'google': {
          'expectUserResponse': true,
          'isSsml': false,
          'noInputPrompts': [],
          'systemIntent': {
            'intent': 'actions.intent.SIGN_IN',
            'data': {}
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

/**
 * Describes the behavior for ApiAiApp isPermissionGranted method.
 */
describe('ApiAiApp#isPermissionGranted', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request user.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'google-assistant-api-version': 'v1'
    };
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
      'originalRequest': {
        'data': {
          'conversation': {
            'type': 2
          },
          'inputs': [{
            'arguments': [{
              'name': 'permission_granted',
              'text_value': 'true'
            }]
          }]
        }
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.isPermissionGranted()).to.equal(true);

    // Test the false case

    body.originalRequest.data.inputs[0].arguments[0].text_value = false;

    mockRequest = new MockRequest(headers, body);
    mockResponse = new MockResponse();

    app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.isPermissionGranted()).to.equal(false);
  });
});

/**
 * Describes the behavior for ApiAiApp isInSandbox method.
 */
describe('ApiAiApp#isInSandbox', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request user.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'google-assistant-api-version': 'v1'
    };
    let body = {
      'originalRequest': {
        'source': 'google',
        'version': '2',
        'data': {
          'isInSandbox': true,
          'surface': {
            'capabilities': [
              {
                'name': 'actions.capability.AUDIO_OUTPUT'
              },
              {
                'name': 'actions.capability.SCREEN_OUTPUT'
              }
            ]
          },
          'inputs': [],
          'user': {
            'userId': 'user123'
          },
          'device': {
            'locale': 'en-US'
          },
          'conversation': {
            'conversationId': '1494603963782',
            'type': 'ACTIVE',
            'conversationToken': '["_actions_on_google_"]'
          }
        }
      },
      'id': 'e169144c-9d31-4a9d-82a0-b14922ce21a7',
      'timestamp': '2017-05-12T15:46:08.594Z',
      'lang': 'en',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'actions_intent_TRANSACTION_REQUIREMENTS_CHECK',
        'speech': '',
        'action': 'transaction.check.complete',
        'actionIncomplete': false,
        'parameters': {
          'test': '@test'
        },
        'metadata': {
          'intentId': 'fd16d86b-60db-4d19-a683-5b52a22f4795',
          'webhookUsed': 'true',
          'webhookForSlotFillingUsed': 'false',
          'nluResponseTime': 19,
          'intentName': 'transactioncheck_complete'
        },
        'fulfillment': {
          'speech': '',
          'messages': [
            {
              'type': 0,
              'speech': ''
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': '1494603963782'
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.isInSandbox()).to.be.true;

    // Test the false case

    body.originalRequest.data.isInSandbox = false;

    mockRequest = new MockRequest(headers, body);
    mockResponse = new MockResponse();

    app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.isInSandbox()).to.be.false;
  });
});

/**
 * Describes the behavior for ApiAiApp getIntent method.
 */
describe('ApiAiApp#getIntent', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should get the intent value for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
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
      'originalRequest': {
        'data': {
          'conversation': {
            'type': 2
          }
        }
      }
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getIntent()).to.equal('check_guess');
  });
});

/**
 * Describes the behavior for ApiAiApp getArgument method.
 */
describe('ApiAiApp#getArgument', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should get the argument value for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
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
      'originalRequest': {
        'data': {
          'inputs': [
            {
              'arguments': [
                {
                  'raw_text': 'raw text one',
                  'text_value': 'text value one',
                  'name': 'arg_value_one'
                },
                {
                  'name': 'other_value',
                  'raw_text': '45',
                  'other_value': {
                    'key': 'value'
                  }
                }
              ]
            }
          ],
          'conversation': {
            'type': 2
          }
        }
      }
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getArgument('guess')).to.equal('50');
    expect(app.getArgument('arg_value_one')).to.equal('text value one');
    expect(app.getArgument('other_value', true)).to.deep.equal({
      'name': 'other_value',
      'raw_text': '45',
      'other_value': {
        'key': 'value'
      }
    });
  });
});

/**
 * Describes the behavior for ApiAiApp getContextArgument method.
 */
describe('ApiAiApp#getContextArgument', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should get the context argument value for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
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
            'name': 'previous_answer',
            'parameters': {
              'answer': '68',
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
      'originalRequest': {
        'data': {
          'conversation': {
            'type': 2
          }
        }
      }
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getContextArgument('game', 'guess')).to
      .deep.equal({ value: '50', original: '50' });
    expect(app.getContextArgument('previous_answer', 'answer')).to
      .deep.equal({ value: '68' });
  });
});

/**
 * Describes the behavior for ApiAiApp getIncomingRichResponse method.
 */
describe('ApiAiApp#getIncomingRichResponse', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should get the incoming rich response for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json'
    };
    let body = {
      'id': 'db2c39ce-1755-4163-a8df-ea033d713dbb',
      'timestamp': '2017-04-21T22:15:25.611Z',
      'lang': 'en',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'hi',
        'action': 'input.welcome',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [],
        'metadata': {
          'intentId': '784690f8-8d87-4f0d-a40f-3e6c99ecd1e0',
          'webhookUsed': 'false',
          'webhookForSlotFillingUsed': 'false',
          'intentName': 'Default Welcome Intent'
        },
        'fulfillment': {
          'speech': 'Hi!',
          'messages': [
            {
              'type': 'simple_response',
              'platform': 'google',
              'textToSpeech': 'Simple response one'
            },
            {
              'type': 'basic_card',
              'platform': 'google',
              'formattedText': 'my text',
              'buttons': []
            },
            {
              'type': 'suggestion_chips',
              'platform': 'google',
              'suggestions': [
                {
                  'title': 'suggestion one'
                }
              ]
            },
            {
              'type': 'link_out_chip',
              'platform': 'google',
              'destinationName': 'google',
              'url': 'google.com'
            },
            {
              'type': 0,
              'speech': 'Good day!'
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': 'cb92ecc5-0899-41f8-84a4-4ff329907512'
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    const expectedResponse = new RichResponse()
      .addSimpleResponse('Simple response one')
      .addBasicCard(new BasicCard()
        .setBodyText('my text'))
      .addSuggestions('suggestion one')
      .addSuggestionLink('google', 'google.com');

    expect(app.getIncomingRichResponse()).to
      .deep.equal(JSON.parse(JSON.stringify(expectedResponse)));
  });
});

/**
 * Describes the behavior for ApiAiApp getIncomingList method.
 */
describe('ApiAiApp#getIncomingList', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should get the incoming list for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json'
    };
    let body = {
      'id': 'db2c39ce-1755-4163-a8df-ea033d713dbb',
      'timestamp': '2017-04-21T22:15:25.611Z',
      'lang': 'en',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'hi',
        'action': 'input.welcome',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [],
        'metadata': {
          'intentId': '784690f8-8d87-4f0d-a40f-3e6c99ecd1e0',
          'webhookUsed': 'false',
          'webhookForSlotFillingUsed': 'false',
          'intentName': 'Default Welcome Intent'
        },
        'fulfillment': {
          'speech': 'Hi!',
          'messages': [
            {
              'type': 'simple_response',
              'platform': 'google',
              'textToSpeech': 'Check out these options'
            },
            {
              'type': 'list_card',
              'platform': 'google',
              'title': 'list_title',
              'items': [
                {
                  'optionInfo': {
                    'key': 'first_item',
                    'synonyms': []
                  },
                  'title': 'first item'
                },
                {
                  'optionInfo': {
                    'key': 'second_item',
                    'synonyms': []
                  },
                  'title': 'second item'
                }
              ]
            },
            {
              'type': 0,
              'speech': 'unused'
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': 'cb92ecc5-0899-41f8-84a4-4ff329907512'
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    const expectedResponse = new List()
      .setTitle('list_title')
      .addItems([
        new OptionItem().setTitle('first item').setKey('first_item'),
        new OptionItem().setTitle('second item').setKey('second_item')
      ]);

    expect(app.getIncomingList()).to
      .deep.equal(JSON.parse(JSON.stringify(expectedResponse)));
  });
});

/**
 * Describes the behavior for ApiAiApp getIncomingCarousel method.
 */
describe('ApiAiApp#getIncomingCarousel', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should get the incoming list for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json'
    };
    let body = {
      'id': 'db2c39ce-1755-4163-a8df-ea033d713dbb',
      'timestamp': '2017-04-21T22:15:25.611Z',
      'lang': 'en',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'hi',
        'action': 'input.welcome',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [],
        'metadata': {
          'intentId': '784690f8-8d87-4f0d-a40f-3e6c99ecd1e0',
          'webhookUsed': 'false',
          'webhookForSlotFillingUsed': 'false',
          'intentName': 'Default Welcome Intent'
        },
        'fulfillment': {
          'speech': 'Hi!',
          'messages': [
            {
              'type': 'simple_response',
              'platform': 'google',
              'textToSpeech': 'Check out these options'
            },
            {
              'type': 'carousel_card',
              'platform': 'google',
              'items': [
                {
                  'optionInfo': {
                    'key': 'first_item',
                    'synonyms': []
                  },
                  'title': 'first item',
                  'description': 'Your first choice'
                },
                {
                  'optionInfo': {
                    'key': 'second_item',
                    'synonyms': []
                  },
                  'title': 'second item',
                  'description': 'Your second choice'
                }
              ]
            },
            {
              'type': 0,
              'speech': 'unused'
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': 'cb92ecc5-0899-41f8-84a4-4ff329907512'
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    const expectedResponse = new Carousel()
      .addItems([
        new OptionItem().setTitle('first item').setKey('first_item')
          .setDescription('Your first choice'),
        new OptionItem().setTitle('second item').setKey('second_item')
        .setDescription('Your second choice')
      ]);

    expect(app.getIncomingCarousel()).to
      .deep.equal(JSON.parse(JSON.stringify(expectedResponse)));
  });
});

/**
 * Describes the behavior for ApiAiApp getSelectedOption method.
 */
describe('ApiAiApp#getSelectedOption', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should get the selected option when given in APIAI context.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'originalRequest': {
        'source': 'google',
        'data': {
          'inputs': [
            {
              'arguments': [
                {
                  'text_value': 'first_item',
                  'name': 'OPTION'
                }
              ],
              'intent': 'actions.intent.OPTION',
              'raw_inputs': [
                {
                  'query': 'firstitem',
                  'input_type': 2,
                  'annotation_sets': []
                }
              ]
            }
          ]
        }
      },
      'id': 'db2c39ce-1755-4163-a8df-ea033d713dbb',
      'timestamp': '2017-04-21T22:15:25.611Z',
      'lang': 'en',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'hi',
        'action': 'input.welcome',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [
          {
            'name': 'actions_intent_option',
            'parameters': {
              'OPTION': 'first_item'
            },
            'lifespan': 0
          }
        ],
        'metadata': {
          'intentId': '784690f8-8d87-4f0d-a40f-3e6c99ecd1e0',
          'webhookUsed': 'false',
          'webhookForSlotFillingUsed': 'false',
          'intentName': 'Default Welcome Intent'
        },
        'fulfillment': {
          'speech': 'Hi!',
          'messages': [
            {
              'type': 0,
              'speech': 'unused'
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': 'cb92ecc5-0899-41f8-84a4-4ff329907512'
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getSelectedOption()).to.equal('first_item');
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should get the selected option when not given in APIAI context.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'originalRequest': {
        'source': 'google',
        'data': {
          'inputs': [
            {
              'arguments': [
                {
                  'text_value': 'first_item',
                  'name': 'OPTION'
                }
              ],
              'intent': 'actions.intent.OPTION',
              'raw_inputs': [
                {
                  'query': 'firstitem',
                  'input_type': 2,
                  'annotation_sets': []
                }
              ]
            }
          ]
        }
      },
      'id': 'db2c39ce-1755-4163-a8df-ea033d713dbb',
      'timestamp': '2017-04-21T22:15:25.611Z',
      'lang': 'en',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'hi',
        'action': 'input.welcome',
        'actionIncomplete': false,
        'parameters': {},
        'contexts': [],
        'metadata': {
          'intentId': '784690f8-8d87-4f0d-a40f-3e6c99ecd1e0',
          'webhookUsed': 'false',
          'webhookForSlotFillingUsed': 'false',
          'intentName': 'Default Welcome Intent'
        },
        'fulfillment': {
          'speech': 'Hi!',
          'messages': [
            {
              'type': 0,
              'speech': 'unused'
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': 'cb92ecc5-0899-41f8-84a4-4ff329907512'
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getSelectedOption()).to.equal('first_item');
  });
});

/**
 * Describes the behavior for ApiAiApp isRequestFromApiAi method.
 */
describe('ApiAiApp#isRequestFromApiAi', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should confirm request is from API.ai.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1',
      'Google-Assistant-Signature': 'YOUR_PRIVATE_KEY'
    };
    let body = {
      'id': '93ada919-582d-4694-a965-4278453a6503',
      'timestamp': '2016-12-01T17:36:16.886Z',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'talk to action snippets',
        'speech': '',
        'action': 'input.welcome',
        'actionIncomplete': false,
        'parameters': {

        },
        'contexts': [
          {
            'name': 'number',
            'lifespan': 5
          },
          {
            'name': '_actions_on_google_',
            'lifespan': 99
          }
        ],
        'metadata': {
          'intentId': '1b1f35cb-ef66-41c4-9703-89446c00cfe8',
          'webhookUsed': 'true',
          'webhookForSlotFillingUsed': 'false',
          'intentName': 'Default Welcome Intent'
        },
        'fulfillment': {
          'speech': 'Good day!',
          'messages': [
            {
              'type': 0,
              'speech': 'Hello!'
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': 'f23e77a5-8b09-495d-b9b3-6835d737abf3',
      'originalRequest': {
        'data': {
          'conversation': {
            'type': 2
          }
        }
      }
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    const HEADER_KEY = 'Google-Assistant-Signature';
    const HEADER_VALUE = 'YOUR_PRIVATE_KEY';

    expect(app.isRequestFromApiAi(HEADER_KEY, HEADER_VALUE)).to.equal(true);
  });
});

/**
 * Describes the behavior for ApiAiApp isRequestFromApiAi method.
 */
describe('ApiAiApp#isRequestFromApiAi', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should confirm request is NOT from API.ai.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
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
      ],
      'originalRequest': {
        'data': {
          'conversation': {
            'type': 2
          }
        }
      }
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    const HEADER_KEY = 'Google-Assistant-Signature';
    const HEADER_VALUE = 'YOUR_PRIVATE_KEY';

    expect(app.isRequestFromApiAi(HEADER_KEY, HEADER_VALUE)).to.equal(false);
  });
});

/**
 * Describes the behavior for ApiAiApp hasSurfaceCapability method.
 */
describe('ApiAiApp#hasSurfaceCapability', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return true for a valid capability from incoming JSON for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'id': '4bef6e67-c09d-4a43-ae7b-97c4457582c7',
      'timestamp': '2016-12-01T19:27:58.837Z',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'talk to action snippets',
        'speech': '',
        'action': 'input.welcome',
        'actionIncomplete': false,
        'parameters': {

        },
        'contexts': [

        ],
        'metadata': {
          'intentId': '1b1f35cb-ef66-41c4-9703-89446c00cfe8',
          'webhookUsed': 'true',
          'webhookForSlotFillingUsed': 'false',
          'intentName': 'Default Welcome Intent'
        },
        'fulfillment': {
          'speech': 'Good day!',
          'messages': [
            {
              'type': 0,
              'speech': 'Hi!'
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': 'f23e77a5-8b09-495d-b9b3-6835d737abf3',
      'originalRequest': {
        'data': {
          'surface': {
            'capabilities': [
              {
                'name': 'actions.capability.AUDIO_OUTPUT'
              },
              {
                'name': 'actions.capability.SCREEN_OUTPUT'
              }
            ]
          },
          'inputs': [
            {
              'raw_inputs': [
                {
                  'query': 'basic card',
                  'input_type': 3,
                  'annotation_sets': []
                }
              ]
            }
          ],
          'conversation': {
            'type': 2
          }
        }
      }
    };

    let mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    let hasScreenOutput =
      app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT);
    let hasMagicPowers =
      app.hasSurfaceCapability('MAGIC_POWERS');
    expect(hasScreenOutput).to.be.true;
    expect(hasMagicPowers).to.be.false;
  });
});

/**
 * Describes the behavior for ApiAiApp getSurfaceCapabilities method.
 */
describe('ApiAiApp#getSurfaceCapabilities', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid list of capabilities from incoming JSON for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'id': '4bef6e67-c09d-4a43-ae7b-97c4457582c7',
      'timestamp': '2016-12-01T19:27:58.837Z',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'talk to action snippets',
        'speech': '',
        'action': 'input.welcome',
        'actionIncomplete': false,
        'parameters': {

        },
        'contexts': [

        ],
        'metadata': {
          'intentId': '1b1f35cb-ef66-41c4-9703-89446c00cfe8',
          'webhookUsed': 'true',
          'webhookForSlotFillingUsed': 'false',
          'intentName': 'Default Welcome Intent'
        },
        'fulfillment': {
          'speech': 'Good day!',
          'messages': [
            {
              'type': 0,
              'speech': 'Hi!'
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': 'f23e77a5-8b09-495d-b9b3-6835d737abf3',
      'originalRequest': {
        'data': {
          'surface': {
            'capabilities': [
              {
                'name': 'actions.capability.AUDIO_OUTPUT'
              },
              {
                'name': 'actions.capability.SCREEN_OUTPUT'
              }
            ]
          },
          'inputs': [
            {
              'raw_inputs': [
                {
                  'query': 'basic card',
                  'input_type': 3,
                  'annotation_sets': []
                }
              ]
            }
          ],
          'conversation': {
            'type': 2
          }
        }
      }
    };

    let mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    let capabilities = app.getSurfaceCapabilities();
    expect(capabilities).to.deep.equal([
      app.SurfaceCapabilities.AUDIO_OUTPUT,
      app.SurfaceCapabilities.SCREEN_OUTPUT
    ]);
  });
});

/**
 * Describes the behavior for ApiAiApp getInputType method.
 */
describe('ApiAiApp#getInputType', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid input type from incoming JSON for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'id': '4bef6e67-c09d-4a43-ae7b-97c4457582c7',
      'timestamp': '2016-12-01T19:27:58.837Z',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'talk to action snippets',
        'speech': '',
        'action': 'input.welcome',
        'actionIncomplete': false,
        'parameters': {

        },
        'contexts': [

        ],
        'metadata': {
          'intentId': '1b1f35cb-ef66-41c4-9703-89446c00cfe8',
          'webhookUsed': 'true',
          'webhookForSlotFillingUsed': 'false',
          'intentName': 'Default Welcome Intent'
        },
        'fulfillment': {
          'speech': 'Good day!',
          'messages': [
            {
              'type': 0,
              'speech': 'Hi!'
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': 'f23e77a5-8b09-495d-b9b3-6835d737abf3',
      'originalRequest': {
        'data': {
          'inputs': [
            {
              'raw_inputs': [
                {
                  'input_type': 3
                }
              ]
            }
          ],
          'conversation': {
            'type': 2
          }
        }
      }
    };

    let mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    let inputType = app.getInputType();
    expect(inputType).to.equal(app.InputTypes.KEYBOARD);
  });
});

/**
 * Describes the behavior for ApiAiApp getRawInput method.
 */
describe('ApiAiApp#getRawInput', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should raw input from API.ai.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1',
      'Google-Assistant-Signature': 'YOUR_PRIVATE_KEY'
    };
    let body = {
      'id': 'fdeca0bc-264a-4152-81fe-7d3c3d92bdfb',
      'timestamp': '2016-12-01T19:02:49.021Z',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'is it 667',
        'speech': '',
        'action': 'input.number',
        'actionIncomplete': false,
        'parameters': {
          'number': '667'
        },
        'contexts': [
          {
            'name': 'number',
            'parameters': {
              'number': '667',
              'number.original': '667'
            },
            'lifespan': 5
          },
          {
            'name': '_actions_on_google_',
            'parameters': {
              'number': '667',
              'number.original': '667'
            },
            'lifespan': 99
          }
        ],
        'metadata': {
          'intentId': '18ac04d6-9e5d-43ae-ab46-7b51a8658746',
          'webhookUsed': 'true',
          'webhookForSlotFillingUsed': 'false',
          'intentName': 'number_intent'
        },
        'fulfillment': {
          'speech': '',
          'messages': [
            {
              'type': 0,
              'speech': ''
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': 'f23e77a5-8b09-495d-b9b3-6835d737abf3',
      'originalRequest': {
        'data': {
          'conversation': {
            'type': 2
          }
        }
      }
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getRawInput()).to.equal('is it 667');
  });
});

/**
 * Describes the behavior for ApiAiApp setContext method.
 */
describe('ApiAiApp#setContext', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid JSON in the response object for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'id': '4bef6e67-c09d-4a43-ae7b-97c4457582c7',
      'timestamp': '2016-12-01T19:27:58.837Z',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'talk to action snippets',
        'speech': '',
        'action': 'input.welcome',
        'actionIncomplete': false,
        'parameters': {

        },
        'contexts': [
          {
            'name': 'number',
            'lifespan': 5
          }
        ],
        'metadata': {
          'intentId': '1b1f35cb-ef66-41c4-9703-89446c00cfe8',
          'webhookUsed': 'true',
          'webhookForSlotFillingUsed': 'false',
          'intentName': 'Default Welcome Intent'
        },
        'fulfillment': {
          'speech': 'Good day!',
          'messages': [
            {
              'type': 0,
              'speech': 'Hi!'
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': 'f23e77a5-8b09-495d-b9b3-6835d737abf3',
      'originalRequest': {
        'data': {
          'conversation': {
            'type': 2
          }
        }
      }
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    const CONTEXT_NUMBER = 'number';

    function handler (app) {
      app.setContext(CONTEXT_NUMBER);
      app.ask('Welcome to action snippets! Say a number.');
    }

    let actionMap = new Map();
    actionMap.set('input.welcome', handler);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'speech': 'Welcome to action snippets! Say a number.',
      'data': {
        'google': {
          'expect_user_response': true,
          'is_ssml': false,
          'no_input_prompts': [

          ]
        }
      },
      'contextOut': [
        {
          'name': '_actions_on_google_',
          'lifespan': 100,
          'parameters': {

          }
        },
        {
          'name': 'number',
          'lifespan': 1
        }
      ]
    };
    expect(mockResponse.body).to.deep.equal(expectedResponse);
  });
});

/**
 * Describes the behavior for ApiAiApp getContexts method.
 */
describe('ApiAiApp#getContexts', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the active contexts from incoming JSON for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'id': '4bef6e67-c09d-4a43-ae7b-97c4457582c7',
      'timestamp': '2016-12-01T19:27:58.837Z',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'talk to action snippets',
        'speech': '',
        'action': 'input.welcome',
        'actionIncomplete': false,
        'parameters': {

        },
        'contexts': [
          {
            'name': '_actions_on_google_'
          },
          {
            'name': 'number',
            'lifespan': 5,
            'parameters': {
              'parameterOne': '23',
              'parameterTwo': '24'
            }
          },
          {
            'name': 'word',
            'lifespan': 1,
            'parameters': {
              'parameterOne': 'wordOne',
              'parameterTwo': 'wordTwo'
            }
          }
        ],
        'metadata': {
          'intentId': '1b1f35cb-ef66-41c4-9703-89446c00cfe8',
          'webhookUsed': 'true',
          'webhookForSlotFillingUsed': 'false',
          'intentName': 'Default Welcome Intent'
        },
        'fulfillment': {
          'speech': 'Good day!',
          'messages': [
            {
              'type': 0,
              'speech': 'Hi!'
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': 'f23e77a5-8b09-495d-b9b3-6835d737abf3',
      'originalRequest': {
        'data': {
          'conversation': {
            'type': 2
          }
        }
      }
    };
    let mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    let mockContexts = app.getContexts();

    let expectedContexts = [
      {
        'name': 'number',
        'lifespan': 5,
        'parameters': {
          'parameterOne': '23',
          'parameterTwo': '24'
        }
      },
      {
        'name': 'word',
        'lifespan': 1,
        'parameters': {
          'parameterOne': 'wordOne',
          'parameterTwo': 'wordTwo'
        }
      }
    ];
    expect(mockContexts).to.deep.equal(expectedContexts);

    // Check the case with only app.data incoming
    body.result.contexts = [ { 'name': '_actions_on_google_' } ];
    mockRequest = new MockRequest(headers, body);

    app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });
    mockContexts = app.getContexts();
    expectedContexts = [];
    expect(mockContexts).to.deep.equal(expectedContexts);

    // Check the empty case
    body.result.contexts = [];
    mockRequest = new MockRequest(headers, body);

    app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });
    mockContexts = app.getContexts();
    expectedContexts = [];
    expect(mockContexts).to.deep.equal(expectedContexts);
  });
});

/**
 * Describes the behavior for ApiAiApp getContext method.
 */
describe('ApiAiApp#getContext', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the context by name from incoming JSON for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'id': '4bef6e67-c09d-4a43-ae7b-97c4457582c7',
      'timestamp': '2016-12-01T19:27:58.837Z',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'talk to action snippets',
        'speech': '',
        'action': 'input.welcome',
        'actionIncomplete': false,
        'parameters': {

        },
        'contexts': [
          {
            'name': '_actions_on_google_'
          },
          {
            'name': 'number',
            'lifespan': 5,
            'parameters': {
              'parameterOne': '23',
              'parameterTwo': '24'
            }
          },
          {
            'name': 'word',
            'lifespan': 1,
            'parameters': {
              'parameterOne': 'wordOne',
              'parameterTwo': 'wordTwo'
            }
          }
        ],
        'metadata': {
          'intentId': '1b1f35cb-ef66-41c4-9703-89446c00cfe8',
          'webhookUsed': 'true',
          'webhookForSlotFillingUsed': 'false',
          'intentName': 'Default Welcome Intent'
        },
        'fulfillment': {
          'speech': 'Good day!',
          'messages': [
            {
              'type': 0,
              'speech': 'Hi!'
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': 'f23e77a5-8b09-495d-b9b3-6835d737abf3',
      'originalRequest': {
        'data': {
          'conversation': {
            'type': 2
          }
        }
      }
    };
    let mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    let mockContext = app.getContext('number');

    let expectedContext = {
      'name': 'number',
      'lifespan': 5,
      'parameters': {
        'parameterOne': '23',
        'parameterTwo': '24'
      }
    };
    expect(mockContext).to.deep.equal(expectedContext);

    //  Check the empty case
    body.result.contexts = [];
    mockRequest = new MockRequest(headers, body);

    app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });
    mockContext = app.getContext('name');
    expectedContext = null;
    expect(mockContext).to.equal(expectedContext);
  });
});

/**
 * Describes the behavior for ApiAiApp ask with no inputs method.
 */
describe('ApiAiApp#ask', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid JSON in the response object for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'id': '2a8b7faa-29c0-4ccf-a973-726f9eaf3e2c',
      'timestamp': '2016-12-04T18:34:31.218Z',
      'result': {
        'source': 'agent',
        'resolvedQuery': 'talk to action snippets',
        'speech': '',
        'action': 'input.welcome',
        'actionIncomplete': false,
        'parameters': {

        },
        'contexts': [
          {
            'name': 'number',
            'parameters': {

            },
            'lifespan': 5
          },
          {
            'name': '_actions_on_google_',
            'parameters': {

            },
            'lifespan': 99
          }
        ],
        'metadata': {
          'intentId': '1b1f35cb-ef66-41c4-9703-89446c00cfe8',
          'webhookUsed': 'true',
          'webhookForSlotFillingUsed': 'false',
          'intentName': 'Default Welcome Intent'
        },
        'fulfillment': {
          'speech': 'Hello!',
          'messages': [
            {
              'type': 0,
              'speech': 'Hello!'
            }
          ]
        },
        'score': 1
      },
      'status': {
        'code': 200,
        'errorType': 'success'
      },
      'sessionId': 'f23e77a5-8b09-495d-b9b3-6835d737abf3',
      'originalRequest': {
        'data': {
          'conversation': {
            'type': 2
          }
        }
      }
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    function handler (app) {
      app.ask('Welcome to action snippets! Say a number.',
        ['Say any number', 'Pick a number', 'What is the number?']);
    }

    let actionMap = new Map();
    actionMap.set('input.welcome', handler);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'speech': 'Welcome to action snippets! Say a number.',
      'data': {
        'google': {
          'expect_user_response': true,
          'is_ssml': false,
          'no_input_prompts': [
            {
              'text_to_speech': 'Say any number'
            },
            {
              'text_to_speech': 'Pick a number'
            },
            {
              'text_to_speech': 'What is the number?'
            }
          ]
        }
      },
      'contextOut': [
        {
          'name': '_actions_on_google_',
          'lifespan': 100,
          'parameters': {

          }
        }
      ]
    };
    expect(mockResponse.body).to.deep.equal(expectedResponse);
  });
});

// ---------------------------------------------------------------------------
//                   Actions SDK support
// ---------------------------------------------------------------------------

/**
 * Describes the behavior for ApiAiApp constructor method.
 */
describe('ActionsSdkApp#constructor', function () {
  // Calls sessionStarted when provided
  it('Calls sessionStarted when new session', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
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
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const sessionStartedSpy = chai.spy();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse,
      sessionStarted: sessionStartedSpy
    });

    app.handleRequest();

    expect(sessionStartedSpy).to.have.been.called();
  });

  // Does not call sessionStarted when not new session
  it('Does not call sessionStarted when not new session ', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
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
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const sessionStartedSpy = chai.spy();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse,
      sessionStarted: sessionStartedSpy
    });

    app.handleRequest();

    expect(sessionStartedSpy).to.not.have.been.called();
  });

  // Does transform to Proto3
  it('Does not detect v2 and transform body when version not present', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
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
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    app.handleRequest();

    expect(app.body_).to.deep.equal({
      'user': {
        'userId': '11112226094657824893'
      },
      'conversation': {
        'conversationId': '1480373842830',
        'type': 2
      },
      'inputs': [
        {
          'intent': 'assistant.intent.action.MAIN',
          'rawInputs': [
            {
              'inputType': 2,
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
    });
  });

  // Does not transform to Proto3
  it('Does detect v2 and not transform body when version is present', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
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
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    app.handleRequest();

    expect(app.body_).to.deep.equal(body);
  });
});

/**
 * Describes the behavior for ActionsSdkApp ask method.
 */
describe('ActionsSdkApp#ask', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid JSON in the response object for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
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
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    function handler (app) {
      let inputPrompt = app.buildInputPrompt(true, '<speak>Hi! <break time="1"/> ' +
          'I can read out an ordinal like ' +
          '<say-as interpret-as="ordinal">123</say-as>. Say a number.</speak>',
          ['I didn\'t hear a number', 'If you\'re still there, what\'s the number?', 'What is the number?']);
      app.ask(inputPrompt);
    }

    let actionMap = new Map();
    actionMap.set(app.StandardIntents.MAIN, handler);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'conversation_token': '{"state":null,"data":{}}',
      'expect_user_response': true,
      'expected_inputs': [
        {
          'input_prompt': {
            'initial_prompts': [
              {
                'ssml': '<speak>Hi! <break time="1"/> I can read out an ordinal like <say-as interpret-as="ordinal">123</say-as>. Say a number.</speak>'
              }
            ],
            'no_input_prompts': [
              {
                'ssml': 'I didn\'t hear a number'
              },
              {
                'ssml': 'If you\'re still there, what\'s the number?'
              },
              {
                'ssml': 'What is the number?'
              }
            ]
          },
          'possible_intents': [
            {
              'intent': 'assistant.intent.action.TEXT'
            }
          ]
        }
      ]
    };
    expect(mockResponse.body).to.deep.equal(expectedResponse);
  });
});

/**
 * Describes the behavior for ActionsSdkApp ask method with function handler.
 */
describe('ActionsSdkApp#ask', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid JSON in the response object for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
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
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    function handler (app) {
      let inputPrompt = app.buildInputPrompt(true, '<speak>Hi! <break time="1"/> ' +
          'I can read out an ordinal like ' +
          '<say-as interpret-as="ordinal">123</say-as>. Say a number.</speak>',
          ['I didn\'t hear a number', 'If you\'re still there, what\'s the number?', 'What is the number?']);
      app.ask(inputPrompt);
    }

    let actionMap = new Map();
    actionMap.set(app.StandardIntents.MAIN, handler);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'conversation_token': '{"state":null,"data":{}}',
      'expect_user_response': true,
      'expected_inputs': [
        {
          'input_prompt': {
            'initial_prompts': [
              {
                'ssml': '<speak>Hi! <break time="1"/> I can read out an ordinal like <say-as interpret-as="ordinal">123</say-as>. Say a number.</speak>'
              }
            ],
            'no_input_prompts': [
              {
                'ssml': 'I didn\'t hear a number'
              },
              {
                'ssml': 'If you\'re still there, what\'s the number?'
              },
              {
                'ssml': 'What is the number?'
              }
            ]
          },
          'possible_intents': [
            {
              'intent': 'assistant.intent.action.TEXT'
            }
          ]
        }
      ]
    };
    expect(mockResponse.body).to.deep.equal(expectedResponse);
  });
});

/**
 * Describes the behavior for ActionsSdkApp tell method.
 */
describe('ActionsSdkApp#tell', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid JSON in the response object for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
      },
      'conversation': {
        'conversation_id': '1480389944033',
        'type': 2,
        'conversation_token': '{"state":null,"data":{"state":null,"data":{}}}'
      },
      'inputs': [
        {
          'intent': 'assistant.intent.action.MAIN',
          'raw_inputs': [
            {
              'input_type': 2,
              'query': 'bye'
            }
          ],
          'arguments': [
            {
              'name': 'raw_text',
              'raw_text': 'bye',
              'text_value': 'bye'
            }
          ]
        }
      ]
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    function handler (app) {
      return new Promise(function (resolve, reject) {
        resolve(app.tell('Goodbye!'));
      });
    }

    let actionMap = new Map();
    actionMap.set(app.StandardIntents.MAIN, handler);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'expect_user_response': false,
      'final_response': {
        'speech_response': {
          'text_to_speech': 'Goodbye!'
        }
      }
    };
    expect(mockResponse.body).to.deep.equal(expectedResponse);
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid simple response JSON in the response object for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
      },
      'conversation': {
        'conversation_id': '1480389944033',
        'type': 2,
        'conversation_token': '{"state":null,"data":{"state":null,"data":{}}}'
      },
      'inputs': [
        {
          'intent': 'assistant.intent.action.MAIN',
          'raw_inputs': [
            {
              'input_type': 2,
              'query': 'bye'
            }
          ],
          'arguments': [
            {
              'name': 'raw_text',
              'raw_text': 'bye',
              'text_value': 'bye'
            }
          ]
        }
      ]
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    function handler (app) {
      return new Promise(function (resolve, reject) {
        resolve(app.tell({ speech: 'hello', displayText: 'hi' }));
      });
    }

    let actionMap = new Map();
    actionMap.set('assistant.intent.action.MAIN', handler);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'expect_user_response': false,
      'final_response': {
        'rich_response': {
          'items': [
            {
              'simple_response': {
                'text_to_speech': 'hello',
                'display_text': 'hi'
              }
            }
          ],
          'suggestions': []
        }
      }
    };
    expect(JSON.parse(JSON.stringify(mockResponse.body)))
      .to.deep.equal(expectedResponse);
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid rich response JSON in the response object for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
      },
      'conversation': {
        'conversation_id': '1480389944033',
        'type': 2,
        'conversation_token': '{"state":null,"data":{"state":null,"data":{}}}'
      },
      'inputs': [
        {
          'intent': 'assistant.intent.action.MAIN',
          'raw_inputs': [
            {
              'input_type': 2,
              'query': 'bye'
            }
          ],
          'arguments': [
            {
              'name': 'raw_text',
              'raw_text': 'bye',
              'text_value': 'bye'
            }
          ]
        }
      ]
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    function handler (app) {
      return new Promise(function (resolve, reject) {
        resolve(app.tell(app.buildRichResponse()
          .addSimpleResponse({ speech: 'hello', displayText: 'hi' })
          .addSuggestions(['Say this', 'or this'])));
      });
    }

    let actionMap = new Map();
    actionMap.set('assistant.intent.action.MAIN', handler);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'expect_user_response': false,
      'final_response': {
        'rich_response': {
          'items': [
            {
              'simple_response': {
                'text_to_speech': 'hello',
                'display_text': 'hi'
              }
            }
          ],
          'suggestions': [
            {
              'title': 'Say this'
            },
            {
              'title': 'or this'
            }
          ]
        }
      }
    };
    expect(JSON.parse(JSON.stringify(mockResponse.body)))
      .to.deep.equal(expectedResponse);
  });

  // Failure test, when the API returns a 400 response with the response object
  it('Should send failure response for rich response without simple response', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
      },
      'conversation': {
        'conversation_id': '1480389944033',
        'type': 2,
        'conversation_token': '{"state":null,"data":{"state":null,"data":{}}}'
      },
      'inputs': [
        {
          'intent': 'assistant.intent.action.MAIN',
          'raw_inputs': [
            {
              'input_type': 2,
              'query': 'bye'
            }
          ],
          'arguments': [
            {
              'name': 'raw_text',
              'raw_text': 'bye',
              'text_value': 'bye'
            }
          ]
        }
      ]
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    function handler (app) {
      return new Promise(function (resolve, reject) {
        resolve(app.tell(app.buildRichResponse()));
      });
    }

    let actionMap = new Map();
    actionMap.set('check_guess', handler);

    app.handleRequest(actionMap);

    expect(mockResponse.statusCode).to.equal(400);
  });
});

/**
 * Describes the behavior for ActionsSdkApp getRawInput method.
 */
describe('ActionsSdkApp#getRawInput', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should get the raw user input for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
      },
      'conversation': {
        'conversation_id': '1480389944033',
        'type': 2,
        'conversation_token': '{"state":null,"data":{"state":null,"data":{}}}'
      },
      'inputs': [
        {
          'intent': 'assistant.intent.action.TEXT',
          'raw_inputs': [
            {
              'input_type': 2,
              'query': 'bye'
            }
          ],
          'arguments': [
            {
              'name': 'raw_text',
              'raw_text': 'bye',
              'text_value': 'bye'
            }
          ]
        }
      ]
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getRawInput()).to.equal('bye');
  });

  // Test a change made for backwards compatibility with legacy sample code
  it('Does initialize StandardIntents without an options object', function () {
    const app = new ActionsSdkApp();

    expect(app.StandardIntents.MAIN).to.equal('assistant.intent.action.MAIN');
    expect(app.StandardIntents.TEXT).to.equal('assistant.intent.action.TEXT');
    expect(app.StandardIntents.PERMISSION).to
      .equal('assistant.intent.action.PERMISSION');
  });
});

/**
 * Describes the behavior for ActionsSdkApp askForText method.
 */
describe('ActionsSdkApp#askForText', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid JSON in the response object for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
      },
      'conversation': {
        'conversation_id': '1480463613280',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'assistant.intent.action.MAIN',
          'raw_inputs': [
            {
              'input_type': 2,
              'query': 'talk to action snippets'
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
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    function handler (app) {
      return new Promise(function (resolve, reject) {
        resolve(app.ask('What can I help you with?'));
      });
    }

    let actionMap = new Map();
    actionMap.set(app.StandardIntents.MAIN, handler);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'conversation_token': '{"state":null,"data":{}}',
      'expect_user_response': true,
      'expected_inputs': [
        {
          'input_prompt': {
            'initial_prompts': [
              {
                'text_to_speech': 'What can I help you with?'
              }
            ],
            'no_input_prompts': [

            ]
          },
          'possible_intents': [
            {
              'intent': 'assistant.intent.action.TEXT'
            }
          ]
        }
      ]
    };
    expect(mockResponse.body).to.deep.equal(expectedResponse);
  });
});

/**
 * Describes the behavior for ActionsSdkApp askForText method with SSML.
 */
describe('ActionsSdkApp#askForText', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid JSON in the response object for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
      },
      'conversation': {
        'conversation_id': '1480464628054',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'assistant.intent.action.MAIN',
          'raw_inputs': [
            {
              'input_type': 2,
              'query': 'talk to action snippets'
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
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    function handler (app) {
      return new Promise(function (resolve, reject) {
        resolve(app.ask('<speak>What <break time="1"/> can I help you with?</speak>'));
      });
    }

    let actionMap = new Map();
    actionMap.set(app.StandardIntents.MAIN, handler);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'conversation_token': '{"state":null,"data":{}}',
      'expect_user_response': true,
      'expected_inputs': [
        {
          'input_prompt': {
            'initial_prompts': [
              {
                'ssml': '<speak>What <break time="1"/> can I help you with?</speak>'
              }
            ],
            'no_input_prompts': [

            ]
          },
          'possible_intents': [
            {
              'intent': 'assistant.intent.action.TEXT'
            }
          ]
        }
      ]
    };
    expect(mockResponse.body).to.deep.equal(expectedResponse);
  });
});

/**
 * Describes the behavior for ActionsSdkApp ask (advanced usage) method.
 */
describe('ActionsSdkApp#ask', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid JSON in the response object for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {

      },
      'conversation': {
        'conversation_id': '1480528109466',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'assistant.intent.action.MAIN',
          'raw_inputs': [
            {
              'input_type': 2,
              'query': 'talk to action snippets'
            }
          ],
          'arguments': [

          ]
        }
      ]
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    function handler (app) {
      return new Promise(function (resolve, reject) {
        let inputPrompt = app.buildInputPrompt(false, 'Welcome to action snippets! Say a number.',
          ['Say any number', 'Pick a number', 'What is the number?']);
        resolve(app.ask(inputPrompt));
      });
    }

    let actionMap = new Map();
    actionMap.set(app.StandardIntents.MAIN, handler);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'conversation_token': '{"state":null,"data":{}}',
      'expect_user_response': true,
      'expected_inputs': [
        {
          'input_prompt': {
            'initial_prompts': [
              {
                'text_to_speech': 'Welcome to action snippets! Say a number.'
              }
            ],
            'no_input_prompts': [
              {
                'text_to_speech': 'Say any number'
              },
              {
                'text_to_speech': 'Pick a number'
              },
              {
                'text_to_speech': 'What is the number?'
              }
            ]
          },
          'possible_intents': [
            {
              'intent': 'assistant.intent.action.TEXT'
            }
          ]
        }
      ]
    };
    expect(JSON.stringify(mockResponse.body)).to.equal(JSON.stringify(expectedResponse));
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid simple response JSON in the response object for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
      },
      'conversation': {
        'conversation_id': '1480389944033',
        'type': 2,
        'conversation_token': '{"state":null,"data":{}}'
      },
      'inputs': [
        {
          'intent': 'assistant.intent.action.MAIN',
          'raw_inputs': [
            {
              'input_type': 2,
              'query': 'bye'
            }
          ],
          'arguments': [
            {
              'name': 'raw_text',
              'raw_text': 'bye',
              'text_value': 'bye'
            }
          ]
        }
      ]
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    function handler (app) {
      return new Promise(function (resolve, reject) {
        resolve(app.ask({ speech: 'hello', displayText: 'hi' }));
      });
    }

    let actionMap = new Map();
    actionMap.set('assistant.intent.action.MAIN', handler);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'conversation_token': '{"state":null,"data":{}}',
      'expect_user_response': true,
      'expected_inputs': [
        {
          'input_prompt': {
            'rich_initial_prompt': {
              'items': [
                {
                  'simple_response': {
                    'text_to_speech': 'hello',
                    'display_text': 'hi'
                  }
                }
              ],
              'suggestions': []
            }
          },
          'possible_intents': [
            {
              'intent': 'assistant.intent.action.TEXT'
            }
          ]
        }
      ]
    };
    expect(JSON.parse(JSON.stringify(mockResponse.body)))
      .to.deep.equal(expectedResponse);
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid rich response JSON in the response object for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
      },
      'conversation': {
        'conversation_id': '1480389944033',
        'type': 2,
        'conversation_token': '{"state":null,"data":{}}'
      },
      'inputs': [
        {
          'intent': 'assistant.intent.action.MAIN',
          'raw_inputs': [
            {
              'input_type': 2,
              'query': 'bye'
            }
          ],
          'arguments': [
            {
              'name': 'raw_text',
              'raw_text': 'bye',
              'text_value': 'bye'
            }
          ]
        }
      ]
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    function handler (app) {
      return new Promise(function (resolve, reject) {
        resolve(app.ask(app.buildRichResponse()
          .addSimpleResponse({ speech: 'hello', displayText: 'hi' })
          .addSuggestions(['Say this', 'or this'])));
      });
    }

    let actionMap = new Map();
    actionMap.set('assistant.intent.action.MAIN', handler);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'conversation_token': '{"state":null,"data":{}}',
      'expect_user_response': true,
      'expected_inputs': [
        {
          'input_prompt': {
            'rich_initial_prompt': {
              'items': [
                {
                  'simple_response': {
                    'text_to_speech': 'hello',
                    'display_text': 'hi'
                  }
                }
              ],
              'suggestions': [
                {
                  'title': 'Say this'
                },
                {
                  'title': 'or this'
                }
              ]
            }
          },
          'possible_intents': [
            {
              'intent': 'assistant.intent.action.TEXT'
            }
          ]
        }
      ]
    };
    expect(JSON.parse(JSON.stringify(mockResponse.body)))
      .to.deep.equal(expectedResponse);
  });
});

/**
 * Describes the behavior for ActionsSdkApp askWithList method.
 */
describe('ActionsSdkApp#askWithList', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid list JSON in the response object for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
    let body = {
      'user': {

      },
      'conversation': {
        'conversationId': '1480532856956',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'show_list',
          'rawInputs': [
            {
              'inputType': 2,
              'query': 'show me a list'
            }
          ],
          'arguments': [

          ]
        }
      ]
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    const SHOW_LIST = 'show_list';

    function showList (app) {
      app.askWithList('Here is a list', app.buildList()
        .addItems([
          app.buildOptionItem('key_1', 'key one'),
          app.buildOptionItem('key_2', 'key two')
        ]), {
          optionType: 'list'
        });
    }

    let actionMap = new Map();
    actionMap.set(SHOW_LIST, showList);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'conversationToken': '{"optionType":"list"}',
      'expectUserResponse': true,
      'expectedInputs': [
        {
          'inputPrompt': {
            'initialPrompts': [
              {
                'textToSpeech': 'Here is a list'
              }
            ],
            'noInputPrompts': [
            ]
          },
          'possibleIntents': [
            {
              'intent': 'actions.intent.OPTION',
              'inputValueData': {
                '@type': 'type.googleapis.com/google.actions.v2.OptionValueSpec',
                'listSelect': {
                  'items': [
                    {
                      'optionInfo': {
                        'key': 'key_1',
                        'synonyms': [
                          'key one'
                        ]
                      },
                      'title': ''
                    },
                    {
                      'optionInfo': {
                        'key': 'key_2',
                        'synonyms': [
                          'key two'
                        ]
                      },
                      'title': ''
                    }
                  ]
                }
              }
            }
          ]
        }
      ]
    };

    expect(JSON.stringify(mockResponse.body)).to.equal(JSON.stringify(expectedResponse));
  });

  it('Should return the an error JSON in the response when list has <2 items.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
    let body = {
      'user': {

      },
      'conversation': {
        'conversationId': '1480532856956',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'show_list',
          'rawInputs': [
            {
              'inputType': 2,
              'query': 'show me a list'
            }
          ],
          'arguments': [

          ]
        }
      ]
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    const SHOW_LIST = 'show_list';

    function showList (app) {
      app.askWithList('Here is a list', app.buildList(), {
        optionType: 'list'
      });
    }

    let actionMap = new Map();
    actionMap.set(SHOW_LIST, showList);

    app.handleRequest(actionMap);

    expect(mockResponse.statusCode).to.equal(400);
  });
});

/**
 * Describes the behavior for ActionsSdkApp askWithCarousel method.
 */
describe('ActionsSdkApp#askWithCarousel', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid carousel JSON in the response object for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
    let body = {
      'user': {

      },
      'conversation': {
        'conversationId': '1480532856956',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'show_carousel',
          'rawInputs': [
            {
              'inputType': 2,
              'query': 'show me a carousel'
            }
          ],
          'arguments': [

          ]
        }
      ]
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    const SHOW_CAROUSEL = 'show_carousel';

    function showCarousel (app) {
      app.askWithCarousel('Here is a carousel', app.buildCarousel()
        .addItems([
          app.buildOptionItem('key_1', 'key one'),
          app.buildOptionItem('key_2', 'key two')
        ]), {
          optionType: 'carousel'
        });
    }

    let actionMap = new Map();
    actionMap.set(SHOW_CAROUSEL, showCarousel);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'conversationToken': '{"optionType":"carousel"}',
      'expectUserResponse': true,
      'expectedInputs': [
        {
          'inputPrompt': {
            'initialPrompts': [
              {
                'textToSpeech': 'Here is a carousel'
              }
            ],
            'noInputPrompts': [
            ]
          },
          'possibleIntents': [
            {
              'intent': 'actions.intent.OPTION',
              'inputValueData': {
                '@type': 'type.googleapis.com/google.actions.v2.OptionValueSpec',
                'carouselSelect': {
                  'items': [
                    {
                      'optionInfo': {
                        'key': 'key_1',
                        'synonyms': [
                          'key one'
                        ]
                      },
                      'title': ''
                    },
                    {
                      'optionInfo': {
                        'key': 'key_2',
                        'synonyms': [
                          'key two'
                        ]
                      },
                      'title': ''
                    }
                  ]
                }
              }
            }
          ]
        }
      ]
    };

    expect(JSON.stringify(mockResponse.body)).to.equal(JSON.stringify(expectedResponse));
  });

  it('Should return the an error JSON in the response when carousel has <2 items.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
    let body = {
      'user': {

      },
      'conversation': {
        'conversationId': '1480532856956',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'show_list',
          'rawInputs': [
            {
              'inputType': 2,
              'query': 'show me a list'
            }
          ],
          'arguments': [

          ]
        }
      ]
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    const SHOW_LIST = 'show_list';

    function showList (app) {
      app.askWithList('Here is a list', app.buildList(), {
        optionType: 'list'
      });
    }

    let actionMap = new Map();
    actionMap.set(SHOW_LIST, showList);

    app.handleRequest(actionMap);

    expect(mockResponse.statusCode).to.equal(400);
  });
});

/**
 * Describes the behavior for ActionsSdkApp askForPermissions method in v1.
 */
describe('ActionsSdkApp#askForPermissions', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid JSON in the response object for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {

      },
      'conversation': {
        'conversation_id': '1480532856956',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'GET_RIDE',
          'raw_inputs': [
            {
              'input_type': 2,
              'query': 'get me a ride in a big car'
            }
          ],
          'arguments': [

          ]
        }
      ]
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    const GET_RIDE = 'GET_RIDE';

    function getRide (app) {
      app.askForPermissions('To get you a ride', [
        app.SupportedPermissions.NAME,
        app.SupportedPermissions.DEVICE_PRECISE_LOCATION
      ], {
        carType: 'big'
      });
    }

    let actionMap = new Map();
    actionMap.set(GET_RIDE, getRide);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'conversation_token': '{"carType":"big"}',
      'expect_user_response': true,
      'expected_inputs': [
        {
          'input_prompt': {
            'initial_prompts': [
              {
                'text_to_speech': 'PLACEHOLDER_FOR_PERMISSION'
              }
            ],
            'no_input_prompts': [
            ]
          },
          'possible_intents': [
            {
              'intent': 'assistant.intent.action.PERMISSION',
              'input_value_spec': {
                'permission_value_spec': {
                  'opt_context': 'To get you a ride',
                  'permissions': ['NAME', 'DEVICE_PRECISE_LOCATION']
                }
              }
            }
          ]
        }
      ]
    };

    expect(mockResponse.body).to.deep.equal(expectedResponse);
  });
});

/**
 * Describes the behavior for ActionsSdkApp askForPermissions method in v2.
 */
describe('ActionsSdkApp#askForPermissions', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid JSON in the response object for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
    let body = {
      'user': {

      },
      'conversation': {
        'conversationId': '1480532856956',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'GET_RIDE',
          'rawInputs': [
            {
              'inputType': 2,
              'query': 'get me a ride in a big car'
            }
          ],
          'arguments': [

          ]
        }
      ]
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    const GET_RIDE = 'GET_RIDE';

    function getRide (app) {
      app.askForPermissions('To get you a ride', [
        app.SupportedPermissions.NAME,
        app.SupportedPermissions.DEVICE_PRECISE_LOCATION
      ], {
        carType: 'big'
      });
    }

    let actionMap = new Map();
    actionMap.set(GET_RIDE, getRide);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'conversationToken': '{"carType":"big"}',
      'expectUserResponse': true,
      'expectedInputs': [
        {
          'inputPrompt': {
            'initialPrompts': [
              {
                'textToSpeech': 'PLACEHOLDER_FOR_PERMISSION'
              }
            ],
            'noInputPrompts': [
            ]
          },
          'possibleIntents': [
            {
              'intent': 'actions.intent.PERMISSION',
              'inputValueData': {
                '@type': 'type.googleapis.com/google.actions.v2.PermissionValueSpec',
                'optContext': 'To get you a ride',
                'permissions': ['NAME', 'DEVICE_PRECISE_LOCATION']
              }
            }
          ]
        }
      ]
    };

    expect(mockResponse.body).to.deep.equal(expectedResponse);
  });
});

/**
 * Describes the behavior for ActionsSdkApp askForTransactionRequirements method.
 */
describe('ActionsSdkApp#askForTransactionRequirements', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON transaction requirements with Google payment options', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
    let body = {
      'user': {

      },
      'conversation': {
        'conversationId': '1480532856956',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'GET_RIDE',
          'rawInputs': [
            {
              'inputType': 2,
              'query': 'get me 2 items'
            }
          ],
          'arguments': [

          ]
        }
      ]
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    let transactionConfig = {
      deliveryAddressRequired: true,
      tokenizationParameters: {
        myParam: 'myParam'
      },
      cardNetworks: [
        'VISA',
        'MASTERCARD'
      ],
      prepaidCardDisallowed: false
    };

    app.handleRequest((app) => {
      app.askForTransactionRequirements(transactionConfig, { cartSize: 2 });
    });

    let expectedResponse = {
      'conversationToken': '{"cartSize":2}',
      'expectUserResponse': true,
      'expectedInputs': [
        {
          'inputPrompt': {
            'initialPrompts': [
              {
                'textToSpeech': 'PLACEHOLDER_FOR_TXN_REQUIREMENTS'
              }
            ],
            'noInputPrompts': [
            ]
          },
          'possibleIntents': [
            {
              'intent': 'actions.intent.TRANSACTION_REQUIREMENTS_CHECK',
              'inputValueData': {
                '@type': 'type.googleapis.com/google.actions.v2.TransactionRequirementsCheckSpec',
                'orderOptions': {
                  'requestDeliveryAddress': true
                },
                'paymentOptions': {
                  'googleProvidedOptions': {
                    'tokenizationParameters': {
                      'tokenizationType': 'PAYMENT_GATEWAY',
                      'parameters': {
                        'myParam': 'myParam'
                      }
                    },
                    'supportedCardNetworks': [
                      'VISA',
                      'MASTERCARD'
                    ],
                    'prepaidCardDisallowed': false
                  }
                }
              }
            }
          ]
        }
      ]
    };

    expect(mockResponse.body).to.deep.equal(expectedResponse);
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON transaction requirements with Action payment options', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
    let body = {
      'user': {

      },
      'conversation': {
        'conversationId': '1480532856956',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'GET_RIDE',
          'rawInputs': [
            {
              'inputType': 2,
              'query': 'get me 2 items'
            }
          ],
          'arguments': [

          ]
        }
      ]
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    let transactionConfig = {
      deliveryAddressRequired: true,
      type: 'BANK',
      displayName: 'Checking-4773'
    };

    app.handleRequest((app) => {
      app.askForTransactionRequirements(transactionConfig, { cartSize: 2 });
    });

    let expectedResponse = {
      'conversationToken': '{"cartSize":2}',
      'expectUserResponse': true,
      'expectedInputs': [
        {
          'inputPrompt': {
            'initialPrompts': [
              {
                'textToSpeech': 'PLACEHOLDER_FOR_TXN_REQUIREMENTS'
              }
            ],
            'noInputPrompts': [
            ]
          },
          'possibleIntents': [
            {
              'intent': 'actions.intent.TRANSACTION_REQUIREMENTS_CHECK',
              'inputValueData': {
                '@type': 'type.googleapis.com/google.actions.v2.TransactionRequirementsCheckSpec',
                'orderOptions': {
                  'requestDeliveryAddress': true
                },
                'paymentOptions': {
                  'actionProvidedOptions': {
                    'paymentType': 'BANK',
                    'displayName': 'Checking-4773'
                  }
                }
              }
            }
          ]
        }
      ]
    };

    expect(mockResponse.body).to.deep.equal(expectedResponse);
  });
});

/**
 * Describes the behavior for ActionsSdkApp askForDeliveryAddress method.
 */
describe('ActionsSdkApp#askForDeliveryAddress', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON delivery address', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
    let body = {
      'user': {

      },
      'conversation': {
        'conversationId': '1480532856956',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'GET_RIDE',
          'rawInputs': [
            {
              'inputType': 2,
              'query': 'get me 2 items'
            }
          ],
          'arguments': [

          ]
        }
      ]
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    app.handleRequest((app) => {
      app.askForDeliveryAddress('Just because', { cartSize: 2 });
    });

    let expectedResponse = {
      'conversationToken': '{"cartSize":2}',
      'expectUserResponse': true,
      'expectedInputs': [
        {
          'inputPrompt': {
            'initialPrompts': [
              {
                'textToSpeech': 'PLACEHOLDER_FOR_DELIVERY_ADDRESS'
              }
            ],
            'noInputPrompts': [
            ]
          },
          'possibleIntents': [
            {
              'intent': 'actions.intent.DELIVERY_ADDRESS',
              'inputValueData': {
                '@type': 'type.googleapis.com/google.actions.v2.DeliveryAddressValueSpec',
                'addressOptions': {
                  'reason': 'Just because'
                }
              }
            }
          ]
        }
      ]
    };

    expect(mockResponse.body).to.deep.equal(expectedResponse);
  });
});

/**
 * Describes the behavior for ActionsSdkApp askForTransactionDecision method.
 */
describe('ActionsSdkApp#askForTransactionDecision', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON transaction decision with Google payment options', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
    let body = {
      'user': {},
      'conversation': {
        'conversationId': '1480532856956',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'GET_RIDE',
          'rawInputs': [
            {
              'inputType': 2,
              'query': 'get me 2 items'
            }
          ],
          'arguments': []
        }
      ]
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    let transactionConfig = {
      deliveryAddressRequired: true,
      tokenizationParameters: {
        myParam: 'myParam'
      },
      cardNetworks: [
        'VISA',
        'MASTERCARD'
      ],
      prepaidCardDisallowed: false
    };

    app.handleRequest((app) => {
      app.askForTransactionDecision({fakeOrderId: 'order_id'}, transactionConfig,
        {cartSize: 2});
    });

    let expectedResponse = {
      'conversationToken': '{"cartSize":2}',
      'expectUserResponse': true,
      'expectedInputs': [
        {
          'inputPrompt': {
            'initialPrompts': [
              {
                'textToSpeech': 'PLACEHOLDER_FOR_TXN_DECISION'
              }
            ],
            'noInputPrompts': []
          },
          'possibleIntents': [
            {
              'intent': 'actions.intent.TRANSACTION_DECISION',
              'inputValueData': {
                '@type': 'type.googleapis.com/google.actions.v2.TransactionDecisionValueSpec',
                'proposedOrder': {'fakeOrderId': 'order_id'},
                'orderOptions': {
                  'requestDeliveryAddress': true
                },
                'paymentOptions': {
                  'googleProvidedOptions': {
                    'tokenizationParameters': {
                      'tokenizationType': 'PAYMENT_GATEWAY',
                      'parameters': {
                        'myParam': 'myParam'
                      }
                    },
                    'supportedCardNetworks': [
                      'VISA',
                      'MASTERCARD'
                    ],
                    'prepaidCardDisallowed': false
                  }
                }
              }
            }
          ]
        }
      ]
    };

    expect(mockResponse.body).to.deep.equal(expectedResponse);
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON transaction decision with Action payment options', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
    let body = {
      'user': {},
      'conversation': {
        'conversationId': '1480532856956',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'GET_RIDE',
          'rawInputs': [
            {
              'inputType': 2,
              'query': 'get me 2 items'
            }
          ],
          'arguments': []
        }
      ]
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    let transactionConfig = {
      deliveryAddressRequired: true,
      type: 'BANK',
      displayName: 'Checking-4773'
    };

    app.handleRequest((app) => {
      app.askForTransactionDecision({fakeOrderId: 'order_id'}, transactionConfig,
        {cartSize: 2});
    });

    let expectedResponse = {
      'conversationToken': '{"cartSize":2}',
      'expectUserResponse': true,
      'expectedInputs': [
        {
          'inputPrompt': {
            'initialPrompts': [
              {
                'textToSpeech': 'PLACEHOLDER_FOR_TXN_DECISION'
              }
            ],
            'noInputPrompts': []
          },
          'possibleIntents': [
            {
              'intent': 'actions.intent.TRANSACTION_DECISION',
              'inputValueData': {
                '@type': 'type.googleapis.com/google.actions.v2.TransactionDecisionValueSpec',
                'proposedOrder': {'fakeOrderId': 'order_id'},
                'orderOptions': {
                  'requestDeliveryAddress': true
                },
                'paymentOptions': {
                  'actionProvidedOptions': {
                    'paymentType': 'BANK',
                    'displayName': 'Checking-4773'
                  }
                }
              }
            }
          ]
        }
      ]
    };

    expect(mockResponse.body).to.deep.equal(expectedResponse);
  });
});

/**
 * Describes the behavior for ActionsSdkApp askForConfirmation method.
 */
describe('ActionsSdkApp#askForConfirmation', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON confirmation request', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
    let body = {
      'user': {},
      'conversation': {
        'conversationId': '1480532856956',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'GET_RIDE',
          'rawInputs': [
            {
              'inputType': 2,
              'query': 'get me 2 items'
            }
          ],
          'arguments': []
        }
      ]
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    app.handleRequest((app) => {
      app.askForConfirmation('You want to do that?', {cartSize: 2});
    });

    let expectedResponse = {
      'conversationToken': '{"cartSize":2}',
      'expectUserResponse': true,
      'expectedInputs': [
        {
          'inputPrompt': {
            'initialPrompts': [
              {
                'textToSpeech': 'PLACEHOLDER_FOR_CONFIRMATION'
              }
            ],
            'noInputPrompts': []
          },
          'possibleIntents': [
            {
              'intent': 'actions.intent.CONFIRMATION',
              'inputValueData': {
                '@type': 'type.googleapis.com/google.actions.v2.ConfirmationValueSpec',
                'dialogSpec': {
                  'requestConfirmationText': 'You want to do that?'
                }
              }
            }
          ]
        }
      ]
    };

    expect(mockResponse.body).to.deep.equal(expectedResponse);
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON confirmation request without prompt', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
    let body = {
      'user': {},
      'conversation': {
        'conversationId': '1480532856956',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'GET_RIDE',
          'rawInputs': [
            {
              'inputType': 2,
              'query': 'get me 2 items'
            }
          ],
          'arguments': []
        }
      ]
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    app.handleRequest((app) => {
      app.askForConfirmation();
    });

    let expectedResponse = {
      'conversationToken': '{"state":null,"data":{}}',
      'expectUserResponse': true,
      'expectedInputs': [
        {
          'inputPrompt': {
            'initialPrompts': [
              {
                'textToSpeech': 'PLACEHOLDER_FOR_CONFIRMATION'
              }
            ],
            'noInputPrompts': []
          },
          'possibleIntents': [
            {
              'intent': 'actions.intent.CONFIRMATION',
              'inputValueData': {
                '@type': 'type.googleapis.com/google.actions.v2.ConfirmationValueSpec'
              }
            }
          ]
        }
      ]
    };

    expect(mockResponse.body).to.deep.equal(expectedResponse);
  });
});

/**
 * Describes the behavior for ActionsSdkApp askForDateTime method.
 */
describe('ActionsSdkApp#askForDateTime', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON datetime request', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
    let body = {
      'user': {

      },
      'conversation': {
        'conversationId': '1480532856956',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'GET_RIDE',
          'rawInputs': [
            {
              'inputType': 2,
              'query': 'get me 2 items'
            }
          ],
          'arguments': [

          ]
        }
      ]
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    app.handleRequest((app) => {
      app.askForDateTime('When do you want to come in?',
        'What is the best date for you?',
        'What time of day works best for you?', { cartSize: 2 });
    });

    let expectedResponse = {
      'conversationToken': '{"cartSize":2}',
      'expectUserResponse': true,
      'expectedInputs': [
        {
          'inputPrompt': {
            'initialPrompts': [
              {
                'textToSpeech': 'PLACEHOLDER_FOR_DATETIME'
              }
            ],
            'noInputPrompts': [
            ]
          },
          'possibleIntents': [
            {
              'intent': 'actions.intent.DATETIME',
              'inputValueData': {
                '@type': 'type.googleapis.com/google.actions.v2.DateTimeValueSpec',
                'dialogSpec': {
                  'requestDatetimeText': 'When do you want to come in?',
                  'requestDateText': 'What is the best date for you?',
                  'requestTimeText': 'What time of day works best for you?'
                }
              }
            }
          ]
        }
      ]
    };

    expect(mockResponse.body).to.deep.equal(expectedResponse);
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON datetime request with partial prompts', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
    let body = {
      'user': {

      },
      'conversation': {
        'conversationId': '1480532856956',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'GET_RIDE',
          'rawInputs': [
            {
              'inputType': 2,
              'query': 'get me 2 items'
            }
          ],
          'arguments': [

          ]
        }
      ]
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    app.handleRequest((app) => {
      app.askForDateTime('When do you want to come in?',
        null);
    });

    let expectedResponse = {
      'conversationToken': '{"state":null,"data":{}}',
      'expectUserResponse': true,
      'expectedInputs': [
        {
          'inputPrompt': {
            'initialPrompts': [
              {
                'textToSpeech': 'PLACEHOLDER_FOR_DATETIME'
              }
            ],
            'noInputPrompts': [
            ]
          },
          'possibleIntents': [
            {
              'intent': 'actions.intent.DATETIME',
              'inputValueData': {
                '@type': 'type.googleapis.com/google.actions.v2.DateTimeValueSpec',
                'dialogSpec': {
                  'requestDatetimeText': 'When do you want to come in?'
                }
              }
            }
          ]
        }
      ]
    };

    expect(JSON.parse(JSON.stringify(mockResponse.body))).to.deep.equal(expectedResponse);
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON datetime request without prompts', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
    let body = {
      'user': {

      },
      'conversation': {
        'conversationId': '1480532856956',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'GET_RIDE',
          'rawInputs': [
            {
              'inputType': 2,
              'query': 'get me 2 items'
            }
          ],
          'arguments': [

          ]
        }
      ]
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    app.handleRequest((app) => {
      app.askForDateTime();
    });

    let expectedResponse = {
      'conversationToken': '{"state":null,"data":{}}',
      'expectUserResponse': true,
      'expectedInputs': [
        {
          'inputPrompt': {
            'initialPrompts': [
              {
                'textToSpeech': 'PLACEHOLDER_FOR_DATETIME'
              }
            ],
            'noInputPrompts': [
            ]
          },
          'possibleIntents': [
            {
              'intent': 'actions.intent.DATETIME',
              'inputValueData': {
                '@type': 'type.googleapis.com/google.actions.v2.DateTimeValueSpec'
              }
            }
          ]
        }
      ]
    };

    expect(JSON.parse(JSON.stringify(mockResponse.body))).to.deep.equal(expectedResponse);
  });
});

/**
 * Describes the behavior for ActionsSdkApp askForSignIn method.
 */
describe('ActionsSdkApp#askForSignIn', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON sign in request', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
    let body = {
      'user': {},
      'conversation': {
        'conversationId': '1480532856956',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'GET_RIDE',
          'rawInputs': [
            {
              'inputType': 2,
              'query': 'get me 2 items'
            }
          ],
          'arguments': []
        }
      ]
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    app.handleRequest((app) => {
      app.askForSignIn({cartSize: 2});
    });

    let expectedResponse = {
      'conversationToken': '{"cartSize":2}',
      'expectUserResponse': true,
      'expectedInputs': [
        {
          'inputPrompt': {
            'initialPrompts': [
              {
                'textToSpeech': 'PLACEHOLDER_FOR_SIGN_IN'
              }
            ],
            'noInputPrompts': []
          },
          'possibleIntents': [
            {
              'intent': 'actions.intent.SIGN_IN',
              'inputValueData': {}
            }
          ]
        }
      ]
    };

    expect(mockResponse.body).to.deep.equal(expectedResponse);
  });
});

/**
 * Describes the behavior for ActionsSdkApp getUser method.
 */
describe('ActionsSdkApp#getUser', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request info.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
      },
      'conversation': {
        'conversation_id': '1480476553943',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'assistant.intent.action.MAIN',
          'raw_inputs': [
            {
              'input_type': 2,
              'query': 'talk to action snippets'
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
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    // Test new and old API
    expect(app.getUser().user_id).to.equal('11112226094657824893');
    expect(app.getUser().userId).to.equal('11112226094657824893');
  });
});

/**
 * Describes the behavior for ActionsSdkApp getUserName method.
 */
describe('ActionsSdkApp#getUserName', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request user.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893',
        'profile': {
          'display_name': 'John Smith',
          'given_name': 'John',
          'family_name': 'Smith'
        }
      },
      'conversation': {
        'conversation_id': '1480476553943',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'assistant.intent.action.MAIN',
          'raw_inputs': [
            {
              'input_type': 2,
              'query': 'talk to action snippets'
            }
          ],
          'arguments': [
            {
              'name': 'permission_granted',
              'text_value': 'true'
            }
          ]
        }
      ]
    };
    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getUserName().displayName).to.equal('John Smith');
    expect(app.getUserName().givenName).to.equal('John');
    expect(app.getUserName().familyName).to.equal('Smith');

    // Test the false case

    body.user.profile = undefined;

    mockRequest = new MockRequest(headers, body);
    mockResponse = new MockResponse();

    app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getUserName()).to.equal(null);
  });
});

/**
 * Describes the behavior for ActionsSdkApp getTransactionRequirementsResult method.
 */
describe('ActionsSdkApp#getTransactionRequirementsResult', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request user.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': '2'
    };
    let body = {
      'isInSandbox': true,
      'surface': {
        'capabilities': [
          {
            'name': 'actions.capability.AUDIO_OUTPUT'
          },
          {
            'name': 'actions.capability.SCREEN_OUTPUT'
          }
        ]
      },
      'inputs': [
        {
          'rawInputs': [
            {
              'query': 'check transaction',
              'inputType': 'VOICE'
            }
          ],
          'arguments': [
            {
              'extension': {
                'canTransact': true,
                '@type': 'type.googleapis.com/google.actions.v2.TransactionRequirementsCheckResult',
                'resultType': 'OK'
              },
              'name': 'TRANSACTION_REQUIREMENTS_CHECK_RESULT'
            }
          ],
          'intent': 'actions.intent.TRANSACTION_REQUIREMENTS_CHECK'
        }
      ],
      'user': {
        'userId': 'user123'
      },
      'device': {
        'locale': 'en-US'
      },
      'conversation': {
        'conversationId': '1494603963782',
        'type': 'ACTIVE',
        'conversationToken': '["_actions_on_google_"]'
      }
    };
    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getTransactionRequirementsResult()).to.equal('OK');
  });
});

/**
 * Describes the behavior for ActionsSdkApp getDeliveryAddress method.
 */
describe('ActionsSdkApp#getDeliveryAddress', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request delivery address', function () {
    let headers = {
      'Content-Type': 'application/json'
    };
    let body = {
      'isInSandbox': true,
      'surface': {
        'capabilities': [
          {
            'name': 'actions.capability.AUDIO_OUTPUT'
          },
          {
            'name': 'actions.capability.SCREEN_OUTPUT'
          }
        ]
      },
      'inputs': [
        {
          'rawInputs': [
            {
              'query': '1600 Amphitheatre Parkway',
              'inputType': 'VOICE'
            }
          ],
          'arguments': [
            {
              'extension': {
                'userDecision': 'ACCEPTED',
                '@type': 'type.googleapis.com/google.actions.v2.TransactionDecisionValue',
                'location': {
                  'zipCode': '94043',
                  'postalAddress': {
                    'regionCode': 'US',
                    'recipients': [
                      'Jane Smith'
                    ],
                    'postalCode': '94043',
                    'locality': 'Mountain View',
                    'addressLines': [
                      '1600 Amphitheatre Parkway'
                    ],
                    'administrativeArea': 'CA'
                  },
                  'phoneNumber': '+1 415-555-1234',
                  'city': 'Mountain View'
                }
              },
              'name': 'TRANSACTION_DECISION_VALUE'
            }
          ],
          'intent': 'actions.intent.TRANSACTION_DECISION'
        }
      ],
      'user': {
        'userId': 'user123'
      },
      'device': {
        'locale': 'en-US'
      },
      'conversation': {
        'conversationId': '1494606917128',
        'type': 'ACTIVE',
        'conversationToken': '["_actions_on_google_"]'
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getDeliveryAddress()).to.deep.equal({
      zipCode: '94043',
      postalAddress: {
        regionCode: 'US',
        recipients: [
          'Jane Smith'
        ],
        postalCode: '94043',
        locality: 'Mountain View',
        addressLines: [
          '1600 Amphitheatre Parkway'
        ],
        administrativeArea: 'CA'
      },
      phoneNumber: '+1 415-555-1234',
      city: 'Mountain View'
    });
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request delivery address for txn decision', function () {
    let headers = {
      'Content-Type': 'application/json'
    };
    let body = {
      'isInSandbox': true,
      'surface': {
        'capabilities': [
          {
            'name': 'actions.capability.AUDIO_OUTPUT'
          },
          {
            'name': 'actions.capability.SCREEN_OUTPUT'
          }
        ]
      },
      'inputs': [
        {
          'rawInputs': [
            {
              'query': '1600 Amphitheatre Parkway',
              'inputType': 'VOICE'
            }
          ],
          'arguments': [
            {
              'extension': {
                'userDecision': 'ACCEPTED',
                '@type': 'type.googleapis.com/google.actions.v2.DeliveryAddressValue',
                'location': {
                  'zipCode': '94043',
                  'postalAddress': {
                    'regionCode': 'US',
                    'recipients': [
                      'Jane Smith'
                    ],
                    'postalCode': '94043',
                    'locality': 'Mountain View',
                    'addressLines': [
                      '1600 Amphitheatre Parkway'
                    ],
                    'administrativeArea': 'CA'
                  },
                  'phoneNumber': '+1 415-555-1234',
                  'city': 'Mountain View'
                }
              },
              'name': 'DELIVERY_ADDRESS_VALUE'
            }
          ],
          'intent': 'actions.intent.DELIVERY_ADDRESS'
        }
      ],
      'user': {
        'userId': 'user123'
      },
      'device': {
        'locale': 'en-US'
      },
      'conversation': {
        'conversationId': '1494606917128',
        'type': 'ACTIVE',
        'conversationToken': '["_actions_on_google_"]'
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getDeliveryAddress()).to.deep.equal({
      zipCode: '94043',
      postalAddress: {
        regionCode: 'US',
        recipients: [
          'Jane Smith'
        ],
        postalCode: '94043',
        locality: 'Mountain View',
        addressLines: [
          '1600 Amphitheatre Parkway'
        ],
        administrativeArea: 'CA'
      },
      phoneNumber: '+1 415-555-1234',
      city: 'Mountain View'
    });
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return null when user rejects', function () {
    let headers = {
      'Content-Type': 'application/json'
    };
    let body = {
      'isInSandbox': true,
      'surface': {
        'capabilities': [
          {
            'name': 'actions.capability.AUDIO_OUTPUT'
          },
          {
            'name': 'actions.capability.SCREEN_OUTPUT'
          }
        ]
      },
      'inputs': [
        {
          'rawInputs': [
            {
              'query': '1600 Amphitheatre Parkway',
              'inputType': 'VOICE'
            }
          ],
          'arguments': [
            {
              'extension': {
                'userDecision': 'REJECTED',
                '@type': 'type.googleapis.com/google.actions.v2.DeliveryAddressValue',
                'location': {
                  'zipCode': '94043',
                  'postalAddress': {
                    'regionCode': 'US',
                    'recipients': [
                      'Jane Smith'
                    ],
                    'postalCode': '94043',
                    'locality': 'Mountain View',
                    'addressLines': [
                      '1600 Amphitheatre Parkway'
                    ],
                    'administrativeArea': 'CA'
                  },
                  'phoneNumber': '+1 415-555-1234',
                  'city': 'Mountain View'
                }
              },
              'name': 'DELIVERY_ADDRESS_VALUE'
            }
          ],
          'intent': 'actions.intent.DELIVERY_ADDRESS'
        }
      ],
      'user': {
        'userId': 'user123'
      },
      'device': {
        'locale': 'en-US'
      },
      'conversation': {
        'conversationId': '1494606917128',
        'type': 'ACTIVE',
        'conversationToken': '["_actions_on_google_"]'
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getDeliveryAddress()).to.equal(null);
  });
});

/**
 * Describes the behavior for ActionsSdkApp getTransactionDecision method.
 */
describe('ActionsSdkApp#getTransactionDecision', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request delivery address', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': 2
    };
    let body = {
      'isInSandbox': true,
      'surface': {
        'capabilities': [
          {
            'name': 'actions.capability.AUDIO_OUTPUT'
          },
          {
            'name': 'actions.capability.SCREEN_OUTPUT'
          }
        ]
      },
      'inputs': [
        {
          'rawInputs': [
            {
              'query': '1600 Amphitheatre Parkway',
              'inputType': 'VOICE'
            }
          ],
          'arguments': [
            {
              'extension': {
                'userDecision': 'ORDER_ACCEPTED',
                'checkResult': {
                  'resultType': 'OK',
                  'order': {
                    'finalOrder': { 'fakeOrder': 'fake_order' },
                    'googleOrderId': 'goog_123',
                    'actionOrderId': 'action_123',
                    'orderDate': {
                      'seconds': 40,
                      'nanos': 880000000
                    },
                    'paymentInfo': { 'fakePayment': 'fake_payment' },
                    'customerInfo': {
                      'email': 'username@example.com'
                    }
                  }
                }
              },
              'name': 'TRANSACTION_DECISION_VALUE'
            }
          ],
          'intent': 'actions.intent.TRANSACTION_DECISION'
        }
      ],
      'user': {
        'userId': 'user123'
      },
      'device': {
        'locale': 'en-US'
      },
      'conversation': {
        'conversationId': '1494606917128',
        'type': 'ACTIVE',
        'conversationToken': '["_actions_on_google_"]'
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getTransactionDecision()).to.deep.equal({
      'userDecision': 'ORDER_ACCEPTED',
      'checkResult': {
        'resultType': 'OK',
        'order': {
          'finalOrder': { 'fakeOrder': 'fake_order' },
          'googleOrderId': 'goog_123',
          'actionOrderId': 'action_123',
          'orderDate': {
            'seconds': 40,
            'nanos': 880000000
          },
          'paymentInfo': { 'fakePayment': 'fake_payment' },
          'customerInfo': {
            'email': 'username@example.com'
          }
        }
      }
    });
  });
});

/**
 * Describes the behavior for ActionsSdkApp getUserConfirmation method.
 */
describe('ActionsSdkApp#getUserConfirmation', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant positive confirmation decision', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': 2
    };
    let body = {
      'isInSandbox': true,
      'surface': {
        'capabilities': [
          {
            'name': 'actions.capability.AUDIO_OUTPUT'
          },
          {
            'name': 'actions.capability.SCREEN_OUTPUT'
          }
        ]
      },
      'inputs': [
        {
          'rawInputs': [
            {
              'query': 'i think so',
              'inputType': 'VOICE'
            }
          ],
          'arguments': [
            {
              'name': 'CONFIRMATION',
              'boolValue': true
            }
          ],
          'intent': 'actions.intent.CONFIRMATION'
        }
      ],
      'user': {
        'userId': 'user123'
      },
      'device': {
        'locale': 'en-US'
      },
      'conversation': {
        'conversationId': '1494606917128',
        'type': 'ACTIVE',
        'conversationToken': '["_actions_on_google_"]'
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getUserConfirmation()).to.equal(true);
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant negative confirmation decision', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': 2
    };
    let body = {
      'isInSandbox': true,
      'surface': {
        'capabilities': [
          {
            'name': 'actions.capability.AUDIO_OUTPUT'
          },
          {
            'name': 'actions.capability.SCREEN_OUTPUT'
          }
        ]
      },
      'inputs': [
        {
          'rawInputs': [
            {
              'query': 'i think not',
              'inputType': 'VOICE'
            }
          ],
          'arguments': [
            {
              'name': 'CONFIRMATION',
              'boolValue': false
            }
          ],
          'intent': 'actions.intent.CONFIRMATION'
        }
      ],
      'user': {
        'userId': 'user123'
      },
      'device': {
        'locale': 'en-US'
      },
      'conversation': {
        'conversationId': '1494606917128',
        'type': 'ACTIVE',
        'conversationToken': '["_actions_on_google_"]'
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getUserConfirmation()).to.equal(false);
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant missing confirmation decision', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': 2
    };
    let body = {
      'isInSandbox': true,
      'surface': {
        'capabilities': [
          {
            'name': 'actions.capability.AUDIO_OUTPUT'
          },
          {
            'name': 'actions.capability.SCREEN_OUTPUT'
          }
        ]
      },
      'inputs': [
        {
          'rawInputs': [
            {
              'query': 'i think so',
              'inputType': 'VOICE'
            }
          ],
          'arguments': [ ],
          'intent': 'actions.intent.CONFIRMATION'
        }
      ],
      'user': {
        'userId': 'user123'
      },
      'device': {
        'locale': 'en-US'
      },
      'conversation': {
        'conversationId': '1494606917128',
        'type': 'ACTIVE',
        'conversationToken': '["_actions_on_google_"]'
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getUserConfirmation()).to.equal(null);
  });
});

/**
 * Describes the behavior for ActionsSdkApp getDateTime method.
 */
describe('ActionsSdkApp#getDateTime', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant date time info', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': 2
    };
    let body = {
      'isInSandbox': true,
      'surface': {
        'capabilities': [
          {
            'name': 'actions.capability.AUDIO_OUTPUT'
          },
          {
            'name': 'actions.capability.SCREEN_OUTPUT'
          }
        ]
      },
      'inputs': [
        {
          'rawInputs': [
            {
              'query': 'i think so',
              'inputType': 'VOICE'
            }
          ],
          'arguments': [
            {
              'datetimeValue': {
                'date': {
                  'month': 5,
                  'year': 2017,
                  'day': 26
                },
                'time': {
                  'hours': 9
                }
              },
              'name': 'DATETIME'
            }
          ],
          'intent': 'actions.intent.CONFIRMATION'
        }
      ],
      'user': {
        'userId': 'user123'
      },
      'device': {
        'locale': 'en-US'
      },
      'conversation': {
        'conversationId': '1494606917128',
        'type': 'ACTIVE',
        'conversationToken': '["_actions_on_google_"]'
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getDateTime()).to.deep.equal({
      date: {
        month: 5,
        year: 2017,
        day: 26
      },
      time: {
        hours: 9
      }
    });
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant missing date time info', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': 2
    };
    let body = {
      'isInSandbox': true,
      'surface': {
        'capabilities': [
          {
            'name': 'actions.capability.AUDIO_OUTPUT'
          },
          {
            'name': 'actions.capability.SCREEN_OUTPUT'
          }
        ]
      },
      'inputs': [
        {
          'rawInputs': [
            {
              'query': 'i think so',
              'inputType': 'VOICE'
            }
          ],
          'arguments': [
          ],
          'intent': 'actions.intent.DATETIME'
        }
      ],
      'user': {
        'userId': 'user123'
      },
      'device': {
        'locale': 'en-US'
      },
      'conversation': {
        'conversationId': '1494606917128',
        'type': 'ACTIVE',
        'conversationToken': '["_actions_on_google_"]'
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getDateTime()).to.equal(null);
  });
});

/**
 * Describes the behavior for ActionsSdkApp getSignInStatus method.
 */
describe('ActionsSdkApp#getSignInStatus', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant sign in status', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': 2
    };
    let body = {
      'isInSandbox': true,
      'surface': {
        'capabilities': [
          {
            'name': 'actions.capability.AUDIO_OUTPUT'
          },
          {
            'name': 'actions.capability.SCREEN_OUTPUT'
          }
        ]
      },
      'inputs': [
        {
          'rawInputs': [
            {
              'query': 'i think so',
              'inputType': 'VOICE'
            }
          ],
          'arguments': [
            {
              'name': 'SIGN_IN',
              'extension': {
                '@type': 'type.googleapis.com/google.actions.v2.SignInValue',
                'status': 'foo_status'
              }
            }
          ],
          'intent': 'actions.intent.SIGN_IN'
        }
      ],
      'user': {
        'userId': 'user123'
      },
      'device': {
        'locale': 'en-US'
      },
      'conversation': {
        'conversationId': '1494606917128',
        'type': 'ACTIVE',
        'conversationToken': '["_actions_on_google_"]'
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getSignInStatus()).to.deep.equal('foo_status');
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant missing sign in status', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': 2
    };
    let body = {
      'isInSandbox': true,
      'surface': {
        'capabilities': [
          {
            'name': 'actions.capability.AUDIO_OUTPUT'
          },
          {
            'name': 'actions.capability.SCREEN_OUTPUT'
          }
        ]
      },
      'inputs': [
        {
          'rawInputs': [
            {
              'query': 'i think so',
              'inputType': 'VOICE'
            }
          ],
          'arguments': [
          ],
          'intent': 'actions.intent.SIGN_IN'
        }
      ],
      'user': {
        'userId': 'user123'
      },
      'device': {
        'locale': 'en-US'
      },
      'conversation': {
        'conversationId': '1494606917128',
        'type': 'ACTIVE',
        'conversationToken': '["_actions_on_google_"]'
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getSignInStatus()).to.equal(null);
  });
});

/**
 * Describes the behavior for ActionsSdkApp getDeviceLocation method.
 */
describe('ActionsSdkApp#getDeviceLocation', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request user.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
      },
      'conversation': {
        'conversation_id': '1480476553943',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'assistant.intent.action.MAIN',
          'raw_inputs': [
            {
              'input_type': 2,
              'query': 'talk to action snippets'
            }
          ],
          'arguments': [
            {
              'name': 'permission_granted',
              'text_value': 'true'
            }
          ]
        }
      ],
      'device': {
        'location': {
          'coordinates': {
            'latitude': 37.3861,
            'longitude': 122.0839
          },
          'formatted_address': '123 Main St, Anytown, CA 12345, United States',
          'zip_code': '12345',
          'city': 'Anytown'
        }
      }
    };
    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getDeviceLocation().coordinates).to.deep.equal({
      latitude: 37.3861,
      longitude: 122.0839
    });
    expect(app.getDeviceLocation().address)
      .to.equal('123 Main St, Anytown, CA 12345, United States');
    expect(app.getDeviceLocation().zipCode).to.equal('12345');
    expect(app.getDeviceLocation().city).to.equal('Anytown');

    // Test the false case

    body.device = undefined;

    mockRequest = new MockRequest(headers, body);
    mockResponse = new MockResponse();

    app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getDeviceLocation()).to.equal(null);
  });
});

/**
 * Describes the behavior for ActionsSdkApp isPermissionGranted method.
 */
describe('ActionsSdkApp#isPermissionGranted', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request user.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
      },
      'conversation': {
        'conversation_id': '1480476553943',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'assistant.intent.action.MAIN',
          'raw_inputs': [
            {
              'input_type': 2,
              'query': 'talk to action snippets'
            }
          ],
          'arguments': [
            {
              'name': 'permission_granted',
              'text_value': 'true'
            }
          ]
        }
      ]
    };
    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.isPermissionGranted()).to.equal(true);

    // Test the false case

    body.inputs[0].arguments[0].text_value = false;

    mockRequest = new MockRequest(headers, body);
    mockResponse = new MockResponse();

    app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.isPermissionGranted()).to.equal(false);
  });
});

/**
 * Describes the behavior for ActionsSdkApp isInSandbox method.
 */
describe('ActionsSdkApp#isInSandbox', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request delivery address', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Actions-API-Version': 2
    };
    let body = {
      'isInSandbox': true,
      'surface': {
        'capabilities': [
          {
            'name': 'actions.capability.AUDIO_OUTPUT'
          },
          {
            'name': 'actions.capability.SCREEN_OUTPUT'
          }
        ]
      },
      'inputs': [
        {
          'rawInputs': [
            {
              'query': '1600 Amphitheatre Parkway',
              'inputType': 'VOICE'
            }
          ],
          'arguments': [],
          'intent': 'actions.intent.TRANSACTION_DECISION'
        }
      ],
      'user': {
        'userId': 'user123'
      },
      'device': {
        'locale': 'en-US'
      },
      'conversation': {
        'conversationId': '1494606917128',
        'type': 'ACTIVE',
        'conversationToken': '["_actions_on_google_"]'
      }
    };

    let mockRequest = new MockRequest(headers, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.isInSandbox()).to.be.true;

    // Test the false case

    body.isInSandbox = false;

    mockRequest = new MockRequest(headers, body);
    mockResponse = new MockResponse();

    app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.isInSandbox()).to.be.false;
  });
});

/**
 * Describes the behavior for ActionsSdkApp hasSurfaceCapability method.
 */
describe('ActionsSdkApp#hasSurfaceCapability', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return true for a valid capability from incoming JSON for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
      },
      'conversation': {
        'conversation_id': '1480476553943',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'assistant.intent.action.MAIN',
          'raw_inputs': [
            {
              'input_type': 3,
              'query': 'talk to action snippets'
            }
          ]
        }
      ],
      'surface': {
        'capabilities': [
          {
            'name': 'actions.capability.AUDIO_OUTPUT'
          },
          {
            'name': 'actions.capability.SCREEN_OUTPUT'
          }
        ]
      }
    };

    let mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    let hasScreenOutput =
      app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT);
    let hasMagicPowers =
      app.hasSurfaceCapability('MAGIC_POWERS');
    expect(hasScreenOutput).to.be.true;
    expect(hasMagicPowers).to.be.false;
  });
});

/**
 * Describes the behavior for ActionsSdkApp getSurfaceCapabilities method.
 */
describe('ActionsSdkApp#getSurfaceCapabilities', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid list of capabilities from incoming JSON for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
      },
      'conversation': {
        'conversation_id': '1480476553943',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'assistant.intent.action.MAIN',
          'raw_inputs': [
            {
              'input_type': 3,
              'query': 'talk to action snippets'
            }
          ]
        }
      ],
      'surface': {
        'capabilities': [
          {
            'name': 'actions.capability.AUDIO_OUTPUT'
          },
          {
            'name': 'actions.capability.SCREEN_OUTPUT'
          }
        ]
      }
    };

    let mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    let capabilities = app.getSurfaceCapabilities();
    expect(capabilities).to.deep.equal([
      app.SurfaceCapabilities.AUDIO_OUTPUT,
      app.SurfaceCapabilities.SCREEN_OUTPUT
    ]);
  });
});

/**
 * Describes the behavior for ActionsSdkApp getInputType method.
 */
describe('ActionsSdkApp#getInputType', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid input type from incoming JSON for the success case.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
      },
      'conversation': {
        'conversation_id': '1480476553943',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'assistant.intent.action.MAIN',
          'raw_inputs': [
            {
              'input_type': 3,
              'query': 'talk to action snippets'
            }
          ]
        }
      ],
      'surface': {
        'capabilities': [
          {
            'name': 'actions.capability.AUDIO_OUTPUT'
          },
          {
            'name': 'actions.capability.SCREEN_OUTPUT'
          }
        ]
      }
    };

    let mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    let inputType = app.getInputType();
    expect(inputType).to.equal(app.InputTypes.KEYBOARD);
  });
});

/**
 * Describes the behavior for ActionsSdkApp getApiVersion method.
 */
describe('ActionsSdkApp#getApiVersion', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request info.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
      },
      'conversation': {
        'conversation_id': '1480476553943',
        'type': 1
      },
      'inputs': [
        {
          'intent': 'assistant.intent.action.MAIN',
          'raw_inputs': [
            {
              'input_type': 2,
              'query': 'talk to action snippets'
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
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getApiVersion()).to.equal('v1');
  });
});

/**
 * Describes the behavior for ActionsSdkApp getDialogState method.
 */
describe('ActionsSdkApp#getDialogState', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant dialog state info.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
      },
      'conversation': {
        'conversation_id': '1480540140642',
        'type': 2,
        'conversation_token': '{"started":true}'
      },
      'inputs': [
        {
          'intent': 'PROVIDE_NUMBER',
          'raw_inputs': [
            {
              'input_type': 2,
              'query': '5'
            }
          ],
          'arguments': [
            {
              'name': 'number',
              'raw_text': '5',
              'text_value': '5'
            }
          ]
        }
      ]
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    let dialogState = {'started': true};

    expect(dialogState).to.deep.equal(app.getDialogState());
  });
});

/**
 * Describes the behavior for ActionsSdkApp getActionVersionLabel method.
 */
describe('ActionsSdkApp#getActionVersionLabel', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant action version label info.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1',
      'Agent-Version-Label': '1.0.0'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
      },
      'conversation': {
        'conversation_id': '1480540140642',
        'type': 2,
        'conversation_token': '{"started":true}'
      },
      'inputs': [
        {
          'intent': 'PROVIDE_NUMBER',
          'raw_inputs': [
            {
              'input_type': 2,
              'query': '5'
            }
          ],
          'arguments': [
            {
              'name': 'number',
              'raw_text': '5',
              'text_value': '5'
            }
          ]
        }
      ]
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getActionVersionLabel()).to.equal('1.0.0');
  });
});

/**
 * Describes the behavior for ActionsSdkApp getConversationId method.
 */
describe('ActionsSdkApp#getConversationId', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant conversation ID.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1',
      'Agent-Version-Label': '1.0.0'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
      },
      'conversation': {
        'conversation_id': '1480540140642',
        'type': 2,
        'conversation_token': '{"started":true}'
      },
      'inputs': [
        {
          'intent': 'PROVIDE_NUMBER',
          'raw_inputs': [
            {
              'input_type': 2,
              'query': '5'
            }
          ],
          'arguments': [
            {
              'name': 'number',
              'raw_text': '5',
              'text_value': '5'
            }
          ]
        }
      ]
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getConversationId()).to.equal('1480540140642');
  });
});

/**
 * Describes the behavior for ActionsSdkApp getArgument method.
 */
describe('ActionsSdkApp#getArgument', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant intent.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1',
      'Agent-Version-Label': '1.0.0'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
      },
      'conversation': {
        'conversation_id': '1480543005681',
        'type': 2,
        'conversation_token': '{"started":true}'
      },
      'inputs': [
        {
          'intent': 'PROVIDE_NUMBER',
          'raw_inputs': [
            {
              'input_type': 2,
              'query': '45'
            }
          ],
          'arguments': [
            {
              'name': 'number',
              'raw_text': '45',
              'text_value': '45'
            },
            {
              'name': 'other_value',
              'raw_text': '45',
              'other_value': {
                'key': 'value'
              }
            }
          ]
        }
      ]
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    const PROVIDE_NUMBER_INTENT = 'PROVIDE_NUMBER';

    function provideNumberIntent (app) {
      expect(app.getArgument('number')).to.equal('45');
      app.tell('You said ' + app.getArgument('number'));
    }

    let actionMap = new Map();
    actionMap.set(PROVIDE_NUMBER_INTENT, provideNumberIntent);

    app.handleRequest(actionMap);

    expect(app.getArgument('other_value')).to.deep.equal({
      'name': 'other_value',
      'raw_text': '45',
      'other_value': {
        'key': 'value'
      }
    });

    // Validating the response object
    let expectedResponse = {
      'expect_user_response': false,
      'final_response': {
        'speech_response': {
          'text_to_speech': 'You said 45'
        }
      }
    };

    expect(JSON.stringify(mockResponse.body)).to.equal(JSON.stringify(expectedResponse));
  });
});

/**
 * Describes the behavior for ActionsSdkApp getSelectedOption method.
 */
describe('ActionsSdkApp#getSelectedOption', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should get the selected option when given in APIAI context.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1'
    };
    let body = {
      'user': {
        'user_id': '123'
      },
      'inputs': [
        {
          'intent': 'actions.intent.OPTION',
          'raw_inputs': [
            {
              'input_type': 2,
              'query': 'first item',
              'annotation_sets': []
            }
          ],
          'arguments': [
            {
              'name': 'OPTION',
              'text_value': 'first_item'
            }
          ]
        }
      ]
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getSelectedOption()).to.equal('first_item');
  });
});

  /**
 * Describes the behavior for ActionsSdkApp tell with SSML method.
 */
describe('ActionsSdkApp#tell', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant tell SSML.', function () {
    let headers = {
      'Content-Type': 'application/json',
      'Google-Assistant-API-Version': 'v1',
      'Agent-Version-Label': '1.0.0'
    };
    let body = {
      'user': {
        'user_id': '11112226094657824893'
      },
      'conversation': {
        'conversation_id': '1480548909986',
        'type': 2,
        'conversation_token': '{"state":null,"data":{}}'
      },
      'inputs': [
        {
          'intent': 'assistant.intent.action.TEXT',
          'raw_inputs': [
            {
              'input_type': 2,
              'query': '45'
            }
          ],
          'arguments': [
            {
              'name': 'raw_text',
              'raw_text': '45',
              'text_value': '45'
            }
          ]
        }
      ]
    };
    const mockRequest = new MockRequest(headers, body);
    const mockResponse = new MockResponse();

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    function mainIntent (app) {
      let inputPrompt = app.buildInputPrompt(false, 'Welcome to action snippets! Say anything.');
      app.ask(inputPrompt);
    }

    function rawInputIntent (app) {
      app.tell('<speak>You said <break time="2"/>' + app.getRawInput() + '</speak>');
    }

    let actionMap = new Map();
    actionMap.set(app.StandardIntents.MAIN, mainIntent);
    actionMap.set(app.StandardIntents.TEXT, rawInputIntent);

    app.handleRequest(actionMap);

    // Validating the response object
    let expectedResponse = {
      'expect_user_response': false,
      'final_response': {
        'speech_response': {
          'ssml': '<speak>You said <break time="2"/>45</speak>'
        }
      }
    };
    expect(JSON.stringify(mockResponse.body)).to.equal(JSON.stringify(expectedResponse));
  });
});
