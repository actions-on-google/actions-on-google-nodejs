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

const util = require('util')
const functions = require('firebase-functions')
const {
  dialogflow,
  Suggestions,
  BasicCard,
  Button,
  SimpleResponse,
} = require('actions-on-google')

const { values, concat, random, randomPop } = require('./util')
const responses = require('./responses')

const AppContexts = {
  FACT: 'choose_fact-followup',
  CATS: 'choose_cats-followup',
}

const Lifespans = {
  DEFAULT: 5,
}

const app = dialogflow({
  debug: true,
  init: () => ({
    data: {
      facts: responses.categories.reduce((o, c) => { // Convert array of facts to map
        o[c.category] = c.facts.slice()
        return o
      }, {}),
      cats: responses.cats.facts.slice(), // copy cat facts
    },
  }),
})

app.intent('Unrecognized Deep Link Fallback', conv => {
  const response = util.format(responses.general.unhandled, conv.query)
  const suggestions = responses.categories.map(c => c.suggestion)
  conv.ask(response, new Suggestions(suggestions))
})

app.intent('choose_fact', 'tell_fact') // redirect to the intent handler for tell_fact

app.intent('tell_fact', (conv, { category }) => {
  const { facts, cats } = conv.data
  if (values(facts).every(c => !c.length)) {
    // If every fact category facts stored in conv.data is empty, close the conversation
    return conv.close(responses.general.heardItAll)
  }
  const categoryResponse = responses.categories.find(c => c.category === category)
  const fact = randomPop(facts[categoryResponse.category])
  if (!fact) {
    const otherCategory = responses.categories.find(other => other !== categoryResponse)
    const redirect = otherCategory.category
    const parameters = {
      category: redirect,
    }
    conv.contexts.set(AppContexts.FACT, Lifespans.DEFAULT, parameters)
    const response = [util.format(responses.transitions.content.heardItAll, category, redirect)]
    if (cats.length) {
      response.push(responses.transitions.content.alsoCats)
    }
    response.push(responses.general.wantWhat)
    conv.ask(concat(...response))
    conv.ask(new Suggestions(otherCategory.suggestion))
    if (cats.length) {
      conv.ask(new Suggestions(responses.cats.suggestion))
    }
    return
  }
  const { factPrefix } = categoryResponse
  // conv.ask can be called multiple times to have the library construct a single response itself
  // the response will get sent at the end of the function
  // or if the function returns a promise, after the promise is resolved
  conv.ask(new SimpleResponse({
    speech: concat(factPrefix, fact),
    text: factPrefix,
  }))
  conv.ask(responses.general.nextFact)
  conv.ask(new BasicCard({
    title: fact,
    image: random(responses.content.images),
    buttons: new Button({
      title: responses.general.linkOut,
      url: responses.content.link,
    }),
  }))
  conv.ask(responses.general.suggestions.confirmation)
})

app.intent('choose_cats', 'tell_cat_fact') // redirect to the intent handler for tell_cat_fact

app.intent('tell_cat_fact', conv => {
  const { cats } = conv.data
  const fact = randomPop(cats)
  if (!fact) {
    conv.contexts.delete(AppContexts.FACT)
    conv.contexts.delete(AppContexts.CATS)
    conv.ask(responses.transitions.cats.heardItAll)
    return conv.ask(responses.general.suggestions.confirmation)
  }
  const { factPrefix, audio } = responses.cats
  // conv.ask can be called multiple times to have the library construct a single response itself.
  // The response will get sent at the end of the function
  // or if the function returns a promise, after the promise is resolved.
  const sound = util.format(audio, random(responses.cats.sounds))
  conv.ask(new SimpleResponse({
    ssml: `<speak>${concat(factPrefix, sound, fact)}</speak>`,
    text: factPrefix,
  }))
  conv.ask(responses.general.nextFact)
  conv.ask(new BasicCard({
    title: fact,
    image: random(responses.cats.images),
    buttons: new Button({
      title: responses.general.linkOut,
      url: responses.cats.link,
    }),
  }))
  conv.ask(responses.general.suggestions.confirmation)
})

exports.factsAboutGoogle = functions.https.onRequest(app)
