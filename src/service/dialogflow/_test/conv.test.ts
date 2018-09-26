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

import ava, { RegisterContextual } from 'ava'
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

const test = ava as RegisterContextual<AvaContext>

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

test('conv.data is parsed correctly', t => {
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
          name: '_actions_on_google',
          parameters: {
            data: JSON.stringify(data),
          },
        }],
      },
      originalDetectIntentRequest: {
        payload: {},
      },
    } as Api.GoogleCloudDialogflowV2WebhookRequest,
    headers: {},
  })
  t.deepEqual(conv.data, data)
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
  const followup = (conv.serialize() as Api.GoogleCloudDialogflowV2WebhookResponse)
    .followupEventInput
  t.deepEqual(clone(followup), {
    name: event,
    languageCode: lang,
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
  t.deepEqual((conv.serialize() as Api.GoogleCloudDialogflowV2WebhookResponse).followupEventInput, {
    name: event,
    languageCode: lang,
    parameters,
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
  t.deepEqual((conv.serialize() as Api.GoogleCloudDialogflowV2WebhookResponse).followupEventInput, {
    name: event,
    languageCode: lang,
    parameters,
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
  const session = 'abcdefg1234567'
  const conv = new DialogflowConversation({
    body: {
      session,
    } as Api.GoogleCloudDialogflowV2WebhookRequest,
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
        userStorage: '{"data":{}}',
      },
    },
    outputContexts: [
      {
        name: `${session}/contexts/_actions_on_google`,
        lifespanCount: 99,
        parameters: {
          data: '{}',
        },
      },
    ],
  })
})

test('conv.serialize returns the correct response with simple response string and set data', t => {
  const response = 'abc123'
  const session = 'abcdefg1234567'
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
    } as Api.GoogleCloudDialogflowV2WebhookRequest,
    headers: {},
  })
  conv.data = data
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
        userStorage: '{"data":{}}',
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


test('conv.serialize returns the correct response with permission response', t => {
  const session = 'abcdefg1234567'
  const conv = new DialogflowConversation({
    body: {
      session,
    } as Api.GoogleCloudDialogflowV2WebhookRequest,
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
        richResponse: {
          items: [
            {
              simpleResponse: {
                textToSpeech: 'PLACEHOLDER',
              },
            },
          ],
        },
        userStorage: '{"data":{}}',
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
    outputContexts: [
      {
        name: 'abcdefg1234567/contexts/_actions_on_google',
        lifespanCount: 99,
        parameters: {
          data: '{}',
        },
      },
    ],
  })
})

test('conv.serialize returns the correct response with simple response string and reprompts', t => {
  const response = 'abc123'
  const reprompt1 = 'repromt123'
  const reprompt2 = 'repromt456'
  const session = 'abcdefg1234567'
  const conv = new DialogflowConversation({
    body: {
      session,
    } as Api.GoogleCloudDialogflowV2WebhookRequest,
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
        userStorage: '{"data":{}}',
      },
    },
    outputContexts: [
      {
        name: `${session}/contexts/_actions_on_google`,
        lifespanCount: 99,
        parameters: {
          data: '{}',
        },
      },
    ],
  })
})

const simulatorConv = (project: string, session: string) => new DialogflowConversation({
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
        name: `projects/${project}/agent/intents/randomId`,
        displayName: 'Default Fallback Intent',
        isFallback: true,
      },
      intentDetectionConfidence: 1,
      languageCode: 'en',
    },
    originalDetectIntentRequest: {
      payload: {},
    },
    session: `projects/${project}/agent/sessions/${session}`,
  } as Api.GoogleCloudDialogflowV2WebhookRequest,
  headers: {},
})

test('conv.serialize w/ simple response has fulfillmentText when from simulator', t => {
  const response = 'abc123'
  const project = 'project123placeholder'
  const session = 'abcdefg1234567'
  const conv = simulatorConv(project, session)
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
        userStorage: '{"data":{}}',
      },
    },
    outputContexts: [
      {
        name: `projects/${project}/agent/sessions/${session}/contexts/_actions_on_google`,
        lifespanCount: 99,
        parameters: {
          data: '{}',
        },
      },
    ],
    fulfillmentText: response,
  })
})

