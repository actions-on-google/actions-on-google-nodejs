/**
 * Copyright 2016 Google Inc. All Rights Reserved.
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

/**
 * The Actions on Google client library.
 * https://developers.google.com/actions/
 */

'use strict';

const { AssistantApp, State } = require('./assistant-app');
const ActionsSdkApp = require('./actions-sdk-app');
const DialogflowApp = require('./dialogflow-app');
const Transactions = require('./transactions');
const Responses = require('./response-builder');
const { version } = require('./package.json');

const Debug = require('debug');
const debug = Debug('actions-on-google:debug');
debug.log = console.log.bind(console);
debug(`Using Actions on Google Client Library v${version}`);

module.exports = {
  AssistantApp,
  State,
  ActionsSdkApp,
  DialogflowApp,
  Transactions,
  Responses,
  // Backwards compatibility
  get Assistant () {
    console.warn('Importing the class name Assistant is *DEPRECATED*, use AssistantApp');
    return AssistantApp;
  },
  get ActionsSdkAssistant () {
    console.warn('Importing the class name ActionsSdkAssistant is *DEPRECATED*, use ActionsSdkApp');
    return ActionsSdkApp;
  },
  get ApiAiAssistant () {
    console.warn('Importing the class name ApiAiAssistant is *DEPRECATED*, use DialogflowApp');
    return DialogflowApp;
  },
  get ApiAiApp () {
    console.warn('Importing the class name ApiAiApp is *DEPRECATED*, use DialogflowApp');
    return DialogflowApp;
  },
  version
};
