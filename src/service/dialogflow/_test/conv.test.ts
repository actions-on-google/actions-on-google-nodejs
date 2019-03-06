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

import ava, { TestInterface } from 'ava'
import { DialogflowConversation } from '../conv'
import * as Api from '../api/v2'
import * as ActionsApi from '../../actionssdk/api/v2'
import { ContextValues } from '../context'
import { Incoming } from '../incoming'
import { clone } from '../../../common'
import { Permission, SimpleResponse, Image, List } from '../../actionssdk'

interface AvaContext {
  conv: DialogflowConversation
  body: Api.GoogleCloudDialogflowV2WebhookRequest
  request: ActionsApi.GoogleActionsV2AppRequest
}

const test = ava as TestInterface<AvaContext>

test.beforeEach(t => {
  t.context.request = {
    isInSandbox: true,
  }
  t.context.body = {
    originalDetectIntentRequest: {
      payload: t.context.request,
    },
  }
  t.context.conv = new DialogflowConversation({
    body: t.context.body,
    headers: {},
  })
})

test('conv can be instantiated', t => {
  t.true(t.context.conv instanceof DialogflowConversation)
})

test('conv.request is set correctly', t => {
  t.is(t.context.conv.request, t.context.request)
})

test('conv.body is set correctly', t => {
  t.is(t.context.conv.body, t.context.body)
})

test('conv.action is parsed correctly', t => {
  const action = 'abc123'
  const conv = new DialogflowConversation({
    body: {
      queryResult: {
        action,
      },
      originalDetectIntentRequest: {
        payload: {},
      },
    } as Api.GoogleCloudDialogflowV2WebhookRequest,
    headers: {},
  })
  t.is(conv.action, action)
})

test('conv.intent is parsed correctly', t => {
  const intent = 'abc123'
  const conv = new DialogflowConversation({
    body: {
      queryResult: {
        intent: {
          displayName: intent,
        },
      },
      originalDetectIntentRequest: {
        payload: {},
      },
    } as Api.GoogleCloudDialogflowV2WebhookRequest,
    headers: {},
  })
  t.is(conv.intent, intent)
})

test('conv.parameters is parsed correctly', t => {
  const parameters = {
    a: '1',
    b: '2',
  }
  const conv = new DialogflowConversation({
    body: {
      queryResult: {
        parameters,
      },
      originalDetectIntentRequest: {
        payload: {},
      },
    } as Api.GoogleCloudDialogflowV2WebhookRequest,
    headers: {},
  })
  t.is(conv.parameters, parameters)
})

test('conv.contexts is an instance of ContextValues', t => {
  t.true(t.context.conv.contexts instanceof ContextValues)
})

test('conv.incoming is an instance of Incoming', t => {
  t.true(t.context.conv.incoming instanceof Incoming)
})

test('conv.query is parsed correctly', t => {
  const query = 'abc123'
  const conv = new DialogflowConversation({
    body: {
      queryResult: {
        queryText: query,
      },
      originalDetectIntentRequest: {
        payload: {},
      },
    } as Api.GoogleCloudDialogflowV2WebhookRequest,
    headers: {},
  })
  t.is(conv.query, query)
})

test('conv.version is detected correctly to be 2', t => {
  t.is(t.context.conv.version, 2)
})

test('conv.followup sets the raw json correctly with no parameters', t => {
  const lang = 'ab-CD'
  const event = 'abc_123'
  const conv = new DialogflowConversation({
    body: {
      queryResult: {
        languageCode: lang,
      },
      originalDetectIntentRequest: {
        payload: {},
      },
    } as Api.GoogleCloudDialogflowV2WebhookRequest,
    headers: {},
  })
  conv.followup(event)
  t.deepEqual(clone(conv.serialize()), {
    followupEventInput: {
      name: event,
      languageCode: lang,
    },
  })
})

test('conv.followup sets the raw json correctly with parameters', t => {
  const lang = 'ab-CD'
  const event = 'abc_123'
  const parameters = {
    a: '1',
    b: '2',
  }
  const conv = new DialogflowConversation({
    body: {
      queryResult: {
        languageCode: lang,
      },
      originalDetectIntentRequest: {
        payload: {},
      },
    } as Api.GoogleCloudDialogflowV2WebhookRequest,
    headers: {},
  })
  conv.followup(event, parameters)
  t.deepEqual(clone(conv.serialize()), {
    followupEventInput: {
      name: event,
      languageCode: lang,
      parameters,
    },
  })
})

