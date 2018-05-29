# Actions on Google Client Library

This client library makes it easy to create your apps for the Google Assistant, and
supports both Dialogflow fulfillment and the Actions SDK webhook.

* [Client Library GitHub repo](https://github.com/actions-on-google/actions-on-google-nodejs)
* [Client Library reference docs](https://actions-on-google.github.io/actions-on-google-nodejs/)
* [Actions on Google docs](https://developers.google.com/actions/)
* [Actions on Google samples](https://developers.google.com/actions/samples/)

[![NPM Version](https://img.shields.io/npm/v/actions-on-google.svg)](https://www.npmjs.org/package/actions-on-google)
[![Build Status](https://travis-ci.org/actions-on-google/actions-on-google-nodejs.svg?branch=master)](https://travis-ci.org/actions-on-google/actions-on-google-nodejs)

## Setup Instructions

Install the library with either `npm install actions-on-google` or `yarn add actions-on-google` if you use yarn.

### Dialogflow
```javascript
// Import the appropriate service and chosen wrappers

const {
  dialogflow,
  Image,
} = require('actions-on-google')

// Create an app instance

const app = dialogflow()

// Register handlers for Dialogflow intents

app.intent('Default Welcome Intent', conv => {
  conv.ask('Hi, how is it going?')
  conv.ask(`Here's a picture of a cat`)
  conv.ask(new Image({
    url: 'https://developers.google.com/web/fundamentals/accessibility/semantics-builtin/imgs/160204193356-01-cat-500.jpg',
    alt: 'A cat',
  }))
})

// Intent in Dialogflow called `Goodbye`
app.intent('Goodbye', conv => {
  conv.close('See you later!')
})

app.intent('Default Fallback Intent', conv => {
  conv.ask(`I didn't understand. Can you tell me something else?`)
})

// You can register handlers for Dialogflow intents by specifying action names
app.action('action.help', conv => {
  conv.ask('I provide your lucky number.')
})
```

### Actions SDK
```javascript
// Import the appropriate service and chosen wrappers

const {
  actionssdk,
  Image,
} = require('actions-on-google')

// Create an app instance

const app = actionssdk()

// Register handlers for Actions SDK intents

app.intent('actions.intent.MAIN', conv => {
  conv.ask('Hi, how is it going?')
  conv.ask(`Here's a picture of a cat`)
  conv.ask(new Image({
    url: 'https://developers.google.com/web/fundamentals/accessibility/semantics-builtin/imgs/160204193356-01-cat-500.jpg',
    alt: 'A cat',
  }))
})

app.intent('actions.intent.TEXT', (conv, input) => {
  if (input === 'bye' || input === 'goodbye') {
    return conv.close('See you later!')
  }
  conv.ask(`I didn't understand. Can you tell me something else?`)
})
```

### Frameworks

Export or run for your appropriate framework:

#### Firebase Functions
``` javascript
const functions = require('firebase-functions')

// ... app code here

exports.fulfillment = functions.https.onRequest(app)
```

#### Dialogflow Inline Editor
```javascript
const functions = require('firebase-functions')

// ... app code here

// name has to be `dialogflowFirebaseFulfillment`
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app)
```

#### Self Hosted Express Server
```javascript
const express = require('express')
const bodyParser = require('body-parser')

// ... app code here

express().use(bodyParser.json(), app).listen(3000)
```

#### AWS Lambda API Gateway
```javascript
// ... app code here

exports.fulfillment = app
```

### Next Steps

Take a look at the docs and samples linked at the top to get to know the platform and supported functionalities.

## Library Development Instructions
This library uses `yarn` to run commands. Install yarn using instructions from https://yarnpkg.com/en/docs/install or with npm: `npm i -g yarn`.

Install the library dependencies with `yarn`. If you want to run any of the sample apps, follow the instructions in the sample README.

## Functionality

Public interfaces, classes, functions, objects, and properties are labeled with the JSDoc `@public` tag and exported at the top level. Everything else that is not labeled `@public` and exported at the top level is considered internal and may be changed.

This library supports the following Services:
* Dialogflow v1 and v2
* Actions SDK **v2 only**

### Actions SDK
This library supports only Actions SDK fulfillment version 2.

To ensure that your fulfillment uses version 2, set the [`"fulfillmentApiVersion": 2`](https://github.com/actions-on-google/actionssdk-eliza-nodejs/blob/a44a1b0ef0026ce2b0e525ce38bebbf8540ce344/eliza.json#L41) property in your action package.

## References and How to report bugs
* Actions on Google documentation: [https://developers.google.com/actions/](https://developers.google.com/actions/).
* If you find any issues, please open a bug on [GitHub](https://github.com/actions-on-google/actions-on-google-nodejs).
* Questions are answered on [StackOverflow](https://stackoverflow.com/questions/tagged/actions-on-google).

## How to make contributions?
Please read and follow the steps in the CONTRIBUTING.md.

## License
See LICENSE.md.

## Terms
Your use of this library is subject to, and by using or downloading the sample files you agree to comply with, the [Google APIs Terms of Service](https://developers.google.com/terms/).

## Google+
Actions on Google Developers Community on Google+ [https://g.co/actionsdev](https://g.co/actionsdev).
