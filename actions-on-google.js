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

let Debug = require('debug');
let debug = Debug('actions-on-google:debug');
let error = Debug('actions-on-google:error');

// Constants
const ERROR_MESSAGE = 'Sorry, I am unable to process your request.';
const API_ERROR_MESSAGE_PREFIX = 'Action Error: ';
const CONVERSATION_API_VERSION_HEADER = 'Google-Assistant-API-Version';
const CONVERSATION_API_AGENT_VERSION_HEADER = 'Agent-Version-Label';
const RESPONSE_CODE_OK = 200;
const RESPONSE_CODE_BAD_REQUEST = 400;
const ACTIONS_API_AI_CONTEXT = '_actions_on_google_';
const MAX_LIFESPAN = 100;
const HTTP_CONTENT_TYPE_HEADER = 'Content-Type';
const HTTP_CONTENT_TYPE_JSON = 'application/json';
const INPUTS_MAX = 3;

// Configure logging for hosting platforms that only support console.log and console.error
debug.log = console.log.bind(console);
error.log = console.error.bind(console);

/**
 * Constructor for Assistant object.
 * Should not be instantiated; rather instantiate one of the subclasses
 * {@link ActionsSdkAssistant} or {@link ApiAiAssistant}.
 *
 * @param {Object} options JSON configuration: {request [Express HTTP request object],
                   response [Express HTTP response object], sessionStarted [function]}
 * @constructor
 */
function Assistant (options) {
  let self = this;

  if (!options) {
    // ignore for JavaScript inheritance to work
    return;
  }

  debug('Assistant constructor');

  if (!options.request) {
    self.handleError_('Invalid request');
    return;
  }

  if (!options.response) {
    self.handleError_('Invalid response');
    return;
  }

  /**
   * The Express HTTP request that the endpoint receives from the Assistant.
   * @private {object}
   */
  self.request_ = options.request;

  /**
   * The Express HTTP response the endpoint will return to Assistant.
   * @private {object}
   */
  self.response_ = options.response;

  /**
   * 'sessionStarted' callback (optional).
   * @private {object}
   */
  self.sessionStarted_ = options.sessionStarted;

  debug('Request from Assistant: %s', JSON.stringify(self.request_.body));

  /**
   * The request body contains query JSON and previous session variables.
   * @private {object}
   */
  self.body_ = self.request_.body;

  /**
   * API version describes version of the Assistant request.
   * @private {string} valid API version.
   */
  self.apiVersion_ = null;
  // Populates API version.
  if (self.request_.get(CONVERSATION_API_VERSION_HEADER)) {
    self.apiVersion_ = self.request_.get(CONVERSATION_API_VERSION_HEADER);
    debug('Assistant API version: ' + self.apiVersion_);
  }

  /**
   * Intent handling data structure.
   * @private {object}
   */
  self.handler_ = null;

  /**
   * Intent mapping data structure.
   * @private {object}
   */
  self.intentMap_ = null;

  /**
   * Intent state data structure.
   * @private {object}
   */
  self.stateMap_ = null;

  /**
   * The session state.
   * @public {string}
   */
  self.state = null;

  /**
   * The session data in JSON format.
   * @public {object}
   */
  self.data = {};

  /**
   * The API.AI context.
   * @private {object}
   */
  self.contexts_ = {};

  /**
   * The last error message.
   * @private {string}
   */
  self.lastErrorMessage_ = null;

  /**
   * Track if an HTTP response has been sent already.
   * @private {boolean}
   */
  self.responded_ = false;
}

// ---------------------------------------------------------------------------
//                   Public APIs
// ---------------------------------------------------------------------------

/**
 * List of standard intents that the Assistant provides.
 * @readonly
 * @enum {string}
 * @actionssdk
 * @apiai
 */
Assistant.prototype.StandardIntents = {
  /** Assistant fires MAIN intent for queries like [talk to $action]. */
  MAIN: 'assistant.intent.action.MAIN',
  /** Assistant fires TEXT intent when action issues ask intent. */
  TEXT: 'assistant.intent.action.TEXT',
  /** Assistant fires PERMISSION intent when action invokes askForPermission. */
  PERMISSION: 'assistant.intent.action.PERMISSION'
};

/**
 * List of supported permissions the Assistant supports.
 * @readonly
 * @enum {string}
 * @actionssdk
 * @apiai
 */
Assistant.prototype.SupportedPermissions = {
  /**
   * The user's name as defined in the
   * {@link https://developers.google.com/actions/reference/conversation#UserProfile|UserProfile object}
   */
  NAME: 'NAME',
  /**
   * The location of the user's current device, as defined in the
   * {@link https://developers.google.com/actions/reference/conversation#Location|Location object}.
   */
  DEVICE_PRECISE_LOCATION: 'DEVICE_PRECISE_LOCATION',
  /**
   * City and zipcode corresponding to the location of the user's current device, as defined in the
   * {@link https://developers.google.com/actions/reference/conversation#Location|Location object}.
   */
  DEVICE_COARSE_LOCATION: 'DEVICE_COARSE_LOCATION'
};

/**
 * List of built-in argument names.
 * @readonly
 * @enum {string}
 * @actionssdk
 * @apiai
 */
Assistant.prototype.BuiltInArgNames = {
  /** Permission granted argument. */
  PERMISSION_GRANTED: 'permission_granted'
};

