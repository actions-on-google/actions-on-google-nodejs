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
const API_ERROR_MESSAGE_PREFIX = 'API Error: ';
const CONVERSATION_API_VERSION_HEADER = 'Google-Assistant-API-Version';
const CONVERSATION_API_SIGNATURE_HEADER = 'Google-Assistant-Signature';
const CONVERSATION_API_AGENT_VERSION_HEADER = 'Agent-Version-Label';
const RESPONSE_CODE_OK = 200;
const RESPONSE_CODE_BAD_REQUEST = 400;
const ACTIONS_API_AI_CONTEXT = '_actions_on_google_';
const SSML_SPEAK_START = '<speak>';
const SSML_SPEAK_END = '</speak>';
const MAX_LIFESPAN = 100;
const HTTP_CONTENT_TYPE_HEADER = 'Content-Type';
const HTTP_CONTENT_TYPE_JSON = 'application/json';

// Configure logging for hosting platforms that only support console.log and console.error
debug.log = console.log.bind(console);
error.log = console.error.bind(console);

/**
 * Constructor for Assistant object.
 * Should not be instantiated; rather use {@link ActionsSdkAssistant} or {@link ApiAiAssistant}.
 *
 * @param {Object} options JSON configuration: {request, response, sessionStarted}
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
   * The HTTP request that the endpoint receives from the Assistant.
   * @private {object}
   */
  self.request_ = options.request;

  /**
   * The HTTP response the endpoint will return to Assistant.
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
   * The API.ai context.
   * @public {object}
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
 */
Assistant.prototype.StandardIntents = {
  // Assistant fires MAIN intent for queries like [talk to $action].
  MAIN: 'assistant.intent.action.MAIN',
  // Assistant fires TEXT intent when action issues ask intent.
  TEXT: 'assistant.intent.action.TEXT',
  // Assistant fires PERMISSION intent when action invokes askForPermission.
  PERMISSION: 'assistant.intent.action.PERMISSION',
  // Assistant asks user to sign-in to ensure Assistant has a linked 3P service.
  SIGN_IN: 'assistant.intent.action.SIGN_IN'
};

/**
 * List of supported permissions the Assistant supports.
 */
Assistant.prototype.SupportedPermissions = {
  NAME: 'NAME',
  PRECISE_LOCATION: 'DEVICE_PRECISE_LOCATION',
  COARSE_LOCATION: 'DEVICE_COARSE_LOCATION'
};

/**
 * List of built-in argument names.
 */
Assistant.prototype.BuiltInArgNames = {
  PERMISSION_GRANTED: 'permission_granted'
};

/**
 * Handles the incoming Assistant request using a handler or map of handlers.
 *
 * @example
 * // Actions SDK
 * const assistant = new ActionsSdkAssistant({request: request, response: response});
 * const RAW_INTENT = 'raw.input';
 *
 * function mainIntent (assistant) {
 *   let inputPrompt = assistant.buildInputPrompt(false, 'Welcome to action snippets! Say anything.');
 *   let expectedIntent = assistant.buildExpectedIntent(RAW_INTENT);
 *   assistant.ask(inputPrompt, [expectedIntent]);
 * }
 *
 * function rawInputIntent (assistant) {
 *   assistant.tell('You said ' + assistant.getRawInput());
 * }
 *
 * let actionMap = new Map();
 * actionMap.set(assistant.StandardIntents.MAIN, mainIntent);
 * actionMap.set(RAW_INTENT, rawInputIntent);
 *
 * // API.ai
 * const assistant = new Assistant({request: req, response: res});
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
 */
