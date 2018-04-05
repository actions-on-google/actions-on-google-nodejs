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

// Enable actions-on-google debug logging
process.env.DEBUG = 'actions-on-google:*';

/**
 * Test suite for the Dialogflow client library.
 */
const winston = require('winston');
const chai = require('chai');
const { expect } = chai;
const spies = require('chai-spies');
const { DialogflowApp } = require('.././actions-on-google');
const {
  RichResponse,
  BasicCard,
  List,
  Carousel,
  OptionItem
} = require('.././response-builder');
const {
  dialogflowAppRequestBodyNewSessionMock,
  dialogflowAppRequestBodyLiveSessionMock,
  headerV1,
  headerV2,
  MockResponse,
  MockRequest,
  clone
} = require('./utils/mocking');

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

// ---------------------------------------------------------------------------
//                   Dialogflow support
// ---------------------------------------------------------------------------
describe('DialogflowApp', function () {
  let dialogflowAppRequestBodyNewSession, dialogflowAppRequestBodyLiveSession, mockResponse;

  beforeEach(function () {
    dialogflowAppRequestBodyNewSession = clone(dialogflowAppRequestBodyNewSessionMock);
    dialogflowAppRequestBodyLiveSession = clone(dialogflowAppRequestBodyLiveSessionMock);
    mockResponse = new MockResponse();
  });

  /**
   * Describes the behavior for DialogflowApp constructor method.
   */
  describe('#constructor', function () {
    // Calls sessionStarted when provided
    it('Calls sessionStarted when new session', function () {
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyNewSession);
      const sessionStartedSpy = chai.spy();
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse,
        sessionStarted: sessionStartedSpy
      });
      app.handleRequest();
      expect(sessionStartedSpy).to.have.been.called();
    });

    // Does not call sessionStarted when not new session
    it('Does not call sessionStarted when not new session ', function () {
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      const sessionStartedSpy = chai.spy();
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse,
        sessionStarted: sessionStartedSpy
      });
      app.handleRequest();
      expect(sessionStartedSpy).to.not.have.been.called();
    });

    // Test a change made for backwards compatibility with legacy sample code
    it('Does initialize StandardIntents without an options object', function () {
      const app = new DialogflowApp();
      expect(app.StandardIntents.MAIN).to.equal('assistant.intent.action.MAIN');
      expect(app.StandardIntents.TEXT).to.equal('assistant.intent.action.TEXT');
      expect(app.StandardIntents.PERMISSION).to
        .equal('assistant.intent.action.PERMISSION');
    });

    it('Does not detect v2 and transform originalRequest when version not present', function () {
      const bodyWithoutVersion = dialogflowAppRequestBodyNewSession;
      bodyWithoutVersion.originalRequest = { 'foo_prop': 'bar_val' };
      bodyWithoutVersion.foo_field = 'bar_val';
      bodyWithoutVersion.result.parameters.foo_param = 'blue';
      bodyWithoutVersion.result.fulfillment.messages[0]['foo_message'] = 'bar_val';
      bodyWithoutVersion.originalRequest['foo_prop'] = 'bar_val';

      const mockRequest = new MockRequest(headerV1, bodyWithoutVersion);
      const app = new DialogflowApp({ request: mockRequest, response: mockResponse });

      expect(app.isNotApiVersionOne_()).to.equal(false);
      expect(app.body_['foo_field']).to.equal('bar_val');
      expect(app.body_.result.parameters['foo_param']).to.equal('blue');
      expect(app.body_.result.fulfillment.messages[0]['foo_message']).to.equal('bar_val');
      expect(app.body_.originalRequest['fooProp']).to.equal('bar_val');
    });

    it('Does detect v2 and not transform originalRequest when version is present', function () {
      const bodyWithVersion = dialogflowAppRequestBodyNewSession;
      bodyWithVersion.originalRequest = { 'foo_prop': 'bar_val', 'version': '2' };
      bodyWithVersion.foo_field = 'bar_val';
      bodyWithVersion.result.parameters.foo_param = 'blue';
      bodyWithVersion.result.fulfillment.messages[0]['foo_message'] = 'bar_val';
      bodyWithVersion.originalRequest['foo_prop'] = 'bar_val';

      const mockRequest = new MockRequest(headerV1, bodyWithVersion);
      const app = new DialogflowApp({ request: mockRequest, response: mockResponse });

      expect(app.isNotApiVersionOne_()).to.equal(true);
      expect(app.body_['foo_field']).to.equal('bar_val');
      expect(app.body_.result.parameters['foo_param']).to.equal('blue');
      expect(app.body_.result.fulfillment.messages[0]['foo_message']).to.equal('bar_val');
      expect(app.body_.originalRequest['foo_prop']).to.equal('bar_val');
    });
  });

  /**
   * Describes the behavior for DialogflowApp tell method.
   */
  describe('#tell', function () {
    let mockRequest, app;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({ request: mockRequest, response: mockResponse });
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return the valid JSON in the response object for the success case.', function () {
      app.tell('hello');
      const expectedResponse = {
        'speech': 'hello',
        'data': {
          'google': {
            'user_storage': '{"data":{}}',
            'expect_user_response': false,
            'is_ssml': false,
            'no_input_prompts': []
          }
        },
        contextOut: []
      };
      expect(mockResponse.body).to.deep.equal(expectedResponse);
    });

    it('Should return the valid simple response JSON in the response object for the success case.',
      function () {
        app.tell({ speech: 'hello', displayText: 'hi' });
        // Validating the response object
        const expectedResponse = {
          'speech': 'hello',
          'data': {
            'google': {
              'user_storage': '{"data":{}}',
              'expect_user_response': false,
              'no_input_prompts': [],
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
        expect(clone(mockResponse.body)).to.deep.equal(expectedResponse);
      });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return the valid rich response JSON in the response object for the success case.',
      function () {
        app.tell(app.buildRichResponse()
          .addSimpleResponse({ speech: 'hello', displayText: 'hi' })
          .addSuggestions(['Say this', 'or this']));

        // Validating the response object
        const expectedResponse = {
          'speech': 'hello',
          'data': {
            'google': {
              'user_storage': '{"data":{}}',
              'expect_user_response': false,
              'no_input_prompts': [],
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
        expect(clone(mockResponse.body)).to.deep.equal(expectedResponse);
      });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should set response speech when SSML is contained in simple response', function () {
      app.tell({ speech: '<speak>hi</speak>', displayText: 'hi' });

      // Validating the response object
      const expectedResponse = {
        'speech': '<speak>hi</speak>',
        'data': {
          'google': {
            'user_storage': '{"data":{}}',
            'expect_user_response': false,
            'no_input_prompts': [],
            'rich_response': {
              'items': [
                {
                  'simple_response': {
                    'ssml': '<speak>hi</speak>',
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
      expect(clone(mockResponse.body)).to.deep.equal(expectedResponse);
    });

    // Failure test, when the API returns a 400 response with the response object
    it('Should send failure response for rich response without simple response', function () {
      app.tell(app.buildRichResponse());
      expect(mockResponse.statusCode).to.equal(400);
    });
  });

  /**
   * Describes the behavior for DialogflowApp ask method.
   */
  describe('#ask', function () {
    let mockRequest, app;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({ request: mockRequest, response: mockResponse });
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return the valid speech JSON in the response object for the success case.',
      function () {
        app.ask('hello');
        // Validating the response object
        const expectedResponse = {
          'speech': 'hello',
          'data': {
            'google': {
              'user_storage': '{"data":{}}',
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
    it('Should return the valid simple response JSON in the response object for the success case.',
      function () {
        app.ask({ speech: 'hello', displayText: 'hi' });
        // Validating the response object
        const expectedResponse = {
          'speech': 'hello',
          'data': {
            'google': {
              'user_storage': '{"data":{}}',
              'expect_user_response': true,
              'no_input_prompts': [],
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
        expect(clone(mockResponse.body)).to.deep.equal(expectedResponse);
      });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return the valid rich response JSON in the response object for the success case.',
      function () {
        app.ask(app.buildRichResponse()
          .addSimpleResponse({ speech: 'hello', displayText: 'hi' })
          .addSuggestions(['Say this', 'or this']));

        // Validating the response object
        const expectedResponse = {
          'speech': 'hello',
          'data': {
            'google': {
              'user_storage': '{"data":{}}',
              'expect_user_response': true,
              'no_input_prompts': [],
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
        expect(clone(mockResponse.body)).to.deep.equal(expectedResponse);
      });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return no input prompts with a simple response',
      function () {
        app.ask('hello', ['no', 'input', 'prompts']);
        // Validating the response object
        const expectedResponse = {
          'speech': 'hello',
          'data': {
            'google': {
              'user_storage': '{"data":{}}',
              'expect_user_response': true,
              'is_ssml': false,
              'no_input_prompts': [
                {
                  'text_to_speech': 'no'
                },
                {
                  'text_to_speech': 'input'
                },
                {
                  'text_to_speech': 'prompts'
                }
              ]
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
    it('Should return no input prompts with a rich response', function () {
      app.ask(app.buildRichResponse()
        .addSimpleResponse({ speech: 'hello', displayText: 'hi' })
        .addSuggestions(['Say this', 'or this']), ['no', 'input', 'prompts']);

      // Validating the response object
      const expectedResponse = {
        'speech': 'hello',
        'data': {
          'google': {
            'user_storage': '{"data":{}}',
            'expect_user_response': true,
            'no_input_prompts': [
              {
                'text_to_speech': 'no'
              },
              {
                'text_to_speech': 'input'
              },
              {
                'text_to_speech': 'prompts'
              }
            ],
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
      expect(clone(mockResponse.body)).to.deep.equal(expectedResponse);
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should set response speech when SSML is contained in simple response', function () {
      app.ask({ speech: '<speak>hi</speak>', displayText: 'hi' });

      // Validating the response object
      const expectedResponse = {
        'speech': '<speak>hi</speak>',
        'data': {
          'google': {
            'user_storage': '{"data":{}}',
            'expect_user_response': true,
            'no_input_prompts': [],
            'rich_response': {
              'items': [
                {
                  'simple_response': {
                    'ssml': '<speak>hi</speak>',
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
      expect(clone(mockResponse.body)).to.deep.equal(expectedResponse);
    });

    // Failure test, when the API returns a 400 response with the response object
    it('Should send failure response for rich response without simple response', function () {
      app.ask(app.buildRichResponse());
      expect(mockResponse.statusCode).to.equal(400);
    });

    // Failure test, when the API returns a 400 response with the response object
    it('Should send failure response for no input prompts with more than 3 items', function () {
      app.ask('hello', ['too', 'many', 'no input', 'prompts']);
      expect(mockResponse.statusCode).to.equal(400);
    });
  });

  /**
   * Describes the behavior for DialogflowApp askWithList method.
   */
  describe('#askWithList', function () {
    let mockRequest, app;

    beforeEach(function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.version = 2;
      mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({ request: mockRequest, response: mockResponse });
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return the valid list JSON in the response object for the success case.',
      function () {
        app.askWithList('Here is a list', app.buildList()
          .addItems([
            app.buildOptionItem('key_1', 'key one'),
            app.buildOptionItem('key_2', 'key two')
          ]));

        // Validating the response object
        const expectedResponse = {
          'speech': 'Here is a list',
          'data': {
            'google': {
              'userStorage': '{"data":{}}',
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
        expect(clone(mockResponse.body)).to.deep.equal(expectedResponse);
      });

    it('Should return the an error JSON in the response when list has <2 items.', function () {
      app.askWithList('Here is a list', app.buildList());
      expect(mockResponse.statusCode).to.equal(400);
    });
  });

  /**
   * Describes the behavior for DialogflowApp askWithCarousel method.
   */
  describe('#askWithCarousel', function () {
    let mockRequest, app;

    beforeEach(function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.version = 2;
      mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({ request: mockRequest, response: mockResponse });
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return the valid carousel JSON in the response object for the success case.',
      function () {
        app.askWithCarousel('Here is a carousel',
          app.buildCarousel()
            .addItems([
              app.buildOptionItem('key_1', 'key one'),
              app.buildOptionItem('key_2', 'key two')
            ])
        );
        // Validating the response object
        const expectedResponse = {
          'speech': 'Here is a carousel',
          'data': {
            'google': {
              'userStorage': '{"data":{}}',
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
        expect(clone(mockResponse.body)).to.deep.equal(expectedResponse);
      });

    it('Should return the an error JSON in the response when carousel has <2 items.', function () {
      app.askWithCarousel('Here is a carousel',
        app.buildCarousel()
      );
      expect(mockResponse.statusCode).to.equal(400);
    });
  });

  /**
   * Describes the behavior for DialogflowApp askForPermissions method in v1.
   */
  describe('#askForPermissions', function () {
    let mockRequest, app;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({ request: mockRequest, response: mockResponse });
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return the valid JSON in the response object for the success case.', function () {
      app.askForPermissions('To test', ['NAME', 'DEVICE_PRECISE_LOCATION']);
      // Validating the response object
      const expectedResponse = {
        'speech': 'PLACEHOLDER_FOR_PERMISSION',
        'data': {
          'google': {
            'user_storage': '{"data":{}}',
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
   * Describes the behavior for DialogflowApp askForPermissions method in v2.
   */
  describe('#askForPermissions', function () {
    let mockRequest, app;

    beforeEach(function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.version = 2;
      mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({ request: mockRequest, response: mockResponse });
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return the valid JSON in the response object for the success case.', function () {
      app.askForPermissions('To test', ['NAME', 'DEVICE_PRECISE_LOCATION']);
      // Validating the response object
      const expectedResponse = {
        'speech': 'PLACEHOLDER_FOR_PERMISSION',
        'data': {
          'google': {
            'userStorage': '{"data":{}}',
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
   * Describes the behavior for DialogflowApp getUser method.
   */
  describe('#getUser', function () {
    let mockRequest, app;

    beforeEach(function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.data
        .user.user_id = '11112226094657824893';
      mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({ request: mockRequest, response: mockResponse });
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant request user.', function () {
      // Test new and old API
      expect(app.getUser().user_id).to.equal('11112226094657824893');
      expect(app.getUser().userId).to.equal('11112226094657824893');
    });
  });

  /**
   * Describes the behavior for DialogflowApp getUserName method.
   */
  describe('#getUserName', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant request user.', function () {
      let mockRequest, app;
      dialogflowAppRequestBodyLiveSession.originalRequest.data.user = {
        'user_id': '11112226094657824893',
        'profile': {
          'display_name': 'John Smith',
          'given_name': 'John',
          'family_name': 'Smith'
        }
      };
      mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({ request: mockRequest, response: mockResponse });
      expect(app.getUserName().displayName).to.equal('John Smith');
      expect(app.getUserName().givenName).to.equal('John');
      expect(app.getUserName().familyName).to.equal('Smith');

      // Test the false case
      dialogflowAppRequestBodyLiveSession.originalRequest.data.user.profile = undefined;
      mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({ request: mockRequest, response: mockResponse });
      expect(app.getUserName()).to.equal(null);
    });
  });

  /**
   * Describes the behavior for DialogflowApp getUserLocale method.
   */
  describe('#getUserLocale', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant request user with locale.', function () {
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({ request: mockRequest, response: mockResponse });
      expect(app.getUserLocale()).to.equal('en-US');
    });

    // Failure case
    it('Should return null for missing locale.', function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.data.user.locale = undefined;
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({ request: mockRequest, response: mockResponse });
      expect(app.getUserLocale()).to.equal(null);
    });
  });

  /**
   * Describes the behavior for DialogflowApp getDeviceLocation method.
   */
  describe('#getDeviceLocation', function () {
    let mockRequest, app;

    beforeEach(function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.data.device = {
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
      mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({ request: mockRequest, response: mockResponse });
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
      dialogflowAppRequestBodyLiveSession.originalRequest.data.device = undefined;
      initMockApp();
      expect(app.getDeviceLocation()).to.equal(null);
    });
  });

  /**
   * Describes the behavior for DialogflowApp getTransactionRequirementsResult method.
   */
  describe('#getTransactionRequirementsResult', function () {
    beforeEach(function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [
        {
          'extension': {
            'canTransact': true,
            '@type': 'type.googleapis.com/google.actions.v2.TransactionRequirementsCheckResult',
            'resultType': 'OK'
          },
          'name': 'TRANSACTION_REQUIREMENTS_CHECK_RESULT'
        }
      ];
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant request transaction result.', function () {
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getTransactionRequirementsResult()).to.equal('OK');
    });
  });

  /**
   * Describes the behavior for DialogflowApp getDeliveryAddress method.
   */
  describe('#getDeliveryAddress', function () {
    beforeEach(function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [
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
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant request delivery address', function () {
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
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
      dialogflowAppRequestBodyLiveSession.originalRequest.data
        .inputs[0].arguments[0].name = 'TRANSACTION_DECISION_VALUE';
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
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
      dialogflowAppRequestBodyLiveSession.originalRequest.data
        .inputs[0].arguments[0].extension.userDecision =
        'REJECTED';
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getDeliveryAddress()).to.equal(null);
    });
  });

  /**
   * Describes the behavior for DialogflowApp getTransactionDecision method.
   */
  describe('#getTransactionDecision', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant request delivery address', function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [
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
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      const mockResponse = new MockResponse();

      const app = new DialogflowApp({
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
   * Describes the behavior for DialogflowApp askForPlace method.
   */
  describe('#getPlace', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should retrieve assistant valid place information', function () {
      const place = {
        'coordinates': {
          'latitude': 12.3456,
          'longitude': -65.4321
        },
        'formattedAddress': 'Some building',
        'placeId': 'abcdefg'
      };
      dialogflowAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [
        {
          'name': 'PLACE',
          'placeValue': place
        }
      ];
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      const actual = app.getPlace();
      const expected = Object.assign({
        address: place.formattedAddress
      }, place);
      expect(clone(actual)).to.deep.equal(clone(expected));
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return null for assistant place denial', function () {
      const status = {
        'code': 7,
        'message': 'User denied location permission'
      };
      dialogflowAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [
        {
          'name': 'PLACE',
          'status': status
        }
      ];
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getPlace()).to.be.null;
    });
  });

  /**
   * Describes the behavior for DialogflowApp getUserConfirmation method.
   */
  describe('#getUserConfirmation', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant request positive user confirmation', function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [
        {
          'name': 'CONFIRMATION',
          'boolValue': true
        }
      ];
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getUserConfirmation()).to.equal(true);
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant request negative user confirmation', function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [
        {
          'name': 'CONFIRMATION',
          'boolValue': false
        }
      ];
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getUserConfirmation()).to.equal(false);
    });
  });

  /**
   * Describes the behavior for DialogflowApp getDateTime method.
   */
  describe('#getDateTime', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant datetime information', function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [
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
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);

      const app = new DialogflowApp({
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
      dialogflowAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [];
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);

      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getDateTime()).to.equal(null);
    });
  });

  /**
   * Describes the behavior for DialogflowApp getSignInStatus method.
   */
  describe('#getSignInStatus', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant sign in status', function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [
        {
          'name': 'SIGN_IN',
          'extension': {
            '@type': 'type.googleapis.com/google.actions.v2.SignInValue',
            'status': 'foo_status'
          }
        }
      ];
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);

      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.getSignInStatus()).to.equal('foo_status');
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant request missing sign in status', function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [];
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      const mockResponse = new MockResponse();

      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.getSignInStatus()).to.equal(null);
    });
  });

  /**
   * Describes the behavior for DialogflowApp getAvailableSurfaces method.
   */
  describe('#getAvailableSurfaces', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return assistant available surfaces', function () {
      const availableSurfaces = [
        {
          'capabilities': [
            {
              'name': 'cap_one'
            },
            {
              'name': 'cap_two'
            }
          ]
        },
        {
          'capabilities': [
            {
              'name': 'cap_three'
            },
            {
              'name': 'cap_four'
            }
          ]
        }
      ];
      dialogflowAppRequestBodyLiveSession.originalRequest.data
        .availableSurfaces = availableSurfaces;
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.getAvailableSurfaces()).to.deep.equal(availableSurfaces);
    });

    // Failure case test
    it('Should return empty assistant available surfaces', function () {
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getAvailableSurfaces()).to.deep.equal([]);
    });
  });

  /**
   * Describes the behavior for DialogflowApp hasAvailableSurfaceCapabilities method.
   */
  describe('#hasAvailableSurfaceCapabilities', function () {
    beforeEach(function () {
      const availableSurfaces = [
        {
          'capabilities': [
            {
              'name': 'cap_one'
            },
            {
              'name': 'cap_two'
            }
          ]
        },
        {
          'capabilities': [
            {
              'name': 'cap_three'
            },
            {
              'name': 'cap_four'
            }
          ]
        }
      ];
      dialogflowAppRequestBodyLiveSession.originalRequest.data
        .availableSurfaces = availableSurfaces;
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return true for set of valid capabilities', function () {
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.hasAvailableSurfaceCapabilities(['cap_one', 'cap_two'])).to.be.true;
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return true for one valid capability', function () {
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.hasAvailableSurfaceCapabilities('cap_one')).to.be.true;
    });

    // Failure case test, when the API returns a valid 200 response with the response object
    it('Should return false for set of invalid capabilities', function () {
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.hasAvailableSurfaceCapabilities(['cap_one', 'cap_three'])).to.be.false;
    });

    // Failure case test, when the API returns a valid 200 response with the response object
    it('Should return false for one invalid capability', function () {
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.hasAvailableSurfaceCapabilities('cap_five')).to.be.false;
    });

    // Failure case test
    it('Should return false for empty assistant available surfaces', function () {
      dialogflowAppRequestBodyLiveSession.availableSurfaces = undefined;
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.hasAvailableSurfaceCapabilities()).to.be.false;
    });
  });

  /**
   * Describes the behavior for DialogflowApp askForTransactionRequirements method.
   */
  describe('#askForTransactionRequirements', function () {
    let mockRequest, app;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid JSON transaction requirements with Google payment options',
      function () {
        const transactionConfig = {
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

        const expectedResponse = {
          'speech': 'PLACEHOLDER_FOR_TXN_REQUIREMENTS',
          'data': {
            'google': {
              'userStorage': '{"data":{}}',
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
    it('Should return valid JSON transaction requirements with Action payment options',
      function () {
        const transactionConfig = {
          deliveryAddressRequired: true,
          type: 'BANK',
          displayName: 'Checking-4773'
        };

        app.askForTransactionRequirements(transactionConfig);

        const expectedResponse = {
          'speech': 'PLACEHOLDER_FOR_TXN_REQUIREMENTS',
          'data': {
            'google': {
              'userStorage': '{"data":{}}',
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
   * Describes the behavior for DialogflowApp askForDeliveryAddress method.
   */
  describe('#askForDeliveryAddress', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid JSON delivery address', function () {
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);

      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });

      app.askForDeliveryAddress('Just because');

      const expectedResponse = {
        'speech': 'PLACEHOLDER_FOR_DELIVERY_ADDRESS',
        'data': {
          'google': {
            'userStorage': '{"data":{}}',
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
   * Describes the behavior for DialogflowApp askForTransactionDecision method.
   */
  describe('#askForTransactionDecision', function () {
    let app, mockRequest;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
    });
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid JSON transaction decision with Google payment options', function () {
      const transactionConfig = {
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

      const expectedResponse = {
        'speech': 'PLACEHOLDER_FOR_TXN_DECISION',
        'data': {
          'google': {
            'userStorage': '{"data":{}}',
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
      const transactionConfig = {
        deliveryAddressRequired: true,
        type: 'BANK',
        displayName: 'Checking-4773',
        customerInfoOptions: [
          'EMAIL'
        ]
      };

      app.askForTransactionDecision({ fakeOrderId: 'order_id' }, transactionConfig);

      const expectedResponse = {
        'speech': 'PLACEHOLDER_FOR_TXN_DECISION',
        'data': {
          'google': {
            'userStorage': '{"data":{}}',
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
   * Describes the behavior for DialogflowApp askForPlace method.
   */
  describe('#askForPlace', function () {
    let app, mockRequest;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid JSON place request', function () {
      const requestPrompt = 'Where do you want to get picked up?';
      const permissionContext = 'To find a place to pick you up';
      app.askForPlace(requestPrompt, permissionContext);
      const expectedResponse = {
        'speech': 'PLACEHOLDER_FOR_PLACE',
        'data': {
          'google': {
            'userStorage': '{"data":{}}',
            'expectUserResponse': true,
            'isSsml': false,
            'noInputPrompts': [],
            'systemIntent': {
              'intent': 'actions.intent.PLACE',
              'data': {
                '@type': 'type.googleapis.com/google.actions.v2.PlaceValueSpec',
                'dialogSpec': {
                  'extension': {
                    '@type': 'type.googleapis.com/google.actions.v2.PlaceValueSpec.PlaceDialogSpec',
                    'requestPrompt': requestPrompt,
                    'permissionContext': permissionContext
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

    it('Should return statusCode 400 when requestPrompt is not provided.', function () {
      app.askForPlace();
      expect(mockResponse.statusCode).to.equal(400);
    });

    it('Should return statusCode 400 when permissionContext is not provided.', function () {
      const requestPrompt = 'Where do you want to get picked up?';
      app.askForPlace(requestPrompt);
      expect(mockResponse.statusCode).to.equal(400);
    });
  });

  /**
   * Describes the behavior for DialogflowApp askForConfirmation method.
   */
  describe('#askForConfirmation', function () {
    let app, mockRequest;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid JSON confirmation request', function () {
      app.askForConfirmation('You want to do that?');
      const expectedResponse = {
        'speech': 'PLACEHOLDER_FOR_CONFIRMATION',
        'data': {
          'google': {
            'userStorage': '{"data":{}}',
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

      const expectedResponse = {
        'speech': 'PLACEHOLDER_FOR_CONFIRMATION',
        'data': {
          'google': {
            'userStorage': '{"data":{}}',
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
   * Describes the behavior for DialogflowApp askForDateTime method.
   */
  describe('#askForDateTime', function () {
    let app, mockRequest;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid JSON datetime request', function () {
      app.askForDateTime('When do you want to come in?',
        'What is the best date for you?',
        'What time of day works best for you?');

      const expectedResponse = {
        'speech': 'PLACEHOLDER_FOR_DATETIME',
        'data': {
          'google': {
            'userStorage': '{"data":{}}',
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
      const expectedResponse = {
        'speech': 'PLACEHOLDER_FOR_DATETIME',
        'data': {
          'google': {
            'userStorage': '{"data":{}}',
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

      expect(clone(mockResponse.body)).to.deep.equal(expectedResponse);
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid JSON datetime request withouts prompt', function () {
      app.askForDateTime();

      const expectedResponse = {
        'speech': 'PLACEHOLDER_FOR_DATETIME',
        'data': {
          'google': {
            'userStorage': '{"data":{}}',
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
   * Describes the behavior for DialogflowApp askForSignIn method.
   */
  describe('#askForSignIn', function () {
    let app, mockRequest;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid JSON sign in request', function () {
      app.askForSignIn();
      const expectedResponse = {
        'speech': 'PLACEHOLDER_FOR_SIGN_IN',
        'data': {
          'google': {
            'userStorage': '{"data":{}}',
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
   * Describes the behavior for DialogflowApp askForNewSurface method.
   */
  describe('#askForNewSurface', function () {
    let app, mockRequest;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid JSON sign in request', function () {
      app.askForNewSurface('test context', 'test title', ['cap_one', 'cap_two']);
      const expectedResponse = {
        'speech': 'PLACEHOLDER_FOR_NEW_SURFACE',
        'data': {
          'google': {
            'userStorage': '{"data":{}}',
            'expectUserResponse': true,
            'isSsml': false,
            'noInputPrompts': [],
            'systemIntent': {
              'intent': 'actions.intent.NEW_SURFACE',
              'data': {
                'context': 'test context',
                'notificationTitle': 'test title',
                'capabilities': ['cap_one', 'cap_two'],
                '@type': 'type.googleapis.com/google.actions.v2.NewSurfaceValueSpec'
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
   * Describes the behavior for DialogflowApp isNewSurface method.
   */
  describe('#isNewSurface', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate when new surface was accepted.', function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [
        {
          'name': 'NEW_SURFACE',
          'extension': {
            'status': 'OK'
          }
        }
      ];

      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);

      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.isNewSurface()).to.be.true;
    });

    // Failure case test
    it('Should validate when new surface was denied.', function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [
        {
          'name': 'NEW_SURFACE',
          'extension': {
            'status': 'DENIED'
          }
        }
      ];

      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);

      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.isNewSurface()).to.be.false;
    });
  });

  /**
   * Describes the behavior for DialogflowApp isPermissionGranted method.
   */
  describe('#isPermissionGranted', function () {
    let app, mockRequest;

    function initMockApp () {
      mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
    }

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant request user.', function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [{
        'name': 'permission_granted',
        'text_value': 'true'
      }];
      initMockApp();
      expect(app.isPermissionGranted()).to.equal(true);

      // Test the false case
      dialogflowAppRequestBodyLiveSession.originalRequest.data
        .inputs[0].arguments[0].text_value = false;
      initMockApp();
      expect(app.isPermissionGranted()).to.equal(false);
    });
  });

  /**
   * Describes the behavior for DialogflowApp isInSandbox method.
   */
  describe('#isInSandbox', function () {
    let app, mockRequest;

    function initMockApp () {
      mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
    }

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant request user.', function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.data.isInSandbox = true;
      initMockApp();
      expect(app.isInSandbox()).to.be.true;

      // Test the false case
      dialogflowAppRequestBodyLiveSession.originalRequest.data.isInSandbox = false;
      initMockApp();
      expect(app.isInSandbox()).to.be.false;
    });
  });

  /**
   * Describes the behavior for DialogflowApp getRepromptCount method.
   */
  describe('#getRepromptCount', function () {
    // Success case test, when the API requests with a valid reprompt count.
    it('Should return the proper reprompt count.', function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.data.inputs = [{
        'intent': 'actions.intent.NO_INPUT',
        'arguments': [
          {
            'name': 'REPROMPT_COUNT',
            'intValue': '1'
          },
          {
            'name': 'IS_FINAL_REPROMPT',
            'boolValue': false
          }
        ]
      }];
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getRepromptCount()).to.equal(1);
    });
    // Test case checking it handles API requests without reprompt count correctly.
    it('Should return null when no reprompt count available.', function () {
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getRepromptCount()).to.be.null;
    });
  });

  /**
   * Describes the behavior for DialogflowApp isFinalReprompt method.
   */
  describe('#isFinalReprompt', function () {
    // Success case test, when the API requests with a valid reprompt count.
    it('Should return true for final reprompt', function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.data.inputs = [{
        'intent': 'actions.intent.NO_INPUT',
        'arguments': [
          {
            'name': 'REPROMPT_COUNT',
            'intValue': '2'
          },
          {
            'name': 'IS_FINAL_REPROMPT',
            'boolValue': true
          }
        ]
      }];
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.isFinalReprompt()).to.be.true;
    });
    // Success case test, when the API requests with a valid reprompt count.
    it('Should return false for non-final reprompt', function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.data.inputs = [{
        'intent': 'actions.intent.NO_INPUT',
        'arguments': [
          {
            'name': 'REPROMPT_COUNT',
            'intValue': '0'
          },
          {
            'name': 'IS_FINAL_REPROMPT',
            'boolValue': false
          }
        ]
      }];
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.isFinalReprompt()).to.be.false;
    });
    // Failure case test, when the API requests without reprompt count.
    it('Should return false when no reprompt count available.', function () {
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.isFinalReprompt()).to.be.false;
    });
  });

  /**
   * Describes the behavior for DialogflowApp getIntent method.
   */
  describe('#getIntent', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should get the intent value for the success case.', function () {
      dialogflowAppRequestBodyLiveSession.result.action = 'check_guess';
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);

      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.getIntent()).to.equal('check_guess');
    });
  });

  /**
   * Describes the behavior for DialogflowApp getArgument method.
   */
  describe('#getArgument', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should get the argument value for the success case.', function () {
      dialogflowAppRequestBodyLiveSession.result.parameters.guess = '50';
      dialogflowAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [
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
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);

      const app = new DialogflowApp({
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
   * Describes the behavior for DialogflowApp getContextArgument method.
   */
  describe('#getContextArgument', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should get the context argument value for the success case.', function () {
      dialogflowAppRequestBodyLiveSession.result.contexts = [
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
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);

      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.getContextArgument('game', 'guess')).to.deep.equal({
        value: '50',
        original: '50'
      });
      expect(app.getContextArgument('previous_answer', 'answer')).to.deep.equal({ value: '68' });
    });
  });

  /**
   * Describes the behavior for DialogflowApp getIncomingRichResponse method.
   */
  describe('#getIncomingRichResponse', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should get the incoming rich response for the success case.', function () {
      dialogflowAppRequestBodyLiveSession.result.fulfillment.messages = [
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

      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);

      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });

      const expectedResponse = new RichResponse()
        .addSimpleResponse('Simple response one')
        .addBasicCard(new BasicCard()
          .setBodyText('my text'))
        .addSuggestions('suggestion one')
        .addSuggestionLink('google', 'google.com');

      expect(app.getIncomingRichResponse()).to.deep.equal(clone(expectedResponse));
    });
  });

  /**
   * Describes the behavior for DialogflowApp getIncomingList method.
   */
  describe('#getIncomingList', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should get the incoming list for the success case.', function () {
      dialogflowAppRequestBodyLiveSession.result.fulfillment.messages.push({
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
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);

      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });

      const expectedResponse = new List()
        .setTitle('list_title')
        .addItems([
          new OptionItem().setTitle('first item').setKey('first_item'),
          new OptionItem().setTitle('second item').setKey('second_item')
        ]);

      expect(app.getIncomingList()).to.deep.equal(clone(expectedResponse));
    });
  });

  /**
   * Describes the behavior for DialogflowApp getIncomingCarousel method.
   */
  describe('#getIncomingCarousel', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should get the incoming list for the success case.', function () {
      dialogflowAppRequestBodyLiveSession.result.fulfillment.messages.push({
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

      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);

      const app = new DialogflowApp({
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

      expect(app.getIncomingCarousel()).to.deep.equal(clone(expectedResponse));
    });
  });

  /**
   * Describes the behavior for DialogflowApp getSelectedOption method.
   */
  describe('#getSelectedOption', function () {
    let mockRequest, app;
    beforeEach(function () {
      mockRequest = new MockRequest(headerV1, {});
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should get the selected option when given in Dialogflow context.', function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.data.inputs[0] = {
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
      dialogflowAppRequestBodyLiveSession.result.contexts = [
        {
          'name': 'actions_intent_option',
          'parameters': {
            'OPTION': 'first_item'
          },
          'lifespan': 0
        }
      ];
      mockRequest.body = dialogflowAppRequestBodyLiveSession;
      app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getSelectedOption()).to.equal('first_item');
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should get the selected option when not given in Dialogflow context.', function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.data.inputs[0] = {
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
      mockRequest.body = dialogflowAppRequestBodyLiveSession;
      app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getSelectedOption()).to.equal('first_item');
    });
  });

  /**
   * Describes the behavior for DialogflowApp isRequestFromDialogflow method.
   */
  describe('#isRequestFromDialogflow', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should confirm request is from Dialogflow.', function () {
      const header = clone(headerV1);
      header['Google-Assistant-Signature'] = 'YOUR_PRIVATE_KEY';
      const mockRequest = new MockRequest(header, dialogflowAppRequestBodyLiveSession);

      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });

      const HEADER_KEY = 'Google-Assistant-Signature';
      const HEADER_VALUE = 'YOUR_PRIVATE_KEY';

      expect(app.isRequestFromDialogflow(HEADER_KEY, HEADER_VALUE)).to.equal(true);
    });

    it('Should confirm request is NOT from Dialogflow.', function () {
      const header = clone(headerV1);
      const mockRequest = new MockRequest(header, dialogflowAppRequestBodyLiveSession);

      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });

      const HEADER_KEY = 'Google-Assistant-Signature';
      const HEADER_VALUE = 'YOUR_PRIVATE_KEY';

      expect(app.isRequestFromDialogflow(HEADER_KEY, HEADER_VALUE)).to.equal(false);
    });
  });

  /**
   * Describes the behavior for DialogflowApp hasSurfaceCapability method.
   */
  describe('#hasSurfaceCapability', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return true for a valid capability from incoming JSON for the success case.',
      function () {
        dialogflowAppRequestBodyLiveSession.originalRequest.data.surface = {
          'capabilities': [
            {
              'name': 'actions.capability.AUDIO_OUTPUT'
            },
            {
              'name': 'actions.capability.SCREEN_OUTPUT'
            },
            {
              'name': 'actions.capability.MEDIA_RESPONSE_AUDIO'
            },
            {
              'name': 'actions.capability.WEB_BROWSER'
            }
          ]
        };

        const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);

        const app = new DialogflowApp({
          request: mockRequest,
          response: mockResponse
        });

        const hasScreenOutput =
          app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT);
        const hasMagicPowers =
          app.hasSurfaceCapability('MAGIC_POWERS');
        expect(hasScreenOutput).to.be.true;
        expect(hasMagicPowers).to.be.false;
      });
  });

  /**
   * Describes the behavior for DialogflowApp getSurfaceCapabilities method.
   */
  describe('#getSurfaceCapabilities', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid list of capabilities from incoming JSON for the success case.',
      function () {
        dialogflowAppRequestBodyLiveSession.originalRequest.data.surface = {
          'capabilities': [
            {
              'name': 'actions.capability.AUDIO_OUTPUT'
            },
            {
              'name': 'actions.capability.SCREEN_OUTPUT'
            },
            {
              'name': 'actions.capability.MEDIA_RESPONSE_AUDIO'
            },
            {
              'name': 'actions.capability.WEB_BROWSER'
            }
          ]
        };

        const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);

        const app = new DialogflowApp({
          request: mockRequest,
          response: mockResponse
        });

        const capabilities = app.getSurfaceCapabilities();
        expect(capabilities).to.deep.equal([
          app.SurfaceCapabilities.AUDIO_OUTPUT,
          app.SurfaceCapabilities.SCREEN_OUTPUT,
          app.SurfaceCapabilities.MEDIA_RESPONSE_AUDIO,
          app.SurfaceCapabilities.WEB_BROWSER
        ]);
      });
  });

  /**
   * Describes the behavior for DialogflowApp getInputType method.
   */
  describe('#getInputType', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid input type from incoming JSON for the success case.', function () {
      const KEYBOARD = 3;
      dialogflowAppRequestBodyLiveSession.originalRequest.data.inputs = [
        {
          'raw_inputs': [
            {
              'input_type': KEYBOARD
            }
          ]
        }
      ];
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });

      const inputType = app.getInputType();
      expect(inputType).to.equal(app.InputTypes.KEYBOARD);
    });
  });

  /**
   * Describes the behavior for DialogflowApp getRawInput method.
   */
  describe('#getRawInput', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should raw input from Dialogflow.', function () {
      dialogflowAppRequestBodyLiveSession.result.resolvedQuery = 'is it 667';

      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);

      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.getRawInput()).to.equal('is it 667');
    });
  });

  /**
   * Describes the behavior for DialogflowApp setContext method.
   */
  describe('#setContext', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return the valid JSON in the response object for the success case.', function () {
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });

      const CONTEXT_NUMBER = 'number';
      app.setContext(CONTEXT_NUMBER);
      app.ask('Welcome to action snippets! Say a number.');

      // Validating the response object
      const expectedResponse = {
        'speech': 'Welcome to action snippets! Say a number.',
        'data': {
          'google': {
            'user_storage': '{"data":{}}',
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
   * Describes the behavior for DialogflowApp getContexts method.
   */
  describe('#getContexts', function () {
    let app, mockRequest;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
    });

    function initMockApp () {
      app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
    }

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return the active contexts from incoming JSON for the success case.', function () {
      dialogflowAppRequestBodyLiveSession.result.contexts = [
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
      mockRequest.body = dialogflowAppRequestBodyLiveSession;
      initMockApp();
      const mockContexts = app.getContexts();
      const expectedContexts = [
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
    it('Should return the active contexts from incoming JSON when only app.data incoming',
      function () {
        dialogflowAppRequestBodyLiveSession.result.contexts = [{ 'name': '_actions_on_google_' }];
        mockRequest.body = dialogflowAppRequestBodyLiveSession;
        initMockApp();
        const mockContexts = app.getContexts();
        const expectedContexts = [];
        expect(mockContexts).to.deep.equal(expectedContexts);
      });
    it('Should return the active contexts from incoming JSON when no contexts provided.',
      function () {
        // Check the empty case
        dialogflowAppRequestBodyLiveSession.result.contexts = [];
        mockRequest.body = dialogflowAppRequestBodyLiveSession;
        initMockApp();
        const mockContexts = app.getContexts();
        const expectedContexts = [];
        expect(mockContexts).to.deep.equal(expectedContexts);
      });
  });

  /**
   * Describes the behavior for DialogflowApp getContext method.
   */
  describe('#getContext', function () {
    let app, mockRequest;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
    });

    function initMockApp () {
      app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
    }

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return the context by name from incoming JSON for the success case.', function () {
      dialogflowAppRequestBodyLiveSession.result.contexts = [{
        'name': 'number',
        'lifespan': 5,
        'parameters': {
          'parameterOne': '23',
          'parameterTwo': '24'
        }
      }];
      mockRequest.body = dialogflowAppRequestBodyLiveSession;
      initMockApp();

      const mockContext = app.getContext('number');
      const expectedContext = {
        'name': 'number',
        'lifespan': 5,
        'parameters': {
          'parameterOne': '23',
          'parameterTwo': '24'
        }
      };
      expect(mockContext).to.deep.equal(expectedContext);
    });

    it('Should return the context by name from incoming JSON when no context provided.',
      function () {
        //  Check the empty case
        dialogflowAppRequestBodyLiveSession.result.contexts = [];
        mockRequest.body = dialogflowAppRequestBodyLiveSession;
        initMockApp();
        const mockContext = app.getContext('name');
        const expectedContext = null;
        expect(mockContext).to.equal(expectedContext);
      });
  });

  /**
   * Describes the behavior for DialogflowApp ask with no inputs method.
   */
  describe('#ask', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return the valid JSON in the response object for the success case.', function () {
      const mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });

      app.ask('Welcome to action snippets! Say a number.',
        ['Say any number', 'Pick a number', 'What is the number?']);

      const expectedResponse = {
        'speech': 'Welcome to action snippets! Say a number.',
        'data': {
          'google': {
            'user_storage': '{"data":{}}',
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
            'parameters': {}
          }
        ]
      };
      expect(mockResponse.body).to.deep.equal(expectedResponse);
    });
  });

  // Note: The current way these tests are written are not ideal.
  // They are duplicated and should be fixed when the library is refactored.
  describe('#userStorage', function () {
    it('Should parse undefined userStorage as an empty object for new session', function () {
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyNewSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.userStorage).to.deep.equal({});
    });
    it('Should parse undefined userStorage as an empty object for live session', function () {
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.userStorage).to.deep.equal({});
    });
    it('Should parse invalid userStorage from request body user data as empty object', function () {
      // This is invalid JSON
      dialogflowAppRequestBodyNewSession.originalRequest.data.user.userStorage = '{{}}';
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyNewSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.userStorage).to.deep.equal({});
    });
    it('Should send userStorage in response body', function () {
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      const testUserStorage = {
        someProperty: 'someValue'
      };
      app.userStorage = testUserStorage;
      expect(app.userStorage).to.deep.equal(testUserStorage);
      app.tell('hi');
      expect(mockResponse.body.data.google.userStorage).to.equal(JSON.stringify({
        data: testUserStorage
      }));
    });
    it('Should parse userStorage from request body user data for new session', function () {
      const testUserStorage = {
        someProperty: 'someValue'
      };
      dialogflowAppRequestBodyNewSession.originalRequest.data.user.userStorage = JSON.stringify({
        data: testUserStorage
      });
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyNewSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.userStorage).to.deep.equal(testUserStorage);
    });
    it('Should parse userStorage from request body user data for live session', function () {
      const testUserStorage = {
        someProperty: 'someValue'
      };
      dialogflowAppRequestBodyLiveSession.originalRequest.data.user.userStorage = JSON.stringify({
        data: testUserStorage
      });
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.userStorage).to.deep.equal(testUserStorage);
    });
    it('Should send userStorage if it was changed', function () {
      const testUserStorage = {
        someProperty: 'someValue',
        someOtherProperty: 'someOtherValue'
      };
      dialogflowAppRequestBodyLiveSession.originalRequest.data.user.userStorage = JSON.stringify({
        data: testUserStorage
      });
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.userStorage).to.deep.equal(testUserStorage);
      const modifiedUserStorage = {
        someProperty: 'test',
        someOtherProperty: 'someOtherValue'
      };
      app.userStorage.someProperty = modifiedUserStorage.someProperty;
      expect(app.userStorage).to.deep.equal(modifiedUserStorage);
      app.tell('hi');
      expect(mockResponse.body.data.google.userStorage).to.equal(JSON.stringify({
        data: modifiedUserStorage
      }));
    });
    it('Should not send userStorage if it was not changed', function () {
      const testUserStorage = {
        someProperty: 'someValue',
        someOtherProperty: 'someOtherValue'
      };
      dialogflowAppRequestBodyLiveSession.originalRequest.data.user.userStorage = JSON.stringify({
        data: testUserStorage
      });
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.userStorage).to.deep.equal(testUserStorage);
      app.tell('hi');
      expect(mockResponse.body.data.google.userStorage).to.undefined;
    });
    it('Should send userStorage if its properties were reordered', function () {
      const testUserStorage = {
        someProperty: 'someValue',
        someOtherProperty: 'someOtherValue'
      };
      dialogflowAppRequestBodyLiveSession.originalRequest.data.user.userStorage = JSON.stringify({
        data: testUserStorage
      });
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.userStorage).to.deep.equal(testUserStorage);
      // Generate new object with keys in reverse order
      const modifiedUserStorage = Object.keys(testUserStorage).reduceRight((o, k) => {
        o[k] = testUserStorage[k];
        return o;
      }, {});
      app.userStorage = modifiedUserStorage;
      expect(app.userStorage).to.deep.equal(modifiedUserStorage);
      app.tell('hi');
      expect(mockResponse.body.data.google.userStorage).to.equal(JSON.stringify({
        data: modifiedUserStorage
      }));
    });
  });

  describe('#data', function () {
    it('Should parse undefined AoG context as an empty data object for new session', function () {
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyNewSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.data).to.deep.equal({});
    });
    it('Should parse undefined AoG context as an empty data object for live session', function () {
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.data).to.deep.equal({});
    });
    it('Should parse undefined AoG context parameters as an empty data object for live session',
      function () {
        dialogflowAppRequestBodyLiveSession.result.contexts[0] = {
          name: '_actions_on_google',
          parameters: undefined
        };
        const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
        const app = new DialogflowApp({
          request: mockRequest,
          response: mockResponse
        });
        expect(app.data).to.deep.equal({});
      });
    it('Should parse AoG context as a data object for new session', function () {
      const testData = {
        someProperty: 'someValue',
        someOtherProperty: 'someOtherValue'
      };
      dialogflowAppRequestBodyNewSession.result.contexts[0] = {
        name: '_actions_on_google_',
        parameters: testData
      };
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyNewSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.data).to.deep.equal(testData);
    });
    it('Should parse AoG context as a data object for live session', function () {
      const testData = {
        someProperty: 'someValue',
        someOtherProperty: 'someOtherValue'
      };
      dialogflowAppRequestBodyLiveSession.result.contexts[0] = {
        name: '_actions_on_google_',
        parameters: testData
      };
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.data).to.deep.equal(testData);
    });
    it('Should send AoG context in response body mid-dialog', function () {
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      const testData = {
        someProperty: 'someValue'
      };
      app.data = testData;
      expect(app.data).to.deep.equal(testData);
      app.ask('hi');
      expect(mockResponse.body.contextOut[0]).to.deep.equal({
        name: '_actions_on_google_',
        parameters: testData,
        lifespan: 100
      });
    });
    it('Should send modified AoG context in response body mid-dialog', function () {
      const testData = {
        someProperty: 'someValue',
        someOtherProperty: 'someOtherValue'
      };
      dialogflowAppRequestBodyLiveSession.result.contexts[0] = {
        name: '_actions_on_google_',
        parameters: testData
      };
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      const modifiedData = {
        someProperty: 'test',
        someOtherProperty: 'someOtherValue'
      };
      app.data = modifiedData;
      app.ask('hi');
      expect(mockResponse.body.contextOut[0]).to.deep.equal({
        name: '_actions_on_google_',
        parameters: modifiedData,
        lifespan: 100
      });
    });
    it('Should send empty AoG context in response body for dialog end', function () {
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      const testData = {
        someProperty: 'someValue'
      };
      app.data = testData;
      expect(app.data).to.deep.equal(testData);
      app.tell('hi');
      expect(mockResponse.body.contextOut).to.be.an('array').that.is.empty;
    });
  });

  describe('#getLastSeen', function () {
    it('Should return null for empty lastSeen v2 proto3 Timestamp for new session', function () {
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyNewSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getLastSeen()).to.be.null;
    });
    it('Should return null for empty lastSeen v2 proto3 Timestamp for live session', function () {
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getLastSeen()).to.be.null;
    });
    it('Should return a Date for lastSeen v2 proto3 Timestamp for new session', function () {
      const timestamp = '2017-10-26T23:40:59.742Z';
      dialogflowAppRequestBodyNewSession.originalRequest.data.user.lastSeen = timestamp;
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyNewSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      const lastSeen = app.getLastSeen();
      expect(lastSeen).to.be.a('Date');
      expect(lastSeen.toISOString()).to.equal(timestamp);
    });
    it('Should return a Date for lastSeen v2 proto3 Timestamp for live session', function () {
      const timestamp = '2017-10-26T23:40:59.742Z';
      dialogflowAppRequestBodyLiveSession.originalRequest.data.user.lastSeen = timestamp;
      const mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      const app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      const lastSeen = app.getLastSeen();
      expect(lastSeen).to.be.a('Date');
      expect(lastSeen.toISOString()).to.equal(timestamp);
    });
  });

  /**
   * Describes the behavior for DialogflowApp askToRegisterDailyUpdate method.
   */
  describe('#askToRegisterDailyUpdate', function () {
    let app, mockRequest;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid JSON update registration request', function () {
      app.askToRegisterDailyUpdate('test_intent', [
        {
          name: 'intent_name',
          textValue: 'intent_value'
        }
      ]);
      const expectedResponse = {
        'speech': 'PLACEHOLDER_FOR_REGISTER_UPDATE',
        'data': {
          'google': {
            'userStorage': '{"data":{}}',
            'expectUserResponse': true,
            'isSsml': false,
            'noInputPrompts': [],
            'systemIntent': {
              'intent': 'actions.intent.REGISTER_UPDATE',
              'data': {
                'intent': 'test_intent',
                'arguments': [
                  {
                    'name': 'intent_name',
                    'textValue': 'intent_value'
                  }
                ],
                'triggerContext': {
                  'timeContext': {
                    'frequency': 'DAILY'
                  }
                },
                '@type': 'type.googleapis.com/google.actions.v2.RegisterUpdateValueSpec'
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

    // Success case test, when the API returns a valid 200 response
    // with the response object without arguments
    it('Should return valid JSON update registration request', function () {
      app.askToRegisterDailyUpdate('test_intent');
      const expectedResponse = {
        'speech': 'PLACEHOLDER_FOR_REGISTER_UPDATE',
        'data': {
          'google': {
            'userStorage': '{"data":{}}',
            'expectUserResponse': true,
            'isSsml': false,
            'noInputPrompts': [],
            'systemIntent': {
              'intent': 'actions.intent.REGISTER_UPDATE',
              'data': {
                'intent': 'test_intent',
                'triggerContext': {
                  'timeContext': {
                    'frequency': 'DAILY'
                  }
                },
                '@type': 'type.googleapis.com/google.actions.v2.RegisterUpdateValueSpec'
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

    // Failure case test, when an invalid intent name is given
    it('Should return null', function () {
      expect(app.askToRegisterDailyUpdate('', [
        {
          name: 'intent_name',
          textValue: 'intent_value'
        }
      ])).to.be.null;
      expect(mockResponse.statusCode).to.equal(400);
    });
  });

  /**
   * Describes the behavior for DialogflowApp isUpdateRegistered method.
   */
  describe('#isUpdateRegistered', function () {
    let app, mockRequest;

    function initMockApp () {
      mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
    }

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate user registration status.', function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [
        {
          'name': 'REGISTER_UPDATE',
          'extension': {
            '@type': 'type.googleapis.com/google.actions.v2.RegisterUpdateValue',
            'status': 'OK'
          }
        }];
      initMockApp();
      expect(app.isUpdateRegistered()).to.equal(true);

      // Test the false case
      dialogflowAppRequestBodyLiveSession.originalRequest.data
        .inputs[0].arguments[0].extension.status = 'CANCELLED';
      initMockApp();
      expect(app.isPermissionGranted()).to.equal(false);
    });
  });

  /**
   * Describes the behavior for DialogflowApp askForUpdatePermission method in v1.
   */
  describe('#askForUpdatePermission', function () {
    let mockRequest, app;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({ request: mockRequest, response: mockResponse });
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return the valid JSON in the response object for the success case.', function () {
      app.askForUpdatePermission('test_intent', [
        {
          name: 'intent_name',
          textValue: 'intent_value'
        }
      ]);
      // Validating the response object
      const expectedResponse = {
        'speech': 'PLACEHOLDER_FOR_PERMISSION',
        'data': {
          'google': {
            'userStorage': '{"data":{}}',
            'expectUserResponse': true,
            'isSsml': false,
            'noInputPrompts': [],
            'systemIntent': {
              'intent': 'actions.intent.PERMISSION',
              'data': {
                '@type': 'type.googleapis.com/google.actions.v2.PermissionValueSpec',
                'permissions': ['UPDATE'],
                'updatePermissionValueSpec': {
                  'intent': 'test_intent',
                  'arguments': [
                    {
                      'name': 'intent_name',
                      'textValue': 'intent_value'
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
      expect(mockResponse.body).to.deep.equal(expectedResponse);
    });

    // Success case test, when the API returns a valid 200 response
    // with the response object without arguments
    it('Should return the valid JSON in the response object ' +
      'without arguments for the success case.', function () {
      app.askForUpdatePermission('test_intent');
      // Validating the response object
      const expectedResponse = {
        'speech': 'PLACEHOLDER_FOR_PERMISSION',
        'data': {
          'google': {
            'userStorage': '{"data":{}}',
            'expectUserResponse': true,
            'isSsml': false,
            'noInputPrompts': [],
            'systemIntent': {
              'intent': 'actions.intent.PERMISSION',
              'data': {
                '@type': 'type.googleapis.com/google.actions.v2.PermissionValueSpec',
                'permissions': ['UPDATE'],
                'updatePermissionValueSpec': {
                  'intent': 'test_intent'
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

    // Failure case test, when an invalid intent name is given
    it('Should return null', function () {
      expect(app.askForUpdatePermission('', [
        {
          name: 'intent_name',
          textValue: 'intent_value'
        }
      ])).to.be.null;
      expect(mockResponse.statusCode).to.equal(400);
    });
  });

  /**
   * Describes the behavior for DialogflowApp askToDeepLink.
   */
  describe('#askToDeepLink', function () {
    let mockRequest, app;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({ request: mockRequest, response: mockResponse });
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return the valid JSON in the response object for the success case.', function () {
      app.askToDeepLink('Great! Looks like we can do that in the app.', 'Google',
        'example://gizmos', 'com.example.gizmos', 'handle this for you');
      // Validating the response object
      const expectedResponse = {
        'speech': 'Great! Looks like we can do that in the app.',
        'data': {
          'google': {
            'userStorage': '{"data":{}}',
            'expectUserResponse': true,
            'isSsml': false,
            'noInputPrompts': [],
            'systemIntent': {
              'intent': 'actions.intent.LINK',
              'data': {
                '@type': 'type.googleapis.com/google.actions.v2.LinkValueSpec',
                'dialogSpec': {
                  'extension': {
                    '@type': 'type.googleapis.com/google.actions.v2.LinkValueSpec.LinkDialogSpec',
                    'destinationName': 'Google',
                    'requestLinkReason': 'handle this for you'
                  }
                },
                'openUrlAction': {
                  'url': 'example://gizmos',
                  'androidApp': {
                    'packageName': 'com.example.gizmos'
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
   * Describes the behavior for DialogflowApp getLinkStatus method.
   */
  describe('#getLinkStatus', function () {
    let app, mockRequest;

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate user registration status.', function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.data
      .inputs[0].arguments = [
        {
          'name': 'LINK',
          'status': {
            'code': 9
          }
        }];
      mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getLinkStatus()).to.equal(9);
    });
  });

  /**
   * Describes the behavior for DialogflowApp getPackageEntitlements method.
   */
  describe('#getPackageEntitlements', function () {
    let app, mockRequest;

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return package entitlements.', function () {
      dialogflowAppRequestBodyLiveSession.originalRequest.data.user.packageEntitlements = {
        'testKey': 'testVal'
      };
      mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getPackageEntitlements()).to.deep.equal({
        'testKey': 'testVal'
      });
    });

    // Failure case test, when no Package Entitlements are present
    it('Should return null.', function () {
      mockRequest = new MockRequest(headerV1, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getPackageEntitlements()).to.be.null;
    });
  });

  /**
   * Describes the behavior for DialogflowApp askForUpdatePermission method in v1.
   */
  describe('#followUpEvents', function () {
    let mockRequest, app;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, dialogflowAppRequestBodyLiveSession);
      app = new DialogflowApp({ request: mockRequest, response: mockResponse });
    });

    it('Should contain followUpEvent in root when you add an event to response', function () {
      app.sendFollowupEvent('foo', { bar: 'foobar' });

      // Validating the response object
      const expectedResponse = {
        'followupEvent': {
          'data': {
            'bar': 'foobar'
          },
          'name': 'foo'
        }
      };
      expect(clone(mockResponse.body)).to.deep.equal(expectedResponse);
    });
    it('Event might have only a name', function () {
      app.sendFollowupEvent('foo');

      // Validating the response object
      const expectedResponse = {
        'followupEvent': {
          'name': 'foo'
        }
      };
      expect(clone(mockResponse.body)).to.deep.equal(expectedResponse);
    });
  });
});