/**
 * Handles the incoming Assistant request using a handler or Map of handlers.
 * Each handler can be a function callback or Promise.
 *
 * @example
 * // Actions SDK
 * const assistant = new ActionsSdkAssistant({request: request, response: response});
 *
 * function mainIntent (assistant) {
 *   let inputPrompt = assistant.buildInputPrompt(true, '<speak>Hi! <break time="1"/> ' +
 *         'I can read out an ordinal like ' +
 *         '<say-as interpret-as="ordinal">123</say-as>. Say a number.</speak>',
 *         ['I didn\'t hear a number', 'If you\'re still there, what\'s the number?', 'What is the number?']);
 *   assistant.ask(inputPrompt);
 * }
 *
 * function rawInput (assistant) {
 *   if (assistant.getRawInput() === 'bye') {
 *     assistant.tell('Goodbye!');
 *   } else {
 *     let inputPrompt = assistant.buildInputPrompt(true, '<speak>You said, <say-as interpret-as="ordinal">' +
 *       assistant.getRawInput() + '</say-as></speak>',
 *         ['I didn\'t hear a number', 'If you\'re still there, what\'s the number?', 'What is the number?']);
 *     assistant.ask(inputPrompt);
 *   }
 * }
 *
 * let actionMap = new Map();
 * actionMap.set(assistant.StandardIntents.MAIN, mainIntent);
 * actionMap.set(assistant.StandardIntents.TEXT, rawInput);
 *
 * assistant.handleRequest(actionMap);
 *
 * // API.AI
 * const assistant = new ApiAiAssistant({request: req, response: res});
 * const NAME_ACTION = 'make_name';
 * const COLOR_ARGUMENT = 'color';
 * const NUMBER_ARGUMENT = 'number';
 *
 * function makeName (assistant) {
 *   let number = assistant.getArgument(NUMBER_ARGUMENT);
 *   let color = assistant.getArgument(COLOR_ARGUMENT);
 *   assistant.tell('Alright, your silly name is ' +
 *     color + ' ' + number +
 *     '! I hope you like it. See you next time.');
 * }
 *
 * let actionMap = new Map();
 * actionMap.set(NAME_ACTION, makeName);
 * assistant.handleRequest(actionMap);
 *
 * @param {Object} handler The handler for the request.
 * @actionssdk
 * @apiai
 */
Assistant.prototype.handleRequest = function (handler) {
  debug('handleRequest: handler=%s', handler);
  let self = this;
  if (!handler) {
    self.handleError_('invalid request handler');
    return;
  }
  self.extractData_();
  if (typeof handler === 'function') {
    debug('handleRequest: function');
    // simple function handler
    self.handler_ = handler;
    let promise = handler(self);
    if (promise instanceof Promise) {
      promise.then(
        function (result) {
          debug(result);
        })
      .catch(
        function (reason) {
          self.handleError_('function failed: %s', reason.message);
          self.tell(!reason.message ? ERROR_MESSAGE : reason.message);
        });
    } else {
      // Handle functions
      return;
    }
    return;
  } else if (handler instanceof Map) {
    debug('handleRequest: map');
    let intent = self.getIntent();
    let result = self.invokeIntentHandler_(handler, intent);
    if (!result) {
      self.tell(!self.lastErrorMessage_ ? ERROR_MESSAGE : self.lastErrorMessage_);
    }
    return;
  }
  // Could not handle intent
  self.handleError_('no matching handler');
  self.tell(ERROR_MESSAGE);
};

/**
 * Equivalent to {@link Assistant#askForPermission}, but allows you to prompt the
 * user for more than one permission at once.
 *
 * Notes:
 *
 * * The order in which you specify the permission prompts does not matter -
 *   it is controlled by the assistant to provide a consistent user experience.
 * * The user will be able to either accept all permissions at once, or none.
 *   If you wish to allow them to selectively accept one or other, make several
 *   dialog turns asking for each permission independently with askForPermission.
 * * Asking for DEVICE_COARSE_LOCATION and DEVICE_PRECISE_LOCATION at once is
 *   equivalent to just asking for DEVICE_PRECISE_LOCATION
 *
 * @example
 * const assistant = new ApiAiAssistant({request: req, response: res});
 * const REQUEST_PERMISSION_ACTION = 'request_permission';
 * const GET_RIDE_ACTION = 'get_ride';
 *
 * function requestPermission (assistant) {
 *   let permission = [
 *     assistant.SupportedPermissions.NAME,
 *     assistant.SupportedPermissions.DEVICE_PRECISE_LOCATION
 *   ];
 *   assistant.askForPermissions('To pick you up', permissions);
 * }
 *
 * function sendRide (assistant) {
 *   if (assistant.isPermissionGranted()) {
 *     let displayName = assistant.getUserName().displayName;
 *     let address = assistant.getDeviceLocation().address;
 *     assistant.tell('I will tell your driver to pick up ' + displayName +
 *         ' at ' + address);
 *   } else {
 *     // Response shows that user did not grant permission
 *     assistant.tell('Sorry, I could not figure out where to pick you up.');
 *   }
 * }
 * let actionMap = new Map();
 * actionMap.set(REQUEST_PERMISSION_ACTION, requestPermission);
 * actionMap.set(GET_RIDE_ACTION, sendRide);
 * assistant.handleRequest(actionMap);
 *
 * @param {string} context Context why the permission is being asked; it's the TTS
 *                 prompt prefix (action phrase) we ask the user.
 * @param {Array} permissions Array of permissions Assistant supports, each of
 *                which comes from Assistant.SupportedPermissions.
 * @param {Object=} dialogState JSON object the action uses to hold dialog state that
 *                 will be circulated back by Assistant.
 *
 * @return A response is sent to Assistant to ask for the user's permission; for any
 *         invalid input, we return null.
 * @actionssdk
 * @apiai
 */
