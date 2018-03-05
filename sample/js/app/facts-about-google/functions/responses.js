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

const { Suggestions, Image } = require('actions-on-google')

exports.categories = [
  {
    category: 'headquarters',
    suggestion: 'Headquarters',
    facts: [
      "Google's headquarters is in Mountain View, California.",
      'Google has over 30 cafeterias in its main campus.',
      'Google has over 10 fitness facilities in its main campus.',
    ],
    factPrefix: "Okay, here's a headquarters fact.",
  },
  {
    category: 'history',
    suggestion: 'History',
    facts: [
      'Google was founded in 1998.',
      'Google was founded by Larry Page and Sergey Brin.',
      'Google went public in 2004.',
      'Google has more than 70 offices in more than 40 countries.',
    ],
    factPrefix: "Sure, here's a history fact.",
  },
]

exports.content = {
  images: [
    {
      url: 'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/' +
        'Search_GSA.2e16d0ba.fill-300x300.png',
      accessibilityText: 'Google app logo',
    },
    {
      url: 'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/' +
        'Dinosaur-skeleton-at-Google.max-900x900.jpg',
      accessibilityText: 'Stan the Dinosaur at Googleplex',
    },
    {
      url: 'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/' +
        'Wide-view-of-Google-campus.max-900x900.jpg',
      accessibilityText: 'Googleplex',
    },
    {
      url: 'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/' +
        'Bikes-on-the-Google-campus.2e16d0ba.fill-300x300.jpg',
      accessibilityText: 'Biking at Googleplex',
    },
  ],
  link: 'https://www.google.com/about/'
}

exports.cats = {
  suggestion: 'Cats',
  facts: [
    'Cats are animals.',
    'Cats have nine lives.',
    'Cats descend from other cats.',
  ],
  images: [
    {
      url: 'https://developers.google.com/web/fundamentals/accessibility/semantics-builtin/imgs/' +
        '160204193356-01-cat-500.jpg',
      accessibilityText: 'Gray Cat',
    },
  ],
  /**
   * This sample uses a sound clip from the Actions on Google Sound Library
   * https://developers.google.com/actions/tools/sound-library
   */
  sounds: [
    'https://actions.google.com/sounds/v1/animals/cat_purr_close.ogg',
  ],
  link: 'https://www.google.com/search?q=cats',
  factPrefix: `Alright, here's a cat fact.`,
  audio: `<audio src="%s"></audio>`
}

exports.transitions = {
  content: {
    heardItAll: "Looks like you've heard all there is to know about the %s of Google. " +
      'I could tell you about its %s instead.',
    alsoCats: 'By the way, I can tell you about cats too.',
  },
  cats: {
    heardItAll: "Looks like you've heard all there is to know about cats. " +
      'Would you like to hear about Google?',
  },
}

exports.general = {
  heardItAll: 'Actually it looks like you heard it all. Thanks for listening!',
  /** Used to give responses for no inputs */
  noInputs: [
    "I didn't hear that.",
    "If you're still there, say that again.",
    'We can stop here. See you soon.',
  ],
  suggestions: {
    /** Google Assistant will respond to more confirmation variants than just these suggestions */
    confirmation: new Suggestions('Sure', 'No thanks'),
  },
  nextFact: 'Would you like to hear another fact?',
  linkOut: 'Learn more',
  wantWhat: 'So what would you like to hear about?',
  unhandled: "Welcome to Facts about Google! I'd really rather not talk about %s. " +
    "Wouldn't you rather talk about Google? " +
    "I can tell you about Google's history or its headquarters. Which do you want to hear about?",
}