test('conv.followup sets the raw json correctly with parameters and lang', t => {
  const lang = 'ef-GH'
  const event = 'abc_123'
  const parameters = {
    a: '1',
    b: '2',
  }
  const conv = new DialogflowConversation({
    body: {
      queryResult: {
        languageCode: 'ab-CD',
      },
      originalDetectIntentRequest: {
        payload: {},
      },
    } as Api.GoogleCloudDialogflowV2WebhookRequest,
    headers: {},
  })
  conv.followup(event, parameters, lang)
  t.deepEqual(clone(conv.serialize()), {
    followupEventInput: {
      name: event,
      languageCode: lang,
      parameters,
    },
  })
})

test('conv.serialize returns the raw json when set with conv.json', t => {
  const json = {
    a: '1',
    b: '2',
    c: {
      d: '3',
      e: '4',
    },
  }
  t.context.conv.json(json)
  t.deepEqual(t.context.conv.serialize() as typeof json, json)
})

test('conv.serialize returns the correct response with simple response string', t => {
  const response = 'abc123'
  const conv = new DialogflowConversation({
    body: {},
    headers: {},
  })
  conv.add(response)
  t.deepEqual(clone(conv.serialize()), {
    payload: {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              simpleResponse: {
                textToSpeech: 'abc123',
              },
            },
          ],
        },
      },
    },
  })
})

test('conv.serialize returns the correct response with permission response', t => {
  const conv = new DialogflowConversation({
    body: {},
    headers: {},
  })
  conv.ask(new Permission({
    permissions: 'NAME',
    context: 'To read your mind',
  }))
  t.deepEqual(clone(conv.serialize()), {
    payload: {
      google: {
        expectUserResponse: true,
        systemIntent: {
          intent: 'actions.intent.PERMISSION',
          data: {
            '@type': 'type.googleapis.com/google.actions.v2.PermissionValueSpec',
            optContext: 'To read your mind',
            permissions: [
              'NAME',
            ],
          },
        },
      },
    },
  })
})

test('conv.serialize returns the correct response with simple response string and reprompts', t => {
  const response = 'abc123'
  const reprompt1 = 'reprompt123'
  const reprompt2 = 'reprompt456'
  const conv = new DialogflowConversation({
    body: {} as Api.GoogleCloudDialogflowV2WebhookRequest,
    headers: {},
  })
  conv.add(response)
  conv.noInputs = [reprompt1, new SimpleResponse(reprompt2)]
  t.deepEqual(clone(conv.serialize()), {
    payload: {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              simpleResponse: {
                textToSpeech: 'abc123',
              },
            },
          ],
        },
        noInputPrompts: [
          {
            textToSpeech: reprompt1,
          },
          {
            textToSpeech: reprompt2,
          },
        ],
      },
    },
  })
})

const simulatorConv = () => new DialogflowConversation({
  body: {
    responseId: 'responseIdRandom123',
    queryResult: {
      queryText: 'test',
      action: 'input.unknown',
      parameters: {},
      allRequiredParamsPresent: true,
      fulfillmentText: 'Sorry, what was that?',
      fulfillmentMessages: [
        {
          text: {
            text: [
              'One more time?',
            ],
          },
        },
      ],
      intent: {
        name: `projects/projectRandom/agent/intents/randomId`,
        displayName: 'Default Fallback Intent',
        isFallback: true,
      },
      intentDetectionConfidence: 1,
      languageCode: 'en',
    },
    originalDetectIntentRequest: {
      payload: {},
    },
    session: 'sessionRandom',
  } as Api.GoogleCloudDialogflowV2WebhookRequest,
  headers: {},
})

test('conv.serialize w/ simple response has fulfillmentText when from simulator', t => {
  const response = 'abc123'
  const conv = simulatorConv()
  conv.add(response)
  t.deepEqual(clone(conv.serialize()), {
    payload: {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              simpleResponse: {
                textToSpeech: response,
              },
            },
          ],
        },
      },
    },
    fulfillmentText: response,
  })
})