Assistant.prototype.askForPermissions = function (
    context, permissions, dialogState) {
  debug('askForPermissions: context=%s, permissions=%s, dialogState=%s',
    context, permissions, JSON.stringify(dialogState));
  let self = this;
  if (!context || context === '') {
    self.handleError_('Assistant context can NOT be empty.');
    return null;
  }
  if (!permissions || permissions.length === 0) {
    self.handleError_('At least one permission needed.');
    return null;
  }
  for (let i = 0; i < permissions.length; i++) {
    let permission = permissions[i];
    if (permission !== self.SupportedPermissions.NAME &&
      permission !== self.SupportedPermissions.DEVICE_PRECISE_LOCATION &&
      permission !== self.SupportedPermissions.DEVICE_COARSE_LOCATION) {
      self.handleError_('Assistant permission must be one of ' +
        '[NAME, DEVICE_PRECISE_LOCATION, DEVICE_COARSE_LOCATION]');
      return null;
    }
  }
  if (!dialogState) {
    dialogState = {
      'state': (self.state instanceof State ? self.state.getName() : self.state),
      'data': self.data
    };
  }
  return self.fulfillPermissionsRequest_({
    opt_context: context,
    permissions: permissions
  }, dialogState);
};

/**
 * Asks the Assistant to guide the user to grant a permission. For example,
 * if you want your action to get access to the user's name, you would invoke
 * the askForPermission method with a context containing the reason for the request,
 * and the assistant.SupportedPermissions.NAME permission. With this, the Assistant will ask
 * the user, in your agent's voice, the following: '[Context with reason for the request],
 * I'll just need to get your name from Google, is that OK?'.
 *
 * Once the user accepts or denies the request, the Assistant will fire another intent:
 * assistant.intent.action.PERMISSION with a boolean argument: assistant.BuiltInArgNames.PERMISSION_GRANTED
 * and, if granted, the information that you requested.
 *
 * Read more:
 *
 * * {@link https://developers.google.com/actions/reference/conversation#ExpectedIntent|Supported Permissions}
 * * Check if the permission has been granted with {@link ActionsSdkAssistant#isPermissionGranted}
 * * {@link ActionsSdkAssistant#getDeviceLocation}
 * * {@link Assistant#getUserName}
 *
 * @example
 * const assistant = new ApiAiAssistant({request: req, response: res});
 * const REQUEST_PERMISSION_ACTION = 'request_permission';
 * const GET_RIDE_ACTION = 'get_ride';
 *
 * function requestPermission (assistant) {
 *   let permission = assistant.SupportedPermissions.NAME;
 *   assistant.askForPermission('To pick you up', permission);
 * }
 *
 * function sendRide (assistant) {
 *   if (assistant.isPermissionGranted()) {
 *     let displayName = assistant.getUserName().displayName;
 *     assistant.tell('I will tell your driver to pick up ' + displayName);
 *   } else {
 *     // Response shows that user did not grant permission
 *     assistant.tell('Sorry, I could not figure out who to pick up.');
 *   }
 * }
 * let actionMap = new Map();
 * actionMap.set(REQUEST_PERMISSION_ACTION, requestPermission);
 * actionMap.set(GET_RIDE_ACTION, sendRide);
 * assistant.handleRequest(actionMap);
 *
 * @param {string} context Context why permission is asked; it's the TTS
 *                 prompt prefix (action phrase) we ask the user.
 * @param {string} permission One of the permissions Assistant supports, each of
 *                 which comes from Assistant.SupportedPermissions.
 * @param {Object=} dialogState JSON object the action uses to hold dialog state that
 *                 will be circulated back by Assistant.
 *
 * @return A response is sent to the Assistant to ask for the user's permission;
 *         for any invalid input, we return null.
 * @actionssdk
 * @apiai
 */
Assistant.prototype.askForPermission = function (
  context, permission, dialogState) {
  debug('askForPermission: context=%s, permission=%s, dialogState=%s',
    context, permission, JSON.stringify(dialogState));
  return this.askForPermissions(context, [permission], dialogState);
};

/**
 * User's permissioned name info.
 * @typedef {Object} UserName
 * @property {string} displayName - user display name
 * @property {string} givenName - user given name
 * @property {string} familyName - user family name
 */

/**
 * User's permissioned device location.
 * @typedef {Object} DeviceLocation
 * @property {Object} coordinates - {latitude, longitude}. Requested with
 *                                  SupportedPermissions.DEVICE_PRECISE_LOCATION
 * @property {string} address - Full, formatted street address. Requested with
 *                              SupportedPermissions.DEVICE_PRECISE_LOCATION.
 * @property {string} zipCode - Zip code. Requested with
 *                              SupportedPermissions.DEVICE_COARSE_LOCATION.
 * @property {string} city - Device city. Requested with
 *                           SupportedPermissions.DEVICE_COARSE_LOCATION
 */

/**
 * If granted permission to user's name in previous intent, returns user's
 * display name, family name, and given name. If name info is unavailable,
 * returns null.
 *
 * @example
 * const assistant = new ApiAiAssistant({request: req, response: res});
 * const REQUEST_PERMISSION_ACTION = 'request_permission';
 * const SAY_NAME_ACTION = 'get_name';
 *
 * function requestPermission (assistant) {
 *   let permission = assistant.SupportedPermissions.NAME;
 *   assistant.askForPermission('To know who you are', permission);
 * }
 *
 * function sayName (assistant) {
 *   if (assistant.isPermissionGranted()) {
 *     assistant.tell('Your name is ' + assistant.getUserName().displayName));
 *   } else {
 *     // Response shows that user did not grant permission
 *     assistant.tell('Sorry, I could not get your name.');
 *   }
 * }
 * let actionMap = new Map();
 * actionMap.set(REQUEST_PERMISSION_ACTION, requestPermission);
 * actionMap.set(SAY_NAME_ACTION, sayName);
 * assistant.handleRequest(actionMap);
 *
 * @return {Object} Container for user's display name, first name, given name:
 *                  {displayName, givenName, familyName}. Null if name
 *                  permission is not granted.
 * @actionssdk
 * @apiai
 */
