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
 * This is the class that handles the communication with API.ai's backend..
 */

'use strict';

let Debug = require('debug');
let debug = Debug('actions-on-google:debug');
let error = Debug('actions-on-google:error');
const assistant = require('./assistant');
const Assistant = assistant.Assistant;
const State = assistant.State;

// Constants
const RESPONSE_CODE_OK = 200;
const ACTIONS_API_AI_CONTEXT = '_actions_on_google_';
const MAX_LIFESPAN = 100;
const INPUTS_MAX = 3;

// Configure logging for hosting platforms that only support console.log and console.error
debug.log = console.log.bind(console);
error.log = console.error.bind(console);

// ---------------------------------------------------------------------------
//                   API.AI support
// ---------------------------------------------------------------------------

/**
 * Constructor for ApiAiAssistant object. To be used in the API.AI
 * fulfillment webhook logic.
 *
 * @example
 * let ApiAiAssistant = require('actions-on-google').ApiAiAssistant;
 * const assistant = new ApiAiAssistant({request: request, response: response,
 *   sessionStarted:sessionStarted});
 *
 * @param {Object} options JSON configuration: {request [Express HTTP request object],
                   response [Express HTTP response object], sessionStarted [function]}
 * @constructor
 * @apiai
 */
function ApiAiAssistant (options) {
  debug('ApiAiAssistant constructor');
  Assistant.call(this, options);
}

// Inherit the Asssistant methods and properties
ApiAiAssistant.prototype = new Assistant();

/**
 * Gets the {@link https://developers.google.com/actions/reference/conversation#User|User object}.
 * The user object contains information about the user, including
 * a string identifier and personal information (requires requesting permissions,
 * see {@link Assistant#askForPermissions}).
 *
 * @example
 * const assistant = new ApiAiAssistant({request: request, response: response});
 * let userId = assistant.getUser().user_id;
 *
 * @return {Object} {@link https://developers.google.com/actions/reference/conversation#User|User info}
 *                  or null if no value.
 * @apiai
 */
ApiAiAssistant.prototype.getUser = function () {
  debug('getUser');
  let self = this;
  if (!self.body_.originalRequest &&
      self.body_.originalRequest.data &&
      self.body_.originalRequest.data.user) {
    self.handleError_('No user object');
    return null;
  }
  return self.body_.originalRequest.data.user;
};

/**
 * If granted permission to device's location in previous intent, returns device's
 * location (see {@link Assistant#askForPermissions}). If device info is unavailable,
 * returns null.
 *
 * @example
 * const assistant = new ApiAiAssistant({request: req, response: res});
 * assistant.askForPermission("To get you a ride",
 *   assistant.SupportedPermissions.DEVICE_PRECISE_LOCATION);
 * // ...
 * // In response handler for permissions fallback intent:
 * if (assistant.isPermissionGranted()) {
 *   sendCarTo(assistant.getDeviceLocation().coordinates);
 * }
 *
 * @return {Object} Container for device's location data:
 *                  {coordinates, address, zipCode, city}.
 *                  Null if location permission is not granted.
 * @apiai
 */
ApiAiAssistant.prototype.getDeviceLocation = function () {
  debug('getDeviceLocation');
  let self = this;
  if (!self.body_.originalRequest.data.device || !self.body_.originalRequest.data.device.location) {
    return null;
  }
  let deviceLocation = {
    coordinates: self.body_.originalRequest.data.device.location.coordinates,
    address: self.body_.originalRequest.data.device.location.formatted_address,
    zipCode: self.body_.originalRequest.data.device.location.zip_code,
    city: self.body_.originalRequest.data.device.location.city
  };
  return deviceLocation;
};

/**
 * Returns true if the request follows a previous request asking for
 * permission from the user and the user granted the permission(s). Otherwise,
 * false. Use with {@link Assistant#askForPermissions}.
 *
 * @example
 * const assistant = new ApiAiAssistant({request: request, response: response});
 * assistant.askForPermissions("To get you a ride", [
 *   assistant.SupportedPermissions.NAME,
 *   assistant.SupportedPermissions.DEVICE_PRECISE_LOCATION
 * ]);
 * // ...
 * // In response handler for permissions fallback intent:
 * if (assistant.isPermissionGranted()) {
 *  // Use the requested permission(s) to get the user a ride
 * }
 *
 * @return {boolean} true if permissions granted.
 * @apiai
 */
