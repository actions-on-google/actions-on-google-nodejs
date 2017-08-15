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
 * Test suite for the actions client library.
 */
const winston = require('winston');
const chai = require('chai');
const expect = chai.expect;
const spies = require('chai-spies');
const { ActionsSdkApp } = require('.././actions-on-google');
const {
  actionsSdkAppRequestBodyNewSessionMock,
  actionsSdkAppRequestBodyLiveSessionMock,
  headerV1,
  headerV2,
  MockResponse,
  MockRequest,
  fakeConversationId,
  fakeUserId
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
//                   Actions SDK support
// ---------------------------------------------------------------------------

describe('ActionsSdkApp', function () {
  let actionsSdkAppRequestBodyNew, actionsSdkAppRequestBodyLive, mockResponse;

  beforeEach(function () {
    actionsSdkAppRequestBodyNew = JSON.parse(JSON.stringify(actionsSdkAppRequestBodyNewSessionMock));
    actionsSdkAppRequestBodyLive = JSON.parse(JSON.stringify(actionsSdkAppRequestBodyLiveSessionMock));
    mockResponse = new MockResponse();
  });

  /**
   * Describes the behavior for ApiAiApp constructor method.
   */
  describe('#constructor', function () {
    // Calls sessionStarted when provided
    it('Calls sessionStarted when new session', function () {
      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyNew);
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
      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
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
      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
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
      expect(app.body_).to.deep.not.equal(actionsSdkAppRequestBodyLive);
    });

    // Does not transform to Proto3
    it('Does detect v2 and not transform body when version is present', function () {
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);

      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });

      app.handleRequest();

      expect(app.body_).to.deep.equal(actionsSdkAppRequestBodyLive);
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
  describe('#ask', function () {
    let mockRequest, app;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
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
  describe('#tell', function () {
    let mockRequest, app;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
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
  describe('#getRawInput', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should get the raw user input for the success case.', function () {
      actionsSdkAppRequestBodyLive.inputs[0].raw_inputs = [
        {
          'input_type': 2,
          'query': 'bye'
        }
      ];
      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
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
  describe('#askWithList', function () {
    let mockRequest, app;
    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
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
  describe('#askWithCarousel', function () {
    let mockRequest, app;
    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
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
  describe('#askForPermissions', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return the valid JSON in the response object for the success case.', function () {
      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
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
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
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
  describe('#askForTransactionRequirements', function () {
    let mockRequest, app;
    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
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
  describe('#askForDeliveryAddress', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid JSON delivery address', function () {
      let mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
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
  describe('#askForTransactionDecision', function () {
    let mockRequest, app;
    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
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
  describe('#askForConfirmation', function () {
    let mockRequest, app;
    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
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
  describe('#askForDateTime', function () {
    let mockRequest, app;
    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
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
  describe('#askForSignIn', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid JSON sign in request', function () {
      let mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
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
  describe('#getUser', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant request info.', function () {
      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
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
  describe('#getUserName', function () {
    let mockRequest, app;
    function initMockApp () {
      mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
      app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
    }
    it('Should validate assistant request user with sample user information.', function () {
      actionsSdkAppRequestBodyLive.user.profile = {
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
      // Test the false case
      actionsSdkAppRequestBodyLive.user.profile = undefined;
      initMockApp();
      expect(app.getUserName()).to.equal(null);
    });
  });

  /**
   * Describes the behavior for ActionsSdkApp getUserLocale method.
   */
  describe('#getUserLocale', function () {
    let mockRequest, app;
    function initMockApp () {
      mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
      app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
    }
    it('Should validate assistant request user with locale.', function () {
      actionsSdkAppRequestBodyLive.user.locale = 'en-US';
      initMockApp();
      expect(app.getUserLocale()).to.equal('en-US');
    });

    it('Should return null for missing locale.', function () {
      // Test the false case
      actionsSdkAppRequestBodyLive.user.locale = undefined;
      initMockApp();
      expect(app.getUserLocale()).to.equal(null);
    });
  });

  /**
   * Describes the behavior for ActionsSdkApp getTransactionRequirementsResult method.
   */
  describe('#getTransactionRequirementsResult', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant request user.', function () {
      actionsSdkAppRequestBodyLive.inputs[0].arguments = [
        {
          'extension': {
            'canTransact': true,
            '@type': 'type.googleapis.com/google.actions.v2.TransactionRequirementsCheckResult',
            'resultType': 'OK'
          },
          'name': 'TRANSACTION_REQUIREMENTS_CHECK_RESULT'
        }
      ];

      let mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
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
  describe('#getDeliveryAddress', function () {
    beforeEach(function () {
      actionsSdkAppRequestBodyLive.inputs[0].arguments = [
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
      let mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
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
      actionsSdkAppRequestBodyLive.inputs[0].arguments.name = 'DELIVERY_ADDRESS_VALUE';
      let mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
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
      actionsSdkAppRequestBodyLive.inputs[0].arguments[0].extension.userDecision = 'REJECTED';
      let mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
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
  describe('#getTransactionDecision', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant request delivery address', function () {
      actionsSdkAppRequestBodyLive.inputs[0].arguments = [
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
      let mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
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
  describe('#getUserConfirmation', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant positive confirmation decision', function () {
      actionsSdkAppRequestBodyLive.inputs[0].arguments = [
        {
          'name': 'CONFIRMATION',
          'boolValue': true
        }
      ];
      let mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      let app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.getUserConfirmation()).to.equal(true);
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant negative confirmation decision', function () {
      actionsSdkAppRequestBodyLive.inputs[0].arguments = [
        {
          'name': 'CONFIRMATION',
          'boolValue': false
        }
      ];
      let mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);

      let app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.getUserConfirmation()).to.equal(false);
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant missing confirmation decision', function () {
      actionsSdkAppRequestBodyLive.inputs[0].arguments = [];
      let mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
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
  describe('#getDateTime', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant date time info', function () {
      actionsSdkAppRequestBodyLive.inputs[0].arguments = [
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
      let mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
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
      actionsSdkAppRequestBodyLive.inputs[0].arguments = [];
      let mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
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
  describe('#getSignInStatus', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant sign in status', function () {
      actionsSdkAppRequestBodyLive.inputs[0].arguments = [
        {
          'name': 'SIGN_IN',
          'extension': {
            '@type': 'type.googleapis.com/google.actions.v2.SignInValue',
            'status': 'foo_status'
          }
        }
      ];
      let mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      let app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.getSignInStatus()).to.deep.equal('foo_status');
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant missing sign in status', function () {
      actionsSdkAppRequestBodyLive.inputs[0].arguments = [];
      let mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
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
  describe('#getDeviceLocation', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant request for device location when location is provided.', function () {
      actionsSdkAppRequestBodyLive.device = {
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
      let mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
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
      actionsSdkAppRequestBodyLive.device = undefined;
      let mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
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
  describe('#isPermissionGranted', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate when permissions were granted.', function () {
      actionsSdkAppRequestBodyLive.inputs[0].arguments = [
        {
          'name': 'permission_granted',
          'text_value': 'true'
        }
      ];

      let mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);

      let app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.isPermissionGranted()).to.equal(true);
    });

    it('Should validate when permissions were not granted.', function () {
      // Test the false case
      actionsSdkAppRequestBodyLive.inputs[0].arguments = [
        {
          'name': 'permission_granted',
          'text_value': 'false'
        }
      ];
      let mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
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
  describe('#isInSandbox', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate when app is in sandbox mode.', function () {
      actionsSdkAppRequestBodyLive.isInSandbox = true;
      let mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      let app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.isInSandbox()).to.be.true;
    });
    it('Should validate when app is not in sandbox mode.', function () {
      // Test the false case
      actionsSdkAppRequestBodyLive.isInSandbox = false;
      let mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
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
  describe('#hasSurfaceCapability', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return true for a valid capability from incoming JSON for the success case.', function () {
      actionsSdkAppRequestBodyLive.surface = {
        'capabilities': [
          {
            'name': 'actions.capability.AUDIO_OUTPUT'
          },
          {
            'name': 'actions.capability.SCREEN_OUTPUT'
          }
        ]
      };
      let mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);

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
  describe('#getSurfaceCapabilities', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid list of capabilities from incoming JSON for the success case.', function () {
      actionsSdkAppRequestBodyLive.surface = {
        'capabilities': [
          {
            'name': 'actions.capability.AUDIO_OUTPUT'
          },
          {
            'name': 'actions.capability.SCREEN_OUTPUT'
          }
        ]
      };

      let mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
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
  describe('#getInputType', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid input type from incoming JSON for the success case.', function () {
      const KEYBOARD = 3;
      actionsSdkAppRequestBodyLive.inputs[0].raw_inputs = [
        {
          'input_type': KEYBOARD,
          'query': 'talk to action snippets'
        }
      ];
      let mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);

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
  describe('#getApiVersion', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant request info.', function () {
      let headers = {
        'Content-Type': 'application/json',
        'Google-Assistant-API-Version': 'v1'
      };
      const mockRequest = new MockRequest(headers, actionsSdkAppRequestBodyLive);
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
  describe('#getDialogState', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant dialog state info.', function () {
      actionsSdkAppRequestBodyLive.conversation.conversation_token = '{"started":true}';
      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
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
  describe('#getActionVersionLabel', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant action version label info.', function () {
      let headers = JSON.parse(JSON.stringify(headerV1));
      headers['Agent-Version-Label'] = '1.0.0';
      const mockRequest = new MockRequest(headers, actionsSdkAppRequestBodyLive);
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
  describe('#getConversationId', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant conversation ID.', function () {
      actionsSdkAppRequestBodyLive.conversation.conversation_id = fakeConversationId;
      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
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
  describe('#getArgument', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant intent.', function () {
      actionsSdkAppRequestBodyLive.inputs[0].arguments = [
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
      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
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
  describe('#getSelectedOption', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should get the selected option when given in APIAI context.', function () {
      actionsSdkAppRequestBodyLive.inputs[0].arguments = [
        {
          'name': 'OPTION',
          'text_value': 'first_item'
        }
      ];
      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
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
  describe('#tell', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant tell SSML.', function () {
      actionsSdkAppRequestBodyLive.inputs[0].raw_inputs = [
        {
          'input_type': 2,
          'query': '45'
        }
      ];
      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
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
});