Assistant.prototype.getUserName = function () {
  debug('getUserName');
  let self = this;
  if (!self.getUser().profile) {
    return null;
  }
  let userName = {
    displayName: self.getUser().profile.display_name,
    givenName: self.getUser().profile.given_name,
    familyName: self.getUser().profile.family_name
  };
  return userName;
};

// ---------------------------------------------------------------------------
//                   Private Helpers
// ---------------------------------------------------------------------------

/**
 * Utility function to invoke an intent handler.
 *
 * @param {Object} handler The handler for the request.
 * @param {string} intent The intent to handle.
 * @return {boolean} true if the handler was invoked.
 * @private
 */
Assistant.prototype.invokeIntentHandler_ = function (handler, intent) {
  debug('invokeIntentHandler_: handler=%s, intent=%s', handler, intent);
  let self = this;
  self.lastErrorMessage_ = null;
  // map of intents or states
  for (let key of handler.keys()) {
    let value = handler.get(key);
    let name;
    if (key instanceof Intent) {
      debug('key is intent');
      name = key.getName();
    } else if (key instanceof State) {
      debug('key is state');
      name = key.getName();
    } else {
      debug('key is id');
      // String id
      name = key;
    }
    debug('name=' + name);
    if (value instanceof Map) {
      debug('state=' + (self.state instanceof State ? self.state.getName() : self.state));
      // map of states
      if (!self.state && name === null) {
        debug('undefined state');
        return self.invokeIntentHandler_(value, intent);
      } else if (self.state instanceof State && name === self.state.getName()) {
        return self.invokeIntentHandler_(value, intent);
      } else if (name === self.state) {
        return self.invokeIntentHandler_(value, intent);
      }
    }
    // else map of intents
    if (name === intent) {
      debug('map of intents');
      let promise = value(self);
      if (promise instanceof Promise) {
        promise.then(
          function (result) {
            // No-op
          })
        .catch(
          function (reason) {
            error(reason.message);
            self.handleError_('intent handler failed: %s', reason.message);
            self.lastErrorMessage_ = reason.message;
            return false;
          });
      } else {
        // Handle functions
        return true;
      }
      return true;
    }
  }
  self.handleError_('no matching intent handler');
  return false;
};

/**
 * Utility function to detect SSML markup.
 *
 * @param {string} text The text to be checked.
 * @return {boolean} true if text is SSML markup.
 * @private
 */
Assistant.prototype.isSsml_ = function (text) {
  debug('isSsml_: text=%s', text);
  let self = this;
  if (!text) {
    self.handleError_('Missing text');
    return false;
  }
  return /^<speak\b[^>]*>(.*?)<\/speak>$/gi.test(text);
};

/**
 * Utility function to handle error messages.
 *
 * @param {string} text The error message.
 * @private
 */
Assistant.prototype.handleError_ = function (text) {
  debug('handleError_: text=%s', text);
  let self = this;
  if (!text) {
    error('Missing text');
    return;
  }
  // Log error
  error.apply(text, Array.prototype.slice.call(arguments, 1));
  // Tell assistant to say error
  if (self.responded_) {
    return;
  }
  if (self.response_) {
    // Don't call other methods; just do directly
    self.response_.status(RESPONSE_CODE_BAD_REQUEST).send(API_ERROR_MESSAGE_PREFIX + text);
    self.responded_ = true;
  }
};

/**
 * Utility method to send an HTTP response.
 *
 * @param {string} response The JSON response.
 * @param {string} respnseCode The HTTP response code.
 * @return {object} HTTP response.
 * @private
 */
Assistant.prototype.doResponse_ = function (response, responseCode) {
  debug('doResponse_: response=%s, responseCode=%d', JSON.stringify(response), responseCode);
  let self = this;
  if (self.responded_) {
    return;
  }
  if (!response) {
    self.handleError_('Invalid response');
    return null;
  }
  let code = RESPONSE_CODE_OK;
  if (responseCode) {
    code = responseCode;
  }
  if (self.apiVersion_ !== null) {
    self.response_.append(CONVERSATION_API_VERSION_HEADER, self.apiVersion_);
  }
  self.response_.append(HTTP_CONTENT_TYPE_HEADER, HTTP_CONTENT_TYPE_JSON);
  debug('Response %s', JSON.stringify(response));
  let httpResponse = self.response_.status(code).send(response);
  self.responded_ = true;
  return httpResponse;
};

/**
 * Extract session data from the incoming JSON request.
 *
 * Used in subclasses for Actions SDK and API.AI.
 * @private
 */
Assistant.prototype.extractData_ = function () {
  debug('extractData_');
  this.data = {};
};

/**
 * Uses a PermissionsValueSpec object to construct and send a
 * permissions request to user.
 *
 * Used in subclasses for Actions SDK and API.AI.
 * @return {Object} HTTP response.
 * @private
 */
Assistant.prototype.fulfillPermissionsRequest_ = function () {
  debug('fulfillPermissionsRequest_');
  return {};
};

/**
 * Helper to build prompts from SSML's.
 *
 * @param {array} ssmls Array of ssml.
 * @return {array} Array of SpeechResponse objects.
 * @private
 */
Assistant.prototype.buildPromptsFromSsmlHelper_ = function (ssmls) {
  debug('buildPromptsFromSsmlHelper_: ssmls=%s', ssmls);
  let prompts = [];
  for (let i = 0; i < ssmls.length; i++) {
    let prompt = {
      ssml: ssmls[i]
    };
    prompts.push(prompt);
  }
  return prompts;
};

/**
 * Helper to build prompts from plain texts.
 *
 * @param {array} plainTexts Array of plain text to speech.
 * @return {array} Array of SpeechResponse objects.
 * @private
 */