test('conv.serialize w/ simple response text has fulfillmentText when from simulator', t => {
  const speech = 'abc123'
  const text = 'abcd1234'
  const conv = simulatorConv()
  conv.add(new SimpleResponse({
    speech,
    text,
  }))
  t.deepEqual(clone(conv.serialize()), {
    payload: {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              simpleResponse: {
                textToSpeech: speech,
                displayText: text,
              },
            },
          ],
        },
      },
    },
    fulfillmentText: text,
  })
})

test('conv.serialize w/ two simple responses has fulfillmentText warning for simulator', t => {
  const response = 'abc123'
  const response2 = 'abcd1234'
  const conv = simulatorConv()
  conv.add(response)
  conv.add(response2)
  t.deepEqual(clone(conv.serialize()), {
    payload: {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              simpleResponse: {
                textToSpeech: response,
              },
            },
            {
              simpleResponse: {
                textToSpeech: response2,
              },
            },
          ],
        },
        },
      },
    fulfillmentText: 'Cannot display response in Dialogflow simulator. ' +
      'Please test on the Google Assistant simulator instead.',
  })
})

test('conv.serialize w/ solo helper has fulfillmentText warning for simulator', t => {
  const permission: 'NAME' = 'NAME'
  const context = 'To read your mind'
  const conv = simulatorConv()
  conv.ask(new Permission({
    permissions: permission,
    context,
  }))
  t.deepEqual(clone(conv.serialize()), {
    payload: {
      google: {
        expectUserResponse: true,
        systemIntent: {
          data: {
            '@type': 'type.googleapis.com/google.actions.v2.PermissionValueSpec',
            optContext: context,
            permissions: [
              permission,
            ],
          },
          intent: 'actions.intent.PERMISSION',
        },
        },
      },
    fulfillmentText: 'Cannot display response in Dialogflow simulator. ' +
      'Please test on the Google Assistant simulator instead.',
  })
})

test('conv.serialize w/ non solo helper has fulfillmentText warning for simulator', t => {
  const response = 'abc123'
  const conv = simulatorConv()
  conv.ask(response)
  conv.ask(new List({
    items: {
      one: {
        title: 'one1',
        synonyms: ['one11', 'one12'],
      },
      two: {
        title: 'two1',
        synonyms: ['two11', 'two12'],
      },
    },
  }))
  t.deepEqual(clone(conv.serialize()), {
    payload: {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              simpleResponse: {
                textToSpeech: response,
              },
            },
          ],
        },
        systemIntent: {
          data: {
            '@type': 'type.googleapis.com/google.actions.v2.OptionValueSpec',
            listSelect: {
              items: [
                {
                  optionInfo: {
                    key: 'one',
                    synonyms: [
                      'one11',
                      'one12',
                    ],
                  },
                  title: 'one1',
                },
                {
                  optionInfo: {
                    key: 'two',
                    synonyms: [
                      'two11',
                      'two12',
                    ],
                  },
                  title: 'two1',
                },
              ],
            },
          },
          intent: 'actions.intent.OPTION',
        },
        },
      },
    fulfillmentText: 'Cannot display response in Dialogflow simulator. ' +
      'Please test on the Google Assistant simulator instead.',
  })
})

test('conv.serialize w/ image has fulfillmentText warning for simulator', t => {
  const response = 'abc123'
  const image = 'abcd1234'
  const alt = 'abcde12345'
  const conv = simulatorConv()
  conv.add(response)
  conv.add(new Image({
    url: image,
    alt,
  }))
  t.deepEqual(clone(conv.serialize()), {
    payload: {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              simpleResponse: {
                textToSpeech: response,
              },
            },
            {
              basicCard: {
                image: {
                  accessibilityText: alt,
                  url: image,
                },
              },
            },
          ],
        },
        },
      },
    fulfillmentText: 'Cannot display response in Dialogflow simulator. ' +
      'Please test on the Google Assistant simulator instead.',
  })
})

test('conv.serialize defaults to v2 for empty request', t => {
  const response = 'abc123'
  const conv = new DialogflowConversation({
    body: {},
    headers: {},
  })
  conv.add(response)
  t.deepEqual(clone(conv.serialize()), {
    payload: {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              simpleResponse: {
                textToSpeech: response,
              },
            },
          ],
        },
      },
    },
  })
})