ApiAiAssistant.prototype.isPermissionGranted = function () {
  debug('isPermissionGranted');
  let self = this;
  for (let input of self.body_.originalRequest.data.inputs) {
    if (input.arguments) {
      for (let argument of input.arguments) {
        return argument.name === self.BuiltInArgNames.PERMISSION_GRANTED &&
          argument.text_value === 'true';
      }
    }
  }
  return false;
};

/**
 * Verifies whether the request comes from API.AI.
 *
 * @param {string} key The header key specified by the developer in the
 *                 API.AI Fulfillment settings of the action.
 * @param {string} value The private value specified by the developer inside the
 *                 fulfillment header.
 * @return {boolean} true if the request comes from API.AI.
 * @apiai
 */
ApiAiAssistant.prototype.isRequestFromApiAi = function (key, value) {
  debug('isRequestFromApiAi: key=%s, value=%s', key, value);
  let self = this;
  if (!key || key === '') {
    self.handleError_('key must be specified.');
    return false;
  }
  if (!value || value === '') {
    self.handleError_('value must be specified.');
    return false;
  }
  return self.request_.get(key) === value;
};

/**
 * Get the current intent. Alternatively, using a handler Map with {@link Assistant#handleRequest},
 * the client library will automatically handle the incoming intents.
 *
 * @example
 * const assistant = new ApiAiAssistant({request: request, response: response});
 *
 * function responseHandler (assistant) {
 *   let intent = assistant.getIntent();
 *   switch (intent) {
 *     case WELCOME_INTENT:
 *       assistant.ask('Welcome to action snippets! Say a number.');
 *       break;
 *
 *     case NUMBER_INTENT:
 *       let number = assistant.getArgument(NUMBER_ARGUMENT);
 *       assistant.tell('You said ' + number);
 *       break;
 *   }
 * }
 *
 * assistant.handleRequest(responseHandler);
 *
 * @return {string} Intent id or null if no value.
 * @apiai
 */
ApiAiAssistant.prototype.getIntent = function () {
  debug('getIntent');
  let self = this;
  let intent = self.getIntent_();
  if (!intent) {
    self.handleError_('Missing intent from request body');
    return null;
  }
  return intent;
};

/**
 * Get the argument value by name from the current intent.
 *
 * @example
 * const assistant = new ApiAiAssistant({request: request, response: response});
 * const WELCOME_INTENT = 'input.welcome';
 * const NUMBER_INTENT = 'input.number';
 *
 * function welcomeIntent (assistant) {
 *   assistant.ask('Welcome to action snippets! Say a number.');
 * }
 *
 * function numberIntent (assistant) {
 *   let number = assistant.getArgument(NUMBER_ARGUMENT);
 *   assistant.tell('You said ' + number);
 * }
 *
 * let actionMap = new Map();
 * actionMap.set(WELCOME_INTENT, welcomeIntent);
 * actionMap.set(NUMBER_INTENT, numberIntent);
 * assistant.handleRequest(actionMap);
 *
 * @param {string} argName Name of the argument.
 * @return {object} Argument value matching argName
                    or null if no matching argument.
 * @apiai
 */
ApiAiAssistant.prototype.getArgument = function (argName) {
  debug('getArgument: argName=%s', argName);
  let self = this;
  if (!argName) {
    self.handleError_('Invalid argument name');
    return null;
  }
  if (self.body_.result.parameters && self.body_.result.parameters[argName]) {
    return self.body_.result.parameters[argName];
  }
  if (self.body_.originalRequest && self.body_.originalRequest.data &&
      self.body_.originalRequest.data.inputs &&
      self.body_.originalRequest.data.inputs[0].arguments) {
    return self.body_.originalRequest.data.inputs[0].arguments[0][argName];
  }
  debug('Failed to get argument value: %s', argName);
  return null;
};

