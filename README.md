# Actions On Google Client Library

This Actions On Google client library makes it easy to create your actions for the Google Assistant.

The client library supports both the Actions SDK webhook and API.ai fulfillment.

## Setup Instructions

### Actions SDK
 1. Import the appropriate class:

```javascript
let ActionsSdkAssistant = require('actions-on-google').ActionsSdkAssistant;
```

 2. Create an instance:

```javascript
const assistant = new ActionsSdkAssistant({request: request, response: response});
```

### API.ai
 1. Import the appropriate class:

```javascript
let ApiAiAssistant = require('actions-on-google').ApiAiAssistant;
```

 2. Create an instance:

```javascript
const assistant = new ApiAiAssistant({request: request, response: response});
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
