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
const { expect } = chai;
const spies = require('chai-spies');
const { ActionsSdkApp } = require('.././actions-on-google');
const {
  actionsSdkAppRequestBodyNewSessionMock,
  actionsSdkAppRequestBodyLiveSessionMock,
  actionsSdkAppRequestBodyNewSessionMockV2,
  actionsSdkAppRequestBodyLiveSessionMockV2,
  headerV1,
  headerV2,
  MockResponse,
  MockRequest,
  fakeConversationId,
  fakeUserId,
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
//                   Actions SDK support
// ---------------------------------------------------------------------------

describe('ActionsSdkApp', function () {
  let actionsSdkAppRequestBodyNew;
  let actionsSdkAppRequestBodyLive;
  let mockResponse;
  let actionsSdkAppRequestBodyNewV2;
  let actionsSdkAppRequestBodyLiveV2;

  beforeEach(function () {
    actionsSdkAppRequestBodyNew = clone(actionsSdkAppRequestBodyNewSessionMock);
    actionsSdkAppRequestBodyLive = clone(actionsSdkAppRequestBodyLiveSessionMock);
    actionsSdkAppRequestBodyNewV2 = clone(actionsSdkAppRequestBodyNewSessionMockV2);
    actionsSdkAppRequestBodyLiveV2 = clone(actionsSdkAppRequestBodyLiveSessionMockV2);
    mockResponse = new MockResponse();
  });

  /**
   * Describes the behavior for ActionsSdkApp constructor method.
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
      const inputPrompt = app.buildInputPrompt(true, '<speak>Hi! <break time="1"/> ' +
        'I can read out an ordinal like ' +
        '<say-as interpret-as="ordinal">123</say-as>. Say a number.</speak>',
        [
          `I didn't hear a number`,
          `If you're still there, what's the number?`,
          'What is the number?'
        ]);
      app.ask(inputPrompt);

          // Validating the response object
      const expectedResponse = {
        'conversation_token': '{"state":null,"data":{}}',
        'user_storage': '{"data":{}}',
        'expect_user_response': true,
        'expected_inputs': [
          {
            'input_prompt': {
              'initial_prompts': [
                {
                  'ssml': '<speak>Hi! <break time="1"/> ' +
                    'I can read out an ordinal like ' +
                    '<say-as interpret-as="ordinal">123</say-as>. Say a number.</speak>'
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

    it('Should return the valid JSON in the response object for the success case ' +
      'when String text was asked w/o input prompts.', function () {
      app.ask('What can I help you with?');
      const expectedResponse = {
        'conversation_token': '{"state":null,"data":{}}',
        'user_storage': '{"data":{}}',
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

    it('Should return the valid JSON in the response object for the success case ' +
      'when SSML text was asked w/o input prompts.', function () {
      app.ask('<speak>What <break time="1"/> can I help you with?</speak>');
      // Validating the response object
      const expectedResponse = {
        'conversation_token': '{"state":null,"data":{}}',
        'user_storage': '{"data":{}}',
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

    it('Should return the valid JSON in the response object ' +
      'for the advanced success case.', function () {
      const inputPrompt = app.buildInputPrompt(false, 'Welcome to action snippets! Say a number.',
        ['Say any number', 'Pick a number', 'What is the number?']);
      app.ask(inputPrompt);
      // Validating the response object
      const expectedResponse = {
        'conversation_token': '{"state":null,"data":{}}',
        'user_storage': '{"data":{}}',
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

    it('Should return the valid simple response JSON ' +
      'in the response object for the success case.', function () {
      app.ask({ speech: 'hello', displayText: 'hi' });
      // Validating the response object
      const expectedResponse = {
        'conversation_token': '{"state":null,"data":{}}',
        'user_storage': '{"data":{}}',
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
      expect(clone(mockResponse.body)).to.deep.equal(expectedResponse);
    });

      // Success case test, when the API returns a valid 200 response with the response object
    it('Should return the valid rich response JSON ' +
      'in the response object for the success case.', function () {
      app.ask(app.buildRichResponse()
        .addSimpleResponse({ speech: 'hello', displayText: 'hi' })
        .addSuggestions(['Say this', 'or this']));

      // Validating the response object
      const expectedResponse = {
        'conversation_token': '{"state":null,"data":{}}',
        'expect_user_response': true,
        'user_storage': '{"data":{}}',
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
      expect(clone(mockResponse.body)).to.deep.equal(expectedResponse);
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
      const expectedResponse = {
        'user_storage': '{"data":{}}',
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
    it('Should return the valid simple rich response JSON ' +
      'in the response object for the success case.', function () {
      app.tell({ speech: 'hello', displayText: 'hi' });

      // Validating the response object
      const expectedResponse = {
        'user_storage': '{"data":{}}',
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
      expect(clone(mockResponse.body)).to.deep.equal(expectedResponse);
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return the valid rich response JSON ' +
      'in the response object for the success case.', function () {
      app.tell(app.buildRichResponse()
        .addSimpleResponse({ speech: 'hello', displayText: 'hi' })
        .addSuggestions(['Say this', 'or this']));

      // Validating the response object
      const expectedResponse = {
        'user_storage': '{"data":{}}',
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
      expect(clone(mockResponse.body)).to.deep.equal(expectedResponse);
    });

    // Failure test, when the API returns a 400 response with the response object
    it('Should send failure response for rich response without simple response', function () {
      function handler (app) {
        return new Promise(function (resolve, reject) {
          resolve(app.tell(app.buildRichResponse()));
        });
      }

      const actionMap = new Map();
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
    it('Should return the valid list JSON in the response object ' +
      'for the success case.', function () {
      app.askWithList('Here is a list', app.buildList()
        .addItems([
          app.buildOptionItem('key_1', 'key one'),
          app.buildOptionItem('key_2', 'key two')
        ]), {
          optionType: 'list'
        });

      // Validating the response object
      const expectedResponse = {
        'conversationToken': '{"optionType":"list"}',
        'userStorage': '{"data":{}}',
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
    it('Should return the valid carousel JSON in the response object ' +
      'for the success case.', function () {
      app.askWithCarousel('Here is a carousel', app.buildCarousel()
        .addItems([
          app.buildOptionItem('key_1', 'key one'),
          app.buildOptionItem('key_2', 'key two')
        ]), {
          optionType: 'carousel'
        });

      // Validating the response object
      const expectedResponse = {
        'conversationToken': '{"optionType":"carousel"}',
        'userStorage': '{"data":{}}',
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
      const expectedResponse = {
        'conversation_token': '{"carType":"big"}',
        'user_storage': '{"data":{}}',
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

    it('Should return the valid JSON in the response object ' +
      'for the success case in v2.', function () {
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
      const expectedResponse = {
        'conversationToken': '{"carType":"big"}',
        'userStorage': '{"data":{}}',
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
    it('Should return valid JSON transaction requirements ' +
      'with Google payment options', function () {
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
      app.askForTransactionRequirements(transactionConfig, { cartSize: 2 });
      const expectedResponse = {
        'conversationToken': '{"cartSize":2}',
        'userStorage': '{"data":{}}',
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
    it('Should return valid JSON transaction requirements ' +
      'with Google payment options and custom tokenization type', function () {
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
        tokenizationType: 'CUSTOM STRING'
      };
      app.askForTransactionRequirements(transactionConfig, { cartSize: 2 });
      const expectedResponse = {
        'conversationToken': '{"cartSize":2}',
        'userStorage': '{"data":{}}',
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
                        'tokenizationType': 'CUSTOM STRING',
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
    it('Should return valid JSON transaction requirements ' +
      'with Action payment options', function () {
      const transactionConfig = {
        deliveryAddressRequired: true,
        type: 'BANK',
        displayName: 'Checking-4773'
      };
      app.askForTransactionRequirements(transactionConfig, { cartSize: 2 });
      const expectedResponse = {
        'conversationToken': '{"cartSize":2}',
        'userStorage': '{"data":{}}',
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
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      app.askForDeliveryAddress('Just because', { cartSize: 2 });
      const expectedResponse = {
        'conversationToken': '{"cartSize":2}',
        'userStorage': '{"data":{}}',
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
      app.askForTransactionDecision({ fakeOrderId: 'order_id' }, transactionConfig,
        { cartSize: 2 });
      const expectedResponse = {
        'conversationToken': '{"cartSize":2}',
        'userStorage': '{"data":{}}',
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
            ]
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
        displayName: 'Checking-4773'
      };
      app.askForTransactionDecision({ fakeOrderId: 'order_id' }, transactionConfig,
        { cartSize: 2 });
      const expectedResponse = {
        'conversationToken': '{"cartSize":2}',
        'userStorage': '{"data":{}}',
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
            ]
          }
        ]
      };
      expect(mockResponse.body).to.deep.equal(expectedResponse);
    });
  });

  /**
   * Describes the behavior for ActionsSdkApp askForPlace method.
   */
  describe('#askForPlace', function () {
    let mockRequest, app;
    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
    });
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid JSON place request', function () {
      const requestPrompt = 'Where do you want to get picked up?';
      const permissionContext = 'To find a place to pick you up';
      app.askForPlace(requestPrompt, permissionContext, { cartSize: 2 });
      const expectedResponse = {
        'conversationToken': '{"cartSize":2}',
        'userStorage': '{"data":{}}',
        'expectUserResponse': true,
        'expectedInputs': [
          {
            'inputPrompt': {
              'initialPrompts': [
                {
                  'textToSpeech': 'PLACEHOLDER_FOR_PLACE'
                }
              ],
              'noInputPrompts': []
            },
            'possibleIntents': [
              {
                'intent': 'actions.intent.PLACE',
                'inputValueData': {
                  '@type': 'type.googleapis.com/google.actions.v2.PlaceValueSpec',
                  'dialogSpec': {
                    'extension': {
                      '@type':
                        'type.googleapis.com/google.actions.v2.PlaceValueSpec.PlaceDialogSpec',
                      'requestPrompt': requestPrompt,
                      'permissionContext': permissionContext
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
      app.askForConfirmation('You want to do that?', { cartSize: 2 });
      const expectedResponse = {
        'conversationToken': '{"cartSize":2}',
        'userStorage': '{"data":{}}',
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
      const expectedResponse = {
        'conversationToken': '{"state":null,"data":{}}',
        'userStorage': '{"data":{}}',
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

      const expectedResponse = {
        'conversationToken': '{"cartSize":2}',
        'userStorage': '{"data":{}}',
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
      const expectedResponse = {
        'conversationToken': '{"state":null,"data":{}}',
        'userStorage': '{"data":{}}',
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

      expect(clone(mockResponse.body)).to.deep.equal(expectedResponse);
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid JSON datetime request without prompts', function () {
      app.askForDateTime();
      const expectedResponse = {
        'conversationToken': '{"state":null,"data":{}}',
        'userStorage': '{"data":{}}',
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

      expect(clone(mockResponse.body)).to.deep.equal(expectedResponse);
    });
  });

  /**
   * Describes the behavior for ActionsSdkApp askForSignIn method.
   */
  describe('#askForSignIn', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid JSON sign in request', function () {
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      app.askForSignIn({ cartSize: 2 });
      const expectedResponse = {
        'conversationToken': '{"cartSize":2}',
        'userStorage': '{"data":{}}',
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
   * Describes the behavior for ActionsSdkApp askForNewSurface method.
   */
  describe('#askForNewSurface', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid JSON sign in request', function () {
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      app.askForNewSurface('test context', 'test title', ['cap_one', 'cap_two']);
      const expectedResponse = {
        'conversationToken': '{"state":null,"data":{}}',
        'userStorage': '{"data":{}}',
        'expectUserResponse': true,
        'expectedInputs': [
          {
            'inputPrompt': {
              'initialPrompts': [
                {
                  'textToSpeech': 'PLACEHOLDER_FOR_NEW_SURFACE'
                }
              ],
              'noInputPrompts': []
            },
            'possibleIntents': [
              {
                'intent': 'actions.intent.NEW_SURFACE',
                'inputValueData': {
                  'context': 'test context',
                  'notificationTitle': 'test title',
                  'capabilities': ['cap_one', 'cap_two'],
                  '@type': 'type.googleapis.com/google.actions.v2.NewSurfaceValueSpec'
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

      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
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
      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
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
      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
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
      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
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
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
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
   * Describes the behavior for ActionsSdkApp getPlace method.
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
      actionsSdkAppRequestBodyLive.inputs[0].arguments = [
        {
          'name': 'PLACE',
          'placeValue': place
        }
      ];
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
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
      actionsSdkAppRequestBodyLive.inputs[0].arguments = [
        {
          'name': 'PLACE',
          'status': status
        }
      ];
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getPlace()).to.be.null;
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
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
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
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);

      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.getUserConfirmation()).to.equal(false);
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant missing confirmation decision', function () {
      actionsSdkAppRequestBodyLive.inputs[0].arguments = [];
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
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
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
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
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
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
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.getSignInStatus()).to.deep.equal('foo_status');
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant missing sign in status', function () {
      actionsSdkAppRequestBodyLive.inputs[0].arguments = [];
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
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
    it('Should validate assistant request for device location ' +
      'when location is provided.', function () {
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
      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
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

    it('Should validate assistant request for device location ' +
      'when location is undefined.', function () {
      // Test the false case
      actionsSdkAppRequestBodyLive.device = undefined;
      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.getDeviceLocation()).to.equal(null);
    });
  });

  /**
   * Describes the behavior for ActionsSdkApp getAvailableSurfaces method.
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
      actionsSdkAppRequestBodyLive.availableSurfaces = availableSurfaces;
      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.getAvailableSurfaces()).to.deep.equal(availableSurfaces);
    });

    // Failure case test
    it('Should return empty assistant available surfaces', function () {
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getAvailableSurfaces()).to.deep.equal([]);
    });
  });

  /**
   * Describes the behavior for ActionsSdkApp hasAvailableSurfaceCapabilities method.
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
      actionsSdkAppRequestBodyLive.availableSurfaces = availableSurfaces;
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return true for set of valid capabilities', function () {
      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.hasAvailableSurfaceCapabilities(['cap_one', 'cap_two'])).to.be.true;
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return true for one valid capability', function () {
      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.hasAvailableSurfaceCapabilities('cap_one')).to.be.true;
    });

    // Failure case test, when the API returns a valid 200 response with the response object
    it('Should return true for set of invalid capabilities', function () {
      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.hasAvailableSurfaceCapabilities(['cap_one', 'cap_three'])).to.be.false;
    });

    // Failure case test, when the API returns a valid 200 response with the response object
    it('Should return true for one invalid capability', function () {
      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.hasAvailableSurfaceCapabilities('cap_five')).to.be.false;
    });

    // Failure case test
    it('Should return false for empty assistant available surfaces', function () {
      actionsSdkAppRequestBodyLive.availableSurfaces = undefined;
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.hasAvailableSurfaceCapabilities()).to.be.false;
    });
  });

  /**
   * Describes the behavior for ActionsSdkApp isNewSurface method.
   */
  describe('#isNewSurface', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate when new surface was accepted.', function () {
      actionsSdkAppRequestBodyLive.inputs[0].arguments = [
        {
          'name': 'NEW_SURFACE',
          'extension': {
            'status': 'OK'
          }
        }
      ];

      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);

      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.isNewSurface()).to.be.true;
    });

    // Failure case test
    it('Should validate when new surface was denied.', function () {
      actionsSdkAppRequestBodyLive.inputs[0].arguments = [
        {
          'name': 'NEW_SURFACE',
          'extension': {
            'status': 'DENIED'
          }
        }
      ];

      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);

      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });

      expect(app.isNewSurface()).to.be.false;
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

      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);

      const app = new ActionsSdkApp({
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
      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
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
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.isInSandbox()).to.be.true;
    });
    it('Should validate when app is not in sandbox mode.', function () {
      // Test the false case
      actionsSdkAppRequestBodyLive.isInSandbox = false;
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.isInSandbox()).to.be.false;
    });
  });

  /**
   * Describes the behavior for ActionsSdkApp getRepromptCount method.
   */
  describe('#getRepromptCount', function () {
    // Success case test, when the API requests with a valid reprompt count.
    it('Should return the proper reprompt count.', function () {
      actionsSdkAppRequestBodyLive.inputs = [{
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
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getRepromptCount()).to.equal(1);
    });
    // Test case checking it handles API requests without reprompt count correctly.
    it('Should return null when no reprompt count available.', function () {
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getRepromptCount()).to.be.null;
    });
  });

  /**
   * Describes the behavior for ActionsSdkApp isFinalReprompt method.
   */
  describe('#isFinalReprompt', function () {
    // Success case test, when the API requests with a valid reprompt count.
    it('Should return true for final reprompt', function () {
      actionsSdkAppRequestBodyLive.inputs = [{
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
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.isFinalReprompt()).to.be.true;
    });
    // Success case test, when the API requests with a valid reprompt count.
    it('Should return false for non-final reprompt', function () {
      actionsSdkAppRequestBodyLive.inputs = [{
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
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.isFinalReprompt()).to.be.false;
    });
    // Failure case test, when the API requests without reprompt count.
    it('Should return false when no reprompt count available.', function () {
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.isFinalReprompt()).to.be.false;
    });
  });

  /**
   * Describes the behavior for ActionsSdkApp hasSurfaceCapability method.
   */
  describe('#hasSurfaceCapability', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return true for a valid capability from incoming JSON ' +
      'for the success case.', function () {
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
      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);

      const app = new ActionsSdkApp({
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
   * Describes the behavior for ActionsSdkApp getSurfaceCapabilities method.
   */
  describe('#getSurfaceCapabilities', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid list of capabilities from incoming JSON ' +
      'for the success case.', function () {
      actionsSdkAppRequestBodyLive.surface = {
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

      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
      const app = new ActionsSdkApp({
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
   * Describes the behavior for ActionsSdkApp getInputType method.
   */
  describe('#getInputType', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return valid input type from incoming JSON ' +
      'for the success case.', function () {
      const KEYBOARD = 3;
      actionsSdkAppRequestBodyLive.inputs[0].raw_inputs = [
        {
          'input_type': KEYBOARD,
          'query': 'talk to action snippets'
        }
      ];
      const mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);

      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });

      const inputType = app.getInputType();
      expect(inputType).to.equal(app.InputTypes.KEYBOARD);
    });
  });

  /**
   * Describes the behavior for ActionsSdkApp getApiVersion method.
   */
  describe('#getApiVersion', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant request info.', function () {
      const headers = {
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
      const dialogState = { 'started': true };
      expect(dialogState).to.deep.equal(app.getDialogState());
    });
  });

  /**
   * Describes the behavior for ActionsSdkApp getActionVersionLabel method.
   */
  describe('#getActionVersionLabel', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate assistant action version label info.', function () {
      const headers = clone(headerV1);
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
      app.tell(`You said ${app.getArgument('number')}`);
      const expectedResponse = {
        'user_storage': '{"data":{}}',
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
    it('Should get the selected option when given in arguments', function () {
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
      app.tell(`<speak>You said <break time="2"/>${app.getRawInput()}</speak>`);
      const expectedResponse = {
        'user_storage': '{"data":{}}',
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

  // Note: The current way these tests are written is not ideal.
  // They are duplicated and should be fixed when the library is refactored.
  describe('#userStorage', function () {
    it('Should parse undefined userStorage as an empty object for new session', function () {
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyNewV2);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.userStorage).to.deep.equal({});
    });
    it('Should parse undefined userStorage as an empty object for live session', function () {
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLiveV2);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.userStorage).to.deep.equal({});
    });
    it('Should parse invalid userStorage from request body user data as empty object', function () {
      actionsSdkAppRequestBodyNewV2.user.userStorage = '{{}}'; // This is invalid JSON
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyNewV2);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.userStorage).to.deep.equal({});
    });
    it('Should send userStorage in response body', function () {
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLiveV2);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      const testUserStorage = {
        someProperty: 'someValue'
      };
      app.userStorage = testUserStorage;
      expect(app.userStorage).to.deep.equal(testUserStorage);
      app.tell('hi');
      expect(mockResponse.body.userStorage).to.equal(JSON.stringify({
        data: testUserStorage
      }));
    });
    it('Should parse userStorage from request body user data for new session', function () {
      const testUserStorage = {
        someProperty: 'someValue'
      };
      actionsSdkAppRequestBodyNewV2.user.userStorage = JSON.stringify({
        data: testUserStorage
      });
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyNewV2);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.userStorage).to.deep.equal(testUserStorage);
    });
    it('Should parse userStorage from request body user data for live session', function () {
      const testUserStorage = {
        someProperty: 'someValue'
      };
      actionsSdkAppRequestBodyLiveV2.user.userStorage = JSON.stringify({
        data: testUserStorage
      });
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLiveV2);
      const app = new ActionsSdkApp({
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
      actionsSdkAppRequestBodyLiveV2.user.userStorage = JSON.stringify({
        data: testUserStorage
      });
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLiveV2);
      const app = new ActionsSdkApp({
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
      expect(mockResponse.body.userStorage).to.equal(JSON.stringify({
        data: modifiedUserStorage
      }));
    });
    it('Should not send userStorage if it was not changed', function () {
      const testUserStorage = {
        someProperty: 'someValue',
        someOtherProperty: 'someOtherValue'
      };
      actionsSdkAppRequestBodyLiveV2.user.userStorage = JSON.stringify({
        data: testUserStorage
      });
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLiveV2);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.userStorage).to.deep.equal(testUserStorage);
      app.tell('hi');
      expect(mockResponse.body.userStorage).to.undefined;
    });
    it('Should send userStorage if its properties were reordered', function () {
      const testUserStorage = {
        someProperty: 'someValue',
        someOtherProperty: 'someOtherValue'
      };
      actionsSdkAppRequestBodyLiveV2.user.userStorage = JSON.stringify({
        data: testUserStorage
      });
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLiveV2);
      const app = new ActionsSdkApp({
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
      expect(mockResponse.body.userStorage).to.equal(JSON.stringify({
        data: modifiedUserStorage
      }));
    });
  });

  describe('#data', function () {
    it('Should parse undefined conversationToken as an empty data object for new session',
      function () {
        const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyNewV2);
        const app = new ActionsSdkApp({
          request: mockRequest,
          response: mockResponse
        });
        expect(app.data).to.deep.equal({});
      });
    it('Should parse undefined conversationToken as an empty data object for live session',
        function () {
          const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLiveV2);
          const app = new ActionsSdkApp({
            request: mockRequest,
            response: mockResponse
          });
          expect(app.data).to.deep.equal({});
        });
    it('Should parse conversationToken as a data object for new session', function () {
      const testData = {
        someProperty: 'someValue',
        someOtherProperty: 'someOtherValue'
      };
      actionsSdkAppRequestBodyNewV2.conversation.conversationToken = JSON.stringify({
        data: testData
      });
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyNewV2);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.data).to.deep.equal(testData);
    });
    it('Should parse conversationToken as a data object for live session', function () {
      const testData = {
        someProperty: 'someValue',
        someOtherProperty: 'someOtherValue'
      };
      actionsSdkAppRequestBodyLiveV2.conversation.conversationToken = JSON.stringify({
        data: testData
      });
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLiveV2);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.data).to.deep.equal(testData);
    });
    it('Should send conversationToken in response body mid-dialog', function () {
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLiveV2);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      const testData = {
        someProperty: 'someValue'
      };
      app.data = testData;
      expect(app.data).to.deep.equal(testData);
      app.ask('hi');
      expect(mockResponse.body.conversationToken).to.equal(JSON.stringify({
        state: null,
        data: testData
      }));
    });
    it('Should send modified conversationToken in response body mid-dialog', function () {
      // Note that the outgoing response here has no 'state' property, since
      // the incoming conversationToken has no 'state' property
      const testData = {
        someProperty: 'someValue',
        someOtherProperty: 'someOtherValue'
      };
      actionsSdkAppRequestBodyLiveV2.conversation.conversationToken = JSON.stringify({
        data: testData
      });
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLiveV2);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      const modifiedData = {
        someProperty: 'test',
        someOtherProperty: 'someOtherValue'
      };
      app.data = modifiedData;
      app.ask('hi');
      expect(mockResponse.body.conversationToken).to.equal(JSON.stringify({
        data: modifiedData
      }));
    });
    it('Should not send conversationToken in response body for dialog end', function () {
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLiveV2);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      const testData = {
        someProperty: 'someValue'
      };
      app.data = testData;
      expect(app.data).to.deep.equal(testData);
      app.tell('hi');
      expect(mockResponse.body.conversationToken).to.be.undefined;
    });
  });

  describe('#getLastSeen', function () {
    it('Should return null for empty lastSeen v2 proto3 Timestamp for new session', function () {
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyNewV2);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getLastSeen()).to.be.null;
    });
    it('Should return null for empty lastSeen v2 proto3 Timestamp for live session', function () {
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLiveV2);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getLastSeen()).to.be.null;
    });
    it('Should return a Date for lastSeen v2 proto3 Timestamp for new session', function () {
      const timestamp = '2017-10-26T23:40:59.742Z';
      actionsSdkAppRequestBodyNewV2.user.lastSeen = timestamp;
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyNewV2);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      const lastSeen = app.getLastSeen();
      expect(lastSeen).to.be.a('Date');
      expect(lastSeen.toISOString()).to.equal(timestamp);
    });
    it('Should return a Date for lastSeen v2 proto3 Timestamp for live session', function () {
      const timestamp = '2017-10-26T23:40:59.742Z';
      actionsSdkAppRequestBodyLiveV2.user.lastSeen = timestamp;
      const mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLiveV2);
      const app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      const lastSeen = app.getLastSeen();
      expect(lastSeen).to.be.a('Date');
      expect(lastSeen.toISOString()).to.equal(timestamp);
    });
  });

  /**
   * Describes the behavior for ActionsSdkApp isRequestFromGoogle method.
   */
  describe('#isRequestFromGoogle', function () {
    const body = actionsSdkAppRequestBodyLive;
    const headerWithAuth = Object.assign({}, headerV1);
    const authToken = 'abc123';
    const validProjectId = 'nodejs-cloud-test-project-1234';
    const sampleToken = 'sampleIDToken';
    const errorMsg = 'error';

    let mockRequest;
    let mockResponse;
    let app;
    const { googleAuthClient } = require('../utils/auth');

    before(() => {
      require('../utils/auth').googleAuthClient = {
        verifyIdToken: (options) => {
          return new Promise((resolve, reject) => {
            if (options.audience === validProjectId) {
              resolve(sampleToken);
            } else {
              reject(errorMsg);
            }
          });
        }
      };
    });

    after(() => {
      require('../utils/auth').googleAuthClient = googleAuthClient;
    });

    beforeEach(() => {
      headerWithAuth['authorization'] = authToken;
      mockRequest = new MockRequest(headerWithAuth, body);
      mockResponse = new MockResponse();
      app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
    });

    // Validates auth token header
    it('Should validate the incoming auth token.', function () {
      return app.isRequestFromGoogle(validProjectId).then(idToken => {
        expect(idToken).to.equal(sampleToken);
      });
    });

    // Invalidates auth token header
    it('Should invalidate incorrect project ID.', function () {
      return app.isRequestFromGoogle('invalidProject').catch(err => {
        expect(err).to.equal(errorMsg);
      });
    });

    // Fails without auth token
    it('Should invalidate header without auth token.', function () {
      headerWithAuth['authorization'] = null;
      return app.isRequestFromGoogle(validProjectId).catch(err => {
        expect(err).to.equal('No incoming API Signature JWT token');
      });
    });
  });

  /*
   * Describes the behavior for ActionsSdkApp askToRegisterDailyUpdate method.
   */
  describe('#askToRegisterDailyUpdate', function () {
    let app, mockRequest;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      app = new ActionsSdkApp({
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
        'conversationToken': '{"state":null,"data":{}}',
        'userStorage': '{"data":{}}',
        'expectUserResponse': true,
        'expectedInputs': [
          {
            'inputPrompt': {
              'initialPrompts': [
                {
                  'textToSpeech': 'PLACEHOLDER_FOR_REGISTER_UPDATE'
                }
              ],
              'noInputPrompts': []
            },
            'possibleIntents': [
              {
                'intent': 'actions.intent.REGISTER_UPDATE',
                'inputValueData': {
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
            ]
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
        'conversationToken': '{"state":null,"data":{}}',
        'userStorage': '{"data":{}}',
        'expectUserResponse': true,
        'expectedInputs': [
          {
            'inputPrompt': {
              'initialPrompts': [
                {
                  'textToSpeech': 'PLACEHOLDER_FOR_REGISTER_UPDATE'
                }
              ],
              'noInputPrompts': []
            },
            'possibleIntents': [
              {
                'intent': 'actions.intent.REGISTER_UPDATE',
                'inputValueData': {
                  'intent': 'test_intent',
                  'triggerContext': {
                    'timeContext': {
                      'frequency': 'DAILY'
                    }
                  },
                  '@type': 'type.googleapis.com/google.actions.v2.RegisterUpdateValueSpec'
                }
              }
            ]
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
   * Describes the behavior for ActionsSdkApp isUpdateRegistered method.
   */
  describe('#isUpdateRegistered', function () {
    let app, mockRequest;

    function initMockApp () {
      mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
      app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
    }

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate user registration status.', function () {
      actionsSdkAppRequestBodyLive.inputs[0].arguments = [
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
      actionsSdkAppRequestBodyLive.inputs[0].arguments[0].extension.status = 'CANCELLED';
      initMockApp();
      expect(app.isPermissionGranted()).to.equal(false);
    });
  });

  /**
   * Describes the behavior for ActionsSdkApp askForUpdatePermission method in v1.
   */
  describe('#askForUpdatePermission', function () {
    let mockRequest, app;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      app = new ActionsSdkApp({ request: mockRequest, response: mockResponse });
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
        'conversationToken': '{"state":null,"data":{}}',
        'userStorage': '{"data":{}}',
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
            ]
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
        'conversationToken': '{"state":null,"data":{}}',
        'userStorage': '{"data":{}}',
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
                  'permissions': ['UPDATE'],
                  'updatePermissionValueSpec': {
                    'intent': 'test_intent'
                  }
                }
              }
            ]
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
   * Describes the behavior for ActionsSdkApp askToDeepLink.
   */
  describe('#askToDeepLink', function () {
    let mockRequest, app;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, actionsSdkAppRequestBodyLive);
      app = new ActionsSdkApp({ request: mockRequest, response: mockResponse });
    });

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return the valid JSON in the response object for the success case.', function () {
      app.askToDeepLink('Great! Looks like we can do that in the app.', 'Google',
        'example://gizmos', 'com.example.gizmos', 'handle this for you');
      // Validating the response object
      const expectedResponse = {
        'conversationToken': '{"state":null,"data":{}}',
        'userStorage': '{"data":{}}',
        'expectUserResponse': true,
        'expectedInputs': [
          {
            'inputPrompt': {
              'initialPrompts': [
                {
                  'textToSpeech': 'Great! Looks like we can do that in the app.'
                }
              ],
              'noInputPrompts': [
              ]
            },
            'possibleIntents': [
              {
                'intent': 'actions.intent.LINK',
                'inputValueData': {
                  '@type': 'type.googleapis.com/google.actions.v2.LinkValueSpec',
                  'openUrlAction': {
                    'url': 'example://gizmos',
                    'androidApp': {
                      'packageName': 'com.example.gizmos'
                    }
                  },
                  'dialogSpec': {
                    'extension': {
                      '@type': 'type.googleapis.com/google.actions.v2.LinkValueSpec.LinkDialogSpec',
                      'destinationName': 'Google',
                      'requestLinkReason': 'handle this for you'
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
   * Describes the behavior for ActionsSdkApp getLinkStatus method.
   */
  describe('#getLinkStatus', function () {
    let app, mockRequest;

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate user registration status.', function () {
      actionsSdkAppRequestBodyLive.inputs[0].arguments = [
        {
          'name': 'LINK',
          'status': {
            'code': 9
          }
        }];
      mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
      app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getLinkStatus()).to.equal(9);
    });
  });

  /**
   * Describes the behavior for ActionsSdkApp getPackageEntitlements method.
   */
  describe('#getPackageEntitlements', function () {
    let app, mockRequest;

    // Success case test, when the API returns a valid 200 response with the response object
    it('Should return package entitlements.', function () {
      actionsSdkAppRequestBodyLive.user.packageEntitlements = {
        'testKey': 'testVal'
      };
      mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
      app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getPackageEntitlements()).to.deep.equal({
        'testKey': 'testVal'
      });
    });

    // Failure case test, when no Package Entitlements are present
    it('Should return null.', function () {
      mockRequest = new MockRequest(headerV1, actionsSdkAppRequestBodyLive);
      app = new ActionsSdkApp({
        request: mockRequest,
        response: mockResponse
      });
      expect(app.getPackageEntitlements()).to.be.null;
    });
  });
});