Assistant.prototype.buildPromptsFromPlainTextHelper_ = function (plainTexts) {
  debug('buildPromptsFromPlainTextHelper_: plainTexts=%s', plainTexts);
  let prompts = [];
  for (let i = 0; i < plainTexts.length; i++) {
    let prompt = {
      text_to_speech: plainTexts[i]
    };
    prompts.push(prompt);
  }
  return prompts;
};

/**
 * Utility class for representing intents by name.
 *
 * @private
 */
let Intent = function (name) {
  this.name_ = name;
};

Intent.prototype.getName = function () {
  return this.name_;
};

/**
 * Utility class for representing states by name.
 *
 * @private
 */
let State = function (name) {
  this.name_ = name;
};

State.prototype.getName = function () {
  return this.name_;
};

// ---------------------------------------------------------------------------
//                   Actions SDK support
// ---------------------------------------------------------------------------

/**
 * Constructor for ActionsSdkAssistant object. To be used in the Actions SDK
 * HTTP endpoint logic.
 *
 * @example
 * let ActionsSdkAssistant = require('actions-on-google').ActionsSdkAssistant;
 * const assistant = new ActionsSdkAssistant({request: request, response: response,
 *   sessionStarted:sessionStarted});
 *
 * @param {Object} options JSON configuration: {request [Express HTTP request object],
                   response [Express HTTP response object], sessionStarted [function]}
 * @constructor
 * @actionssdk
 */
function ActionsSdkAssistant (options) {
  debug('ActionsSdkAssistant constructor');
  let self = this;
  Assistant.call(self, options);
}

// Inherit the Asssistant methods and properties
ActionsSdkAssistant.prototype = new Assistant();