/**
 * Asks Assistant to collect the user's input.
 *
 * NOTE: Due to a bug, if you specify the no-input prompts,
 * the mic is closed after the 3rd prompt, so you should use the 3rd prompt
 * for a bye message until the bug is fixed.
 *
 * @example
 * const assistant = new ApiAiAssistant({request: request, response: response});
 * const WELCOME_INTENT = 'input.welcome';
 * const NUMBER_INTENT = 'input.number';
 *
 * function welcomeIntent (assistant) {
 *   assistant.ask('Welcome to action snippets! Say a number.',
 *     ['Say any number', 'Pick a number', 'What is the number?']);
 * }
 *
 * function numberIntent (assistant) {
 *   let number = assistant.getArgument(NUMBER_ARGUMENT);
 *   assistant.tell('You said ' + number);
 * }
 *
 * let actionMap = new Map();
 * actionMap.set(WELCOME_INTENT, welcomeIntent);
 * actionMap.set(NUMBER_INTENT, numberIntent);
 * assistant.handleRequest(actionMap);
 *
 * @param {String} inputPrompt The input prompt text.
 * @param {array} noInputs Array of re-prompts when the user does not respond (max 3).
 * @return {Object} HTTP response.
 * @apiai
 */
ApiAiAssistant.prototype.ask = function (inputPrompt, noInputs) {
  debug('ask: inputPrompt=%s, noInputs=%s', inputPrompt, noInputs);
  let self = this;
  if (!inputPrompt) {
    self.handleError_('Invalid input prompt');
    return null;
  }
  let dialogState = {
    'state': (self.state instanceof State ? self.state.getName() : self.state),
    'data': self.data
  };
  let response = self.buildResponse_(dialogState, inputPrompt, true, noInputs);
  return self.doResponse_(response, RESPONSE_CODE_OK);
};

/**
 * Tells the Assistant to render the speech response and close the mic.
 *
 * @example
 * const assistant = new ApiAiAssistant({request: request, response: response});
 * const WELCOME_INTENT = 'input.welcome';
 * const NUMBER_INTENT = 'input.number';
 *
 * function welcomeIntent (assistant) {
 *   assistant.ask('Welcome to action snippets! Say a number.');
 * }
 *
 * function numberIntent (assistant) {
 *   let number = assistant.getArgument(NUMBER_ARGUMENT);
 *   assistant.tell('You said ' + number);
 * }
 *
 * let actionMap = new Map();
 * actionMap.set(WELCOME_INTENT, welcomeIntent);
 * actionMap.set(NUMBER_INTENT, numberIntent);
 * assistant.handleRequest(actionMap);
 *
 * @param {string} textToSpeech Final spoken response. Spoken response can be SSML.
 * @return The response that is sent back to Assistant.
 * @apiai
 */
ApiAiAssistant.prototype.tell = function (speechResponse) {
  debug('tell: speechResponse=%s', speechResponse);
  let self = this;
  if (!speechResponse) {
    self.handleError_('Invalid speech response');
    return null;
  }
  let response = self.buildResponse_(undefined, speechResponse, false);
  return self.doResponse_(response, RESPONSE_CODE_OK);
};

/**
 * Set a new context for the current intent.
 *
 * @example
 * const assistant = new ApiAiAssistant({request: request, response: response});
 * const CONTEXT_NUMBER = 'number';
 *
 * function welcomeIntent (assistant) {
 *   assistant.setContext(CONTEXT_NUMBER);
 *   assistant.ask('Welcome to action snippets! Say a number.');
 * }
 *
 * function numberIntent (assistant) {
 *   let number = assistant.getArgument(NUMBER_ARGUMENT);
 *   assistant.tell('You said ' + number);
 * }
 *
 * let actionMap = new Map();
 * actionMap.set(WELCOME_INTENT, welcomeIntent);
 * actionMap.set(NUMBER_INTENT, numberIntent);
 * assistant.handleRequest(actionMap);
 *
 * @param {string} context Name of the context.
 * @param {int} lifespan Context lifespan.
 * @param {object} parameters Context JSON parameters.
 * @apiai
 */
ApiAiAssistant.prototype.setContext = function (context, lifespan, parameters) {
  debug('setContext: context=%s, lifespan=%d, parameters=%s', context, lifespan,
    JSON.stringify(parameters));
  let self = this;
  if (!context) {
    self.handleError_('Invalid context name');
    return null;
  }
  let newContext = {
    name: context,
    lifespan: 1
  };
  if (lifespan !== null && lifespan !== undefined) {
    newContext.lifespan = lifespan;
  }
  if (parameters) {
    newContext.parameters = parameters;
  }
  self.contexts_[context] = newContext;
};

/**
 * Gets the user's raw input query.
 *
 * @example
 * const assistant = new ApiAiAssistant({request: request, response: response});
 * assistant.tell('You said ' + assistant.getRawInput());
 *
 * @return {string} User's raw query or null if no value.
 * @apiai
 */
