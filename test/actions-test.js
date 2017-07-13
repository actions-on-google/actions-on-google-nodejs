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
function apiAiAppRequestBodyNewSession () {
  return {
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
}

function createLiveSessionApiAppBody () {
  let tmp = apiAiAppRequestBodyNewSession();
  tmp.originalRequest.data.conversation.type = 2;
  return tmp;
}

// ---------------------------------------------------------------------------
//                   App helpers
// ---------------------------------------------------------------------------

/**
 * Describes the behavior for Assistant isNotApiVersionOne_ method.
 */
describe('ApiAiApp#isNotApiVersionOne_', function () {
  let mockResponse;
  let invalidHeader = {
    'Content-Type': 'application/json',
    'google-assistant-api-version': 'v1',
    'Google-Actions-API-Version': '1'
  };
  let headerV1 = {
    'Content-Type': 'application/json',
    'google-assistant-api-version': 'v1'
  };

  beforeEach(function () {
    mockResponse = new MockResponse();
  });

  it('Should detect Proto2 when header isn\'t present', function () {
    const mockRequest = new MockRequest(headerV1, {});
    const app = new ApiAiApp({request: mockRequest, response: mockResponse});
    expect(app.isNotApiVersionOne_()).to.equal(false);
  });

  it('Should detect v1 when header is present', function () {
    const mockRequest = new MockRequest(invalidHeader, {});
    const app = new ApiAiApp({request: mockRequest, response: mockResponse});
    expect(app.isNotApiVersionOne_()).to.equal(false);
  });

  it('Should detect v2 when version is present in APIAI req', function () {
    const mockRequest = new MockRequest(headerV1, {
      'originalRequest': {
        'version': 1
      }
    });
    const app = new ApiAiApp({request: mockRequest, response: mockResponse});
    expect(app.isNotApiVersionOne_()).to.equal(false);
  });

  it('Should detect v2 when header is present', function () {
    let headerWithV2 = JSON.parse(JSON.stringify(headerV1));
    headerWithV2['Google-Actions-API-Version'] = '2';
    const mockRequest = new MockRequest(headerWithV2, {});
    const app = new ApiAiApp({request: mockRequest, response: mockResponse});
    expect(app.isNotApiVersionOne_()).to.equal(true);
  });

  it('Should detect v2 when version is present in APIAI req', function () {
    const mockRequest = new MockRequest(headerV1, {
      'originalRequest': {
        'version': 2
      }
    });
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
    const mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyNewSession());
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
  const mockResponse = new MockResponse();

  // Calls sessionStarted when provided
  it('Calls sessionStarted when new session', function () {
    const mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyNewSession());
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
    const mockRequest = new MockRequest(headerV1, createLiveSessionApiAppBody());
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
    let bodyWithoutVersion = apiAiAppRequestBodyNewSession();
    bodyWithoutVersion.originalRequest = {'foo_prop': 'bar_val'};
    bodyWithoutVersion.foo_field = 'bar_val';
    bodyWithoutVersion.result.parameters.foo_param = 'blue';
    bodyWithoutVersion.result.fulfillment.messages[0]['foo_message'] = 'bar_val';
    bodyWithoutVersion.originalRequest['foo_prop'] = 'bar_val';

    const mockRequest = new MockRequest(headerV1, bodyWithoutVersion);
    const app = new ApiAiApp({request: mockRequest, response: mockResponse});

    expect(app.isNotApiVersionOne_()).to.equal(false);
    expect(app.body_['foo_field']).to.equal('bar_val');
    expect(app.body_.result.parameters['foo_param']).to.equal('blue');
    expect(app.body_.result.fulfillment.messages[0]['foo_message']).to.equal('bar_val');
    expect(app.body_.originalRequest['fooProp']).to.equal('bar_val');
  });

  it('Does detect v2 and not transform originalRequest when version is present', function () {
    let bodyWithVersion = apiAiAppRequestBodyNewSession();
    bodyWithVersion.originalRequest = {'foo_prop': 'bar_val', 'version': '2'};
    bodyWithVersion.foo_field = 'bar_val';
    bodyWithVersion.result.parameters.foo_param = 'blue';
    bodyWithVersion.result.fulfillment.messages[0]['foo_message'] = 'bar_val';
    bodyWithVersion.originalRequest['foo_prop'] = 'bar_val';

    const mockRequest = new MockRequest(headerV1, bodyWithVersion);
    const app = new ApiAiApp({request: mockRequest, response: mockResponse});

    expect(app.isNotApiVersionOne_()).to.equal(true);
    expect(app.body_['foo_field']).to.equal('bar_val');
    expect(app.body_.result.parameters['foo_param']).to.equal('blue');
    expect(app.body_.result.fulfillment.messages[0]['foo_message']).to.equal('bar_val');
    expect(app.body_.originalRequest['foo_prop']).to.equal('bar_val');
  });
});

/**
 * Describes the behavior for ApiAiApp tell method.
 */
describe('ApiAiApp#tell', function () {
  let mockResponse, body, mockRequest, app;

  beforeEach(function () {
    mockResponse = new MockResponse();
    body = createLiveSessionApiAppBody();
    mockRequest = new MockRequest(headerV1, body);
    app = new ApiAiApp({request: mockRequest, response: mockResponse});
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid JSON in the response object for the success case.', function () {
    app.tell('hello');
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

  it('Should return the valid simple response JSON in the response object for the success case.', function () {
    app.tell({speech: 'hello', displayText: 'hi'});
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
    expect(JSON.parse(JSON.stringify(mockResponse.body))).to.deep.equal(expectedResponse);
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid rich response JSON in the response object for the success case.', function () {
    app.tell(app.buildRichResponse()
          .addSimpleResponse({ speech: 'hello', displayText: 'hi' })
          .addSuggestions(['Say this', 'or this']));

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
    app.tell(app.buildRichResponse());
    expect(mockResponse.statusCode).to.equal(400);
  });
});

/**
 * Describes the behavior for ApiAiApp ask method.
 */
describe('ApiAiApp#ask', function () {
  let mockResponse, body, mockRequest, app;

  beforeEach(function () {
    mockResponse = new MockResponse();
    body = createLiveSessionApiAppBody();
    mockRequest = new MockRequest(headerV1, body);
    app = new ApiAiApp({request: mockRequest, response: mockResponse});
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid speech JSON in the response object for the success case.', function () {
    app.ask('hello');
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
    app.ask({speech: 'hello', displayText: 'hi'});
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
    app.ask(app.buildRichResponse()
          .addSimpleResponse({ speech: 'hello', displayText: 'hi' })
          .addSuggestions(['Say this', 'or this']));

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
    app.ask(app.buildRichResponse());
    expect(mockResponse.statusCode).to.equal(400);
  });
});

/**
 * Describes the behavior for ApiAiApp askWithList method.
 */
describe('ApiAiApp#askWithList', function () {
  let mockResponse, body, mockRequest, app;

  beforeEach(function () {
    mockResponse = new MockResponse();
    body = createLiveSessionApiAppBody();
    body.originalRequest.version = 2;
    mockRequest = new MockRequest(headerV1, body);
    app = new ApiAiApp({request: mockRequest, response: mockResponse});
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid list JSON in the response object for the success case.', function () {
    app.askWithList('Here is a list', app.buildList()
          .addItems([
            app.buildOptionItem('key_1', 'key one'),
            app.buildOptionItem('key_2', 'key two')
          ]));

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
    app.askWithList('Here is a list', app.buildList());
    expect(mockResponse.statusCode).to.equal(400);
  });
});

/**
 * Describes the behavior for ApiAiApp askWithCarousel method.
 */
describe('ApiAiApp#askWithCarousel', function () {
  let mockResponse, body, mockRequest, app;

  beforeEach(function () {
    mockResponse = new MockResponse();
    body = createLiveSessionApiAppBody();
    body.originalRequest.version = 2;
    mockRequest = new MockRequest(headerV1, body);
    app = new ApiAiApp({request: mockRequest, response: mockResponse});
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid carousel JSON in the response object for the success case.', function () {
    app.askWithCarousel('Here is a carousel',
          app.buildCarousel()
            .addItems([
              app.buildOptionItem('key_1', 'key one'),
              app.buildOptionItem('key_2', 'key two')
            ])
        );
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
    app.askWithCarousel('Here is a carousel',
          app.buildCarousel()
        );
    expect(mockResponse.statusCode).to.equal(400);
  });
});

/**
 * Describes the behavior for ApiAiApp askForPermissions method in v1.
 */
describe('ApiAiApp#askForPermissions', function () {
  let mockResponse, body, mockRequest, app;

  beforeEach(function () {
    mockResponse = new MockResponse();
    body = createLiveSessionApiAppBody();
    mockRequest = new MockRequest(headerV1, body);
    app = new ApiAiApp({request: mockRequest, response: mockResponse});
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid JSON in the response object for the success case.', function () {
    app.askForPermissions('To test', ['NAME', 'DEVICE_PRECISE_LOCATION']);
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
  let mockResponse, body, mockRequest, app;

  beforeEach(function () {
    mockResponse = new MockResponse();
    body = createLiveSessionApiAppBody();
    body.originalRequest.version = 2;
    mockRequest = new MockRequest(headerV1, body);
    app = new ApiAiApp({request: mockRequest, response: mockResponse});
  });

    // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid JSON in the response object for the success case.', function () {
    app.askForPermissions('To test', ['NAME', 'DEVICE_PRECISE_LOCATION']);
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
  let mockResponse, body, mockRequest, app;

  beforeEach(function () {
    mockResponse = new MockResponse();
    body = createLiveSessionApiAppBody();
    body.originalRequest.data.user.user_id = '11112226094657824893';
    mockRequest = new MockRequest(headerV1, body);
    app = new ApiAiApp({request: mockRequest, response: mockResponse});
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request user.', function () {
    // Test new and old API
    expect(app.getUser().user_id).to.equal('11112226094657824893');
    expect(app.getUser().userId).to.equal('11112226094657824893');
  });
});

/**
 * Describes the behavior for ApiAiApp getUserName method.
 */
describe('ApiAiApp#getUserName', function () {
  let mockResponse, body;

  beforeEach(function () {
    mockResponse = new MockResponse();
    body = createLiveSessionApiAppBody();
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request user.', function () {
    let mockRequest, app;
    body.originalRequest.data.user = {
      'user_id': '11112226094657824893',
      'profile': {
        'display_name': 'John Smith',
        'given_name': 'John',
        'family_name': 'Smith'
      }
    };
    mockRequest = new MockRequest(headerV1, body);
    app = new ApiAiApp({request: mockRequest, response: mockResponse});
    expect(app.getUserName().displayName).to.equal('John Smith');
    expect(app.getUserName().givenName).to.equal('John');
    expect(app.getUserName().familyName).to.equal('Smith');

    // Test the false case
    body.originalRequest.data.user.profile = undefined;
    mockRequest = new MockRequest(headerV1, body);
    app = new ApiAiApp({request: mockRequest, response: mockResponse});
    expect(app.getUserName()).to.equal(null);
  });
});

/**
 * Describes the behavior for ApiAiApp getUserLocale method.
 */
describe('ApiAiApp#getUserLocale', function () {
  let mockResponse, body;

  beforeEach(function () {
    mockResponse = new MockResponse();
    body = createLiveSessionApiAppBody();
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request user with locale.', function () {
    let mockRequest, app;
    mockRequest = new MockRequest(headerV1, body);
    app = new ApiAiApp({request: mockRequest, response: mockResponse});
    expect(app.getUserLocale()).to.equal('en-US');
  });

  // Failure case
  it('Should return null for missing locale.', function () {
    let mockRequest, app;
    body.originalRequest.data.user.locale = undefined;
    mockRequest = new MockRequest(headerV1, body);
    app = new ApiAiApp({request: mockRequest, response: mockResponse});
    expect(app.getUserLocale()).to.equal(null);
  });
});

/**
 * Describes the behavior for ApiAiApp getDeviceLocation method.
 */
describe('ApiAiApp#getDeviceLocation', function () {
  let mockResponse, mockRequest, body, app;

  beforeEach(function () {
    body = createLiveSessionApiAppBody();
    body.originalRequest.data.device = {
      'location': {
        'coordinates': {
          'latitude': 37.3861,
          'longitude': 122.0839
        },
        'formatted_address': '123 Main St, Anytown, CA 12345, United States',
        'zip_code': '12345',
        'city': 'Anytown'
      }
    };
  });

  function initMockApp () {
    mockRequest = new MockRequest(headerV1, body);
    mockResponse = new MockResponse();
    app = new ApiAiApp({request: mockRequest, response: mockResponse});
  }

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request user.', function () {
    initMockApp();
    expect(app.getDeviceLocation().coordinates).to.deep.equal({
      latitude: 37.3861,
      longitude: 122.0839
    });
    expect(app.getDeviceLocation().address)
      .to.equal('123 Main St, Anytown, CA 12345, United States');
    expect(app.getDeviceLocation().zipCode).to.equal('12345');
    expect(app.getDeviceLocation().city).to.equal('Anytown');
  });

  it('Should validate faulty assistant request user.', function () {
    // Test the false case
    body.originalRequest.data.device = undefined;
    initMockApp();
    expect(app.getDeviceLocation()).to.equal(null);
  });
});

/**
 * Describes the behavior for ApiAiApp getTransactionRequirementsResult method.
 */
describe('ApiAiApp#getTransactionRequirementsResult', function () {
  function addTransactionToBody () {
    let body = createLiveSessionApiAppBody();
    body.originalRequest.data.inputs[0].arguments = [
      {
        'extension': {
          'canTransact': true,
          '@type': 'type.googleapis.com/google.actions.v2.TransactionRequirementsCheckResult',
          'resultType': 'OK'
        },
        'name': 'TRANSACTION_REQUIREMENTS_CHECK_RESULT'
      }
    ];
    return body;
  }

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request transaction result.', function () {
    let body = addTransactionToBody();
    let mockRequest = new MockRequest(headerV1, body);
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
  let body, mockResponse;

  beforeEach(function () {
    body = createLiveSessionApiAppBody();
    body.originalRequest.data.inputs[0].arguments = [
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
    ];
    mockResponse = new MockResponse();
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request delivery address', function () {
    let mockRequest = new MockRequest(headerV1, body);
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
    body.originalRequest.data.inputs[0].arguments[0].name = 'TRANSACTION_DECISION_VALUE';
    let mockRequest = new MockRequest(headerV1, body);
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
    body.originalRequest.data.inputs[0].arguments[0].extension.userDecision = 'REJECTED';
    let mockRequest = new MockRequest(headerV1, body);
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
    let body = createLiveSessionApiAppBody();
    body.originalRequest.data.inputs[0].arguments = [
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
    ];
    let mockRequest = new MockRequest(headerV1, body);
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
    let body = createLiveSessionApiAppBody();
    body.originalRequest.data.inputs[0].arguments = [
      {
        'name': 'CONFIRMATION',
        'boolValue': true
      }
    ];
    let mockRequest = new MockRequest(headerV1, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });
    expect(app.getUserConfirmation()).to.equal(true);
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request negative user confirmation', function () {
    let body = createLiveSessionApiAppBody();
    body.originalRequest.data.inputs[0].arguments = [
      {
        'name': 'CONFIRMATION',
        'boolValue': false
      }
    ];
    let mockRequest = new MockRequest(headerV1, body);
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
    let body = createLiveSessionApiAppBody();
    body.originalRequest.data.inputs[0].arguments = [
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
    ];
    let mockRequest = new MockRequest(headerV1, body);
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
    let body = createLiveSessionApiAppBody();
    body.originalRequest.data.inputs[0].arguments = [];
    let mockRequest = new MockRequest(headerV1, body);
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
    let body = createLiveSessionApiAppBody();
    body.originalRequest.data.inputs[0].arguments = [
      {
        'name': 'SIGN_IN',
        'extension': {
          '@type': 'type.googleapis.com/google.actions.v2.SignInValue',
          'status': 'foo_status'
        }
      }
    ];
    let mockRequest = new MockRequest(headerV1, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getSignInStatus()).to.equal('foo_status');
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request missing sign in status', function () {
    let body = createLiveSessionApiAppBody();
    body.originalRequest.data.inputs[0].arguments = [];
    let mockRequest = new MockRequest(headerV1, body);
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
  let body, mockRequest, mockResponse, app;

  beforeEach(function () {
    body = createLiveSessionApiAppBody();
    mockRequest = new MockRequest(headerV2, body);
    mockResponse = new MockResponse();
    app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON transaction requirements with Google payment options', function () {
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

    app.askForTransactionRequirements(transactionConfig);

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
    let transactionConfig = {
      deliveryAddressRequired: true,
      type: 'BANK',
      displayName: 'Checking-4773'
    };

    app.askForTransactionRequirements(transactionConfig);

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
    let body = createLiveSessionApiAppBody();
    let mockRequest = new MockRequest(headerV2, body);
    let mockResponse = new MockResponse();

    let app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    app.askForDeliveryAddress('Just because');

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
  let body, app, mockRequest, mockResponse;

  beforeEach(function () {
    body = createLiveSessionApiAppBody();
    mockRequest = new MockRequest(headerV2, body);
    mockResponse = new MockResponse();
    app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });
  });
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON transaction decision with Google payment options', function () {
    let transactionConfig = {
      deliveryAddressRequired: true,
      tokenizationParameters: {
        myParam: 'myParam'
      },
      cardNetworks: [
        'VISA',
        'MASTERCARD'
      ],
      prepaidCardDisallowed: false,
      customerInfoOptions: [
        'EMAIL'
      ]
    };

    app.askForTransactionDecision({ fakeOrderId: 'order_id' }, transactionConfig);

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
                'requestDeliveryAddress': true,
                'customerInfoOptions': [
                  'EMAIL'
                ]
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
    let transactionConfig = {
      deliveryAddressRequired: true,
      type: 'BANK',
      displayName: 'Checking-4773',
      customerInfoOptions: [
        'EMAIL'
      ]
    };

    app.askForTransactionDecision({ fakeOrderId: 'order_id' }, transactionConfig);

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
                'requestDeliveryAddress': true,
                'customerInfoOptions': [
                  'EMAIL'
                ]
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
  let body, app, mockRequest, mockResponse;

  beforeEach(function () {
    body = createLiveSessionApiAppBody();
    mockRequest = new MockRequest(headerV2, body);
    mockResponse = new MockResponse();
    app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON confirmation request', function () {
    app.askForConfirmation('You want to do that?');
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
    app.askForConfirmation();

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
  let body, app, mockRequest, mockResponse;

  beforeEach(function () {
    body = createLiveSessionApiAppBody();
    mockRequest = new MockRequest(headerV2, body);
    mockResponse = new MockResponse();
    app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON datetime request', function () {
    app.askForDateTime('When do you want to come in?',
        'What is the best date for you?',
        'What time of day works best for you?');

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
    app.askForDateTime('When do you want to come in?', null);
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
    app.askForDateTime();

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
  let body, app, mockRequest, mockResponse;

  beforeEach(function () {
    body = createLiveSessionApiAppBody();
    mockRequest = new MockRequest(headerV2, body);
    mockResponse = new MockResponse();
    app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON sign in request', function () {
    app.askForSignIn();
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
  let body, app, mockRequest, mockResponse;

  function initMockApp () {
    mockRequest = new MockRequest(headerV1, body);
    mockResponse = new MockResponse();
    app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });
  }

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request user.', function () {
    body = createLiveSessionApiAppBody();
    body.originalRequest.data.inputs[0].arguments = [{
      'name': 'permission_granted',
      'text_value': 'true'
    }];
    initMockApp();
    expect(app.isPermissionGranted()).to.equal(true);

    // Test the false case
    body.originalRequest.data.inputs[0].arguments[0].text_value = false;
    initMockApp();
    expect(app.isPermissionGranted()).to.equal(false);
  });
});

/**
 * Describes the behavior for ApiAiApp isInSandbox method.
 */
describe('ApiAiApp#isInSandbox', function () {
  let body, app, mockRequest, mockResponse;

  function initMockApp () {
    mockRequest = new MockRequest(headerV1, body);
    mockResponse = new MockResponse();
    app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });
  }

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request user.', function () {
    body = createLiveSessionApiAppBody();
    body.originalRequest.data.isInSandbox = true;
    initMockApp();
    expect(app.isInSandbox()).to.be.true;

    // Test the false case
    body.originalRequest.data.isInSandbox = false;
    initMockApp();
    expect(app.isInSandbox()).to.be.false;
  });
});

/**
 * Describes the behavior for ApiAiApp getIntent method.
 */
describe('ApiAiApp#getIntent', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should get the intent value for the success case.', function () {
    let body = createLiveSessionApiAppBody();
    body.result.action = 'check_guess';
    const mockRequest = new MockRequest(headerV1, body);
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
    let body = createLiveSessionApiAppBody();
    body.result.parameters.guess = '50';
    body.originalRequest.data.inputs[0].arguments = [
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
    ];
    const mockRequest = new MockRequest(headerV1, body);
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
    let body = createLiveSessionApiAppBody();
    body.result.contexts = [
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
          'guess.original': '51',
          'guess': '50'
        },
        'lifespan': 99
      }
    ];
    const mockRequest = new MockRequest(headerV1, body);
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
    let body = createLiveSessionApiAppBody();
    body.result.fulfillment.messages = [
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
    ];

    const mockRequest = new MockRequest(headerV1, body);
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
    let body = createLiveSessionApiAppBody();
    body.result.fulfillment.messages.push({
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
    });
    const mockRequest = new MockRequest(headerV1, body);
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
    let body = createLiveSessionApiAppBody();
    body.result.fulfillment.messages.push({
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
    });

    const mockRequest = new MockRequest(headerV1, body);
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
  let mockRequest, mockResponse, app;
  beforeEach(function () {
    mockRequest = new MockRequest(headerV1, {});
    mockResponse = new MockResponse();
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should get the selected option when given in APIAI context.', function () {
    let body = createLiveSessionApiAppBody();
    body.originalRequest.data.inputs[0] = {
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
    };
    body.result.contexts = [
      {
        'name': 'actions_intent_option',
        'parameters': {
          'OPTION': 'first_item'
        },
        'lifespan': 0
      }
    ];
    mockRequest.body = body;
    app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });
    expect(app.getSelectedOption()).to.equal('first_item');
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should get the selected option when not given in APIAI context.', function () {
    let body = createLiveSessionApiAppBody();
    body.originalRequest.data.inputs[0] = {
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
    };
    mockRequest.body = body;
    app = new ApiAiApp({
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
    let header = JSON.parse(JSON.stringify(headerV1));
    header['Google-Assistant-Signature'] = 'YOUR_PRIVATE_KEY';
    const mockRequest = new MockRequest(header, createLiveSessionApiAppBody());
    const mockResponse = new MockResponse();

    const app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    const HEADER_KEY = 'Google-Assistant-Signature';
    const HEADER_VALUE = 'YOUR_PRIVATE_KEY';

    expect(app.isRequestFromApiAi(HEADER_KEY, HEADER_VALUE)).to.equal(true);
  });

  it('Should confirm request is NOT from API.ai.', function () {
    let header = JSON.parse(JSON.stringify(headerV1));
    let body = createLiveSessionApiAppBody();
    const mockRequest = new MockRequest(header, body);
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
    let body = createLiveSessionApiAppBody();
    body.originalRequest.data.surface = {
      'capabilities': [
        {
          'name': 'actions.capability.AUDIO_OUTPUT'
        },
        {
          'name': 'actions.capability.SCREEN_OUTPUT'
        }
      ]
    };

    let mockRequest = new MockRequest(headerV1, body);
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
    let body = createLiveSessionApiAppBody();
    body.originalRequest.data.surface = {
      'capabilities': [
        {
          'name': 'actions.capability.AUDIO_OUTPUT'
        },
        {
          'name': 'actions.capability.SCREEN_OUTPUT'
        }
      ]
    };

    let mockRequest = new MockRequest(headerV1, body);
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
    let body = createLiveSessionApiAppBody();
    const KEYBOARD = 3;
    body.originalRequest.data.inputs = [
      {
        'raw_inputs': [
          {
            'input_type': KEYBOARD
          }
        ]
      }
    ];
    let mockRequest = new MockRequest(headerV1, body);
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
    let body = createLiveSessionApiAppBody();
    body.result.resolvedQuery = 'is it 667';

    const mockRequest = new MockRequest(headerV1, body);
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
    let body = createLiveSessionApiAppBody();
    const mockRequest = new MockRequest(headerV1, body);
    const mockResponse = new MockResponse();
    const app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    const CONTEXT_NUMBER = 'number';
    app.setContext(CONTEXT_NUMBER);
    app.ask('Welcome to action snippets! Say a number.');

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
          'name': CONTEXT_NUMBER,
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
  let body, app, mockRequest, mockResponse;

  beforeEach(function () {
    body = createLiveSessionApiAppBody();
    mockRequest = new MockRequest(headerV1, body);
    mockResponse = new MockResponse();
  });

  function initMockApp () {
    app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });
  }

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the active contexts from incoming JSON for the success case.', function () {
      // let body = createLiveSessionApiAppBody();
    body.result.contexts = [
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
    ];
    mockRequest.body = body;
    initMockApp();
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
  });
  it('Should return the active contexts from incoming JSON when only app.data incoming', function () {
    body.result.contexts = [{'name': '_actions_on_google_'}];
    mockRequest.body = body;
    initMockApp();
    let mockContexts = app.getContexts();
    let expectedContexts = [];
    expect(mockContexts).to.deep.equal(expectedContexts);
  });
  it('Should return the active contexts from incoming JSON when no contexts provided.', function () {
    // Check the empty case
    body.result.contexts = [];
    mockRequest.body = body;
    initMockApp();
    let mockContexts = app.getContexts();
    let expectedContexts = [];
    expect(mockContexts).to.deep.equal(expectedContexts);
  });
});

