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
 * The Actions on Google client library Assistant base class.
 *
 * This class contains the methods that are shared between platforms to suppor the converstaion API
 * protocol form Assistant. It also exports the 'State' class as a helper to represent states by
 * name.
 */

'use strict';

const Debug = require('debug');
const debug = Debug('actions-on-google:debug');
const error = Debug('actions-on-google:error');

// Constants
const ERROR_MESSAGE = 'Sorry, I am unable to process your request.';
const API_ERROR_MESSAGE_PREFIX = 'Action Error: ';
const CONVERSATION_API_VERSION_HEADER = 'Google-Assistant-API-Version';
const RESPONSE_CODE_OK = 200;
const RESPONSE_CODE_BAD_REQUEST = 400;
const HTTP_CONTENT_TYPE_HEADER = 'Content-Type';
const HTTP_CONTENT_TYPE_JSON = 'application/json';

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
const Assistant = class {
  constructor (options) {
    debug('Assistant constructor');

    /**
     * Intent handling data structure.
     * @private {object}
     */
    this.handler_ = null;

    /**
     * Intent mapping data structure.
     * @private {object}
     */
    this.intentMap_ = null;

    /**
     * Intent state data structure.
     * @private {object}
     */
    this.stateMap_ = null;

    /**
     * The session state.
     * @public {string}
     */
    this.state = null;

    /**
     * The session data in JSON format.
     * @public {object}
     */
    this.data = {};

    /**
     * The API.AI context.
     * @private {object}
     */
    this.contexts_ = {};

    /**
     * The last error message.
     * @private {string}
     */
    this.lastErrorMessage_ = null;

    /**
     * Track if an HTTP response has been sent already.
     * @private {boolean}
     */
    this.responded_ = false;

    /**
     * List of standard intents that the Assistant provides.
     * @readonly
     * @enum {string}
     * @actionssdk
     * @apiai
     */
    this.StandardIntents = {
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
    this.SupportedPermissions = {
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
    this.BuiltInArgNames = {
      /** Permission granted argument. */
      PERMISSION_GRANTED: 'permission_granted'
    };

    if (!options) {
      // ignore for JavaScript inheritance to work
      return;
    }
    if (!options.request) {
      this.handleError_('Request can NOT be empty.');
      return;
    }
    if (!options.response) {
      this.handleError_('Response can NOT be empty.');
      return;
    }

    /**
     * The Express HTTP request that the endpoint receives from the Assistant.
     * @private {object}
     */
    this.request_ = options.request;

    /**
     * The Express HTTP response the endpoint will return to Assistant.
     * @private {object}
     */
    this.response_ = options.response;

    /**
     * 'sessionStarted' callback (optional).
     * @private {object}
     */
    this.sessionStarted_ = options.sessionStarted;

    debug('Request from Assistant: %s', JSON.stringify(this.request_.body));

    /**
     * The request body contains query JSON and previous session variables.
     * @private {object}
     */
    this.body_ = this.request_.body;

    /**
     * API version describes version of the Assistant request.
     * @private {string} valid API version.
     */
    this.apiVersion_ = null;
    // Populates API version.
    if (this.request_.get(CONVERSATION_API_VERSION_HEADER)) {
      this.apiVersion_ = this.request_.get(CONVERSATION_API_VERSION_HEADER);
      debug('Assistant API version: ' + this.apiVersion_);
    }
  }

  // ---------------------------------------------------------------------------
  //                   Public APIs
  // ---------------------------------------------------------------------------

  /**
   * Handles the incoming Assistant request using a handler or Map of handlers.
   * Each handler can be a function callback or Promise.
   *
   * @example
   * // Actions SDK
   * const assistant = new ActionsSdkAssistant({request: request, response: response});
   *
   * function mainIntent (assistant) {
   *   const inputPrompt = assistant.buildInputPrompt(true, '<speak>Hi! <break time="1"/> ' +
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
   *     const inputPrompt = assistant.buildInputPrompt(true, '<speak>You said, <say-as interpret-as="ordinal">' +
   *       assistant.getRawInput() + '</say-as></speak>',
   *         ['I didn\'t hear a number', 'If you\'re still there, what\'s the number?', 'What is the number?']);
   *     assistant.ask(inputPrompt);
   *   }
   * }
   *
   * const actionMap = new Map();
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
   *   const number = assistant.getArgument(NUMBER_ARGUMENT);
   *   const color = assistant.getArgument(COLOR_ARGUMENT);
   *   assistant.tell('Alright, your silly name is ' +
   *     color + ' ' + number +
   *     '! I hope you like it. See you next time.');
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(NAME_ACTION, makeName);
   * assistant.handleRequest(actionMap);
   *
   * @param {Object} handler The handler for the request.
   * @actionssdk
   * @apiai
   */
  handleRequest (handler) {
    debug('handleRequest: handler=%s', handler);
    if (!handler) {
      this.handleError_('request handler can NOT be empty.');
      return;
    }
    this.extractData_();
    if (typeof handler === 'function') {
      debug('handleRequest: function');
      // simple function handler
      this.handler_ = handler;
      const promise = handler(this);
      if (promise instanceof Promise) {
        promise.then(
          (result) => {
            debug(result);
          })
        .catch(
          (reason) => {
            this.handleError_('function failed: %s', reason.message);
            this.tell(!reason.message ? ERROR_MESSAGE : reason.message);
          });
      } else {
        // Handle functions
        return;
      }
      return;
    } else if (handler instanceof Map) {
      debug('handleRequest: map');
      const intent = this.getIntent();
      const result = this.invokeIntentHandler_(handler, intent);
      if (!result) {
        this.tell(!this.lastErrorMessage_ ? ERROR_MESSAGE : this.lastErrorMessage_);
      }
      return;
    }
    // Could not handle intent
    this.handleError_('invalid intent handler type: ' + (typeof handler));
    this.tell(ERROR_MESSAGE);
  }

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
   *   const permission = [
   *     assistant.SupportedPermissions.NAME,
   *     assistant.SupportedPermissions.DEVICE_PRECISE_LOCATION
   *   ];
   *   assistant.askForPermissions('To pick you up', permissions);
   * }
   *
   * function sendRide (assistant) {
   *   if (assistant.isPermissionGranted()) {
   *     const displayName = assistant.getUserName().displayName;
   *     const address = assistant.getDeviceLocation().address;
   *     assistant.tell('I will tell your driver to pick up ' + displayName +
   *         ' at ' + address);
   *   } else {
   *     // Response shows that user did not grant permission
   *     assistant.tell('Sorry, I could not figure out where to pick you up.');
   *   }
   * }
   * const actionMap = new Map();
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
  askForPermissions (context, permissions, dialogState) {
    debug('askForPermissions: context=%s, permissions=%s, dialogState=%s',
      context, permissions, JSON.stringify(dialogState));
    if (!context || context === '') {
      this.handleError_('Assistant context can NOT be empty.');
      return null;
    }
    if (!permissions || permissions.length === 0) {
      this.handleError_('At least one permission needed.');
      return null;
    }
    for (let i = 0; i < permissions.length; i++) {
      const permission = permissions[i];
      if (permission !== this.SupportedPermissions.NAME &&
        permission !== this.SupportedPermissions.DEVICE_PRECISE_LOCATION &&
        permission !== this.SupportedPermissions.DEVICE_COARSE_LOCATION) {
        this.handleError_('Assistant permission must be one of ' +
          '[NAME, DEVICE_PRECISE_LOCATION, DEVICE_COARSE_LOCATION]');
        return null;
      }
    }
    if (!dialogState) {
      dialogState = {
        'state': (this.state instanceof State ? this.state.getName() : this.state),
        'data': this.data
      };
    }
    return this.fulfillPermissionsRequest_({
      opt_context: context,
      permissions: permissions
    }, dialogState);
  }

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
   *   const permission = assistant.SupportedPermissions.NAME;
   *   assistant.askForPermission('To pick you up', permission);
   * }
   *
   * function sendRide (assistant) {
   *   if (assistant.isPermissionGranted()) {
   *     const displayName = assistant.getUserName().displayName;
   *     assistant.tell('I will tell your driver to pick up ' + displayName);
   *   } else {
   *     // Response shows that user did not grant permission
   *     assistant.tell('Sorry, I could not figure out who to pick up.');
   *   }
   * }
   * const actionMap = new Map();
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
  askForPermission (context, permission, dialogState) {
    debug('askForPermission: context=%s, permission=%s, dialogState=%s',
      context, permission, JSON.stringify(dialogState));
    return this.askForPermissions(context, [permission], dialogState);
  }

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
   *   const permission = assistant.SupportedPermissions.NAME;
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
   * const actionMap = new Map();
   * actionMap.set(REQUEST_PERMISSION_ACTION, requestPermission);
   * actionMap.set(SAY_NAME_ACTION, sayName);
   * assistant.handleRequest(actionMap);
   *
   * @return {UserName} Null if name permission is not granted.
   * @actionssdk
   * @apiai
   */
  getUserName () {
    debug('getUserName');
    if (!this.getUser().profile) {
      return null;
    }
    const userName = {
      displayName: this.getUser().profile.display_name,
      givenName: this.getUser().profile.given_name,
      familyName: this.getUser().profile.family_name
    };
    return userName;
  }

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
  invokeIntentHandler_ (handler, intent) {
    debug('invokeIntentHandler_: handler=%s, intent=%s', handler, intent);
    this.lastErrorMessage_ = null;
    // map of intents or states
    for (let key of handler.keys()) {
      const value = handler.get(key);
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
        debug('state=' + (this.state instanceof State ? this.state.getName() : this.state));
        // map of states
        if (!this.state && name === null) {
          debug('undefined state');
          return this.invokeIntentHandler_(value, intent);
        } else if (this.state instanceof State && name === this.state.getName()) {
          return this.invokeIntentHandler_(value, intent);
        } else if (name === this.state) {
          return this.invokeIntentHandler_(value, intent);
        }
      }
      // else map of intents
      if (name === intent) {
        debug('map of intents');
        const promise = value(this);
        if (promise instanceof Promise) {
          promise.then(
            (result) => {
              // No-op
            })
          .catch(
            (reason) => {
              error(reason.message);
              this.handleError_('intent handler failed: %s', reason.message);
              this.lastErrorMessage_ = reason.message;
              return false;
            });
        } else {
          // Handle functions
          return true;
        }
        return true;
      }
    }
    this.handleError_('no matching intent handler for: ' + intent);
    return false;
  }

  /**
   * Utility function to detect SSML markup.
   *
   * @param {string} text The text to be checked.
   * @return {boolean} true if text is SSML markup.
   * @private
   */
  isSsml_ (text) {
    debug('isSsml_: text=%s', text);
    if (!text) {
      this.handleError_('text can NOT be empty.');
      return false;
    }
    return /^<speak\b[^>]*>(.*?)<\/speak>$/gi.test(text);
  }

  /**
   * Utility function to handle error messages.
   *
   * @param {string} text The error message.
   * @private
   */
  handleError_ (text) {
    debug('handleError_: text=%s', text);
    if (!text) {
      error('Missing text');
      return;
    }
    // Log error
    error.apply(text, Array.prototype.slice.call(arguments, 1));
    // Tell assistant to say error
    if (this.responded_) {
      return;
    }
    if (this.response_) {
      // Don't call other methods; just do directly
      this.response_.status(RESPONSE_CODE_BAD_REQUEST).send(API_ERROR_MESSAGE_PREFIX + text);
      this.responded_ = true;
    }
  }

  /**
   * Utility method to send an HTTP response.
   *
   * @param {string} response The JSON response.
   * @param {string} respnseCode The HTTP response code.
   * @return {object} HTTP response.
   * @private
   */
  doResponse_ (response, responseCode) {
    debug('doResponse_: response=%s, responseCode=%d', JSON.stringify(response), responseCode);
    if (this.responded_) {
      return;
    }
    if (!response) {
      this.handleError_('Response can NOT be empty.');
      return null;
    }
    let code = RESPONSE_CODE_OK;
    if (responseCode) {
      code = responseCode;
    }
    if (this.apiVersion_ !== null) {
      this.response_.append(CONVERSATION_API_VERSION_HEADER, this.apiVersion_);
    }
    this.response_.append(HTTP_CONTENT_TYPE_HEADER, HTTP_CONTENT_TYPE_JSON);
    debug('Response %s', JSON.stringify(response));
    const httpResponse = this.response_.status(code).send(response);
    this.responded_ = true;
    return httpResponse;
  }

  /**
   * Extract session data from the incoming JSON request.
   *
   * Used in subclasses for Actions SDK and API.AI.
   * @private
   */
  extractData_ () {
    debug('extractData_');
    this.data = {};
  }

  /**
   * Uses a PermissionsValueSpec object to construct and send a
   * permissions request to user.
   *
   * Used in subclasses for Actions SDK and API.AI.
   * @return {Object} HTTP response.
   * @private
   */
  fulfillPermissionsRequest_ () {
    debug('fulfillPermissionsRequest_');
    return {};
  }

  /**
   * Helper to build prompts from SSML's.
   *
   * @param {array} ssmls Array of ssml.
   * @return {array} Array of SpeechResponse objects.
   * @private
   */
  buildPromptsFromSsmlHelper_ (ssmls) {
    debug('buildPromptsFromSsmlHelper_: ssmls=%s', ssmls);
    const prompts = [];
    for (let i = 0; i < ssmls.length; i++) {
      const prompt = {
        ssml: ssmls[i]
      };
      prompts.push(prompt);
    }
    return prompts;
  }

  /**
   * Helper to build prompts from plain texts.
   *
   * @param {array} plainTexts Array of plain text to speech.
   * @return {array} Array of SpeechResponse objects.
   * @private
   */
  buildPromptsFromPlainTextHelper_ (plainTexts) {
    debug('buildPromptsFromPlainTextHelper_: plainTexts=%s', plainTexts);
    const prompts = [];
    for (let i = 0; i < plainTexts.length; i++) {
      const prompt = {
        text_to_speech: plainTexts[i]
      };
      prompts.push(prompt);
    }
    return prompts;
  }
};

/**
 * Utility class for representing intents by name.
 *
 * @private
 */
const Intent = class {
  constructor (name) {
    this.name_ = name;
  }

  getName () {
    return this.name_;
  }
};

/**
 * Utility class for representing states by name.
 *
 * @private
 */
const State = class {
  constructor (name) {
    this.name_ = name;
  }

  getName () {
    return this.name_;
  }
};

module.exports = {
  Assistant: Assistant,
  State: State
};