Assistant.prototype.handleRequest = function (handler) {
  debug('handleRequest: handler=%s', handler);
  let self = this;
  if (!handler) {
    self.handleError_('invalid request handler');
    return;
  }
  self.data = self.extractData_();
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
 * Asks the Assistant to guide the user to grant the permissions, e.g., when action wants
 * to access the user's personal info, action invokes askForPermissions method,
 * the Assistant will ask the user '<ActionPhrase>, I'll just need to get your '
 * 'first name, last name, email and current location, is that OK?', once user
 * says 'Yes' or 'No', the Assistant will fire another intent:
 * assistant.intent.action.PERMISSION with a bool arg: 'permission_granted'. If
 * permission_granted is true, the action can inspect request.user_info for details,
 * otherwise the action needs to change the way it asks the user to continue the dialog.
 *
 * @example
 * const assistant = new ApiAiAssistant({request: req, response: res});
 * const REQUEST_PERMISSION_ACTION = 'request_permission';
 * const READ_MIND_ACTION = 'read_mind';
 *
 * function requestPermission (assistant) {
 *   return new Promise(function (resolve, reject) {
 *     let userId = assistant.getUser().user_id;
 *     firebaseAdmin.database().ref('users/' + userId)
 *       .once('value', function (data) {
 *         if (data && data.val()) {
 *           resolve(assistant.tell(sayName(data.val().name)));
 *         } else {
 *           let permission = assistant.SupportedPermissions.NAME;
 *           resolve(assistant.askForPermissions('To read your mind', [permission]));
 *         }
 *       });
 *   });
 * }
 *
 * function readMind (assistant) {
 *   for (let input of req.body.originalRequest.data.inputs) {
 *     if (input.arguments) {
 *       for (let argument of input.arguments) {
 *         if (argument.name === assistant.BuiltInArgNames.PERMISSION_GRANTED &&
 *           argument.text_value === 'true') {
 *           if (assistant.getUser() && assistant.getUser().profile) {
 *             let userId = assistant.getUser().user_id;
 *             let displayName = assistant.getUser().profile.display_name;
 *             // Save to Firebase
 *             firebaseAdmin.database().ref('users/' + userId).set({
 *               name: displayName
 *             });
 *             assistant.tell(sayName(displayName));
 *             return;
 *           }
 *         }
 *       }
 *     }
 *   }
 *   // Response shows that user did not grant permission
 *   assistant.tell('<speak>Wow! <break time="1s"/> this has never ' +
 *     'happened before. I can\'t read your mind. I need more practice. ' +
 *     'Ask me again later.</speak>');
 * }
 * let actionMap = new Map();
 * actionMap.set(REQUEST_PERMISSION_ACTION, requestPermission);
 * actionMap.set(READ_MIND_ACTION, readMind);
 * assistant.handleRequest(actionMap);
 *
 * @param {string} context Context why permission is asked; it's the TTS
 *                 prompt prefix (action phrase) we ask the user.
 * @param {Array} permissions List of permissions Assistant supports, each of
 *                which comes from Assistant.SupportedPermissions.
 * @param {Object=} dialogState JSON object the action uses to hold dialog state that
 *                 will be circulated back by Assistant, e.g., {magic: 10}.
 *
 * @return A response is sent to Assistant to ask for the user's permission, for any
 *         invalid input, we return null.
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
      permission !== self.SupportedPermissions.PRECISE_LOCATION &&
      permission !== self.SupportedPermissions.COARSE_LOCATION) {
      self.handleError_('Assistant permission must be one of ' +
        '[NAME, PRECISE_LOCATION, COARSE_LOCATION]');
      return null;
    }
  }
  return self.fulfillPermissionsRequest_({
    opt_context: context,
    permissions: permissions
  }, dialogState);
};

/**
 * Asks the Assistant to guide the user to grant a permission, e.g., when the action
 * wants to access the user's personal info, action invokes askForPermissions method,
 * Assistant will ask user '<ActionPhrase>, I'll just need to get your'
 * '<first name, last name, email OR current location>, is that OK?', once user
 * says 'Yes' or 'No', Assistant will fire another intent:
 * assistant.intent.action.PERMISSION with a bool arg: 'permission_granted'. If
 * permission_granted is true, the action can inspect request.user_info for details,
 * otherwise action needs to change the way it asks the user to continue the dialog.
 *
 * @example
 * const assistant = new ApiAiAssistant({request: req, response: res});
 * const REQUEST_PERMISSION_ACTION = 'request_permission';
 * const READ_MIND_ACTION = 'read_mind';
 *
 * function requestPermission (assistant) {
 *   return new Promise(function (resolve, reject) {
 *     let userId = assistant.getUser().user_id;
 *     firebaseAdmin.database().ref('users/' + userId)
 *       .once('value', function (data) {
 *         if (data && data.val()) {
 *           resolve(assistant.tell(sayName(data.val().name)));
 *         } else {
 *           let permission = assistant.SupportedPermissions.NAME;
 *           resolve(assistant.askForPermission('To read your mind', permission));
 *         }
 *       });
 *   });
 * }
 *
 * function readMind (assistant) {
 *   for (let input of req.body.originalRequest.data.inputs) {
 *     if (input.arguments) {
 *       for (let argument of input.arguments) {
 *         if (argument.name === assistant.BuiltInArgNames.PERMISSION_GRANTED &&
 *           argument.text_value === 'true') {
 *           if (assistant.getUser() && assistant.getUser().profile) {
 *             let userId = assistant.getUser().user_id;
 *             let displayName = assistant.getUser().profile.display_name;
 *             // Save to Firebase
 *             firebaseAdmin.database().ref('users/' + userId).set({
 *               name: displayName
 *             });
 *             assistant.tell(sayName(displayName));
 *             return;
 *           }
 *         }
 *       }
 *     }
 *   }
 *   // Response shows that user did not grant permission
 *   assistant.tell('<speak>Wow! <break time="1s"/> this has never ' +
 *     'happened before. I can\'t read your mind. I need more practice. ' +
 *     'Ask me again later.</speak>');
 * }
 * let actionMap = new Map();
 * actionMap.set(REQUEST_PERMISSION_ACTION, requestPermission);
 * actionMap.set(READ_MIND_ACTION, readMind);
 * assistant.handleRequest(actionMap);
 *
 * @param {string} context Context why permission is asked; it's the TTS
 *                 prompt prefix (action phrase) we ask the user.
 * @param {string} permission One of the permissions Assistant supports, each of
 *                 which comes from Assistant.SupportedPermissions.
 * @param {Object=} dialogState JSON object the action uses to hold dialog state that
 *                 will be circulated back by Assistant, e.g., {magic: 10}.
 *
 * @return A response is sent to the Assistant to ask for the user's permission,
 *         for any invalid input, we return null.
 */