/**
 * Describes the behavior for ApiAiApp getContext method.
 */
describe('ApiAiApp#getContext', function () {
  let body, app, mockRequest, mockResponse;

  beforeEach(function () {
    body = createLiveSessionApiAppBody();
    mockRequest = new MockRequest(headerV1, body);
    mockResponse = new MockResponse();
  });

  function initMockApp () {
    app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });
  }

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the context by name from incoming JSON for the success case.', function () {
    let body = createLiveSessionApiAppBody();
    body.result.contexts = [{
      'name': 'number',
      'lifespan': 5,
      'parameters': {
        'parameterOne': '23',
        'parameterTwo': '24'
      }
    }];
    mockRequest.body = body;
    initMockApp();

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
  });

  it('Should return the context by name from incoming JSON when no context provided.', function () {
    //  Check the empty case
    body.result.contexts = [];
    mockRequest.body = body;
    initMockApp();
    let mockContext = app.getContext('name');
    let expectedContext = null;
    expect(mockContext).to.equal(expectedContext);
  });
});

/**
 * Describes the behavior for ApiAiApp ask with no inputs method.
 */
describe('ApiAiApp#ask', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid JSON in the response object for the success case.', function () {
    let body = createLiveSessionApiAppBody();
    const mockRequest = new MockRequest(headerV1, body);
    const mockResponse = new MockResponse();
    const app = new ApiAiApp({
      request: mockRequest,
      response: mockResponse
    });

    app.ask('Welcome to action snippets! Say a number.',
      ['Say any number', 'Pick a number', 'What is the number?']);

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

function actionsSdkAppRequestBodyNewSession () {
  return {
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
}

function createLiveSessionActionsSdkAppBody () {
  let tmp = actionsSdkAppRequestBodyNewSession();
  tmp.conversation.type = 2;
  return tmp;
}

/**
 * Describes the behavior for ApiAiApp constructor method.
 */
describe('ActionsSdkApp#constructor', function () {
  let mockResponse;

  beforeEach(function () {
    mockResponse = new MockResponse();
  });

  // Calls sessionStarted when provided
  it('Calls sessionStarted when new session', function () {
    const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyNewSession());
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
    const mockRequest = new MockRequest(headerV1, createLiveSessionActionsSdkAppBody());
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
    const mockRequest = new MockRequest(headerV1, createLiveSessionActionsSdkAppBody());
    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });
    app.handleRequest();
    expect(app.body_).to.deep.equal({
      'user': {
        'userId': fakeUserId
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
    expect(app.body_).to.deep.not.equal(createLiveSessionActionsSdkAppBody());
  });

  // Does not transform to Proto3
  it('Does detect v2 and not transform body when version is present', function () {
    const mockRequest = new MockRequest(headerV2, createLiveSessionActionsSdkAppBody());

    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    app.handleRequest();

    expect(app.body_).to.deep.equal(createLiveSessionActionsSdkAppBody());
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
 * Describes the behavior for ActionsSdkApp ask method.
 */
describe('ActionsSdkApp#ask', function () {
  let mockRequest, mockResponse, app;

  beforeEach(function () {
    mockRequest = new MockRequest(headerV1, createLiveSessionActionsSdkAppBody());
    mockResponse = new MockResponse();
    app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });
  });

    // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid JSON in the response object for the success case.', function () {
    let inputPrompt = app.buildInputPrompt(true, '<speak>Hi! <break time="1"/> ' +
      'I can read out an ordinal like ' +
      '<say-as interpret-as="ordinal">123</say-as>. Say a number.</speak>',
      ['I didn\'t hear a number', 'If you\'re still there, what\'s the number?', 'What is the number?']);
    app.ask(inputPrompt);

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

  it('Should return the valid JSON in the response object for the success case when String text was asked w/o input prompts.', function () {
    app.ask('What can I help you with?');
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

  it('Should return the valid JSON in the response object for the success case when SSML text was asked w/o input prompts.', function () {
    app.ask('<speak>What <break time="1"/> can I help you with?</speak>');
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

  it('Should return the valid JSON in the response object for the advanced success case.', function () {
    let inputPrompt = app.buildInputPrompt(false, 'Welcome to action snippets! Say a number.',
      ['Say any number', 'Pick a number', 'What is the number?']);
    app.ask(inputPrompt);
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

  it('Should return the valid simple response JSON in the response object for the success case.', function () {
    app.ask({ speech: 'hello', displayText: 'hi' });
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
    app.ask(app.buildRichResponse()
      .addSimpleResponse({ speech: 'hello', displayText: 'hi' })
      .addSuggestions(['Say this', 'or this']));

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
 * Describes the behavior for ActionsSdkApp tell method.
 */
describe('ActionsSdkApp#tell', function () {
  let mockRequest, mockResponse, app;

  beforeEach(function () {
    mockRequest = new MockRequest(headerV1, createLiveSessionActionsSdkAppBody());
    mockResponse = new MockResponse();
    app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid JSON in the response object for the success case.', function () {
    app.tell('Goodbye!');
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
  it('Should return the valid simple rich response JSON in the response object for the success case.', function () {
    app.tell({ speech: 'hello', displayText: 'hi' });

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
    app.tell(app.buildRichResponse()
      .addSimpleResponse({ speech: 'hello', displayText: 'hi' })
      .addSuggestions(['Say this', 'or this']));

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
    function handler (app) {
      return new Promise(function (resolve, reject) {
        resolve(app.tell(app.buildRichResponse()));
      });
    }

    let actionMap = new Map();
    actionMap.set('intent_name_not_present_in_the_body', handler);

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
    let body = createLiveSessionActionsSdkAppBody();
    body.inputs[0].raw_inputs = [
      {
        'input_type': 2,
        'query': 'bye'
      }
    ];
    const mockRequest = new MockRequest(headerV1, body);
    const mockResponse = new MockResponse();
    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });
    expect(app.getRawInput()).to.equal('bye');
  });
});

/**
 * Describes the behavior for ActionsSdkApp askWithList method.
 */
describe('ActionsSdkApp#askWithList', function () {
  let mockRequest, mockResponse, app;
  beforeEach(function () {
    mockRequest = new MockRequest(headerV2, createLiveSessionActionsSdkAppBody());
    mockResponse = new MockResponse();
    app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });
  });
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid list JSON in the response object for the success case.', function () {
    app.askWithList('Here is a list', app.buildList()
      .addItems([
        app.buildOptionItem('key_1', 'key one'),
        app.buildOptionItem('key_2', 'key two')
      ]), {
        optionType: 'list'
      });

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
    app.askWithList('Here is a list', app.buildList(), {
      optionType: 'list'
    });
    expect(mockResponse.statusCode).to.equal(400);
  });
});

/**
 * Describes the behavior for ActionsSdkApp askWithCarousel method.
 */
describe('ActionsSdkApp#askWithCarousel', function () {
  let mockRequest, mockResponse, app;
  beforeEach(function () {
    mockRequest = new MockRequest(headerV2, createLiveSessionActionsSdkAppBody());
    mockResponse = new MockResponse();
    app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });
  });
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid carousel JSON in the response object for the success case.', function () {
    app.askWithCarousel('Here is a carousel', app.buildCarousel()
      .addItems([
        app.buildOptionItem('key_1', 'key one'),
        app.buildOptionItem('key_2', 'key two')
      ]), {
        optionType: 'carousel'
      });

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
    app.askWithList('Here is a list', app.buildList(), {
      optionType: 'list'
    });

    expect(mockResponse.statusCode).to.equal(400);
  });
});

/**
 * Describes the behavior for ActionsSdkApp askForPermissions method in v1.
 */
describe('ActionsSdkApp#askForPermissions', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return the valid JSON in the response object for the success case.', function () {
    const mockRequest = new MockRequest(headerV1, createLiveSessionActionsSdkAppBody());
    const mockResponse = new MockResponse();
    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    app.askForPermissions('To get you a ride', [
      app.SupportedPermissions.NAME,
      app.SupportedPermissions.DEVICE_PRECISE_LOCATION
    ], {
      carType: 'big'
    });

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

  it('Should return the valid JSON in the response object for the success case in v2.', function () {
    const mockRequest = new MockRequest(headerV2, createLiveSessionActionsSdkAppBody());
    const mockResponse = new MockResponse();
    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });
    app.askForPermissions('To get you a ride', [
      app.SupportedPermissions.NAME,
      app.SupportedPermissions.DEVICE_PRECISE_LOCATION
    ], {
      carType: 'big'
    });
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
  let mockRequest, mockResponse, app;
  beforeEach(function () {
    mockRequest = new MockRequest(headerV2, createLiveSessionActionsSdkAppBody());
    mockResponse = new MockResponse();
    app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });
  });
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON transaction requirements with Google payment options', function () {
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
    app.askForTransactionRequirements(transactionConfig, { cartSize: 2 });
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
    let transactionConfig = {
      deliveryAddressRequired: true,
      type: 'BANK',
      displayName: 'Checking-4773'
    };
    app.askForTransactionRequirements(transactionConfig, { cartSize: 2 });
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
    let mockRequest = new MockRequest(headerV2, createLiveSessionActionsSdkAppBody());
    let mockResponse = new MockResponse();
    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });
    app.askForDeliveryAddress('Just because', { cartSize: 2 });
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
  let mockRequest, mockResponse, app;
  beforeEach(function () {
    mockRequest = new MockRequest(headerV2, createLiveSessionActionsSdkAppBody());
    mockResponse = new MockResponse();
    app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });
  });
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON transaction decision with Google payment options', function () {
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
    app.askForTransactionDecision({fakeOrderId: 'order_id'}, transactionConfig,
      {cartSize: 2});
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
    let transactionConfig = {
      deliveryAddressRequired: true,
      type: 'BANK',
      displayName: 'Checking-4773'
    };
    app.askForTransactionDecision({fakeOrderId: 'order_id'}, transactionConfig,
      {cartSize: 2});
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
  let mockRequest, mockResponse, app;
  beforeEach(function () {
    mockRequest = new MockRequest(headerV2, createLiveSessionActionsSdkAppBody());
    mockResponse = new MockResponse();
    app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });
  });
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON confirmation request', function () {
    app.askForConfirmation('You want to do that?', {cartSize: 2});
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
    app.askForConfirmation();
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
  let mockRequest, mockResponse, app;
  beforeEach(function () {
    mockRequest = new MockRequest(headerV2, createLiveSessionActionsSdkAppBody());
    mockResponse = new MockResponse();
    app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });
  });
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should return valid JSON datetime request', function () {
    app.askForDateTime('When do you want to come in?',
      'What is the best date for you?',
      'What time of day works best for you?', { cartSize: 2 });

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
    app.askForDateTime('When do you want to come in?',
      null);
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
    app.askForDateTime();
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
    let mockRequest = new MockRequest(headerV2, createLiveSessionActionsSdkAppBody());
    let mockResponse = new MockResponse();
    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });
    app.askForSignIn({cartSize: 2});
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
    const mockRequest = new MockRequest(headerV1, createLiveSessionActionsSdkAppBody());
    const mockResponse = new MockResponse();
    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });
    // Test new and old API
    expect(app.getUser().user_id).to.equal(fakeUserId);
    expect(app.getUser().userId).to.equal(fakeUserId);
  });
});

