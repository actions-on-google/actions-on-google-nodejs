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

const Debug = require('debug');
const debug = Debug('actions-on-google:debug');
const error = Debug('actions-on-google:error');
const assistant = require('./assistant');
const Assistant = assistant.Assistant;
const State = assistant.State;

// Constants
const RESPONSE_CODE_OK = 200;
const ACTIONS_API_AI_CONTEXT = '_actions_on_google_';
const MAX_LIFESPAN = 100;
const INPUTS_MAX = 3;
const ORIGINAL_SUFFIX = '.original';

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
 * const ApiAiAssistant = require('actions-on-google').ApiAiAssistant;
 * const assistant = new ApiAiAssistant({request: request, response: response,
 *   sessionStarted:sessionStarted});
 *
 * @param {Object} options JSON configuration.
 * @param {Object} options.request Express HTTP request object.
 * @param {Object} options.response Express HTTP response object.
 * @param {Function=} options.sessionStarted Function callback when session starts.
 *     Only called if webhook is enabled for welcome/triggering intents, and
 *     called from Web Simulator or Google Home device (i.e., not API.AI simulator).
 * @apiai
 */
const ApiAiAssistant = class extends Assistant {
  constructor (options) {
    debug('ApiAiAssistant constructor');
    super(options);

    if (this.body_.originalRequest &&
        this.body_.originalRequest.data &&
        this.body_.originalRequest.data.conversation) {
      if (this.body_.originalRequest.data.conversation.type ===
        this.ConversationStages.NEW && this.sessionStarted_ &&
        typeof this.sessionStarted_ === 'function') {
        this.sessionStarted_();
      } else if (this.sessionStarted_ && typeof this.sessionStarted_ !== 'function') {
        this.handleError_('options.sessionStarted must be a Function');
      }
    }
  }

  /**
   * Gets the {@link User} object.
   * The user object contains information about the user, including
   * a string identifier and personal information (requires requesting permissions,
   * see {@link Assistant#askForPermissions|askForPermissions}).
   *
   * @example
   * const assistant = new ApiAiAssistant({request: request, response: response});
   * const userId = assistant.getUser().userId;
   *
   * @return {User} Null if no value.
   * @apiai
   */
  getUser () {
    debug('getUser');
    if (!(this.body_.originalRequest &&
        this.body_.originalRequest.data &&
        this.body_.originalRequest.data.user)) {
      this.handleError_('No user object');
      return null;
    }
    // User object includes original API properties
    const user = {
      userId: this.body_.originalRequest.data.user.user_id,
      user_id: this.body_.originalRequest.data.user.user_id,
      userName: this.body_.originalRequest.data.user.profile ? {
        displayName: this.body_.originalRequest.data.user.profile.display_name,
        givenName: this.body_.originalRequest.data.user.profile.given_name,
        familyName: this.body_.originalRequest.data.user.profile.family_name
      } : null,
      profile: this.body_.originalRequest.data.user.profile,
      accessToken: this.body_.originalRequest.data.user.access_token,
      access_token: this.body_.originalRequest.data.user.access_token
    };
    return user;
  }

  /**
   * If granted permission to device's location in previous intent, returns device's
   * location (see {@link Assistant#askForPermissions|askForPermissions}).
   * If device info is unavailable, returns null.
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
   * @return {DeviceLocation} Null if location permission is not granted.
   * @apiai
   */
  getDeviceLocation () {
    debug('getDeviceLocation');
    if (!this.body_.originalRequest.data.device || !this.body_.originalRequest.data.device.location) {
      return null;
    }
    const deviceLocation = {
      coordinates: this.body_.originalRequest.data.device.location.coordinates,
      address: this.body_.originalRequest.data.device.location.formatted_address,
      zipCode: this.body_.originalRequest.data.device.location.zip_code,
      city: this.body_.originalRequest.data.device.location.city
    };
    return deviceLocation;
  }

  /**
   * Returns true if the request follows a previous request asking for
   * permission from the user and the user granted the permission(s). Otherwise,
   * false. Use with {@link Assistant#askForPermissions|askForPermissions}.
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
   * @return {boolean} True if permissions granted.
   * @apiai
   */
  isPermissionGranted () {
    debug('isPermissionGranted');
    for (let input of this.body_.originalRequest.data.inputs) {
      if (input.arguments) {
        for (let argument of input.arguments) {
          return argument.name === this.BuiltInArgNames.PERMISSION_GRANTED &&
            argument.text_value === 'true';
        }
      }
    }
    return false;
  }

  /**
   * Verifies whether the request comes from API.AI.
   *
   * @param {string} key The header key specified by the developer in the
   *     API.AI Fulfillment settings of the action.
   * @param {string} value The private value specified by the developer inside the
   *     fulfillment header.
   * @return {boolean} True if the request comes from API.AI.
   * @apiai
   */
  isRequestFromApiAi (key, value) {
    debug('isRequestFromApiAi: key=%s, value=%s', key, value);
    if (!key || key === '') {
      this.handleError_('key must be specified.');
      return false;
    }
    if (!value || value === '') {
      this.handleError_('value must be specified.');
      return false;
    }
    return this.request_.get(key) === value;
  }

  /**
   * Get the current intent. Alternatively, using a handler Map with
   * {@link Assistant#handleRequest|handleRequest},
   * the client library will automatically handle the incoming intents.
   *
   * @example
   * const assistant = new ApiAiAssistant({request: request, response: response});
   *
   * function responseHandler (assistant) {
   *   const intent = assistant.getIntent();
   *   switch (intent) {
   *     case WELCOME_INTENT:
   *       assistant.ask('Welcome to action snippets! Say a number.');
   *       break;
   *
   *     case NUMBER_INTENT:
   *       const number = assistant.getArgument(NUMBER_ARGUMENT);
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
  getIntent () {
    debug('getIntent');
    const intent = this.getIntent_();
    if (!intent) {
      this.handleError_('Missing intent from request body');
      return null;
    }
    return intent;
  }

  /**
   * Get the argument value by name from the current intent. If the argument
   * is included in originalRequest, and is not a text argument, the entire
   * argument object is returned.
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
   *   const number = assistant.getArgument(NUMBER_ARGUMENT);
   *   assistant.tell('You said ' + number);
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(WELCOME_INTENT, welcomeIntent);
   * actionMap.set(NUMBER_INTENT, numberIntent);
   * assistant.handleRequest(actionMap);
   *
   * @param {string} argName Name of the argument.
   * @return {Object} Argument value matching argName
   *     or null if no matching argument.
   * @apiai
   */
  getArgument (argName) {
    debug('getArgument: argName=%s', argName);
    if (!argName) {
      this.handleError_('Invalid argument name');
      return null;
    }
    if (this.body_.result.parameters && this.body_.result.parameters[argName]) {
      return this.body_.result.parameters[argName];
    }
    if (this.body_.originalRequest && this.body_.originalRequest.data &&
      this.body_.originalRequest.data.inputs) {
      for (let input of this.body_.originalRequest.data.inputs) {
        if (input.arguments) {
          for (let argument of input.arguments) {
            if (argument.name === argName) {
              if (argument.text_value) {
                return argument.text_value;
              } else {
                return argument;
              }
            }
          }
        }
      }
    }
    debug('Failed to get argument value: %s', argName);
    return null;
  }

  /**
   * Get the context argument value by name from the current intent. Context
   * arguments include parameters collected in previous intents during the
   * lifespan of the given context. If the context argument has an original
   * value, usually representing the underlying entity value, that will be given
   * as part of the return object.
   *
   * @example
   * const assistant = new ApiAiAssistant({request: request, response: response});
   * const WELCOME_INTENT = 'input.welcome';
   * const NUMBER_INTENT = 'input.number';
   * const OUT_CONTEXT = 'output_context';
   * const NUMBER_ARG = 'myNumberArg';
   *
   * function welcomeIntent (assistant) {
   *   const parameters = {};
   *   parameters[NUMBER_ARG] = '42';
   *   assistant.setContext(OUT_CONTEXT, 1, parameters);
   *   assistant.ask('Welcome to action snippets! Ask me for your number.');
   * }
   *
   * function numberIntent (assistant) {
   *   const number = assistant.getContextArgument(OUT_CONTEXT, NUMBER_ARG);
   *   // number === { value: 42 }
   *   assistant.tell('Your number is  ' + number.value);
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(WELCOME_INTENT, welcomeIntent);
   * actionMap.set(NUMBER_INTENT, numberIntent);
   * assistant.handleRequest(actionMap);
   *
   * @param {string} contextName Name of the context.
   * @param {string} argName Name of the argument.
   * @return {Object} Object containing value property and optional original
   *     property matching context argument. Null if no matching argument.
   * @apiai
   */
  getContextArgument (contextName, argName) {
    debug('getContextArgument: contextName=%s, argName=%s', contextName, argName);
    if (!contextName) {
      this.handleError_('Invalid context name');
      return null;
    }
    if (!argName) {
      this.handleError_('Invalid argument name');
      return null;
    }
    if (!this.body_.result ||
      !this.body_.result.contexts) {
      this.handleError_('No contexts included in request');
      return null;
    }
    for (let context of this.body_.result.contexts) {
      if (context.name === contextName && context.parameters[argName]) {
        let argument = { value: context.parameters[argName] };
        if (context.parameters[argName + ORIGINAL_SUFFIX]) {
          argument.original = context.parameters[argName + ORIGINAL_SUFFIX];
        }
        return argument;
      }
    }
    debug('Failed to get context argument value: %s', argName);
    return null;
  }

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
   *   const number = assistant.getArgument(NUMBER_ARGUMENT);
   *   assistant.tell('You said ' + number);
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(WELCOME_INTENT, welcomeIntent);
   * actionMap.set(NUMBER_INTENT, numberIntent);
   * assistant.handleRequest(actionMap);
   *
   * @param {string} inputPrompt The input prompt text.
   * @param {Array<string>=} noInputs Array of re-prompts when the user does not respond (max 3).
   * @return {Object} HTTP response.
   * @apiai
   */
  ask (inputPrompt, noInputs) {
    debug('ask: inputPrompt=%s, noInputs=%s', inputPrompt, noInputs);
    if (!inputPrompt) {
      this.handleError_('Invalid input prompt');
      return null;
    }
    const dialogState = {
      'state': (this.state instanceof State ? this.state.getName() : this.state),
      'data': this.data
    };
    const response = this.buildResponse_(dialogState, inputPrompt, true, noInputs);
    return this.doResponse_(response, RESPONSE_CODE_OK);
  }

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
   *   const number = assistant.getArgument(NUMBER_ARGUMENT);
   *   assistant.tell('You said ' + number);
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(WELCOME_INTENT, welcomeIntent);
   * actionMap.set(NUMBER_INTENT, numberIntent);
   * assistant.handleRequest(actionMap);
   *
   * @param {string} textToSpeech Final spoken response. Spoken response can be SSML.
   * @return The response that is sent back to Assistant.
   * @apiai
   */
  tell (speechResponse) {
    debug('tell: speechResponse=%s', speechResponse);
    if (!speechResponse) {
      this.handleError_('Invalid speech response');
      return null;
    }
    const response = this.buildResponse_(undefined, speechResponse, false);
    return this.doResponse_(response, RESPONSE_CODE_OK);
  }

  /**
   * Set a new context for the current intent.
   *
   * @example
   * const assistant = new ApiAiAssistant({request: request, response: response});
   * const CONTEXT_NUMBER = 'number';
   * const NUMBER_ARGUMENT = 'myNumber';
   *
   * function welcomeIntent (assistant) {
   *   assistant.setContext(CONTEXT_NUMBER);
   *   assistant.ask('Welcome to action snippets! Say a number.');
   * }
   *
   * function numberIntent (assistant) {
   *   const number = assistant.getArgument(NUMBER_ARGUMENT);
   *   assistant.tell('You said ' + number);
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(WELCOME_INTENT, welcomeIntent);
   * actionMap.set(NUMBER_INTENT, numberIntent);
   * assistant.handleRequest(actionMap);
   *
   * @param {string} name Name of the context. API.AI converts to lowercase.
   * @param {int} [lifespan=1] Context lifespan.
   * @param {Object=} parameters Context JSON parameters.
   * @apiai
   */
  setContext (name, lifespan, parameters) {
    debug('setContext: context=%s, lifespan=%d, parameters=%s', name, lifespan,
      JSON.stringify(parameters));
    if (!name) {
      this.handleError_('Invalid context name');
      return null;
    }
    const newContext = {
      name: name,
      lifespan: 1
    };
    if (lifespan !== null && lifespan !== undefined) {
      newContext.lifespan = lifespan;
    }
    if (parameters) {
      newContext.parameters = parameters;
    }
    this.contexts_[name] = newContext;
  }

  /**
   * API.AI {@link https://docs.api.ai/docs/concept-contexts|Context}.
   * @typedef {Object} Context
   * @property {string} name - Full name of the context.
   * @property {Object} parameters - Parameters carried within this context.
                                     See {@link https://docs.api.ai/docs/concept-actions#section-extracting-values-from-contexts|here}.
   * @property {number} lifespan - Remaining number of intents
   */

  /**
   * Returns the incoming contexts for this intent.
   *
   * @example
   * const assistant = new ApiAiAssistant({request: request, response: response});
   * const CONTEXT_NUMBER = 'number';
   * const NUMBER_ARGUMENT = 'myNumber';
   *
   * function welcomeIntent (assistant) {
   *   assistant.setContext(CONTEXT_NUMBER);
   *   assistant.ask('Welcome to action snippets! Say a number.');
   * }
   *
   * function numberIntent (assistant) {
   *   let contexts = assistant.getContexts();
   *   // contexts === [{
   *   //   name: 'number',
   *   //   lifespan: 0,
   *   //   parameters: {
   *   //     myNumber: '23',
   *   //     myNumber.original: '23'
   *   //   }
   *   // }]
   *   const number = assistant.getArgument(NUMBER_ARGUMENT);
   *   assistant.tell('You said ' + number);
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(WELCOME_INTENT, welcomeIntent);
   * actionMap.set(NUMBER_INTENT, numberIntent);
   * assistant.handleRequest(actionMap);
   *
   * @return {Context[]} Empty if no active contexts.
   * @apiai
   */
  getContexts () {
    debug('getContexts');
    if (!this.body_.result ||
        !this.body_.result.contexts) {
      this.handleError_('No contexts included in request');
      return null;
    }
    return this.body_.result.contexts.filter((context) => {
      return context.name !== ACTIONS_API_AI_CONTEXT;
    });
  }

 /**
   * Returns the incoming context by name for this intent.
   *
   * @example
   * const action = new ApiAiAction({request: request, response: response});
   * const CONTEXT_NUMBER = 'number';
   * const NUMBER_ARGUMENT = 'myNumber';
   *
   * function welcomeIntent (action) {
   *   action.setContext(CONTEXT_NUMBER);
   *   action.ask('Welcome to action snippets! Say a number.');
   * }
   *
   * function numberIntent (action) {
   *   let context = action.getContext(CONTEXT_NUMBER);
   *   // context === {
   *   //   name: 'number',
   *   //   lifespan: 0,
   *   //   parameters: {
   *   //     myNumber: '23',
   *   //     myNumber.original: '23'
   *   //   }
   *   // }
   *   const number = action.getArgument(NUMBER_ARGUMENT);
   *   action.tell('You said ' + number);
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(WELCOME_INTENT, welcomeIntent);
   * actionMap.set(NUMBER_INTENT, numberIntent);
   * action.handleRequest(actionMap);
   *
   * @return {Object} Context value matching name
   *     or null if no matching context.
   * @apiai
   */

  getContext (name) {
    debug('getContext: name=%s', name);
    if (!this.body_.result ||
        !this.body_.result.contexts) {
      this.handleError_('No contexts included in request');
      return null;
    }
    for (let context of this.body_.result.contexts) {
      if (context.name === name) {
        return context;
      }
    }
    debug('Failed to get context: %s', name);
    return null;
  }

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
  getRawInput () {
    debug('getRawInput');
    if (!this.body_.result ||
        !this.body_.result.resolvedQuery) {
      this.handleError_('No raw input');
      return null;
    }
    return this.body_.result.resolvedQuery;
  }

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
  getIntent_ () {
    debug('getIntent_');
    if (this.body_.result) {
      return this.body_.result.action;
    } else {
      this.handleError_('Missing result from request body');
      return null;
    }
  }

  /**
   * Builds a response for API.AI to send back to the Assistant.
   *
   * @param {Object} dialogState JSON object the action uses to hold dialog state that
   *     will be circulated back by Assistant.
   * @param {string} textToSpeech TTS spoken to end user.
   * @param {boolean} expectUserResponse true if the user response is expected.
   * @param {Array<string>=} noInputs Array of re-prompts when the user does not respond (max 3).
   * @return {Object} The final response returned to Assistant.
   * @private
   * @apiai
   */
  buildResponse_ (dialogState, textToSpeech, expectUserResponse, noInputs) {
    debug('buildResponse_: dialogState=%s, textToSpeech=%s, expectUserResponse=%s, noInputs=%s',
        JSON.stringify(dialogState), textToSpeech, expectUserResponse, noInputs);
    if (!textToSpeech === undefined) {
      this.handleError_('Invalid text to speech');
      return null;
    }
    if (noInputs) {
      if (noInputs.length > INPUTS_MAX) {
        this.handleError_('Invalid number of no inputs');
        return null;
      }
      if (this.isSsml_(textToSpeech)) {
        noInputs = this.buildPromptsFromSsmlHelper_(noInputs);
      } else {
        noInputs = this.buildPromptsFromPlainTextHelper_(noInputs);
      }
    } else {
      noInputs = [];
    }
    const response = {
      speech: textToSpeech,
      data: {
        google: {
          expect_user_response: expectUserResponse,
          is_ssml: this.isSsml_(textToSpeech),
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
    for (let context of Object.keys(this.contexts_)) {
      response.contextOut.push(this.contexts_[context]);
    }
    return response;
  }

  /**
   * Extract the session data from the incoming JSON request.
   *
   * @private
   * @apiai
   */
  extractData_ () {
    debug('extractData_');
    if (this.body_.result && this.body_.result.contexts.length > 0) {
      for (let i = 0; i < this.body_.result.contexts.length; i++) {
        if (this.body_.result.contexts[i].name === ACTIONS_API_AI_CONTEXT) {
          const parameters = this.body_.result.contexts[i].parameters;
          if (parameters) {
            this.data = parameters;
          } else {
            this.data = {};
          }
          break;
        }
      }
    } else {
      this.data = {};
    }
  }

  /**
   * Uses a PermissionsValueSpec object to construct and send a
   * permissions request to the user.
   *
   * @param {Object} permissionsSpec PermissionsValueSpec object containing
   *     the permissions prefix and permissions requested.
   * @return {Object} The HTTP response.
   * @private
   * @apiai
   */
  fulfillPermissionsRequest_ (permissionsSpec) {
    debug('fulfillPermissionsRequest_: permissionsSpec=%s',
      JSON.stringify(permissionsSpec));
    const dialogState = {
      'state': (this.state instanceof State ? this.state.getName() : this.state),
      'data': this.data
    };
    const inputPrompt = 'PLACEHOLDER_FOR_PERMISSION';
    const response = this.buildResponse_(dialogState, inputPrompt, true);
    response.data.google.permissions_request = permissionsSpec;
    return this.doResponse_(response, RESPONSE_CODE_OK);
  }
};

module.exports = ApiAiAssistant;
