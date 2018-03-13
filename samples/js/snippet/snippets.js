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

const functions = require('firebase-functions')
const {
  dialogflow,
  actionssdk,
  Parameters,
  Suggestions,
  PermissionArgument,
  BasicCard,
  Button,
  Permission,
} = require('../../../src')
const { localize, Localized, Localization } = require('./plugin/localize')
const { randomize, Randomized, Randomization } = require('./plugin/randomize')
const { koa } = require('./koa')

const app = dialogflow()
  .use(koa) // Provide plugins which can include additional frameworks support
  .use(localize)
  .use(randomize)

app.intent('tell_greeting', (conv, { color, num }) => {
  conv.ask(`Dialogflow likes ${color}`, new Suggestions('Ok', 'Cool')) // n > 1 arguments
  conv.ask(new BasicCard({
    title: 'Card Title',
    image: { // Mostly, provide anonymous Objects with the properties defined by the raw JSON API
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

app.intent('tell_greeting', (conv, { custom }) => {
  conv.ask(`I got your custom parameter ${custom.prop}!`)
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

app.intent('Default Welcome Intent', (conv, { color }) => {
  conv.ask(`Hi ${color}`)
})

app.intent('tell_greeting', (conv, { color, num }) => {
  conv.ask(`Your color was ${color}`)
})

app.intent('tell_greeting', conv => {
  // Return a promise to do async asks, will send everything when promise resolves
  return new Promise(resolve => setTimeout(() => resolve(), 1000))
    .then(() => {
      conv.ask('Hi')
    })
})

app.intent('Default Welcome Intent', (conv, { color }) => {
  conv.ask(new Permission({
    context: 'To read your mind',
    permissions: 'DEVICE_COARSE_LOCATION',
  }))
})

app.intent('read_mind', (conv, params, permissionGranted) => {
  if (permissionGranted) {
    return conv.close('Thanks for letting me read your mind!')
  }
  conv.close(`Oh, I see you don't want me to get your permissions now!`)
})

exports.dialog = functions.https.onRequest(app)

const actionsApp = actionssdk()

// String enums are typed using typedef enums
actionsApp.intent('actions.intent.MAIN', conv => {
  conv.ask('Hi')
})

actionsApp.intent('actions.intent.TEXT', (conv, input) => {
  if (input === 'bye') {
    return conv.close('Bye!') // Explicit close mic method call
  }
  conv.ask(`You said ${input}`)
})