/**
 * Describes the behavior for ActionsSdkApp getUserName method.
 */
describe('ActionsSdkApp#getUserName', function () {
  let mockRequest, mockResponse, app, body;
  function initMockApp () {
    mockRequest = new MockRequest(headerV1, body);
    mockResponse = new MockResponse();
    app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });
  }
  it('Should validate assistant request user with sample user information.', function () {
    body = createLiveSessionActionsSdkAppBody();
    body.user.profile = {
      'display_name': 'John Smith',
      'given_name': 'John',
      'family_name': 'Smith'
    };
    initMockApp();
    expect(app.getUserName().displayName).to.equal('John Smith');
    expect(app.getUserName().givenName).to.equal('John');
    expect(app.getUserName().familyName).to.equal('Smith');
  });

  it('Should validate assistant request with undefined user information.', function () {
    body = createLiveSessionActionsSdkAppBody();
    // Test the false case
    body.user.profile = undefined;
    initMockApp();
    expect(app.getUserName()).to.equal(null);
  });
});

/**
 * Describes the behavior for ActionsSdkApp getUserLocale method.
 */
describe('ActionsSdkApp#getUserLocale', function () {
  let mockRequest, mockResponse, app, body;
  function initMockApp () {
    mockRequest = new MockRequest(headerV1, body);
    mockResponse = new MockResponse();
    app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });
  }
  it('Should validate assistant request user with locale.', function () {
    body = createLiveSessionActionsSdkAppBody();
    body.user.locale = 'en-US';
    initMockApp();
    expect(app.getUserLocale()).to.equal('en-US');
  });

  it('Should return null for missing locale.', function () {
    body = createLiveSessionActionsSdkAppBody();
    // Test the false case
    body.user.locale = undefined;
    initMockApp();
    expect(app.getUserLocale()).to.equal(null);
  });
});

