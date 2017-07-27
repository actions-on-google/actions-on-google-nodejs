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
 * Test suite for the ApiAiApp client library.
 */
const winston = require('winston');
const chai = require('chai');
const expect = chai.expect;
const spies = require('chai-spies');
const { ApiAiApp } = require('.././actions-on-google');
const RichResponse = require('.././response-builder').RichResponse;
const BasicCard = require('.././response-builder').BasicCard;
const List = require('.././response-builder').List;
const Carousel = require('.././response-builder').Carousel;
const OptionItem = require('.././response-builder').OptionItem;
const {
  apiAiAppRequestBodyNewSessionMock,
  apiAiAppRequestBodyLiveSessionMock,
  headerV1,
  headerV2,
  MockResponse,
  MockRequest
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
//                   API.ai support
// ---------------------------------------------------------------------------
describe('ApiAiApp', function () {
  let apiAiAppRequestBodyNewSession, apiAiAppRequestBodyLiveSession, mockResponse;

  beforeEach(function () {
    apiAiAppRequestBodyNewSession = JSON.parse(JSON.stringify(apiAiAppRequestBodyNewSessionMock));
    apiAiAppRequestBodyLiveSession = JSON.parse(JSON.stringify(apiAiAppRequestBodyLiveSessionMock));
    mockResponse = new MockResponse();
  });

  /**
   * Describes the behavior for ApiAiApp constructor method.
   */
  describe('#constructor', function () {
    // Calls sessionStarted when provided
    it('Calls sessionStarted when new session', function () {
      const mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyNewSession);
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
      const mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
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
      let bodyWithoutVersion = apiAiAppRequestBodyNewSession;
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
      let bodyWithVersion = apiAiAppRequestBodyNewSession;
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
  describe('#tell', function () {
    let mockRequest, app;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
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
            'no_input_prompts': []
          }
        },
        contextOut: []
      };
      expect(mockResponse.body).to.deep.equal(expectedResponse);
    });

    it('Should return the valid simple response JSON in the response object for the success case.',
      function () {
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
    it('Should return the valid rich response JSON in the response object for the success case.',
      function () {
        app.tell(app.buildRichResponse()
          .addSimpleResponse({speech: 'hello', displayText: 'hi'})
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
  describe('#ask', function () {
    let mockRequest, app;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
      app = new ApiAiApp({request: mockRequest, response: mockResponse});
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return the valid speech JSON in the response object for the success case.',
      function () {
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
    it('Should return the valid simple response JSON in the response object for the success case.',
      function () {
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
    it('Should return the valid rich response JSON in the response object for the success case.',
      function () {
        app.ask(app.buildRichResponse()
          .addSimpleResponse({speech: 'hello', displayText: 'hi'})
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
  describe('#askWithList', function () {
    let mockRequest, app;

    beforeEach(function () {
      apiAiAppRequestBodyLiveSession.originalRequest.version = 2;
      mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
      app = new ApiAiApp({request: mockRequest, response: mockResponse});
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
        expect(JSON.parse(JSON.stringify(mockResponse.body))).to.deep.equal(expectedResponse);
      });

    it('Should return the an error JSON in the response when list has <2 items.', function () {
      app.askWithList('Here is a list', app.buildList());
      expect(mockResponse.statusCode).to.equal(400);
    });
  });

  /**
   * Describes the behavior for ApiAiApp askWithCarousel method.
   */
  describe('#askWithCarousel', function () {
    let mockRequest, app;

    beforeEach(function () {
      apiAiAppRequestBodyLiveSession.originalRequest.version = 2;
      mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
      app = new ApiAiApp({request: mockRequest, response: mockResponse});
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
  describe('#askForPermissions', function () {
    let mockRequest, app;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
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
  describe('#askForPermissions', function () {
    let mockRequest, app;

    beforeEach(function () {
      apiAiAppRequestBodyLiveSession.originalRequest.version = 2;
      mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
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
  describe('#getUser', function () {
    let mockRequest, app;

    beforeEach(function () {
      apiAiAppRequestBodyLiveSession.originalRequest.data.user.user_id = '11112226094657824893';
      mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
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
  describe('#getUserName', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant request user.', function () {
      let mockRequest, app;
      apiAiAppRequestBodyLiveSession.originalRequest.data.user = {
        'user_id': '11112226094657824893',
        'profile': {
          'display_name': 'John Smith',
          'given_name': 'John',
          'family_name': 'Smith'
        }
      };
      mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
      app = new ApiAiApp({request: mockRequest, response: mockResponse});
      expect(app.getUserName().displayName).to.equal('John Smith');
      expect(app.getUserName().givenName).to.equal('John');
      expect(app.getUserName().familyName).to.equal('Smith');

      // Test the false case
      apiAiAppRequestBodyLiveSession.originalRequest.data.user.profile = undefined;
      mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
      app = new ApiAiApp({request: mockRequest, response: mockResponse});
      expect(app.getUserName()).to.equal(null);
    });
  });

  /**
   * Describes the behavior for ApiAiApp getUserLocale method.
   */
  describe('#getUserLocale', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant request user with locale.', function () {
      let mockRequest, app;
      mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
      app = new ApiAiApp({request: mockRequest, response: mockResponse});
      expect(app.getUserLocale()).to.equal('en-US');
    });

    // Failure case
    it('Should return null for missing locale.', function () {
      let mockRequest, app;
      apiAiAppRequestBodyLiveSession.originalRequest.data.user.locale = undefined;
      mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
      app = new ApiAiApp({request: mockRequest, response: mockResponse});
      expect(app.getUserLocale()).to.equal(null);
    });
  });

  /**
   * Describes the behavior for ApiAiApp getDeviceLocation method.
   */
  describe('#getDeviceLocation', function () {
    let mockRequest, app;

    beforeEach(function () {
      apiAiAppRequestBodyLiveSession.originalRequest.data.device = {
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
      mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
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
      apiAiAppRequestBodyLiveSession.originalRequest.data.device = undefined;
      initMockApp();
      expect(app.getDeviceLocation()).to.equal(null);
    });
  });

  /**
   * Describes the behavior for ApiAiApp getTransactionRequirementsResult method.
   */
  describe('#getTransactionRequirementsResult', function () {
    beforeEach(function () {
      apiAiAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [
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
      let mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
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
  describe('#getDeliveryAddress', function () {
    beforeEach(function () {
      apiAiAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [
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
      let mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
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
      apiAiAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments[0].name = 'TRANSACTION_DECISION_VALUE';
      let mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
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
      apiAiAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments[0].extension.userDecision =
        'REJECTED';
      let mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
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
  describe('#getTransactionDecision', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant request delivery address', function () {
      apiAiAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [
        {
          'extension': {
            'userDecision': 'ORDER_ACCEPTED',
            'checkResult': {
              'resultType': 'OK',
              'order': {
                'finalOrder': {'fakeOrder': 'fake_order'},
                'googleOrderId': 'goog_123',
                'actionOrderId': 'action_123',
                'orderDate': {
                  'seconds': 40,
                  'nanos': 880000000
                },
                'paymentInfo': {'fakePayment': 'fake_payment'},
                'customerInfo': {
                  'email': 'username@example.com'
                }
              }
            }
          },
          'name': 'TRANSACTION_DECISION_VALUE'
        }
      ];
      let mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
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
            'finalOrder': {'fakeOrder': 'fake_order'},
            'googleOrderId': 'goog_123',
            'actionOrderId': 'action_123',
            'orderDate': {
              'seconds': 40,
              'nanos': 880000000
            },
            'paymentInfo': {'fakePayment': 'fake_payment'},
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
  describe('#getUserConfirmation', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant request positive user confirmation', function () {
      apiAiAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [
        {
          'name': 'CONFIRMATION',
          'boolValue': true
        }
      ];
      let mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
      let app = new ApiAiApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getUserConfirmation()).to.equal(true);
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant request negative user confirmation', function () {
      apiAiAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [
        {
          'name': 'CONFIRMATION',
          'boolValue': false
        }
      ];
      let mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
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
  describe('#getDateTime', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant datetime information', function () {
      apiAiAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [
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
      let mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);

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
      apiAiAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [];
      let mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);

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
  describe('#getSignInStatus', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant sign in status', function () {
      apiAiAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [
        {
          'name': 'SIGN_IN',
          'extension': {
            '@type': 'type.googleapis.com/google.actions.v2.SignInValue',
            'status': 'foo_status'
          }
        }
      ];
      let mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);

      let app = new ApiAiApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.getSignInStatus()).to.equal('foo_status');
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant request missing sign in status', function () {
      apiAiAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [];
      let mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
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
  describe('#askForTransactionRequirements', function () {
    let mockRequest, app;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, apiAiAppRequestBodyLiveSession);
      app = new ApiAiApp({
        request: mockRequest,
        response: mockResponse
      });
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid JSON transaction requirements with Google payment options',
      function () {
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
    it('Should return valid JSON transaction requirements with Action payment options',
      function () {
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
  describe('#askForDeliveryAddress', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid JSON delivery address', function () {
      let mockRequest = new MockRequest(headerV2, apiAiAppRequestBodyLiveSession);

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
  describe('#askForTransactionDecision', function () {
    let app, mockRequest;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, apiAiAppRequestBodyLiveSession);
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

      app.askForTransactionDecision({fakeOrderId: 'order_id'}, transactionConfig);

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
                'proposedOrder': {'fakeOrderId': 'order_id'},
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

      app.askForTransactionDecision({fakeOrderId: 'order_id'}, transactionConfig);

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
                'proposedOrder': {'fakeOrderId': 'order_id'},
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
  describe('#askForConfirmation', function () {
    let app, mockRequest;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, apiAiAppRequestBodyLiveSession);
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
  describe('#askForDateTime', function () {
    let app, mockRequest;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, apiAiAppRequestBodyLiveSession);
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
  describe('#askForSignIn', function () {
    let app, mockRequest;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, apiAiAppRequestBodyLiveSession);
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
  describe('#isPermissionGranted', function () {
    let app, mockRequest;

    function initMockApp () {
      mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
      app = new ApiAiApp({
        request: mockRequest,
        response: mockResponse
      });
    }

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant request user.', function () {
      apiAiAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [{
        'name': 'permission_granted',
        'text_value': 'true'
      }];
      initMockApp();
      expect(app.isPermissionGranted()).to.equal(true);

      // Test the false case
      apiAiAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments[0].text_value = false;
      initMockApp();
      expect(app.isPermissionGranted()).to.equal(false);
    });
  });

  /**
   * Describes the behavior for ApiAiApp isInSandbox method.
   */
  describe('#isInSandbox', function () {
    let app, mockRequest;

    function initMockApp () {
      mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
      app = new ApiAiApp({
        request: mockRequest,
        response: mockResponse
      });
    }

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant request user.', function () {
      apiAiAppRequestBodyLiveSession.originalRequest.data.isInSandbox = true;
      initMockApp();
      expect(app.isInSandbox()).to.be.true;

      // Test the false case
      apiAiAppRequestBodyLiveSession.originalRequest.data.isInSandbox = false;
      initMockApp();
      expect(app.isInSandbox()).to.be.false;
    });
  });

  /**
   * Describes the behavior for ApiAiApp getIntent method.
   */
  describe('#getIntent', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should get the intent value for the success case.', function () {
      apiAiAppRequestBodyLiveSession.result.action = 'check_guess';
      const mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);

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
  describe('#getArgument', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should get the argument value for the success case.', function () {
      apiAiAppRequestBodyLiveSession.result.parameters.guess = '50';
      apiAiAppRequestBodyLiveSession.originalRequest.data.inputs[0].arguments = [
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
      const mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);

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
  describe('#getContextArgument', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should get the context argument value for the success case.', function () {
      apiAiAppRequestBodyLiveSession.result.contexts = [
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
      const mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);

      const app = new ApiAiApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.getContextArgument('game', 'guess')).to.deep.equal({value: '50', original: '50'});
      expect(app.getContextArgument('previous_answer', 'answer')).to.deep.equal({value: '68'});
    });
  });

  /**
   * Describes the behavior for ApiAiApp getIncomingRichResponse method.
   */
  describe('#getIncomingRichResponse', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should get the incoming rich response for the success case.', function () {
      apiAiAppRequestBodyLiveSession.result.fulfillment.messages = [
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

      const mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);

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
  describe('#getIncomingList', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should get the incoming list for the success case.', function () {
      apiAiAppRequestBodyLiveSession.result.fulfillment.messages.push({
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
      const mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);

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
  describe('#getIncomingCarousel', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should get the incoming list for the success case.', function () {
      apiAiAppRequestBodyLiveSession.result.fulfillment.messages.push({
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

      const mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);

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

      expect(app.getIncomingCarousel()).to.deep.equal(JSON.parse(JSON.stringify(expectedResponse)));
    });
  });

  /**
   * Describes the behavior for ApiAiApp getSelectedOption method.
   */
  describe('#getSelectedOption', function () {
    let mockRequest, app;
    beforeEach(function () {
      mockRequest = new MockRequest(headerV1, {});
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should get the selected option when given in APIAI context.', function () {
      apiAiAppRequestBodyLiveSession.originalRequest.data.inputs[0] = {
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
      apiAiAppRequestBodyLiveSession.result.contexts = [
        {
          'name': 'actions_intent_option',
          'parameters': {
            'OPTION': 'first_item'
          },
          'lifespan': 0
        }
      ];
      mockRequest.body = apiAiAppRequestBodyLiveSession;
      app = new ApiAiApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getSelectedOption()).to.equal('first_item');
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should get the selected option when not given in APIAI context.', function () {
      apiAiAppRequestBodyLiveSession.originalRequest.data.inputs[0] = {
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
      mockRequest.body = apiAiAppRequestBodyLiveSession;
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
  describe('#isRequestFromApiAi', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should confirm request is from API.ai.', function () {
      let header = JSON.parse(JSON.stringify(headerV1));
      header['Google-Assistant-Signature'] = 'YOUR_PRIVATE_KEY';
      const mockRequest = new MockRequest(header, apiAiAppRequestBodyLiveSession);

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
      const mockRequest = new MockRequest(header, apiAiAppRequestBodyLiveSession);

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
  describe('#hasSurfaceCapability', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return true for a valid capability from incoming JSON for the success case.',
      function () {
        apiAiAppRequestBodyLiveSession.originalRequest.data.surface = {
          'capabilities': [
            {
              'name': 'actions.capability.AUDIO_OUTPUT'
            },
            {
              'name': 'actions.capability.SCREEN_OUTPUT'
            }
          ]
        };

        let mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);

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
  describe('#getSurfaceCapabilities', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid list of capabilities from incoming JSON for the success case.',
      function () {
        apiAiAppRequestBodyLiveSession.originalRequest.data.surface = {
          'capabilities': [
            {
              'name': 'actions.capability.AUDIO_OUTPUT'
            },
            {
              'name': 'actions.capability.SCREEN_OUTPUT'
            }
          ]
        };

        let mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);

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
  describe('#getInputType', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid input type from incoming JSON for the success case.', function () {
      const KEYBOARD = 3;
      apiAiAppRequestBodyLiveSession.originalRequest.data.inputs = [
        {
          'raw_inputs': [
            {
              'input_type': KEYBOARD
            }
          ]
        }
      ];
      let mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
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
  describe('#getRawInput', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should raw input from API.ai.', function () {
      apiAiAppRequestBodyLiveSession.result.resolvedQuery = 'is it 667';

      const mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);

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
  describe('#setContext', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return the valid JSON in the response object for the success case.', function () {
      const mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
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
   * Describes the behavior for ApiAiApp getContexts method.
   */
  describe('#getContexts', function () {
    let app, mockRequest;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
    });

    function initMockApp () {
      app = new ApiAiApp({
        request: mockRequest,
        response: mockResponse
      });
    }

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return the active contexts from incoming JSON for the success case.', function () {
      // let body = apiAiAppRequestBodyLiveSession;
      apiAiAppRequestBodyLiveSession.result.contexts = [
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
      mockRequest.body = apiAiAppRequestBodyLiveSession;
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
    it('Should return the active contexts from incoming JSON when only app.data incoming',
      function () {
        apiAiAppRequestBodyLiveSession.result.contexts = [{'name': '_actions_on_google_'}];
        mockRequest.body = apiAiAppRequestBodyLiveSession;
        initMockApp();
        let mockContexts = app.getContexts();
        let expectedContexts = [];
        expect(mockContexts).to.deep.equal(expectedContexts);
      });
    it('Should return the active contexts from incoming JSON when no contexts provided.',
      function () {
        // Check the empty case
        apiAiAppRequestBodyLiveSession.result.contexts = [];
        mockRequest.body = apiAiAppRequestBodyLiveSession;
        initMockApp();
        let mockContexts = app.getContexts();
        let expectedContexts = [];
        expect(mockContexts).to.deep.equal(expectedContexts);
      });
  });

  /**
   * Describes the behavior for ApiAiApp getContext method.
   */
  describe('#getContext', function () {
    let app, mockRequest;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
    });

    function initMockApp () {
      app = new ApiAiApp({
        request: mockRequest,
        response: mockResponse
      });
    }

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return the context by name from incoming JSON for the success case.', function () {
      apiAiAppRequestBodyLiveSession.result.contexts = [{
        'name': 'number',
        'lifespan': 5,
        'parameters': {
          'parameterOne': '23',
          'parameterTwo': '24'
        }
      }];
      mockRequest.body = apiAiAppRequestBodyLiveSession;
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

    it('Should return the context by name from incoming JSON when no context provided.',
      function () {
        //  Check the empty case
        apiAiAppRequestBodyLiveSession.result.contexts = [];
        mockRequest.body = apiAiAppRequestBodyLiveSession;
        initMockApp();
        let mockContext = app.getContext('name');
        let expectedContext = null;
        expect(mockContext).to.equal(expectedContext);
      });
  });

  /**
   * Describes the behavior for ApiAiApp ask with no inputs method.
   */
  describe('#ask', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return the valid JSON in the response object for the success case.', function () {
      const mockRequest = new MockRequest(headerV1, apiAiAppRequestBodyLiveSession);
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
            'parameters': {}
          }
        ]
      };
      expect(mockResponse.body).to.deep.equal(expectedResponse);
    });
  });
});
