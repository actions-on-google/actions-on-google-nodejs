# Actions On Google Client Library

This Actions On Google client library makes it easy to create your apps for the Google Assistant.

The client library supports both the Actions SDK webhook and Dialogflow fulfillment.

[![Build](https://travis-ci.org/actions-on-google/actions-on-google-nodejs.svg?branch=master)](https://travis-ci.org/actions-on-google/actions-on-google-nodejs?branch=master)

## Setup Instructions

### Actions SDK
 1. Import the appropriate class:

```javascript
let ActionsSdkApp = require('actions-on-google').ActionsSdkApp;
```

 2. Create an instance:

```javascript
const app = new ActionsSdkApp({request: request, response: response});
```

### Dialogflow
 1. Import the appropriate class:

```javascript
let DialogflowApp = require('actions-on-google').DialogflowApp;
```

 2. Create an instance:

```javascript
const app = new DialogflowApp({request: request, response: response});
```

## References and How to report bugs
* Actions on Google documentation: [https://developers.google.com/actions/](https://developers.google.com/actions/).
* If you find any issues, please open a bug on [GitHub](https://github.com/actions-on-google/actions-on-google-nodejs).
* Questions are answered on [StackOverflow](https://stackoverflow.com/questions/tagged/actions-on-google).

## How to make contributions?
Please read and follow the steps in the CONTRIBUTING.md.

## License
See LICENSE.md.

## Terms
Your use of this sample is subject to, and by using or downloading the sample files you agree to comply with, the [Google APIs Terms of Service](https://developers.google.com/terms/).

## Google+
Actions on Google Developers Community on Google+ [https://g.co/actionsdev](https://g.co/actionsdev).