/**
 * Describes the behavior for ActionsSdkApp getTransactionRequirementsResult method.
 */
describe('ActionsSdkApp#getTransactionRequirementsResult', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request user.', function () {
    let body = createLiveSessionActionsSdkAppBody();
    body.inputs[0].arguments = [
      {
        'extension': {
          'canTransact': true,
          '@type': 'type.googleapis.com/google.actions.v2.TransactionRequirementsCheckResult',
          'resultType': 'OK'
        },
        'name': 'TRANSACTION_REQUIREMENTS_CHECK_RESULT'
      }
    ];

    let mockRequest = new MockRequest(headerV2, body);
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
  let body;

  beforeEach(function () {
    body = createLiveSessionActionsSdkAppBody();
    body.inputs[0].arguments = [
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
    ];
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant request delivery address', function () {
    let mockRequest = new MockRequest(headerV1, body);
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
    body.inputs[0].arguments.name = 'DELIVERY_ADDRESS_VALUE';
    let mockRequest = new MockRequest(headerV1, body);
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
    body.inputs[0].arguments[0].extension.userDecision = 'REJECTED';
    let mockRequest = new MockRequest(headerV1, body);
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
    let body = createLiveSessionActionsSdkAppBody();
    body.inputs[0].arguments = [
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
    ];
    let mockRequest = new MockRequest(headerV2, body);
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
    let body = createLiveSessionActionsSdkAppBody();
    body.inputs[0].arguments = [
      {
        'name': 'CONFIRMATION',
        'boolValue': true
      }
    ];
    let mockRequest = new MockRequest(headerV2, body);
    let mockResponse = new MockResponse();
    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getUserConfirmation()).to.equal(true);
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant negative confirmation decision', function () {
    let body = createLiveSessionActionsSdkAppBody();
    body.inputs[0].arguments = [
      {
        'name': 'CONFIRMATION',
        'boolValue': false
      }
    ];
    let mockRequest = new MockRequest(headerV2, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getUserConfirmation()).to.equal(false);
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant missing confirmation decision', function () {
    let body = createLiveSessionActionsSdkAppBody();
    body.inputs[0].arguments = [];
    let mockRequest = new MockRequest(headerV2, body);
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
    let body = createLiveSessionActionsSdkAppBody();
    body.inputs[0].arguments = [
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
    ];
    let mockRequest = new MockRequest(headerV2, body);
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
    let body = createLiveSessionActionsSdkAppBody();
    body.inputs[0].arguments = [];
    let mockRequest = new MockRequest(headerV2, body);
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
    let body = createLiveSessionActionsSdkAppBody();
    body.inputs[0].arguments = [
      {
        'name': 'SIGN_IN',
        'extension': {
          '@type': 'type.googleapis.com/google.actions.v2.SignInValue',
          'status': 'foo_status'
        }
      }
    ];
    let mockRequest = new MockRequest(headerV2, body);
    let mockResponse = new MockResponse();
    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.getSignInStatus()).to.deep.equal('foo_status');
  });

  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant missing sign in status', function () {
    let body = createLiveSessionActionsSdkAppBody();
    body.inputs[0].arguments = [];
    let mockRequest = new MockRequest(headerV2, body);
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
  it('Should validate assistant request for device location when location is provided.', function () {
    let body = createLiveSessionActionsSdkAppBody();
    body.device = {
      'location': {
        'coordinates': {
          'latitude': 37.3861,
          'longitude': 122.0839
        },
        'formatted_address': '123 Main St, Anytown, CA 12345, United States',
        'zip_code': '12345',
        'city': 'Anytown'
      }
    };
    let mockRequest = new MockRequest(headerV1, body);
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
  });

  it('Should validate assistant request for device location when location is undefined.', function () {
    // Test the false case
    let body = createLiveSessionActionsSdkAppBody();
    body.device = undefined;
    let mockRequest = new MockRequest(headerV1, body);
    let mockResponse = new MockResponse();
    let app = new ActionsSdkApp({
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
  it('Should validate when permissions were granted.', function () {
    let body = createLiveSessionActionsSdkAppBody();
    body.inputs[0].arguments = [
      {
        'name': 'permission_granted',
        'text_value': 'true'
      }
    ];

    let mockRequest = new MockRequest(headerV1, body);
    let mockResponse = new MockResponse();

    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });

    expect(app.isPermissionGranted()).to.equal(true);
  });

  it('Should validate when permissions were not granted.', function () {
    // Test the false case
    let body = createLiveSessionActionsSdkAppBody();
    body.inputs[0].arguments = [
      {
        'name': 'permission_granted',
        'text_value': 'false'
      }
    ];
    let mockRequest = new MockRequest(headerV1, body);
    let mockResponse = new MockResponse();
    let app = new ActionsSdkApp({
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
  it('Should validate when app is in sandbox mode.', function () {
    let body = createLiveSessionActionsSdkAppBody();
    body.isInSandbox = true;
    let mockRequest = new MockRequest(headerV2, body);
    let mockResponse = new MockResponse();
    let app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });
    expect(app.isInSandbox()).to.be.true;
  });
  it('Should validate when app is not in sandbox mode.', function () {
    // Test the false case
    let body = createLiveSessionActionsSdkAppBody();
    body.isInSandbox = false;
    let mockRequest = new MockRequest(headerV2, body);
    let mockResponse = new MockResponse();
    let app = new ActionsSdkApp({
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
    let body = createLiveSessionActionsSdkAppBody();
    body.surface = {
      'capabilities': [
        {
          'name': 'actions.capability.AUDIO_OUTPUT'
        },
        {
          'name': 'actions.capability.SCREEN_OUTPUT'
        }
      ]
    };
    let mockRequest = new MockRequest(headerV1, body);
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
    let body = createLiveSessionActionsSdkAppBody();
    body.surface = {
      'capabilities': [
        {
          'name': 'actions.capability.AUDIO_OUTPUT'
        },
        {
          'name': 'actions.capability.SCREEN_OUTPUT'
        }
      ]
    };

    let mockRequest = new MockRequest(headerV1, body);
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
    const KEYBOARD = 3;
    let body = createLiveSessionActionsSdkAppBody();
    body.inputs[0].raw_inputs = [
      {
        'input_type': KEYBOARD,
        'query': 'talk to action snippets'
      }
    ];
    let mockRequest = new MockRequest(headerV1, body);
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
    const mockRequest = new MockRequest(headers, createLiveSessionActionsSdkAppBody());
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
    let body = createLiveSessionActionsSdkAppBody();
    body.conversation.conversation_token = '{"started":true}';
    const mockRequest = new MockRequest(headerV1, body);
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
    let headers = JSON.parse(JSON.stringify(headerV1));
    headers['Agent-Version-Label'] = '1.0.0';
    const mockRequest = new MockRequest(headers, createLiveSessionActionsSdkAppBody());
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
    let body = createLiveSessionActionsSdkAppBody();
    body.conversation.conversation_id = fakeConversationId;
    const mockRequest = new MockRequest(headerV1, body);
    const mockResponse = new MockResponse();
    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });
    expect(app.getConversationId()).to.equal(fakeConversationId);
  });
});

/**
 * Describes the behavior for ActionsSdkApp getArgument method.
 */
describe('ActionsSdkApp#getArgument', function () {
  // Success case test, when the API returns a valid 200 response with the response object
  it('Should validate assistant intent.', function () {
    let body = createLiveSessionActionsSdkAppBody();
    body.inputs[0].arguments = [
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
    ];
    const mockRequest = new MockRequest(headerV1, body);
    const mockResponse = new MockResponse();
    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });
    expect(app.getArgument('number')).to.equal('45');
    expect(app.getArgument('other_value')).to.deep.equal({
      'name': 'other_value',
      'raw_text': '45',
      'other_value': {
        'key': 'value'
      }
    });
    app.tell('You said ' + app.getArgument('number'));
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
    let body = createLiveSessionActionsSdkAppBody();
    body.inputs[0].arguments = [
      {
        'name': 'OPTION',
        'text_value': 'first_item'
      }
    ];
    const mockRequest = new MockRequest(headerV1, body);
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
    let body = createLiveSessionActionsSdkAppBody();
    body.inputs[0].raw_inputs = [
      {
        'input_type': 2,
        'query': '45'
      }
    ];
    const mockRequest = new MockRequest(headerV1, body);
    const mockResponse = new MockResponse();
    const app = new ActionsSdkApp({
      request: mockRequest,
      response: mockResponse
    });
    app.tell('<speak>You said <break time="2"/>' + app.getRawInput() + '</speak>');
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