/*
 * Gets the request Conversation API version.
 *
 * @example
 * const assistant = new ActionsSdkAssistant({request: request, response: response});
 * let apiVersion = assistant.getApiVersion();
 *
 * @return {string} Version value or null if no value.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.getApiVersion = function () {
  debug('getApiVersion');
  return this.apiVersion_;
};

/**
 * Gets the user's raw input query.
 *
 * @example
 * const assistant = new ActionsSdkAssistant({request: request, response: response});
 * assistant.tell('You said ' + assistant.getRawInput());
 *
 * @return {string} User's raw query or null if no value.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.getRawInput = function () {
  debug('getRawInput');
  let self = this;
  let input = self.getTopInput_();
  if (!input) {
    self.handleError_('Failed to get top Input.');
    return null;
  }
  if (!input.raw_inputs || input.raw_inputs.length === 0) {
    self.handleError_('Missing user raw input');
    return null;
  }
  let rawInput = input.raw_inputs[0];
  if (!rawInput.query) {
    self.handleError_('Missing query for user raw input');
    return null;
  }
  return rawInput.query;
};

/**
 * Gets previous JSON dialog state that the action sent to Assistant.
 * Alternatively, use the assistant.data field to store JSON values between requests.
 *
 * @example
 * const assistant = new ActionsSdkAssistant({request: request, response: response});
 * let dialogState = assistant.getDialogState();
 *
 * @return {Object} JSON object provided to the Assistant in the previous
 *                  user turn or {} if no value.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.getDialogState = function () {
  debug('getDialogState');
  let self = this;
  if (self.body_.conversation &&
      self.body_.conversation.conversation_token) {
    return JSON.parse(self.body_.conversation.conversation_token);
  }
  return {};
};

/**
 * Gets the {@link https://developers.google.com/actions/reference/conversation#User|User object}.
 * The user object contains information about the user, including
 * a string identifier and personal information (requires requesting permissions,
 * see {@link Assistant#askForPermissions}).
 *
 * @example
 * const assistant = new ActionsSdkAssistant({request: request, response: response});
 * let userId = assistant.getUser().user_id;
 *
 * @return {Object} {@link https://developers.google.com/actions/reference/conversation#User|User info}
 *                  or null if no value.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.getUser = function () {
  debug('getUser');
  let self = this;
  if (!self.body_.user) {
    self.handleError_('No user object');
    return null;
  }
  return self.body_.user;
};

/**
 * If granted permission to device's location in previous intent, returns device's
 * location (see {@link Assistant#askForPermissions}). If device info is unavailable,
 * returns null.
 *
 * @example
 * const assistant = new ActionsSdkAssistant({request: req, response: res});
 * assistant.askForPermission("To get you a ride",
 *   assistant.SupportedPermissions.DEVICE_PRECISE_LOCATION);
 * // ...
 * // In response handler for subsequent intent:
 * if (assistant.isPermissionGranted()) {
 *   sendCarTo(assistant.getDeviceLocation().coordinates);
 * }
 *
 * @return {Object} Container for device's location data:
 *                  {coordinates, address, zipCode, city}.
 *                  Null if location permission is not granted.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.getDeviceLocation = function () {
  debug('getDeviceLocation');
  let self = this;
  if (!self.body_.device || !self.body_.device.location) {
    return null;
  }
  let deviceLocation = {
    coordinates: self.body_.device.location.coordinates,
    address: self.body_.device.location.formatted_address,
    zipCode: self.body_.device.location.zip_code,
    city: self.body_.device.location.city
  };
  return deviceLocation;
};

/**
 * Returns true if the request follows a previous request asking for
 * permission from the user and the user granted the permission(s). Otherwise,
 * false. Use with {@link Assistant#askForPermissions}.
 *
 * @example
 * const assistant = new ActionsSdkAssistant({request: request, response: response});
 * assistant.askForPermissions("To get you a ride", [
 *   assistant.SupportedPermissions.NAME,
 *   assistant.SupportedPermissions.DEVICE_PRECISE_LOCATION
 * ]);
 * // ...
 * // In response handler for subsequent intent:
 * if (assistant.isPermissionGranted()) {
 *  // Use the requested permission(s) to get the user a ride
 * }
 *
 * @return {boolean} true if permissions granted.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.isPermissionGranted = function () {
  debug('isPermissionGranted');
  let self = this;
  return self.getArgument(self.BuiltInArgNames.PERMISSION_GRANTED) === 'true';
};

/**
 * Gets the "versionLabel" specified inside the Action Package.
 * Used by actions to do version control.
 *
 * @example
 * const assistant = new ActionsSdkAssistant({request: request, response: response});
 * let actionVersionLabel = assistant.getActionVersionLabel();
 *
 * @return {string} The specified version label or null if unspecified.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.getActionVersionLabel = function () {
  debug('getActionVersionLabel');
  let self = this;
  let versionLabel = self.request_.get(CONVERSATION_API_AGENT_VERSION_HEADER);
  if (versionLabel) {
    return versionLabel;
  } else {
    return null;
  }
};

/**
 * Gets the unique conversation ID. It's a new ID for the initial query,
 * and stays the same until the end of the conversation.
 *
 * @example
 * const assistant = new ActionsSdkAssistant({request: request, response: response});
 * let conversationId = assistant.getConversationId();
 *
 * @return {string} Conversation ID or null if no value.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.getConversationId = function () {
  debug('getConversationId');
  let self = this;
  if (!self.body_.conversation || !self.body_.conversation.conversation_id) {
    self.handleError_('No conversation ID');
    return null;
  }
  return self.body_.conversation.conversation_id;
};

/**
 * Get the current intent. Alternatively, using a handler Map with {@link Assistant#handleRequest},
 * the client library will automatically handle the incoming intents.
 *
 * @example
 * const assistant = new ActionsSdkAssistant({request: request, response: response});
 *
 * function responseHandler (assistant) {
 *   let intent = assistant.getIntent();
 *   switch (intent) {
 *     case assistant.StandardIntents.MAIN:
 *       let inputPrompt = assistant.buildInputPrompt(false, 'Welcome to action snippets! Say anything.');
 *       assistant.ask(inputPrompt);
 *       break;
 *
 *     case assistant.StandardIntents.TEXT:
 *       assistant.tell('You said ' + assistant.getRawInput());
 *       break;
 *   }
 * }
 *
 * assistant.handleRequest(responseHandler);
 *
 * @return {string} Intent id or null if no value.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.getIntent = function () {
  debug('getIntent');
  let self = this;
  let input = self.getTopInput_();
  if (!input) {
    self.handleError_('Missing intent from request body');
    return null;
  }
  return input.intent;
};

/**
 * Get the argument value by name from the current intent.
 *
 * @param {string} argName Name of the argument.
 * @return {string} Argument value matching argName
 *                  or null if no matching argument.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.getArgument = function (argName) {
  debug('getArgument: argName=%s', argName);
  let self = this;
  if (!argName) {
    self.handleError_('Invalid argument name');
    return null;
  }
  let argument = self.getArgument_(argName);
  if (!argument) {
    self.handleError_('Missing argument');
    return null;
  }
  if (argument.text_value) {
    return argument.text_value;
  } else if (argument.raw_text) {
    return argument.raw_text;
  }
  debug('Failed to get argument value: %s', argName);
  return null;
};

/**
 * Asks Assistant to collect user's input; all user's queries need to be sent to
 * the action.
 *
 * @example
 * const assistant = new ActionsSdkAssistant({request: request, response: response});
 *
 * function mainIntent (assistant) {
 *   let inputPrompt = assistant.buildInputPrompt(true, '<speak>Hi! <break time="1"/> ' +
 *         'I can read out an ordinal like ' +
 *         '<say-as interpret-as="ordinal">123</say-as>. Say a number.</speak>',
 *         ['I didn\'t hear a number', 'If you\'re still there, what\'s the number?', 'What is the number?']);
 *   assistant.ask(inputPrompt);
 * }
 *
 * function rawInput (assistant) {
 *   if (assistant.getRawInput() === 'bye') {
 *     assistant.tell('Goodbye!');
 *   } else {
 *     let inputPrompt = assistant.buildInputPrompt(true, '<speak>You said, <say-as interpret-as="ordinal">' +
 *       assistant.getRawInput() + '</say-as></speak>',
 *         ['I didn\'t hear a number', 'If you\'re still there, what\'s the number?', 'What is the number?']);
 *     assistant.ask(inputPrompt);
 *   }
 * }
 *
 * let actionMap = new Map();
 * actionMap.set(assistant.StandardIntents.MAIN, mainIntent);
 * actionMap.set(assistant.StandardIntents.TEXT, rawInput);
 *
 * assistant.handleRequest(actionMap);
 *
 * @param {Object} inputPrompt Holding initial and no-input prompts.
 * @param {Object} dialogState JSON object the action uses to hold dialog state that
 *                 will be circulated back by Assistant.
 * @return The response that is sent to Assistant to ask user to provide input.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.ask = function (inputPrompt, dialogState) {
  debug('ask: inputPrompt=%s, dialogState=%s',
    JSON.stringify(inputPrompt), JSON.stringify(dialogState));
  let self = this;
  if (!inputPrompt) {
    self.handleError_('Invalid input prompt');
    return null;
  }
  if (typeof inputPrompt === 'string') {
    inputPrompt = self.buildInputPrompt(self.isSsml_(inputPrompt), inputPrompt);
  }
  if (!dialogState) {
    dialogState = {
      'state': (self.state instanceof State ? self.state.getName() : self.state),
      'data': self.data
    };
  } else if (Array.isArray(dialogState)) {
    self.handleError_('Invalid dialog state');
    return null;
  }
  let expectedIntent = self.buildExpectedIntent_(self.StandardIntents.TEXT, []);
  return self.buildAskHelper_(inputPrompt, [expectedIntent], dialogState);
};

/**
 * Tells Assistant to render the speech response and close the mic.
 *
 * @example
 * const assistant = new ActionsSdkAssistant({request: request, response: response});
 *
 * function mainIntent (assistant) {
 *   let inputPrompt = assistant.buildInputPrompt(true, '<speak>Hi! <break time="1"/> ' +
 *         'I can read out an ordinal like ' +
 *         '<say-as interpret-as="ordinal">123</say-as>. Say a number.</speak>',
 *         ['I didn\'t hear a number', 'If you\'re still there, what\'s the number?', 'What is the number?']);
 *   assistant.ask(inputPrompt);
 * }
 *
 * function rawInput (assistant) {
 *   if (assistant.getRawInput() === 'bye') {
 *     assistant.tell('Goodbye!');
 *   } else {
 *     let inputPrompt = assistant.buildInputPrompt(true, '<speak>You said, <say-as interpret-as="ordinal">' +
 *       assistant.getRawInput() + '</say-as></speak>',
 *         ['I didn\'t hear a number', 'If you\'re still there, what\'s the number?', 'What is the number?']);
 *     assistant.ask(inputPrompt);
 *   }
 * }
 *
 * let actionMap = new Map();
 * actionMap.set(assistant.StandardIntents.MAIN, mainIntent);
 * actionMap.set(assistant.StandardIntents.TEXT, rawInput);
 *
 * assistant.handleRequest(actionMap);
 *
 * @param {string} textToSpeech Final spoken response. Spoken response can be SSML.
 * @return The HTTP response that is sent back to Assistant.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.tell = function (textToSpeech) {
  debug('tell: textToSpeech=%s', textToSpeech);
  let self = this;
  if (!textToSpeech) {
    self.handleError_('Invalid speech response');
    return null;
  }
  let finalResponse = {};
  if (self.isSsml_(textToSpeech)) {
    finalResponse.speech_response = {
      ssml: textToSpeech
    };
  } else {
    finalResponse.speech_response = {
      text_to_speech: textToSpeech
    };
  }
  let response = self.buildResponseHelper_(
    null, false, null, finalResponse);
  return self.doResponse_(response, RESPONSE_CODE_OK);
};

/**
 * Builds the {@link https://developers.google.com/actions/reference/conversation#InputPrompt|InputPrompt object}
 * from initial prompt and no-input prompts.
 *
 * The Assistant needs one initial prompt to start the conversation. If there is no user response,
 * the Assistant re-opens the mic and renders the no-input prompts three times
 * (one for each no-input prompt that was configured) to help the user
 * provide the right response.
 *
 * Note: we highly recommend action to provide all the prompts required here in order to ensure a
 * good user experience.
 *
 * @example
 * let inputPrompt = assistant.buildInputPrompt(false, 'Welcome to action snippets! Say a number.',
 *     ['Say any number', 'Pick a number', 'What is the number?']);
 * assistant.ask(inputPrompt);
 *
 * @param {boolean} isSsml Indicates whether the text to speech is SSML or not.
 * @param {string} initialPrompt The initial prompt the Assistant asks the user.
 * @param {array} noInputs Array of re-prompts when the user does not respond (max 3).
 * @return {Object} An {@link https://developers.google.com/actions/reference/conversation#InputPrompt|InputPrompt object}.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.buildInputPrompt = function (isSsml, initialPrompt, noInputs) {
  debug('buildInputPrompt: isSsml=%s, initialPrompt=%s, noInputs=%s',
    isSsml, initialPrompt, noInputs);
  let self = this;
  let initials = [];

  if (noInputs) {
    if (noInputs.length > INPUTS_MAX) {
      self.handleError_('Invalid number of no inputs');
      return null;
    }
  } else {
    noInputs = [];
  }

  self.maybeAddItemToArray_(initialPrompt, initials);
  if (isSsml) {
    return {
      initial_prompts: self.buildPromptsFromSsmlHelper_(initials),
      no_input_prompts: self.buildPromptsFromSsmlHelper_(noInputs)
    };
  } else {
    return {
      initial_prompts: self.buildPromptsFromPlainTextHelper_(initials),
      no_input_prompts: self.buildPromptsFromPlainTextHelper_(noInputs)
    };
  }
};

// ---------------------------------------------------------------------------
//                   Private Helpers
// ---------------------------------------------------------------------------

/**
 * Get the top most Input object.
 *
 * @return {object} Input object.
 * @private
 * @actionssdk
 */