test('conv.serialize w/ simple response text has fulfillmentText when from simulator', t => {
  const speech = 'abc123'
  const text = 'abcd1234'
  const session = 'abcdefg1234567'
  const project = 'project123placeholder'
  const conv = simulatorConv(project, session)
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
        userStorage: '{"data":{}}',
      },
    },
    outputContexts: [
      {
        name: `projects/${project}/agent/sessions/${session}/contexts/_actions_on_google`,
        lifespanCount: 99,
        parameters: {
          data: '{}',
        },
      },
    ],
    fulfillmentText: text,
  })
})

test('conv.serialize w/ two simple responses has fulfillmentText warning for simulator', t => {
  const response = 'abc123'
  const response2 = 'abcd1234'
  const session = 'abcdefg1234567'
  const project = 'project123placeholder'
  const conv = simulatorConv(project, session)
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
        userStorage: '{"data":{}}',
      },
    },
    outputContexts: [
      {
        name: `projects/${project}/agent/sessions/${session}/contexts/_actions_on_google`,
        lifespanCount: 99,
        parameters: {
          data: '{}',
        },
      },
    ],
    fulfillmentText: 'Cannot display response in Dialogflow simulator. ' +
      'Please test on the Google Assistant simulator instead.',
  })
})

test('conv.serialize w/ solo helper has fulfillmentText warning for simulator', t => {
  const permission: 'NAME' = 'NAME'
  const context = 'To read your mind'
  const session = 'abcdefg1234567'
  const project = 'project123placeholder'
  const conv = simulatorConv(project, session)
  conv.ask(new Permission({
    permissions: permission,
    context,
  }))
  t.deepEqual(clone(conv.serialize()), {
    payload: {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              simpleResponse: {
                textToSpeech: 'PLACEHOLDER',
              },
            },
          ],
        },
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
        userStorage: '{"data":{}}',
      },
    },
    outputContexts: [
      {
        name: `projects/${project}/agent/sessions/${session}/contexts/_actions_on_google`,
        lifespanCount: 99,
        parameters: {
          data: '{}',
        },
      },
    ],
    fulfillmentText: 'Cannot display response in Dialogflow simulator. ' +
      'Please test on the Google Assistant simulator instead.',
  })
})

test('conv.serialize w/ non solo helper has fulfillmentText warning for simulator', t => {
  const response = 'abc123'
  const session = 'abcdefg1234567'
  const project = 'project123placeholder'
  const conv = simulatorConv(project, session)
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
        userStorage: '{"data":{}}',
      },
    },
    outputContexts: [
      {
        name: `projects/${project}/agent/sessions/${session}/contexts/_actions_on_google`,
        lifespanCount: 99,
        parameters: {
          data: '{}',
        },
      },
    ],
    fulfillmentText: 'Cannot display response in Dialogflow simulator. ' +
      'Please test on the Google Assistant simulator instead.',
  })
})

test('conv.serialize w/ image has fulfillmentText warning for simulator', t => {
  const response = 'abc123'
  const image = 'abcd1234'
  const alt = 'abcde12345'
  const session = 'abcdefg1234567'
  const project = 'project123placeholder'
  const conv = simulatorConv(project, session)
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
        userStorage: '{"data":{}}',
      },
    },
    outputContexts: [
      {
        name: `projects/${project}/agent/sessions/${session}/contexts/_actions_on_google`,
        lifespanCount: 99,
        parameters: {
          data: '{}',
        },
      },
    ],
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
        userStorage: '{"data":{}}',
      },
    },
    outputContexts: [
      {
        name: `undefined/contexts/_actions_on_google`,
        lifespanCount: 99,
        parameters: {
          data: '{}',
        },
      },
    ],
  })
})
