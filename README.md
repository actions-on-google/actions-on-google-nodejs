# Actions On Google Client Library
==================================

This Actions On Google client library makes it easy to create your actions for the Google Assistant.

The client library supports both the Actions SDK webhook and API.ai fulfillment.


Here is the list of sample apps using the library:
* [Hello World: HelloWorld](https://github.com/actions-on-google/helloworld)


## Setup Instructions

# Actions SDK
 1. Import the appropriate class: let ActionsSdkAssistant = require('actions-on-google').ActionsSdkAssistant;
 2. Create an instance: const assistant = new ActionsSdkAssistant({request: request, response: response});

 # API.ai
 1. Import the appropriate class: let ApiAiAssistant = require('actions-on-google').ApiAiAssistant;
 2. Create an instance: const assistant = new ApiAiAssistant({request: request, response: response});

See the developer guide and release notes at https://developers.google.com/actions/ for more details.

## Documentation
* Actions On Google: https://developers.google.com/actions/

## References and How to report bugs
* Conversation APIs: http://developers.google.com/actions
* If you find any issues, please open a bug here on GitHub

How to make contributions?
Please read and follow the steps in the CONTRIBUTING.md

License
See LICENSE.md

## Terms
Your use of this sample is subject to, and by using or downloading the sample files you agree to comply with, the [Google APIs Terms of Service](https://developers.google.com/terms/) and the [Actions On Google Developer Terms of Service](https://developers.google.com/actions/docs/terms/).

## Google+
Actions on Google Developers Community on Google+ [http://g.co/actionsdev](http://g.co/actionsdev)