ActionsSdkAssistant.prototype.getTopInput_ = function () {
  debug('getTopInput_');
  let self = this;
  if (!self.body_.inputs || self.body_.inputs.length === 0) {
    self.handleError_('Missing inputs from request body');
    return null;
  }
  return self.body_.inputs[0];
};

/**
 * Builds the response to send back to Assistant.
 *
 * @param {string} conversationToken The dialog state.
 * @param {boolean} expectUserResponse The expected user response.
 * @param {object} expectedInput The expected response.
 * @param {boolean} finalResponse The final response.
 * @return {object} Final response returned to server.
 * @private
 * @actionssdk
 */
ActionsSdkAssistant.prototype.buildResponseHelper_ = function (conversationToken,
    expectUserResponse, expectedInput, finalResponse) {
  debug('buildResponseHelper_: conversationToken=%s, expectUserResponse=%s, ' +
    'expectedInput=%s, finalResponse=%s',
    conversationToken, expectUserResponse, JSON.stringify(expectedInput),
    JSON.stringify(finalResponse));
  let response = {};
  if (conversationToken) {
    response.conversation_token = conversationToken;
  }
  response.expect_user_response = expectUserResponse;
  if (expectedInput) {
    response.expected_inputs = expectedInput;
  }
  if (!expectUserResponse && finalResponse) {
    response.final_response = finalResponse;
  }
  return response;
};