Assistant.prototype.askForPermission = function (
    context, permission, dialogState) {
  debug('askForPermission: context=%s, permission=%s, dialogState=%s',
    context, permission, JSON.stringify(dialogState));
  return this.askForPermissions(context, [permission], dialogState);
};

// ---------------------------------------------------------------------------
//                   Private Helpers
// ---------------------------------------------------------------------------

/**
 * Utility function to invoke an intent handler.
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
 * @param {string} text The text to be checked.
 * @return {boolean} true if SSML markup.
 * @private
 */
Assistant.prototype.isSsml_ = function (text) {
  debug('isSsml_: text=%s', text);
  let self = this;
  if (!text) {
    self.handleError_('Missing text');
    return false;
  }
  text = text.trim().toLowerCase();
  if (text.startsWith(SSML_SPEAK_START) &&
      text.endsWith(SSML_SPEAK_END)) {
    return true;
  }
  return false;
};

/**
 * Utility function to handle error message.
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
 * @return {object} response.
 * @private
 */
Assistant.prototype.doResponse_ = function (response, responseCode) {
  debug('doResponse_');
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
 * Used in subclasses for Actions SDK and API.ai.
 * @return {Object} JSON data values.
 * @private
 */
Assistant.prototype.extractData_ = function () {
  debug('extractData_');
  return {};
};

/**
 * Uses a PermissionsValueSpec object to construct and send a
 * permissions request to user.
 * Used in subclasses for Actions SDK and API.ai.
 * @return {Object} HTTP response.
 * @private
 */
Assistant.prototype.fulfillPermissionsRequest_ = function () {
  debug('fulfillPermissionsRequest_');
  return {};
};

/**
 * Utility class for representing intents by name.
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
 * Constructor for ActionsSdkAssistant object.
 *
 * @example
 * let ActionsSdkAssistant = require('actions-on-google').ActionsSdkAssistant;
 * const assistant = new ActionsSdkAssistant({request: request, response: response,
 *   sessionStarted:sessionStarted});
 *
 * @param {Object} options JSON configuration: {request, response, sessionStarted}
 * @constructor
 * @actionssdk
 */
function ActionsSdkAssistant (options) {
  debug('ActionsSdkAssistant constructor');
  let self = this;
  Assistant.call(self, options);
}

ActionsSdkAssistant.prototype = new Assistant();

/*
 * Gets the request API version.
 *
 * @example
 * const assistant = new ActionsSdkAssistant({request: request, response: response});
 * let apiVersion = assistant.getApiVersion();
 *
 * @return {string} version value or null if no value.
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
 * @return {string} user's raw query or null if no value.
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
 * Gets previous dialog state that the action sent to Assistant, or null, e.g., {magic: 5}
 * Alternatively, use the assistant.data field to store JSON values between requests.
 *
 * @example
 * const assistant = new ActionsSdkAssistant({request: request, response: response});
 * let dialogState = assistant.getDialogState();
 *
 * @return {Object} JSON object provided to Google Assistant in previous
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
 * Gets the user object.
 *
 * @example
 * const assistant = new ActionsSdkAssistant({request: request, response: response});
 * let userId = assistant.getUser().user_id;
 *
 * @return {object} user info or null if no value.
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
 * Gets the "versionLabel" specified inside the Action Package, used by actions to do version control.
 *
 * @example
 * const assistant = new ActionsSdkAssistant({request: request, response: response});
 * let actionVersionLabel = assistant.getActionVersionLabel();
 *
 * @return {string} the specified version label or null if unspecified.
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
 * @return {string} conversation ID or null if no value.
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
 * Get the current intent. Alternatively, using a handler Map for handleRequest,
 * the client library will automatically handle the incoming intents.
 *
 * @example
 * const assistant = new ActionsSdkAssistant({request: request, response: response});
 * const RAW_INTENT = 'raw.input';
 *
 * function responseHandler (assistant) {
 *   let intent = assistant.getIntent();
 *   switch (intent) {
 *     case assistant.StandardIntents.MAIN:
 *       let inputPrompt = assistant.buildInputPrompt(false, 'Welcome to action snippets! Say anything.');
 *       let expectedIntent = assistant.buildExpectedIntent(RAW_INTENT);
 *       assistant.ask(inputPrompt, [expectedIntent]);
 *       break;
 *
 *     case RAW_INTENT:
 *       assistant.tell('You said ' + assistant.getRawInput());
 *       break;
 *   }
 * }
 *
 * assistant.handleRequest(responseHandler);
 *
 * @return {string} intent id or null if no value.
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
 * @example
 * const assistant = new ActionsSdkAssistant({request: request, response: response});
 *
 * function mainIntent (assistant) {
 *   let inputPrompt = assistant.buildInputPrompt(false, 'Welcome to action snippets! Say a number.',
 *     ['Sorry, say that again?', 'Sorry, that number again?', 'What was that number?'],
 *     ['Say any number', 'Pick a number', 'What is the number?']);
 *   let expectedIntent = assistant.buildExpectedIntent(PROVIDE_NUMBER_INTENT);
 *   assistant.ask(inputPrompt, [expectedIntent], ["$SchemaOrg_Number"], {started: true});
 * }
 *
 * function provideNumberIntent (assistant) {
 *   assistant.tell('You said ' + assistant.getArgument('number'));
 * }
 *
 * let actionMap = new Map();
 * actionMap.set(assistant.StandardIntents.MAIN, mainIntent);
 * actionMap.set(PROVIDE_NUMBER_INTENT, provideNumberIntent);
 *
 * assistant.handleRequest(actionMap);
 *
 * @param {string} argName Name of the argument.
 * @return {string} argument value or null if no value.
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
 * Asks Assistant to collect the user's input.
 *
 * @example
 * // Basic 'ask' usage
 * const assistant = new ActionsSdkAssistant({request: request, response: response});
 * const RAW_INTENT = 'raw.input';
 *
 * function mainIntent (assistant) {
 *   let inputPrompt = assistant.buildInputPrompt(false, 'Welcome to action snippets! Say anything.');
 *   let expectedIntent = assistant.buildExpectedIntent(RAW_INTENT);
 *   assistant.ask(inputPrompt, [expectedIntent]);
 * }
 *
 * function rawInputIntent (assistant) {
 *   assistant.tell('You said ' + assistant.getRawInput());
 * }
 *
 * let actionMap = new Map();
 * actionMap.set(assistant.StandardIntents.MAIN, mainIntent);
 * actionMap.set(RAW_INTENT, rawInputIntent);
 *
 * assistant.handleRequest(actionMap);
 *
 * // Advanced 'ask' usage
 * const assistant = new ActionsSdkAssistant({request: request, response: response});
 * const PROVIDE_NUMBER_INTENT = 'PROVIDE_NUMBER';
 *
 * function mainIntent (assistant) {
 *   let inputPrompt = assistant.buildInputPrompt(false, 'Welcome to action snippets! Say a number.',
 *     ['Sorry, say that again?', 'Sorry, that number again?', 'What was that number?'],
 *     ['Say any number', 'Pick a number', 'What is the number?']);
 *   let expectedIntent = assistant.buildExpectedIntent(PROVIDE_NUMBER_INTENT);
 *   assistant.ask(inputPrompt, [expectedIntent], ["$SchemaOrg_Number"], {started: true});
 * }
 *
 * function provideNumberIntent (assistant) {
 *   assistant.tell('You said ' + assistant.getRawInput());
 * }
 *
 * let actionMap = new Map();
 * actionMap.set(assistant.StandardIntents.MAIN, mainIntent);
 * actionMap.set(PROVIDE_NUMBER_INTENT, provideNumberIntent);
 *
 * assistant.handleRequest(actionMap);
 *
 * @param {Object} inputPrompt Holding initial, no-match and no-input prompts.
 * @param {array} possibleIntents List of ExpectedIntents.
 * @param {array} speechBiasingHints Speech biasing hints, e.g. ["$SchemaOrg_Number"]
 * @param {Object} dialogState JSON object the action uses to hold dialog state that
 *                 will be circulated back by Assistant, e.g., {magic: 10}.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.ask = function (
    inputPrompt, possibleIntents, speechBiasingHints, dialogState) {
  debug('ask: inputPrompt=%s, possibleIntents=%s, speechBiasingHints=%s, dialogState=%s',
    inputPrompt, possibleIntents, speechBiasingHints, dialogState);
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
  if (speechBiasingHints) {
    expectedInputs.speech_biasing_hints = speechBiasingHints;
  }
  let response = self.buildResponseHelper_(
    JSON.stringify(dialogState),
    true, // expected_user_response
    expectedInputs,
    null // final_response is null b/c dialog is active
  );
  return self.doResponse_(response, RESPONSE_CODE_OK);
};

/**
 * Asks Assistant to collect user's input; all user's queries need to be sent to
 * the action.
 *
 * @example
 * const assistant = new ActionsSdkAssistant({request: request, response: response});
 *
 * function askForTextIntent (assistant) {
 *   assistant.askForText({
 *     'text_to_speech': 'What can I help you with?'
 *   });
 * }
 *
 * function rawInputIntent (assistant) {
 *   assistant.tell('You said ' + assistant.getRawInput());
 * }
 *
 * let actionMap = new Map();
 * actionMap.set(assistant.StandardIntents.MAIN, askForTextIntent);
 * actionMap.set(assistant.StandardIntents.TEXT, rawInputIntent);
 *
 * assistant.handleRequest(actionMap);
 *
 * @param {Object} speechResponse, SpeechResponse including text to speech or
 *                 SSML: {text_to_speech: 'text', ssml: '<speak>text</speak>'}
 *                 Note we don't specify no-match, no-input here b/c all
 *                 user's queries will be matched and sent to the action.
 * @param {Array} speechBiasingHints List of speech biasing hints action wants
 *                Assistant to enforce strong speech biasing, e.g. ["$SchemaOrg_Number"]
 * @param {Object} dialogState JSON object the action uses to hold dialog state that
 *                 will be circulated back by Assistant, e.g., {magic: 10}.
 *
 * @return A response is sent to Assistant to ask user to provide an input.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.askForText = function (
    speechResponse, speechBiasingHints, dialogState) {
  debug('askForText: speechResponse=%s,  speechBiasingHints=%s, dialogState=%s',
    JSON.stringify(speechResponse), JSON.stringify(speechBiasingHints), JSON.stringify(dialogState));
  let self = this;
  let expectedIntent = this.buildExpectedIntent(self.StandardIntents.TEXT, []);
  let isSsml = speechResponse.ssml && speechResponse.ssml !== '';
  let initialPrompt =
      isSsml ? speechResponse.ssml : speechResponse.text_to_speech;
  // We don't provide no-match and no-input prompt b/c user's query will always
  // be matched.
  let inputPrompt = self.buildInputPrompt(isSsml, initialPrompt);
  if (!dialogState) {
    dialogState = {
      'state': (self.state instanceof State ? self.state.getName() : self.state),
      'data': self.data
    };
  }
  return self.ask(inputPrompt, [expectedIntent], speechBiasingHints, dialogState);
};

/**
 * Asks Assistant to guide the user to sign-in the action. Once done,
 * in the subsequent request, Assistant will include user.access_token.
 * Example usage:
 * U: [order a movie ticket]
 * A: [what is the movie]
 * U: [hunger games]
 * A: [To order movie ticket, please go to your Google Home app to sign in
 * movie app action first, and come back again]  <- movie app action invokes
 * askForSignIn('order movie ticket', dialogState); Note that at this stage mic
 * is closed.
 *
 * U: go to Google Home app and log in movie app and retry:
 * U: [order a movie ticket]
 * A: [what is the movie]: Assistant passes user.access_token to movie app at
 * this point.
 *
 * @param {string} action_phrase Description for the task to guide user to sign
 *                 in.
 * @param {Object} dialogState JSON object the action uses to hold dialog state that
 *                 will be circulated back by Assistant, e.g., {magic: 10}.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.askForSignIn = function (actionPhrase, dialogState) {
  debug('askForSignIn: actionPhrase=%s, dialogState=%s',
    actionPhrase, JSON.stringify(dialogState));
  let self = this;
  if (!actionPhrase || actionPhrase === '') {
    self.handleError_('Action phrase should not be empty.');
    return null;
  }
  // Build an expected intent for SIGN_IN.
  let expectedIntent = {
    intent: self.StandardIntents.SIGN_IN,
    input_value_spec: {
      sign_in_value_spec: {
        action_phrase: actionPhrase
      }
    }
  };
  // Build a dummy input prompt which will not be used. The actual text to
  // speech would be based on the requested intent.
  let inputPrompt = self.buildInputPrompt(false, 'PLACEHOLDER_FOR_SIGN_IN');
  if (!dialogState) {
    dialogState = {
      'state': (self.state instanceof State ? self.state.getName() : self.state),
      'data': self.data
    };
  }
  self.ask(inputPrompt, [expectedIntent], ['$SchemaOrg_YesNo'], dialogState);
};

/**
 * Similar to ask method but only uses a list of raw values for expected
 * intent IDs; no runtime entities are provided.
 *
 * @example
 * const assistant = new ActionsSdkAssistant({request: request, response: response});
 * const PROVIDE_NUMBER_INTENT = 'PROVIDE_NUMBER';
 *
 * function mainIntent (assistant) {
 *   let inputPrompt = assistant.buildInputPrompt(false, 'Welcome to action snippets! Say a number.',
 *     ['Sorry, say that again?', 'Sorry, that number again?', 'What was that number?'],
 *     ['Say any number', 'Pick a number', 'What is the number?']);
 *   assistant.askNoRuntimeEntities(inputPrompt, [PROVIDE_NUMBER_INTENT], ["$SchemaOrg_Number"], {started: true});
 * }
 *
 * function provideNumberIntent (assistant) {
 *   assistant.tell('You said ' + assistant.getRawInput());
 * }
 *
 * let actionMap = new Map();
 * actionMap.set(assistant.StandardIntents.MAIN, mainIntent);
 * actionMap.set(PROVIDE_NUMBER_INTENT, provideNumberIntent);
 *
 * assistant.handleRequest(actionMap);
 *
 * @param {Object} inputPrompt Object holding no-match, no-input prompts, use
 *                 buildInputPrompt to construct it.
 * @param {Array} expectedIntentIds List of intent IDs action expects,
 *                 e.g., ['PROVIDE_LOCATION', 'PROVIDE_DATE'].
 * @param {Array} speechBiasingHints List speech biasing hints, e.g. ["$SchemaOrg_Number"]
 * @param {Object} dialogState JSON object the action uses to hold dialog state that
 *                 will be circulated back by Assistant, e.g., {magic: 10}.
 * @return A response is sent back to Assistant.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.askNoRuntimeEntities = function (
    inputPrompt, expectedIntentIds, speechBiasingHints, dialogState) {
  debug('askNoRuntimeEntities: inputPrompt=%s, expectedIntentIds=%s, ' +
    'speechBiasingHints=%s, dialogState=%s',
    inputPrompt, expectedIntentIds, JSON.stringify(speechBiasingHints), JSON.stringify(dialogState));
  let self = this;
  if (!inputPrompt) {
    self.handleError_('Invalid input prompt');
    return null;
  }
  let expectedIntents = [];
  if (expectedIntentIds) {
    for (let i = 0; i < expectedIntentIds.length; i++) {
      let intent = self.buildExpectedIntent(expectedIntentIds[i], null);
      if (intent) {
        expectedIntents.push(intent);
      }
    }
  }
  if (!dialogState) {
    dialogState = {
      'state': (self.state instanceof State ? self.state.getName() : self.state),
      'data': self.data
    };
  }
  return self.ask(inputPrompt, expectedIntents, speechBiasingHints, dialogState);
};

/**
 * Tells Assistant to render the speech response and close the mic.
 *
 * @example
 * const assistant = new ActionsSdkAssistant({request: request, response: response});
 *
 * function mainIntent (assistant) {
 *   let inputPrompt = assistant.buildInputPrompt(false, 'Welcome to action snippets! Say anything.');
 *   let expectedIntent = assistant.buildExpectedIntent(RAW_INTENT);
 *   assistant.ask(inputPrompt, [expectedIntent]);
 * }
 *
 * function rawInputIntent (assistant) {
 *   assistant.tell('You said ' + assistant.getRawInput());
 * }
 *
 * let actionMap = new Map();
 * actionMap.set(assistant.StandardIntents.MAIN, mainIntent);
 * actionMap.set(RAW_INTENT, rawInputIntent);
 *
 * assistant.handleRequest(actionMap);
 *
 * @param {string} textToSpeech Final spoken response to Assistant.
 * @return the response is sent back to Assistant.
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
 * Builds the InputPrompt object from initial prompt, no-match prompts, and no-input
 * prompts.
 *
 * Assistant needs one initial prompt to start the conversation, then if the user provides
 * an input which does not match to action's expected intents, Assistant renders the
 * no-match prompts three times (one for each no-match prompt that was configured) to help the user
 * provide the right response. If no user's response, Assistant re-opens the mic and issues no-input
 * prompts in similar fashion.
 *
 * Note: we highly recommend action to provide all the prompts required here in order to ensure a
 * good user experience.
 *
 * @example
 * let inputPrompt = assistant.buildInputPrompt(false, 'Welcome to action snippets! Say a number.',
 *     ['Sorry, say that again?', 'Sorry, that number again?', 'What was that number?'],
 *     ['Say any number', 'Pick a number', 'What is the number?']);
 *   let expectedIntent = assistant.buildExpectedIntent(PROVIDE_NUMBER_INTENT);
 *   assistant.ask(inputPrompt, [expectedIntent], ["$SchemaOrg_Number"], {started: true});
 *
 * @param {boolean} isSsml Indicates whether the text to speech is SSML or not.
 * @param {string} initialPrompt The initial prompt Assistant asks the user.
 * @param {string} noMatches Array of re-prompts when user's response mismatches
 *                 action's expected input (max 3).
 * @param {string} noInputs Array of re-prompt when user does not respond (max 3).
 * @return {Object} an InputPrompt object.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.buildInputPrompt = function (isSsml, initialPrompt,
    noMatches, noInputs) {
  debug('buildInputPrompt: isSsml=%s, initialPrompt=%s, noMatches=%s, noInputs=%s',
    isSsml, initialPrompt, noMatches, noInputs);
  let self = this;
  let initials = [];

  if (noMatches) {
    if (noMatches.length > 3) {
      self.handleError_('Invalid number of no matches');
      return null;
    }
  } else {
    noMatches = [];
  }

  if (noInputs) {
    if (noInputs.length > 3) {
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
      no_match_prompts: self.buildPromptsFromSsmlHelper_(noMatches),
      no_input_prompts: self.buildPromptsFromSsmlHelper_(noInputs)
    };
  } else {
    return {
      initial_prompts: self.buildPromptsFromPlainTextHelper_(initials),
      no_match_prompts: self.buildPromptsFromPlainTextHelper_(noMatches),
      no_input_prompts: self.buildPromptsFromPlainTextHelper_(noInputs)
    };
  }
};

/**
 * Builds an ExpectedIntent object.
 *
 * Refer to 'newRuntimeEntity' to create the list of runtime entities required by this method.
 *
 * @param {string} intent Developer specified in-dialog intent inside Action
 *                 Package or Assistant built-in intent like
 *                 'assistant.intent.action.TEXT'.
 * @param {Array} runtimeEntities List of runtime entities, each runtime entity
 *                represents a custom type defined dynamically, e.g., car
 *                action might return list of available drivers after user says
 *                [book a cab].
 *
 * @example
 * let options = {
 *   [
 *     {
 *       name: '$RuntimeDriver'
 *       items: [
 *         { key: 'S', synonyms: ['car S', 'car small'] },
 *         { key: 'XL', synonyms: ['car XL', 'car large'] }
 *       ]
 *     }
 *   ]
 *  }
 *
 * @return {Object} an expected intent encapsulating the intent and options.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.buildExpectedIntent = function (intent, runtimeEntities) {
  debug('buildExpectedIntent: intent=%s, runtimeEntities=%s', intent, runtimeEntities);
  let self = this;
  if (!intent || intent === '') {
    self.handleError_('Invalid intent');
    return null;
  }
  let expectedIntent = {
    intent: intent
  };
  if (runtimeEntities && runtimeEntities.length) {
    expectedIntent.input_value_spec = {
      option_value_spec: {
        options: runtimeEntities
      }
    };
  }
  return expectedIntent;
};

/**
 * Creates a runtime entity including list of items.
 *
 * This method is mostly used to create a runtime entity before action invokes buildExpectedIntent.
 *
 * @param {string} name The name for this entity, must be matched to a custom
 *                 type defined in Action Package.
 * @param {Array} items List of possible items for this entity.
 * @return {Object} a runtime entity.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.newRuntimeEntity = function (name, items) {
  debug('newRuntimeEntity: name=%s, items=%s', name, items);
  let self = this;
  if (!name) {
    self.handleError_('Invalid name');
    return null;
  }
  if (!name.startsWith('$')) {
    self.handleError_('Name must start with $, name: ' + name);
    return null;
  }
  if (!items || items.length === 0) {
    self.handleError_('Missing items.');
    return null;
  }
  return {
    name: name,
    items: items
  };
};

/**
 * Creates a new item with a specific key and list of synonyms.
 * @param {string} key UUID for this item.
 * @param {Array} synonyms List of synonyms which can be used by user to refer to this
 *                item.
 * @return {Object} an Item object used to encapsulate this item, e.g.,
 *  {
 *    key: 'CAR_XL'
 *    synonyms: [ 'car XL', 'car large']
 *  }
 * @actionssdk
 */
ActionsSdkAssistant.prototype.newItem = function (key, synonyms) {
  debug('newItem: key=%s, synonyms=%s', key, synonyms);
  return {
    key: key,
    synonyms: synonyms
  };
};

// ---------------------------------------------------------------------------
//                   Private Helpers
// ---------------------------------------------------------------------------

/**
 * Get the top most Input object.
 * @return {object} input object.
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
 * @param {string} conversationToken Dialog state.
 * @param {boolean} expectUserResponse Expected user response.
 * @param {object} expectedInput Expected response.
 * @param {boolean} finalResponse Final response.
 * @return {string} final response returned to server.
 * @private
 * @actionssdk
 */
ActionsSdkAssistant.prototype.buildResponseHelper_ = function (conversationToken,
    expectUserResponse, expectedInput, finalResponse) {
  debug('buildResponseHelper_: conversationToken=%s, expectUserResponse=%s, ' +
    'expectedInput=%s, finalResponse=%s',
    conversationToken, expectUserResponse, expectedInput, finalResponse);
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

/*
 * Gets Conversation API signature which is SHA256 of developer provided key
 * plus the request post_body, e.g., SHA-256('private_key:post_body'). Action
 * needs to re-compute the signature to verify the request comes from Assistant
 * @return {string} if the signature exists, otherwise empty.
 * @private
 * @actionssdk
 */
ActionsSdkAssistant.prototype.getConversationApiSignatureOrEmpty_ = function () {
  debug('getConversationApiSignatureOrEmpty_');
  let self = this;
  if (self.request_.get(CONVERSATION_API_SIGNATURE_HEADER)) {
    return self.request_.get(CONVERSATION_API_SIGNATURE_HEADER);
  } else {
    return '';
  }
};

/**
 * Helper to build prompts from SSML's.
 * @param {array} ssmls List of ssml.
 * @return {array} list of SpeechResponse objects.
 * @private
 * @actionssdk
 */
ActionsSdkAssistant.prototype.buildPromptsFromSsmlHelper_ = function (ssmls) {
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
 * @param {array} plainTexts List of plain text to speech.
 * @return {array} list of SpeechResponse objects.
 * @private
 * @actionssdk
 */
ActionsSdkAssistant.prototype.buildPromptsFromPlainTextHelper_ = function (plainTexts) {
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
 * Get argument by name from the current action.
 * @param {string} argName Name of the argument.
 * @return {object} argument matching argName.
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
 * Extract session data from incoming JSON request.
 * @return {Object} JSON data values.
 * @private
 * @actionssdk
 */
ActionsSdkAssistant.prototype.extractData_ = function () {
  debug('extractData_');
  let self = this;
  let data = {};
  if (self.body_.conversation &&
    self.body_.conversation.conversation_token) {
    data = JSON.parse(this.body_.conversation.conversation_token);
  }

  return data;
};

/**
 * Uses a PermissionsValueSpec object to construct and send a
 * permissions request to user.
 *
 * @param {object} permissionsSpec PermissionsValueSpec object containing
 *                 permissions prefix and permissions requested.
 * @param {Object} dialogState JSON object the action uses to hold dialog state that
 *                 will be circulated back by Assistant, e.g., {magic: 10}.
 * @return {Object} HTTP response.
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
  return self.ask(inputPrompt, [expectedIntent], ['$SchemaOrg_YesNo'], dialogState);
};

// ---------------------------------------------------------------------------
//                   API.ai support
// ---------------------------------------------------------------------------

/**
 * Constructor for ApiAiAssistant object.
 *
 * @example
 * let ApiAiAssistant = require('actions-on-google').ApiAiAssistant;
 * const assistant = new ApiAiAssistant({request: request, response: response,
 *   sessionStarted:sessionStarted});
 *
 * @param {Object} options JSON configuration: {request, response, sessionStarted}
 * @constructor
 * @apiai
 */
function ApiAiAssistant (options) {
  debug('ApiAiAssistant constructor');
  Assistant.call(this, options);
}

ApiAiAssistant.prototype = new Assistant();

/**
 * Gets the user object.
 *
 * @example
 * const assistant = new ApiAiAssistant({request: request, response: response});
 * let userId = assistant.getUser().user_id;
 *
 * @return {object} user info or null if no value.
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
 * Verifies whether the request comes from API.AI. The key and value need to be
 * configured in the API.ai project at Fulfillment/Webhook/Headers.
 *
 * @example
 * const assistant = new ApiAiAssistant({request: request, response: response});
 * const HEADER_KEY = 'Google-Assistant-Signature';
 * const HEADER_VALUE = 'YOUR_PRIVATE_KEY';
 *
 * if (!assistant.isRequestFromApiAi(HEADER_KEY, HEADER_VALUE)) {
 *   console.log('Request is not from trusted source (API.AI)');
 *   return;
 * }
 *
 * @param {string} key The header key specified by the developer in the
 *                 API.AI Fulfillment settings of the action.
 * @param {string} value The private value specified by the developer inside the
 *                 fulfillment header.
 * @return {boolean} indicates whether the request comes from API.AI.
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
 * Get the current intent. Alternatively, using a handler Map for handleRequest,
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
 * @return {string} intent id or null if no value.
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
 * @return {string} argument value or null if no value.
 * @apiai
 */
ApiAiAssistant.prototype.getArgument = function (argName) {
  debug('getArgument: argName=%s', argName);
  let self = this;
  if (!argName) {
    self.handleError_('Invalid argument name');
    return null;
  }
  if (self.body_.result.parameters) {
    return self.body_.result.parameters[argName];
  }
  debug('Failed to get argument value: %s', argName);
  return null;
};

/**
 * Asks Assistant to provide an input.
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
 * @param {String} inputPrompt The input prompt.
 * @return {Object} HTTP response.
 * @apiai
 */
ApiAiAssistant.prototype.ask = function (inputPrompt) {
  debug('ask: inputPrompt=%s', inputPrompt);
  let self = this;
  if (!inputPrompt) {
    self.handleError_('Invalid input prompt');
    return null;
  }
  let dialogState = {
    'state': (self.state instanceof State ? self.state.getName() : self.state),
    'data': self.data
  };
  let response = self.buildResponse_(dialogState, inputPrompt, true);
  return self.doResponse_(response, RESPONSE_CODE_OK);
};

/**
 * Tells Assistant to render the speech response and close the mic.
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
 * @param {string} speechResponse Final spoken response to Assistant.
 * @return the response is sent back to Assistant.
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
  debug('setContext: context=%s, lifespan=%s, parameters=%s', context, lifespan, parameters);
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
 * @return {string} user's raw query or null if no value.
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
 * @return {string} action id.
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
 * Builds response for API.ai to send back to Assistant.
 *
 * @param {object} dialogState JSON object the action uses to hold dialog state that
 *                 will be circulated back by Assistant, e.g., {magic: 10}.
 * @param {string} textToSpeech TTS spoken to end user.
 * @param {boolean} expectUserResponse True if user response is expected.
 * @return {object} final response returned to server.
 * @private
 * @apiai
 */
ApiAiAssistant.prototype.buildResponse_ = function (dialogState,
    textToSpeech, expectUserResponse) {
  debug('buildResponse_: dialogState=%s, textToSpeech=%s, expectUserResponse=%s',
    JSON.stringify(dialogState), textToSpeech, expectUserResponse);
  let self = this;
  if (!textToSpeech === undefined) {
    self.handleError_('Invalid text to speech');
    return null;
  }
  let response = {
    speech: textToSpeech,
    data: {
      google: {
        expect_user_response: expectUserResponse,
        speech_biasing_hints: [],
        is_ssml: self.isSsml_(textToSpeech),
        no_input_prompts: []
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
 * Extract session data from incoming JSON request.
 * @return {Object} JSON data values.
 * @private
 * @apiai
 */
ApiAiAssistant.prototype.extractData_ = function () {
  debug('extractData_');
  let self = this;
  let data = {};
  if (self.body_.result && self.body_.result.contexts.length > 0) {
    for (let i = 0; i < self.body_.result.contexts.length; i++) {
      if (self.body_.result.contexts[i].name === ACTIONS_API_AI_CONTEXT) {
        let parameters = self.body_.result.contexts[i].parameters;
        if (parameters) {
          data = parameters;
        } else {
          data = {};
        }
        break;
      }
    }
  }

  return data;
};

/**
 * Uses a PermissionsValueSpec object to construct and send a
 * permissions request to user.
 *
 * @param {object} permissionsSpec PermissionsValueSpec object containing
 *                 the permissions prefix and permissions requested.
 * @return {Object} HTTP response.
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
  response.data.google.speech_biasing_hints = ['$SchemaOrg_YesNo'];
  response.data.google.permissions_request = permissionsSpec;
  return self.doResponse_(response, RESPONSE_CODE_OK);
};

module.exports = {
  ActionsSdkAssistant,
  ApiAiAssistant
};