test('conv.data is parsed correctly', t => {
  const session = 'sessionId123'
  const data = {
    a: '1',
    b: '2',
    c: {
      d: '3',
      e: '4',
    },
  }
  const conv = new DialogflowConversation({
    body: {
      queryResult: {
        outputContexts: [{
          name: `${session}/contexts/_actions_on_google`,
          parameters: {
            data: JSON.stringify(data),
          },
        }],
      },
    } as Api.GoogleCloudDialogflowV2WebhookRequest,
  })
  t.deepEqual(conv.data, data)
})

test('conv generates no contexts from empty conv.data', t => {
  const response = `What's up?`
  const conv = new DialogflowConversation()
  t.deepEqual(conv.data, {})
  conv.ask(response)
  t.deepEqual(clone(conv.serialize()), {
    payload: {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              simpleResponse: {
                textToSpeech: response,
              },
            },
          ],
        },
      },
    },
  })
})

test('conv generates first conv.data replaced correctly', t => {
  const session = 'sessionId123'
  const response = `What's up?`
  const data = {
    a: '1',
    b: '2',
    c: {
      d: '3',
      e: '4',
    },
  }
  const conv = new DialogflowConversation({
    body: {
      session,
    } as Api.GoogleCloudDialogflowV2WebhookRequest,
  })
  t.deepEqual(conv.data, {})
  conv.ask(response)
  conv.data = data
  t.deepEqual(clone(conv.serialize()), {
    payload: {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              simpleResponse: {
                textToSpeech: response,
              },
            },
          ],
        },
      },
    },
    outputContexts: [
      {
        name: `${session}/contexts/_actions_on_google`,
        lifespanCount: 99,
        parameters: {
          data: JSON.stringify(data),
        },
      },
    ],
  })
})

test('conv generates first conv.data mutated correctly', t => {
  const session = 'sessionId123'
  const response = `What's up?`
  const a = '7'
  const conv = new DialogflowConversation<{ a: string }>({
    body: {
      session,
    }  as Api.GoogleCloudDialogflowV2WebhookRequest,
  })
  t.deepEqual(conv.data, {})
  conv.ask(response)
  conv.data.a = a
  t.deepEqual(clone(conv.serialize()), {
    payload: {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              simpleResponse: {
                textToSpeech: response,
              },
            },
          ],
        },
      },
    },
    outputContexts: [
      {
        name: `${session}/contexts/_actions_on_google`,
        lifespanCount: 99,
        parameters: {
          data: JSON.stringify({ a }),
        },
      },
    ],
  })
})

test('conv generates different conv.data correctly', t => {
  const session = 'sessionId123'
  const response = `What's up?`
  const data = {
    a: '1',
    b: '2',
    c: {
      d: '3',
      e: '4',
    },
  }
  const e = '6'
  const conv = new DialogflowConversation<typeof data>({
    body: {
      session,
      queryResult: {
        outputContexts: [{
          name: `${session}/contexts/_actions_on_google`,
          parameters: {
            data: JSON.stringify(data),
          },
        }],
      },
    } as Api.GoogleCloudDialogflowV2WebhookRequest,
  })
  t.deepEqual(conv.data, data)
  conv.ask(response)
  conv.data.c.e = e
  t.deepEqual(clone(conv.serialize()), {
    payload: {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              simpleResponse: {
                textToSpeech: response,
              },
            },
          ],
        },
      },
    },
    outputContexts: [
      {
        name: `${session}/contexts/_actions_on_google`,
        lifespanCount: 99,
        parameters: {
          data: JSON.stringify({
            a: '1',
            b: '2',
            c: {
              d: '3',
              e,
            },
          }),
        },
      },
    ],
  })
})

test('conv generates different conv.data correctly when only with init data', t => {
  const session = 'sessionId123'
  const response = `What's up?`
  const data = {
    a: '1',
    b: '2',
    c: {
      d: '3',
      e: '4',
    },
  }
  const a = '7'
  const conv = new DialogflowConversation<typeof data>({
    body: {
      session,
    } as Api.GoogleCloudDialogflowV2WebhookRequest,
    init: {
      data,
    },
  })
  t.deepEqual(conv.data, data)
  conv.ask(response)
  conv.data.a = a
  t.deepEqual(clone(conv.serialize()), {
    payload: {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              simpleResponse: {
                textToSpeech: response,
              },
            },
          ],
        },
      },
    },
    outputContexts: [
      {
        name: `${session}/contexts/_actions_on_google`,
        lifespanCount: 99,
        parameters: {
          data: JSON.stringify({
            a,
            b: '2',
            c: {
              d: '3',
              e: '4',
            },
          }),
        },
      },
    ],
  })
})