ApiAiAssistant.prototype.getRawInput = function () {
  debug('getRawInput');
  let self = this;
  if (!self.body_.result ||
      !self.body_.result.resolvedQuery) {
    self.handleError_('No raw input');
    return null;
  }
  return self.body_.result.resolvedQuery;
};

// ---------------------------------------------------------------------------
//                   Private Helpers
// ---------------------------------------------------------------------------

/**
 * Get the current intent.
 *
 * @return {string} The intent id.
 * @private
 * @apiai
 */
ApiAiAssistant.prototype.getIntent_ = function () {
  debug('getIntent_');
  let self = this;
  if (self.body_.result) {
    return self.body_.result.action;
  } else {
    self.handleError_('Missing result from request body');
    return null;
  }
};

/**
 * Builds a response for API.AI to send back to the Assistant.
 *
 * @param {object} dialogState JSON object the action uses to hold dialog state that
 *                 will be circulated back by Assistant.
 * @param {string} textToSpeech TTS spoken to end user.
 * @param {boolean} expectUserResponse true if the user response is expected.
 * @param {array} noInputs Array of re-prompts when the user does not respond (max 3).
 * @return {object} The final response returned to Assistant.
 * @private
 * @apiai
 */
ApiAiAssistant.prototype.buildResponse_ = function (dialogState,
    textToSpeech, expectUserResponse, noInputs) {
  debug('buildResponse_: dialogState=%s, textToSpeech=%s, expectUserResponse=%s, noInputs=%s',
    JSON.stringify(dialogState), textToSpeech, expectUserResponse, noInputs);
  let self = this;
  if (!textToSpeech === undefined) {
    self.handleError_('Invalid text to speech');
    return null;
  }
  if (noInputs) {
    if (noInputs.length > INPUTS_MAX) {
      self.handleError_('Invalid number of no inputs');
      return null;
    }
    if (self.isSsml_(textToSpeech)) {
      noInputs = self.buildPromptsFromSsmlHelper_(noInputs);
    } else {
      noInputs = self.buildPromptsFromPlainTextHelper_(noInputs);
    }
  } else {
    noInputs = [];
  }
  let response = {
    speech: textToSpeech,
    data: {
      google: {
        expect_user_response: expectUserResponse,
        is_ssml: self.isSsml_(textToSpeech),
        no_input_prompts: noInputs
      }
    },
    contextOut: []
  };
  if (expectUserResponse) {
    response.contextOut.push({
      name: ACTIONS_API_AI_CONTEXT,
      lifespan: MAX_LIFESPAN,
      parameters: dialogState.data
    });
  }
  for (let context of Object.keys(self.contexts_)) {
    response.contextOut.push(self.contexts_[context]);
  }
  return response;
};

/**
 * Extract the session data from the incoming JSON request.
 *
 * @private
 * @apiai
 */
ApiAiAssistant.prototype.extractData_ = function () {
  debug('extractData_');
  let self = this;
  if (self.body_.result && self.body_.result.contexts.length > 0) {
    for (let i = 0; i < self.body_.result.contexts.length; i++) {
      if (self.body_.result.contexts[i].name === ACTIONS_API_AI_CONTEXT) {
        let parameters = self.body_.result.contexts[i].parameters;
        if (parameters) {
          self.data = parameters;
        } else {
          self.data = {};
        }
        break;
      }
    }
  } else {
    self.data = {};
  }
};

/**
 * Uses a PermissionsValueSpec object to construct and send a
 * permissions request to the user.
 *
 * @param {object} permissionsSpec PermissionsValueSpec object containing
 *                 the permissions prefix and permissions requested.
 * @return {Object} The HTTP response.
 * @private
 * @apiai
 */
ApiAiAssistant.prototype.fulfillPermissionsRequest_ = function (permissionsSpec) {
  debug('fulfillPermissionsRequest_: permissionsSpec=%s',
    JSON.stringify(permissionsSpec));
  let self = this;
  let dialogState = {
    'state': (self.state instanceof State ? self.state.getName() : self.state),
    'data': self.data
  };
  let inputPrompt = 'PLACEHOLDER_FOR_PERMISSION';
  let response = self.buildResponse_(dialogState, inputPrompt, true);
  response.data.google.permissions_request = permissionsSpec;
  return self.doResponse_(response, RESPONSE_CODE_OK);
};

module.exports = ApiAiAssistant;