/**
 * Helper to add item to an array.
 *
 * @private
 * @actionssdk
 */
ActionsSdkAssistant.prototype.maybeAddItemToArray_ = function (item, array) {
  debug('maybeAddItemToArray_: item=%s, array=%s', item, array);
  let self = this;
  if (!array) {
    self.handleError_('Invalid array');
    return;
  }
  if (!item) {
    // ignore add
    return;
  }
  array.push(item);
};

/**
 * Get the argument by name from the current action.
 *
 * @param {string} argName Name of the argument.
 * @return {object} Argument value matching argName
                    or null if no matching argument.
 * @private
 * @actionssdk
 */
ActionsSdkAssistant.prototype.getArgument_ = function (argName) {
  debug('getArgument_: argName=%s', argName);
  let self = this;
  if (!argName) {
    self.handleError_('Invalid argument name');
    return null;
  }
  let input = self.getTopInput_();
  if (!input) {
    self.handleError_('Missing action');
    return null;
  }
  for (let i = 0; i < input.arguments.length; i++) {
    if (input.arguments[i].name === argName) {
      return input.arguments[i];
    }
  }
  debug('Failed to find argument: %s', argName);
  return null;
};

/**
 * Extract session data from the incoming JSON request.
 *
 * @private
 * @actionssdk
 */
ActionsSdkAssistant.prototype.extractData_ = function () {
  debug('extractData_');
  let self = this;
  if (self.body_.conversation &&
    self.body_.conversation.conversation_token) {
    let json = JSON.parse(self.body_.conversation.conversation_token);
    self.data = json.data;
    self.state = json.state;
  } else {
    self.data = {};
  }
};

/**
 * Uses a PermissionsValueSpec object to construct and send a
 * permissions request to user.
 *
 * @param {object} permissionsSpec PermissionsValueSpec object containing
 *                 the permissions prefix and the permissions requested.
 * @param {Object} dialogState JSON object the action uses to hold dialog state that
 *                 will be circulated back by Assistant.
 * @return {Object} HTTP response object.
 * @private
 * @actionssdk
 */
ActionsSdkAssistant.prototype.fulfillPermissionsRequest_ = function (
    permissionsSpec, dialogState) {
  debug('fulfillPermissionsRequest_: permissionsSpec=%s, dialogState=%s',
    JSON.stringify(permissionsSpec), JSON.stringify(dialogState));
  let self = this;
  // Build an Expected Intent object.
  let expectedIntent = {
    intent: self.StandardIntents.PERMISSION,
    input_value_spec: {
      permission_value_spec: permissionsSpec
    }
  };
  // Send an Ask request to Assistant.
  let inputPrompt = self.buildInputPrompt(false, 'PLACEHOLDER_FOR_PERMISSION');
  if (!dialogState) {
    dialogState = {
      'state': (self.state instanceof State ? self.state.getName() : self.state),
      'data': self.data
    };
  }
  return self.buildAskHelper_(inputPrompt, [expectedIntent], dialogState);
};

/**
 * Builds the ask response to send back to Assistant.
 *
 * @param {Object} inputPrompt Holding initial and no-input prompts.
 * @param {array} possibleIntents Array of ExpectedIntents.
 * @param {Object} dialogState JSON object the action uses to hold dialog state that
 *                 will be circulated back by Assistant.
 * @return The response that is sent to Assistant to ask user to provide input.
 * @private
 * @actionssdk
 */
ActionsSdkAssistant.prototype.buildAskHelper_ = function (inputPrompt, possibleIntents, dialogState) {
  debug('buildAskHelper_: inputPrompt=%s, possibleIntents=%s,  dialogState=%s',
    inputPrompt, possibleIntents, JSON.stringify(dialogState));
  let self = this;
  if (!inputPrompt) {
    self.handleError_('Invalid input prompt');
    return null;
  }
  if (typeof inputPrompt === 'string') {
    inputPrompt = self.buildInputPrompt(self.isSsml_(inputPrompt), inputPrompt);
  }
  if (!dialogState) {
    dialogState = {
      'state': (self.state instanceof State ? self.state.getName() : self.state),
      'data': self.data
    };
  }
  let expectedInputs = [{
    input_prompt: inputPrompt,
    possible_intents: possibleIntents
  }];
  let response = self.buildResponseHelper_(
    JSON.stringify(dialogState),
    true, // expected_user_response
    expectedInputs,
    null // final_response is null b/c dialog is active
  );
  return self.doResponse_(response, RESPONSE_CODE_OK);
};

/**
 * Builds an ExpectedIntent object. Refer to {@link ActionsSdkAssistant#newRuntimeEntity} to create the list
 * of runtime entities required by this method. Runtime entities need to be defined in
 * the Action Package.
 *
 * @param {string} intent Developer specified in-dialog intent inside the Action
 *                 Package or an Assistant built-in intent like
 *                 'assistant.intent.action.TEXT'.
 *
 * @return {Object} An {@link https://developers.google.com/actions/reference/conversation#ExpectedIntent|ExpectedIntent object}
                    encapsulating the intent and the runtime entities.
 * @private
 * @actionssdk
 */
ActionsSdkAssistant.prototype.buildExpectedIntent_ = function (intent) {
  debug('buildExpectedIntent_: intent=%s', intent);
  let self = this;
  if (!intent || intent === '') {
    self.handleError_('Invalid intent');
    return null;
  }
  let expectedIntent = {
    intent: intent
  };
  return expectedIntent;
};

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

module.exports = {
  ActionsSdkAssistant,
  ApiAiAssistant
};
