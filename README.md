# Actions on Google Client Library - V2 Alpha release
This is an Alpha release of the Actions on Google client library for Node.js.
The APIs presented are not to be considered stable; we might make breaking changes
to address feedback from the Actions on Google developers community.

This client library makes it easy to create your apps for the Google Assistant, and
supports both Dialogflow fulfillment and the Actions SDK webhook.

[![NPM Version](https://img.shields.io/npm/v/actions-on-google/alpha.svg)](https://www.npmjs.org/package/actions-on-google)
[![Build Status](https://travis-ci.org/actions-on-google/actions-on-google-nodejs.svg?branch=v2.0.0-alpha)](https://travis-ci.org/actions-on-google/actions-on-google-nodejs)

## Setup Instructions

Install the library with either `npm i actions-on-google@2.0.0-alpha.4` or `yarn add actions-on-google@2.0.0-alpha.4` if you use yarn.

### Dialogflow
 1. Import the appropriate service:

```javascript
const { dialogflow } = require('actions-on-google')
```

 2. Create an instance:

```javascript
const app = dialogflow()
```

### Actions SDK
 1. Import the appropriate service:

```javascript
const { actionssdk } = require('actions-on-google')
```

 2. Create an app instance:

```javascript
const app = actionssdk()
```

You can find more usage samples in the `samples` directory, both for Javascript and Typescript.

## Alpha Instructions
This library uses `yarn` to run commands. Install yarn using instructions from https://yarnpkg.com/en/docs/install or with npm: `npm i -g yarn`.

Install the library dependencies with `yarn`. If you want to run any of the sample apps, follow the instructions in the sample README.

Public interfaces, classes, functions, objects, and properties are labeled with the JSDoc `@public` tag and exported at the top level. During the alpha, anything can be changed so make sure to strictly reference the version rather than use approximations (don't use `^`, `~`, `>=`, or `*` in the `package.json` version). After alpha during general availability, everything else that is not labeled `@public` and exported at the top level is considered internal and may be changed.

This library supports the following Services:
* Dialogflow v1 and v2
* Actions SDK **v2 only**

### Actions SDK
This library supports only Actions SDK fulfillment version 2.

To ensure that your fulfillment uses version 2, set the [`"fulfillmentApiVersion": 2`](https://github.com/actions-on-google/actionssdk-eliza-nodejs/blob/a44a1b0ef0026ce2b0e525ce38bebbf8540ce344/eliza.json#L41) property in your action package.

### Supported Features
The Actions on Google Node.js Client Library V2 Alpha supports almost all v1 features with the major exception of incoming Dialogflow responses

### Samples
To run the samples included with the alpha, follow the instructions in the README for each sample's folder.

## References and How to report bugs
* Actions on Google documentation: [https://developers.google.com/actions/](https://developers.google.com/actions/).
* If you find any issues, please open a bug on [GitHub](https://github.com/actions-on-google/actions-on-google-nodejs).
* Questions are answered on [StackOverflow](https://stackoverflow.com/questions/tagged/actions-on-google).

Note that the Actions on Google documentation currently shows usage of v1 of the client library, as that is still the stable version.

## How to make contributions?
Please read and follow the steps in the CONTRIBUTING.md.

## License
See LICENSE.md.

## Terms
Your use of this library is subject to, and by using or downloading the sample files you agree to comply with, the [Google APIs Terms of Service](https://developers.google.com/terms/).

## Google+
Actions on Google Developers Community on Google+ [https://g.co/actionsdev](https://g.co/actionsdev).
