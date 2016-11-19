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
let cryptojs = require('crypto-js');

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

/**
 * Configure logging for hosting platforms that only
 * support console.log and console.error
 */
debug.log = console.log.bind(console);
error.log = console.error.bind(console);

/**
 * Constructor for Assistant object.
 *
 * @example
 * let assistant = new Assistant({request: request, response: response,
 *   sessionStarted:sessionStarted});
 * @param {Object} options JSON configuration: {request, response, sessionStarted}
 * @constructor
 */
function Assistant (options) {
  let self = this;

  if (!options) {
    // ignore for inheritance
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
   * The request cloud function is going to return to Assistant.
   * @private {object}
   */
  self.request_ = options.request;

  /**
   * The response cloud function is going to return to Assistant.
   * @private {object}
   */
  self.response_ = options.response;

  /**
   * Session started callback (optional).
   * @private {object}
   */
  self.sessionStarted_ = options.sessionStarted;

  debug('Request from Assistant: %s', JSON.stringify(self.request_.body));

  /**
   * The request body contains query semantics and previous dialog state.
   * @private {object}
   */
  self.body_ = self.request_.body;

  /**
   * API version describes how Assistant sends request and expects response.
   * @private {string} valid api_version.
   */
  self.apiVersion_ = null;
  // Populates API version.
  if (self.request_.get(CONVERSATION_API_VERSION_HEADER)) {
    self.apiVersion_ = self.request_.get(CONVERSATION_API_VERSION_HEADER);
    debug('Assistant API version: ' + self.apiVersion_);
  }

  /**
   * Intent handling data structures.
   * @private {object}
   */
  self.handler_ = null;
  self.intentMap_ = null;
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

  self.responded_ = false;
}

// ---------------------------------------------------------------------------
//                   Public APIs
// ---------------------------------------------------------------------------

/**
 * List of standard intents assistant provides.
 */
Assistant.prototype.StandardIntents = {
  // Assistant fires MAIN intent for queries like [talk to $agent].
  MAIN: 'assistant.intent.action.MAIN',
  // Assistant fires TEXT intent when action issues ask intent.
  TEXT: 'assistant.intent.action.TEXT',
  // Assistant fires PERMISSION intent when agent invokes askForPermission.
  PERMISSION: 'assistant.intent.action.PERMISSION',
  // Assistant asks user to sign-in to ensure Assistant has a linked 3P service.
  SIGN_IN: 'assistant.intent.action.SIGN_IN'
};

/**
 * List of supported permissions agent can ask.
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
 * Handles the incoming assistant request using a handler or map of handlers.
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
      self.handleError_('intent function does not return Promise');
      self.tell(ERROR_MESSAGE);
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
 * Utility function to detech SSML markup.
 * @param {string} text The text for speech.
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
  if (text.trim().toLowerCase().startsWith(SSML_SPEAK_START) &&
      text.trim().toLowerCase().endsWith(SSML_SPEAK_END)) {
    return true;
  }
  return false;
};

/**
 * Utility function to handle error message.
 * @param {string} text error message.
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
 * Utility method to send HTTP response.
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
 * Extract session data from incoming JSON request.
 * @return {Object} JSON data values.
 * @private
 */
Assistant.prototype.extractData_ = function () {
  debug('extractData_');
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
 * Constructor for Assistant object.
 *
 * @example
 * let assistant = new Assistant({request: request, response: response,
 *   sessionStarted:sessionStarted});
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

/**
 * Verifies whether the request comes from Google Assistant.
 *
 * @param {string} private_key the private key specified by developer inside the
 *                 Action Package, only agent and Google know this key.
 * @return {boolean} indicates whether the request comes from Google Assistant.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.isRequestFromAssistant = function (privateKey) {
  debug('isRequestFromAssistant: privateKey=%s', privateKey);
  let self = this;
  if (!privateKey || privateKey === '') {
    self.handleError_('privateKey must be specified.');
    return false;
  }
  // Google-Assistant-Signature must exist.
  let googleSignedSignature = self.getConversationApiSignatureOrEmpty_();
  if (!googleSignedSignature || googleSignedSignature === '') {
    self.handleError_('Failed to get googleSignedSignature');
    return false;
  }
  // Use HMAC-SHA256 to compute signature of private_key:post_body and verify
  // whether it's the same.
  let hmacSha256 = cryptojs.HmacSHA256(JSON.stringify(self.body_), privateKey);
  return hmacSha256 === googleSignedSignature;
};

/*
 * Gets the request API version.
 * @return {string} version value.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.getApiVersion = function () {
  debug('getApiVersion');
  let self = this;
  return self.apiVersion_;
};

/**
 * Gets user's raw input query.
 * @return {string} user's raw query like 'order a pizza'.
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
 * Gets previous dialog state agent sent to Assistant, or null, e.g., {magic: 5}
 * @return {Object} JSON object developer provided to Google Assistant in prev
 *                  user turn.
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
 * @return {object} user info.
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
 * Gets the Version Label specified inside the Action Package, used by agent to
 * do version control.
 * @return {string} the specified version label or empty if unspecified.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.getAgentVersionLabel = function () {
  debug('getAgentVersionLabel');
  let self = this;
  let versionLabel = self.request_.get(CONVERSATION_API_AGENT_VERSION_HEADER);
  if (versionLabel) {
    return versionLabel;
  } else {
    return '';
  }
};

/**
 * Gets unique conversation ID. It's a new ID for initial query, and stays the
 * same for the conversation.
 * @return {string} conversation ID.
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
 * Get the current intent.
 * @return {string} intent id.
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
 * Get argument value by name from the current intent.
 * @param {string} argName name of the argument.
 * @return {string} argument value.
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
  self.handleError_('Failed to get argument value: %s', argName);
  return null;
};

/**
 * Asks Assistant to provide an input. A response is built and sent back to
 * Assistant if succeeded, otherwise an error code 400 is sent back.
 *
 * @param {Object} inputPrompt holding initial, no-match and no-input prompt.
 * @param {array} possibleIntents list of ExpectedIntents.
 * @param {array} speechBiasingHints speech biasing hints.
 * @param {string} conversationToken opaque token agent wants assistant to
 *                 circulate back.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.ask = function (inputPrompt, possibleIntents, speechBiasingHints, conversationToken) {
  debug('ask: inputPrompt=%s, possibleIntents=%s, speechBiasingHints=%s, conversationToken=%s',
    inputPrompt, possibleIntents, speechBiasingHints, conversationToken);
  let self = this;
  if (!inputPrompt) {
    self.handleError_('Invalid input prompt');
    return null;
  }
  if (typeof inputPrompt === 'string') {
    inputPrompt = self.buildInputPrompt(self.isSsml_(inputPrompt), inputPrompt);
  }
  let dialogState = {
    'state': (self.state instanceof State ? self.state.getName() : self.state),
    'data': self.data
  };
  if (conversationToken) {
    dialogState = conversationToken;
  }
  let expectedInputs = [{
    input_prompt: inputPrompt,
    possible_intents: possibleIntents,
    speech_biasing_hints: speechBiasingHints
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
 * Asks assistant to collect user's input, all user's queries need to be sent to
 * agent.
 *
 * @param {Object} speechResponse, SpeechResponse including text to speech or
 *                 SSML, note we don't specify no-match, no-input here b/c all
 *                 user's queries will be matched and sent to agent.
 * @param {Object} dialogState JSON object representing developer's dialog
 *                 state, it's opaque for Assistant.
 * @param {Array} speechBiasingHints list of speech biasing hints agent wants
 *                Assistant to enforce strong speech biasing.
 *
 * @return A response is sent to Assistant to ask user to provide an input.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.askForText = function (
    speechResponse, dialogState, speechBiasingHints) {
  debug('askForText: speechResponse=%s, dialogState=%s, speechBiasingHints=%s',
    speechResponse, dialogState, speechBiasingHints);
  let self = this;
  let expectedIntent = this.buildExpectedIntent(self.StandardIntent.TEXT, []);
  let isSsml = speechResponse.ssml && speechResponse.ssml !== '';
  let initialPrompt =
      isSsml ? speechResponse.ssml : speechResponse.text_to_speech;
  // We don't provide no-match and no-input prompt b/c user's query will always
  // be matched.
  let inputPrompt = self.buildInputPrompt(isSsml, initialPrompt);
  return self.ask(inputPrompt, [expectedIntent], speechBiasingHints,
                   JSON.stringify(dialogState));
};

/**
 * Asks assistant to guide user to grant the permissions, e.g., when agent wants
 * to access user's personal info, agent invokes askForPermissions method,
 * assistant will ask user 'In order to <ActionPhrase>, we need to access your'
 * 'first name, last name, email and current location, is that OK?', once user
 * says 'Yes' or 'No', assistant will fire another intent:
 * assistant.intent.action.PERMISSION with a bool arg: 'permission_granted'. If
 * permission_granted is true, agent can inspect request.user_info for details,
 * otherwise agent needs to change the way it asks user to continue the dialog.
 *
 * @param {string} context context why permission is asked, it's the TTS
 *                 prompt prefix we ask user.
 * @param {Array} permissions list of permissions assistant supports, each of
 *                which comes from Assistant.SupportedPermissions.
 * @param {Object} dialogState the opaque dialog state agent wants assistant to
 *                 circulate back.
 *
 * @return A response is sent to assistant to ask for user's permission, for any
 * invalid input, we return null.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.askForPermissions = function (
    context, permissions, dialogState) {
  debug('askForPermissions: context=%s, permissions=%s, dialogState=%s',
    context, permissions, dialogState);
  let self = this;
  if (!context || context === '') {
    self.handleError_('Assistant context can NOT be empty.');
    return null;
  }
  if (!permissions || permissions.length === 0) {
    console.error('At least one permission needed.');
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
  // Build an Expected Intent object.
  let expectedIntent = {
    intent: self.BuiltInIntent.PERMISSION,
    input_value_spec: {
      permission_value_spec: {
        opt_context: context,
        permissions: permissions
      }
    }
  };
  // Send an Ask request to Assistant.
  let inputPrompt = self.buildInputPrompt(false, 'PLACEHOLDER_FOR_PERMISSION');
  return self.ask(inputPrompt, [expectedIntent], ['$SchemaOrg_YesNo'],
      JSON.stringify(dialogState));
};

/**
 * Asks assistant to guide user to grant a permission, e.g., when agent wants
 * to access user's personal info, agent invokes askForPermissions method,
 * assistant will ask user 'In order to <ActionPhrase>, we need to access your'
 * 'first name, last name, email and current location, is that OK?', once user
 * says 'Yes' or 'No', assistant will fire another intent:
 * assistant.intent.action.PERMISSION with a bool arg: 'permission_granted'. If
 * permission_granted is true, agent can inspect request.user_info for details,
 * otherwise agent needs to change the way it asks user to continue the dialog.
 *
 * @param {string} opt_context context why permission is asked, it's the TTS
 *                 prompt prefix we ask user.
 * @param {string} permission one of permissions assistant supports, each of
 *                 which comes from Assistant.SupportedPermissions.
 * @param {Object} dialogState the opaque dialog state agent wants assistant to
 *                 circulate back.
 *
 * @return A response is sent to assistant to ask for user's permission, for any
 * invalid input, we return null.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.askForPermission = function (
    context, permission, dialogState) {
  debug('askForPermission: context=%s, permission=%s, dialogState=%s',
    context, permission, dialogState);
  let self = this;
  return self.askForPermissions(context, [permission], dialogState);
};

/**
 * Asks Assistant to guide user to sign-in the agent. Once done,
 * in the subsequent request, Assistant will include user.access_token.
 * Example usage:
 * U: [order a movie ticket]
 * A: [what is the movie]
 * U: [hunger games]
 * A: [To order movie ticket, please go to your Google Home app to sign in
 * movie app agent first, and come back again]  <- movie app agent invokes
 * askForSignIn('order movie ticket', dialogState); Note that at this stage mic
 * is closed.
 *
 * U: go to Google Home app and log in movie app and retry:
 * U: [order a movie ticket]
 * A: [what is the movie]: assistant passes user.access_token to movie app at
 * this point.
 *
 * @param {string} action_phrase description for the task to guide user to sign
 *                 in.
 * @param {Object} dialogState opaque dialog state agent wants assistant to
 *                 circulate back.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.askForSignIn = function (actionPhrase, dialogState) {
  debug('askForSignIn: actionPhrase=%s, dialogState=%s',
    actionPhrase, dialogState);
  let self = this;
  if (!actionPhrase || actionPhrase === '') {
    self.handleError_('Action phrase should not be empty.');
    return null;
  }
  // Build an expected intent for SIGN_IN.
  let expectedIntent = {
    intent: self.BuiltInIntent.SIGN_IN,
    input_value_spec: {
      sign_in_value_spec: {
        action_phrase: actionPhrase
      }
    }
  };
  // Build a dummy input prompt which will not be used. The actual text to
  // speech would be based on the requested intent.
  let inputPrompt = self.buildInputPrompt(false, 'PLACEHOLDER_FOR_SIGN_IN');
  self.ask(inputPrompt, [expectedIntent], ['$SchemaOrg_YesNo'],
      JSON.stringify(dialogState));
};

/**
 * Similar to ask method but developer only provides a list of raw values for expected
 * intent IDs, this means there is no runtime entities provided.
 *
 * @param {Object} inputPrompt Object holding no-match, no-input prompts, use
 *                 buildInputPrompt to construct it.
 * @param {Array} expectedIntentIds list of intent IDs agent expects,
 *                 e.g., ['PROVIDE_LOCATION', 'PROVIDE_DATE'].
 * @param {Object} dialogState JSON object agent uses to hold dialog state, it
 *                 will be circulated back by Assistant, e.g., {magic: 10}.
 * @param {Array} speechBiasingHints list speech biasing hints.
 * @return A response is sent back to Assistant.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.askNoRuntimeEntities = function (inputPrompt, expectedIntentIds, dialogState, speechBiasingHints) {
  debug('askNoRuntimeEntities: inputPrompt=%s, expectedIntentIds=%s, dialogState=%s, speechBiasingHints=%s',
    inputPrompt, expectedIntentIds, dialogState, speechBiasingHints);
  let self = this;
  if (!inputPrompt) {
    self.handleError_('Invalid input prompt');
    return null;
  }
  let expectedIntents = [];
  if (expectedIntentIds) {
    for (let i = 0; i < expectedIntentIds.length; i++) {
      let intent = self.buildExpectedIntentHelper_(expectedIntentIds[i], null);
      if (intent) {
        expectedIntents.push(intent);
      }
    }
  }
  return self.ask(inputPrompt, expectedIntents, speechBiasingHints,
    JSON.stringify(dialogState));
};

/**
 * Tells Assistant to render the speech response and closes the mic.
 * @param {string} speechResponse final spoken response to assistant.
 * @return the response is sent back to Assistant.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.tell = function (speechResponse) {
  debug('tell: speechResponse=%s', speechResponse);
  let self = this;
  if (!speechResponse) {
    self.handleError_('Invalid speech response');
    return null;
  }
  let response = self.buildResponseHelper_(
    null, false, null, {
      speech_response: {
        text_to_speech: speechResponse
      }
    });
  return self.doResponse_(response, RESPONSE_CODE_OK);
};

/**
 * Builds InputPrompt from initial prompt, no-match prompts, and no-input
 * prompts. Assistant needs one initial prompt, if user provides
 * an input which does not match to agent's expected intents, assistant renders
 * no-match prompt three times to help user to provide the right response. if no
 * user's response, assistant re-opens the mic and issues no-input prompts in
 * the similar fashion. Note that, we highly recommend agent to provide all the
 * prompts requires here in order to ensure a good user experience.
 *
 * @param {boolean} isSsml indicates whether the text to speech is SSML or not.
 * @param {string} initialPrompt the initial prompt assistant asks user.
 * @param {string} noMatch1 first re-prompt when user's response mismatches
 *                 agent's expected input.
 * @param {string} noMatch2 second re-prompt when user's response mismatches
 *                 agent's expected input.
 * @param {string} noMatch3 last spoken response before mic is closed.
 * @param {string} noInput1 first re-prompt when user does not respond.
 * @param {string} noInput2 second re-prompt when user does not respond.
 * @param {string} noInput3 last spoken response before mic is closed when
 *                 user does not respond.
 * @return {Object} an InputPrompt object.
 * @actionssdk
 */
ActionsSdkAssistant.prototype.buildInputPrompt = function (isSsml, initialPrompt,
  noMatch1, noMatch2, noMatch3, noInput1, noInput2, noInput3) {
  debug('buildInputPrompt: isSsml=%s, initialPrompt=%s, noMatch1=%s, noMatch2=%s, noMatch3=%s, noInput1=%s, noInput2=%s, noInput3=%s',
    isSsml, initialPrompt, noMatch1, noMatch2, noMatch3, noInput1, noInput2, noInput3);
  let self = this;
  let initials = [];
  let noMatches = [];
  let noInputs = [];

  self.maybeAddItemToArray_(initialPrompt, initials);
  self.maybeAddItemToArray_(noMatch1, noMatches);
  self.maybeAddItemToArray_(noMatch2, noMatches);
  self.maybeAddItemToArray_(noMatch3, noMatches);
  self.maybeAddItemToArray_(noInput1, noInputs);
  self.maybeAddItemToArray_(noInput2, noInputs);
  self.maybeAddItemToArray_(noInput3, noInputs);
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
 * Helper to build an Expected Intent, refers to newRuntimeEntity to create the
 * entities.
 *
 * @param {string} intent developer specified in-dialog intent inside Action
 *                 Package or assistant built-in intent like
 *                 'assistant.intent.action.TEXT'.
 * @param {Array} runtimeEntities list of runtime entity, each runtime entity
 *                represents a custom type defined dynamically, e.g., car
 *                agent might return list of available drivers after user says
 *                [book a cab]:
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
 * Creates a runtime entity including list of items. Mostly this is used to
 * create a runtime entity before agent invokes buildExpectedIntent.
 *
 * @param {string} name the name for this entity, must be matched to a custom
 *                 type defined in Action Package.
 * @param {Array} items list of possible items for this entity.
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
 * @param {Array} list of synonyms which can be used by user to refer to this
 *                item.
 * @return {Object} an Item used to encapsulate this Item, e.g.,
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
 * Builds response to send back to Assistant.
 *
 * @param {string} conversationToken dialog state.
 * @param {boolean} expectUserResponse expected user response.
 * @param {object} expectedInput expected response.
 * @param {boolean} finalResponse final response.
 * @return {string} final response returned to server.
 * @private
 * @actionssdk
 */
ActionsSdkAssistant.prototype.buildResponseHelper_ = function (conversationToken,
  expectUserResponse, expectedInput, finalResponse) {
  debug('buildResponseHelper_: conversationToken=%s, expectUserResponse=%s, expectedInput=%s, finalResponse=%s',
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
 * Helper to build an ExpectedIntent object.
 * @private
 * @actionssdk
 */
ActionsSdkAssistant.prototype.buildExpectedIntentHelper_ = function (intent, options) {
  debug('buildExpectedIntentHelper_: intent=%s, options=%s', intent, options);
  let self = this;
  if (!intent || intent === '') {
    self.handleError_('Missing intent');
    return null;
  }
  let expectedIntent = {
    intent: intent
  };
  if (options && options.length) {
    expectedIntent.input_value_spec = {
      option_value_spec: {
        options: options
      }
    };
  }
  return expectedIntent;
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
 * @param {array} ssmls list of ssml.
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
 * @param {array} plainTexts list of plain text to speech.
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
 * @param {string} argName name of the argument.
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
  self.handleError_('Failed to find argument: %s', argName);
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

// ---------------------------------------------------------------------------
//                   API.ai support
// ---------------------------------------------------------------------------

/**
 * Constructor for Assistant object.
 *
 * @example
 * let assistant = new Assistant({request: request, response: response,
 *   sessionStarted:sessionStarted});
 * @param {Object} options JSON configuration: {request, response, sessionStarted}
 * @constructor
 * @apiai
 */
function ApiAiAssistant (options) {
  debug('ApiAiAssistant constructor');
  let self = this;
  Assistant.call(self, options);
}

ApiAiAssistant.prototype = new Assistant();

/**
 * Gets the user object.
 * @return {object} user info.
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
 * Get the current intent.
 * @return {string} intent id.
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
 * Get argument value by name from the current intent.
 * @param {string} argName name of the argument.
 * @return {string} argument value.
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
  self.handleError_('Failed to get argument value: %s', argName);
  return null;
};

/**
 * Asks Assistant to provide an input. A response is built and sent back to
 * Assistant if succeeded, otherwise an error code 400 is sent back.
 *
 * @param {String} inputPrompt.
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
 * Tells Assistant to render the speech response and closes the mic.
 * @param {string} speechResponse final spoken response to assistant.
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
 * @param {string} context name of the argument.
 * @param {int} context lifespan.
 * @param {object} context JSON parameters.
 * @apiai
 */
ApiAiAssistant.prototype.setContext = function (context, lifespan, parameters) {
  debug('setContext: context=%s, lifespan=%s, parameters=%s', context, lifespan, parameters);
  let self = this;
  if (!context) {
    self.handleError_('Invalid context name');
    return null;
  }
  if (self.apiAi) {
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
  }
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
 * Builds response from API.ai to send back to Assistant.
 *
 * @param {object} dialogState Arbitrary object to be circulated between
 * developer API and Server.
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
    speech: SSML_SPEAK_START + textToSpeech + SSML_SPEAK_END,
    data: {
      google: {
        expect_user_response: expectUserResponse,
        ssml: SSML_SPEAK_START + textToSpeech + SSML_SPEAK_END,
        is_ssml: true,
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

module.exports = {
  ActionsSdkAssistant,
  ApiAiAssistant
};
