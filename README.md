# Actions on Google Client Library

This client library makes it easy to create Actions for the Google Assistant and
supports Dialogflow, Actions SDK (v2), and Smart Home fulfillment.

:warning: For [Conversation Actions](https://developers.google.com/assistant/conversational/actions) built using [Actions Builder}(https://developers.google.com/assistant/console/builder) see https://github.com/actions-on-google/assistant-conversation-nodejs

* [Client Library GitHub repo](https://github.com/actions-on-google/actions-on-google-nodejs)
* [Client Library reference docs](https://actions-on-google.github.io/actions-on-google-nodejs/)
* [Actions on Google docs](https://developers.google.com/assistant)
* [Actions on Google samples](https://developers.google.com/assistant/actions/samples)

[![NPM Version](https://img.shields.io/npm/v/actions-on-google.svg)](https://www.npmjs.org/package/actions-on-google)
[![Build Status](https://travis-ci.org/actions-on-google/actions-on-google-nodejs.svg?branch=master)](https://travis-ci.org/actions-on-google/actions-on-google-nodejs)

## Setup Instructions

Install the library with either `npm install actions-on-google` or `yarn add actions-on-google` if you use yarn.

### Developer Preview

To support features under Developer Preview, the library has a special [`preview`](https://github.com/actions-on-google/actions-on-google-nodejs/tree/preview) branch which can be installed using the `@preview` tag.

This is installed with either `npm install actions-on-google@preview` or `yarn add actions-on-google@preview`.

The `preview` tag will be kept up to date with every new version of the library.

You can use the Developer Preview version to experience exciting new features that we’re still testing to make sure we have the best developer experience, and help us providing feedback on the API design and feature set.

The APIs offered in Developer Preview have not matured to General Availability yet, which means:
  - **You can’t publish Actions** that use features in Developer Preview.
  - The APIs are **potentially subject to backwards incompatible changes**.

### Conversational Services

#### Dialogflow
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
```

#### Actions SDK
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

#### Notes about the code snippet
* [`conv.ask`](https://actions-on-google.github.io/actions-on-google-nodejs/classes/conversation.conversation-1.html#ask)/[`conv.close`](https://actions-on-google.github.io/actions-on-google-nodejs/classes/conversation.conversation-1.html#close)
can be called with any of the [`Response`](https://actions-on-google.github.io/actions-on-google-nodejs/modules/conversation.html#response) types.
* All [`Helper`](https://actions-on-google.github.io/actions-on-google-nodejs/modules/conversation_helper.html) classes are of the `Response` type.

##### Dialogflow
* `app` is an instance of type [`DialogflowApp`](https://actions-on-google.github.io/actions-on-google-nodejs/interfaces/dialogflow.dialogflowapp.html#catch).
* `app` accepts options of type [`DialogflowOptions`](https://actions-on-google.github.io/actions-on-google-nodejs/interfaces/dialogflow.dialogflowoptions.html#clientid).
* `conv` is an instance of type [`DialogflowConversation`](https://actions-on-google.github.io/actions-on-google-nodejs/classes/dialogflow.dialogflowconversation.html).

##### Actions SDK
* `app` is an instance of type [`ActionsSdkApp`](https://actions-on-google.github.io/actions-on-google-nodejs/interfaces/actionssdk.actionssdkapp.html#catch).
* `app` accepts options of type [`ActionsSdkOptions`](https://actions-on-google.github.io/actions-on-google-nodejs/interfaces/actionssdk.actionssdkoptions.html#clientid).
* `conv` is an instance of type [`ActionsSdkConversation`](https://actions-on-google.github.io/actions-on-google-nodejs/classes/actionssdk.actionssdkconversation.html).

### Smart Home
```javascript
// Import the appropriate service
const { smarthome } = require('actions-on-google')

// Create an app instance
const app = smarthome()

// Register handlers for Smart Home intents

app.onExecute((body, headers) => {
  return {
    requestId: 'ff36...',
    payload: {
      // ...
    },
  }
})

app.onQuery((body, headers) => {
  return {
    requestId: 'ff36...',
    payload: {
      // ...
    },
  }
})

app.onSync((body, headers) => {
  return {
    requestId: 'ff36...',
    payload: {
      // ...
    },
  }
})
```

#### Notes about the code snippet
* `app` is an instance of type [`SmartHomeApp`](https://actions-on-google.github.io/actions-on-google-nodejs/interfaces/smarthome.smarthomeapp.html#onexecute).
* `app` accepts options of type [`SmartHomeOptions`](https://actions-on-google.github.io/actions-on-google-nodejs/interfaces/smarthome.smarthomeoptions.html#debug).

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

const expressApp = express().use(bodyParser.json())

expressApp.post('/fulfillment', app)

expressApp.listen(3000)
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
* [Dialogflow](https://dialogflow.com/docs/fulfillment) v1 and v2
* [Actions SDK](https://developers.google.com/assistant/actions/actions-sdk/fulfillment) **v2 only**
* [Smart Home](https://developers.google.com/assistant/smarthome/develop/create#provide-fulfillment)

### Actions SDK
This library supports only Actions SDK fulfillment version 2.

To ensure that your fulfillment uses version 2, set the [`"fulfillmentApiVersion": 2`](https://github.com/actions-on-google/actionssdk-eliza-nodejs/blob/a44a1b0ef0026ce2b0e525ce38bebbf8540ce344/eliza.json#L41) property in your action package.

## References & Issues
+ Questions? Go to [StackOverflow](https://stackoverflow.com/questions/tagged/actions-on-google), [Assistant Developer Community on Reddit](https://www.reddit.com/r/GoogleAssistantDev/) or [Support](https://developers.google.com/assistant/support).
+ For bugs, please report an issue on Github.
+ Actions on Google [Documentation](https://developers.google.com/assistant)
+ Actions on Google [Codelabs](https://codelabs.developers.google.com/?cat=Assistant).
+ [Webhook Boilerplate Template](https://github.com/actions-on-google/dialogflow-webhook-boilerplate-nodejs) for Actions on Google.
 
## Make Contributions
Please read and follow the steps in the [CONTRIBUTING.md](CONTRIBUTING.md).
 
## License
See [LICENSE](LICENSE).
 
## Terms
Your use of this sample is subject to, and by using or downloading the sample files you agree to comply with, the [Google APIs Terms of Service](https://developers.google.com/terms/).
