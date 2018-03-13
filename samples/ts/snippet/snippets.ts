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

import * as functions from 'firebase-functions'
import {
  dialogflow,
  actionssdk,
  Parameters,
  Suggestions,
  PermissionArgument,
  BasicCard,
  Button,
  Permission,
} from '../../../src'
import { localize, Localized, Localization } from './plugin/localize'
import { randomize, Randomized, Randomization } from './plugin/randomize'
import { koa } from './koa'

// Provide Conversation type information to the service generated from Plugins
type Conversation = Localized & Randomized

const app = dialogflow<Conversation>()
  .use(koa) // Provide plugins which can include additional frameworks support
  .use(localize)
  .use(randomize)

app.intent('tell_greeting', (conv, { color, num }) => {
  conv.ask(`Dialogflow likes ${color}`, new Suggestions('Ok', 'Cool')) // n > 1 arguments
  conv.ask(new BasicCard({
    title: 'Card Title',
    // Mostly, provide anonymous Objects with the properties defined by the raw JSON API
    image: {
      url: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
      accessibilityText: 'Google Logo',
    },
    // Some complex objects have class wrappers but can use raw API when needed
    buttons: new Button({
      title: 'Button Title',
      url: 'https://www.google.com',
    }),
    display: 'WHITE',
  })) // Can make multiple ask calls which will generate a single RichResponse
})

app.intent('tell_greeting', conv => {
  conv.ask('The last thing I told you was')
  conv.ask(...conv.randomize.last)
  conv.ask(new Randomization(
    'How are you?',
    'Are you having a good day?',
  ))
})

app.intent('tell_greeting', conv => {
  conv.ask('Hi')
})

app.intent('tell_greeting', (conv, params) => {
  conv.ask(`Hi ${params.color}`)
})

app.intent('tell_greeting', (conv, params) => {
  const { color } = params
  conv.ask(`Hi ${color}`)
})

app.intent('input_welcome', (conv, { color }) => {
  conv.ask(`Hi ${color}`)
})

// Provide Parameters type information to the IntentHandler
interface GreetingParameters extends Parameters {
  color?: string
  num: string
}

app.intent<GreetingParameters>('tell_greeting', async (conv, { color, num }) => {
  conv.ask(`Your color was ${color}`)
})

app.intent<{
  custom: {
    prop: string,
  },
}>('tell_greeting', (conv, { custom }) => {
  conv.ask(`I got your custom parameter ${custom.prop}!`)
})

app.intent('tell_greeting', conv => {
  // Return a promise to do async asks, will send everything when promise resolves
  return new Promise(resolve => setTimeout(() => resolve(), 1000))
    .then(() => {
      conv.ask('Hi')
    })
})

app.intent('input_welcome', (conv, { color }) => {
  conv.ask(new Permission({
    context: 'To read your mind',
    permissions: 'DEVICE_COARSE_LOCATION',
  }))
})

app.intent<PermissionArgument>('read_mind', (conv, params, permissionGranted) => {
  if (permissionGranted) {
    return conv.close('Thanks for letting me read your mind!')
  }
  conv.close(`Oh, I see you don't want me to get your permissions now!`)
})

exports.dialog = functions.https.onRequest(app)

const actionsApp = actionssdk()

// String enums are strongly typed and inferred in TypeScript
actionsApp.intent('actions.intent.MAIN', conv => {
  conv.ask('Hi')
})

actionsApp.intent('actions.intent.TEXT', async (conv, input) => { // Built in async function support
  if (input === 'bye') {
    return conv.close('Bye!') // Explicit close mic method call
  }
  conv.ask(`You said ${input}`)
})