test('conv generates same conv.data as no output contexts', t => {
  const session = 'sessionId123'
  const response = `What's up?`
  const data = {
    a: '1',
    b: '2',
    c: {
      d: '3',
      e: '4',
    },
  }
  const conv = new DialogflowConversation<typeof data>({
    body: {
      session,
      queryResult: {
        outputContexts: [{
          name: `${session}/contexts/_actions_on_google`,
          parameters: {
            data: JSON.stringify(data),
          },
        }],
      },
    } as Api.GoogleCloudDialogflowV2WebhookRequest,
  })
  t.deepEqual(conv.data, data)
  conv.ask(response)
  t.deepEqual(clone(conv.serialize()), {
    payload: {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              simpleResponse: {
                textToSpeech: response,
              },
            },
          ],
        },
      },
    },
  })
})

test('conv sends userStorage when it is not empty', t => {
  const response = `What's up?`
  const data = {
    a: '1',
    b: '2',
    c: {
      d: '3',
      e: '4',
    },
  }
  const conv = new DialogflowConversation()
  t.deepEqual(conv.data, {})
  conv.user.storage = data
  conv.ask(response)
  t.deepEqual(clone(conv.serialize()), {
    payload: {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              simpleResponse: {
                textToSpeech: response,
              },
            },
          ],
        },
        userStorage: JSON.stringify({ data }),
      },
    },
  })
})

test('conv does not send userStorage when it is empty', t => {
  const response = `What's up?`
  const conv = new DialogflowConversation()
  t.deepEqual(conv.user.storage, {})
  conv.ask(response)
  t.deepEqual(clone(conv.serialize()), {
    payload: {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              simpleResponse: {
                textToSpeech: response,
              },
            },
          ],
        },
      },
    },
  })
})

test('conv does not detect coming from simulator given no responseId', t => {
  const response = `What's up?`
  const conv = new DialogflowConversation({
    body: {
      originalDetectIntentRequest: {
        payload: {},
      },
    },
  })
  conv.ask(response)
  t.deepEqual(clone(conv.serialize()), {
    payload: {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              simpleResponse: {
                textToSpeech: response,
              },
            },
          ],
        },
      },
    },
  })
})

test('conv sends speechBiasingHints when set', t => {
  const response = 'What is your favorite color out of red, blue, and green?'
  const biasing = ['red', 'blue', 'green']
  const conv = new DialogflowConversation()
  conv.speechBiasing = biasing
  conv.ask(response)
  t.deepEqual(clone(conv.serialize()), {
    payload: {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              simpleResponse: {
                textToSpeech: response,
              },
            },
          ],
        },
        speechBiasingHints: biasing,
      },
    },
  })
})

test('conv does not error out when simple response is after image', t => {
  const response = 'How are you?'
  const conv = new DialogflowConversation()
  conv.ask(new Image({ url: '', alt: '' }))
  conv.ask(response)
  t.deepEqual(clone(conv.serialize()), {
    payload: {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              basicCard: {
                image: {
                  url: '',
                  accessibilityText: '',
                },
              },
            },
            {
              simpleResponse: {
                textToSpeech: response,
              },
            },
          ],
        },
      },
    },
  })
})

test('conv w/ simple response after image has fulfillmentText warning for simulator', t => {
  const response = 'abc123'
  const image = 'abcd1234'
  const alt = 'abcde12345'
  const conv = simulatorConv()
  conv.add(new Image({
    url: image,
    alt,
  }))
  conv.add(response)
  t.deepEqual(clone(conv.serialize()), {
    payload: {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              basicCard: {
                image: {
                  accessibilityText: alt,
                  url: image,
                },
              },
            },
            {
              simpleResponse: {
                textToSpeech: response,
              },
            },
          ],
        },
        },
      },
    fulfillmentText: 'Cannot display response in Dialogflow simulator. ' +
      'Please test on the Google Assistant simulator instead.',
  })
})
