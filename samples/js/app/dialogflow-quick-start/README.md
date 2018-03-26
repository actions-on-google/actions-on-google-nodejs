# Dialogflow Quick Start Sample

## Setup: Dialogflow Inline Editor (option 1)

1. [Sign up for or sign into Dialogflow](https://console.dialogflow.com/api-client/#/login)
1. Create a Dialogflow agent
1. [Enable the Cloud Function for Firebase inline editor](https://dialogflow.com/docs/fulfillment#cloud_functions_for_firebase)
1. Copy this code in `functions/index.js` the `index.js` file in the Dialogflow Cloud Function for Firebase inline editor.
1. Add `"actions-on-google": "2.0.0-alpha.3"` to the `package.json` file's `dependencies` object in the Dialogflow Cloud Function for Firebase inline editor.
1. Click `Deploy`

## Setup: Firebase CLI (option 2)

1. Create a Dialogflow agent
1. `cd` to the `functions` directory
1. Run `npm install`
1. Install the Firebase CLI by running `npm install -g firebase-tools`
1. Login to your Google account with `firebase login`
1. Add your project to the sample with `firebase use [project ID]` [find your project ID here](https://dialogflow.com/docs/agents#settings)
1. Run `firebase deploy --only functions:dialogflowFirebaseFulfillment`
1. Paste the URL into your Dialogflow agent's fulfillment and click `Save`
1. Under the fulfillment section of your `Default Welcome Intent` and `Default Fallback Intent` check the box for `Use webhook` and click `Save`

## References and How to report bugs
* Dialogflow documentation: [https://docs.dialogflow.com](https://docs.dialogflow.com).
* If you find any issues, please open a bug on [GitHub](https://github.com/actions-on-google/actions-on-google-nodejs/issues).
* Questions are answered on [StackOverflow](https://stackoverflow.com/questions/tagged/dialogflow).

## How to make contributions?
Please read and follow the steps in the CONTRIBUTING.md.

## License
See LICENSE.md.

## Terms
Your use of this sample is subject to, and by using or downloading the sample files you agree to comply with, the [Google APIs Terms of Service](https://developers.google.com/terms/).
