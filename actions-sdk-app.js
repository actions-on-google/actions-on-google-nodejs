/**
 * Copyright 2017 Google Inc. All Rights Reserved.
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
 * This is the class that handles the converstaion API directly from Assistant, providing
 * implementation for all the methods available in the API.
 */

'use strict';

const Debug = require('debug');
const debug = Debug('actions-on-google:debug');
const error = Debug('actions-on-google:error');
const app = require('./assistant-app');
const AssistantApp = app.AssistantApp;
const State = app.State;
const transformToSnakeCase = require('./utils/transform').transformToSnakeCase;
const transformToCamelCase = require('./utils/transform').transformToCamelCase;

// Constants
const CONVERSATION_API_AGENT_VERSION_HEADER = 'Agent-Version-Label';
const RESPONSE_CODE_OK = 200;
const INPUTS_MAX = 3;

// Configure logging for hosting platforms that only support console.log and console.error
debug.log = console.log.bind(console);
error.log = console.error.bind(console);

// ---------------------------------------------------------------------------
//                   Actions SDK support
// ---------------------------------------------------------------------------

/**
 * Constructor for ActionsSdkApp object. To be used in the Actions SDK
 * HTTP endpoint logic.
 *
 * @example
 * const ActionsSdkApp = require('actions-on-google').ActionsSdkApp;
 * const app = new ActionsSdkApp({request: request, response: response,
 *   sessionStarted:sessionStarted});
 *
 * @param {Object} options JSON configuration.
 * @param {Object} options.request Express HTTP request object.
 * @param {Object} options.response Express HTTP response object.
 * @param {Function=} options.sessionStarted Function callback when session starts.
 * @actionssdk
 */
const ActionsSdkApp = class extends AssistantApp {
  constructor (options) {
    debug('ActionsSdkApp constructor');
    super(options);

    // If request is from AoG and in Proto2 format, convert to Proto3.
    if (this.body_ && !this.isNotApiVersionOne_()) {
      this.body_ = transformToCamelCase(this.body_);
    }

    if (this.body_ &&
        this.body_.conversation &&
        this.body_.conversation.type &&
        this.body_.conversation.type === this.ConversationStages.NEW &&
        this.sessionStarted_ && typeof this.sessionStarted_ === 'function') {
      this.sessionStarted_();
    } else if (this.sessionStarted_ && typeof this.sessionStarted_ !== 'function') {
      this.handleError_('options.sessionStarted must be a Function');
    }
  }

  /*
   * Gets the request Conversation API version.
   *
   * @example
   * const app = new ActionsSdkApp({request: request, response: response});
   * const apiVersion = app.getApiVersion();
   *
   * @return {string} Version value or null if no value.
   * @actionssdk
   */
  getApiVersion () {
    debug('getApiVersion');
    return this.apiVersion_ || this.actionsApiVersion_;
  }

  /**
   * Gets the user's raw input query.
   *
   * @example
   * const app = new ActionsSdkApp({request: request, response: response});
   * app.tell('You said ' + app.getRawInput());
   *
   * @return {string} User's raw query or null if no value.
   * @actionssdk
   */
  getRawInput () {
    debug('getRawInput');
    const input = this.getTopInput_();
    if (!input) {
      this.handleError_('Failed to get top Input.');
      return null;
    }
    if (!input.rawInputs || input.rawInputs.length === 0) {
      this.handleError_('Missing user raw input');
      return null;
    }
    const rawInput = input.rawInputs[0];
    if (!rawInput.query) {
      this.handleError_('Missing query for user raw input');
      return null;
    }
    return rawInput.query;
  }

  /**
   * Gets previous JSON dialog state that the app sent to Assistant.
   * Alternatively, use the app.data field to store JSON values between requests.
   *
   * @example
   * const app = new ActionsSdkApp({request: request, response: response});
   * const dialogState = app.getDialogState();
   *
   * @return {Object} JSON object provided to the Assistant in the previous
   *     user turn or {} if no value.
   * @actionssdk
   */
  getDialogState () {
    debug('getDialogState');
    if (this.body_.conversation && this.body_.conversation.conversationToken) {
      return JSON.parse(this.body_.conversation.conversationToken);
    }
    return {};
  }

  /**
   * Gets the {@link User} object.
   * The user object contains information about the user, including
   * a string identifier and personal information (requires requesting permissions,
   * see {@link AssistantApp#askForPermissions|askForPermissions}).
   *
   * @example
   * const app = new ActionsSdkApp({request: request, response: response});
   * const userId = app.getUser().userId;
   *
   * @return {User} Null if no value.
   * @actionssdk
   */
  getUser () {
    debug('getUser');
    if (!this.body_.user) {
      this.handleError_('No user object');
      return null;
    }
    // User object includes original API properties
    const user = {
      userId: this.body_.user.userId,
      user_id: this.body_.user.userId,
      userName: this.body_.user.profile ? {
        displayName: this.body_.user.profile.displayName,
        givenName: this.body_.user.profile.givenName,
        familyName: this.body_.user.profile.familyName
      } : null,
      profile: this.body_.user.profile,
      accessToken: this.body_.user.accessToken,
      access_token: this.body_.user.accessToken
    };
    return user;
  }

  /**
   * If granted permission to device's location in previous intent, returns device's
   * location (see {@link AssistantApp#askForPermissions|askForPermissoins}).
   * If device info is unavailable, returns null.
   *
   * @example
   * const app = new ActionsSdkApp({request: req, response: res});
   * app.askForPermission("To get you a ride",
   *   app.SupportedPermissions.DEVICE_PRECISE_LOCATION);
   * // ...
   * // In response handler for subsequent intent:
   * if (app.isPermissionGranted()) {
   *   sendCarTo(app.getDeviceLocation().coordinates);
   * }
   *
   * @return {DeviceLocation} Null if location permission is not granted.
   * @actionssdk
   */
  getDeviceLocation () {
    debug('getDeviceLocation');
    if (!this.body_.device || !this.body_.device.location) {
      return null;
    }
    const deviceLocation = {
      coordinates: this.body_.device.location.coordinates,
      address: this.body_.device.location.formattedAddress,
      zipCode: this.body_.device.location.zipCode,
      city: this.body_.device.location.city
    };
    return deviceLocation;
  }

  /**
   * Gets transactability of user. Only use after calling
   * askForTransactionRequirements. Null if no result given.
   *
   * @return {string} One of Transactions.ResultType.
   * @actionssdk
   */
  getTransactionRequirementsResult () {
    debug('getTransactionRequirementsResult');
    let result = this.getArgument_(this.BuiltInArgNames.TRANSACTION_REQ_CHECK_RESULT);
    if (result && result.extension && result.extension.resultType) {
      return result.extension.resultType;
    }
    debug('Failed to get transaction requirements result');
    return null;
  }

  /**
   * Gets transaction decision information. Only use after calling
   * askForTransactionDecision.
   *
   * @return {TransactionDecision} Transaction decision data. Returns object with
   *     userDecision. userDecision will be one of
   *     Transactions.ConfirmationDecision. Null if no decision given.
   * @actionssdk
   */
  getTransactionDecision () {
    debug('getTransactionDecision');
    let result = this.getArgument_(this.BuiltInArgNames.TRANSACTION_DECISION_VALUE);
    if (result && result.extension) {
      return result.extension;
    }
    debug('Failed to get transaction decision information');
    return null;
  }

  /**
   * Gets confirmation decision. Use after askForConfirmation.
   *
   * @return {boolean} True if the user replied with affirmative response.
   *     False if user replied with negative response. Null if no user
   *     confirmation decision given.
   * @actionssdk
   */
  getUserConfirmation () {
    debug('getUserConfirmation');
    let result = this.getArgument_(this.BuiltInArgNames.CONFIRMATION);
    if (result && result.boolValue !== undefined) {
      return result.boolValue;
    }
    debug('Failed to get user confirmation information');
    return null;
  }

  /**
   * Gets user provided date and time. Use after askForDateTime.
   *
   * @return {DateTime} Date and time given by the user. Null if no user
   *     date and time given.
   * @actionssdk
   */
  getDateTime () {
    debug('getDateTime');
    let result = this.getArgument_(this.BuiltInArgNames.DATETIME);
    if (result && result.datetimeValue) {
      return result.datetimeValue;
    }
    debug('Failed to get date/time information');
    return null;
  }

  /**
   * Gets status of user sign in request.
   *
   * @return {string} Result of user sign in request. One of
   *     ActionsSdkApp.SignInStatus. Null if no sign in status.
   * @actionssdk
   */
  getSignInStatus () {
    debug('getSignInStatus');
    let result = this.getArgument_(this.BuiltInArgNames.SIGN_IN);
    if (result && result.extension && result.extension.status) {
      return result.extension.status;
    }
    debug('Failed to get sign in status');
    return null;
  }

  /**
   * Gets order delivery address. Only use after calling askForDeliveryAddress.
   *
   * @return {DeliveryAddress} Delivery address information. Null if user
   *     denies permission, or no address given.
   * @actionssdk
   */
  getDeliveryAddress () {
    debug('getDeliveryAddress');
    let result = this.getArgument_(this.BuiltInArgNames.DELIVERY_ADDRESS_VALUE) ||
      this.getArgument_(this.BuiltInArgNames.TRANSACTION_DECISION_VALUE);
    if (!result || !result.extension) {
      debug('Failed to get order delivery address');
      return null;
    }
    if (result.extension.userDecision ===
      this.Transactions.DeliveryAddressDecision.ACCEPTED) {
      const locationValue = result.extension.location;
      if (!locationValue.postalAddress) {
        debug('User accepted, but may not have configured address in app');
        return null;
      }
      return locationValue;
    } else {
      debug('User rejected giving delivery address');
      return null;
    }
  }

  /**
   * Returns true if the request follows a previous request asking for
   * permission from the user and the user granted the permission(s). Otherwise,
   * false. Use with {@link AssistantApp#askForPermissions|askForPermissions}.
   *
   * @example
   * const app = new ActionsSdkApp({request: request, response: response});
   * app.askForPermissions("To get you a ride", [
   *   app.SupportedPermissions.NAME,
   *   app.SupportedPermissions.DEVICE_PRECISE_LOCATION
   * ]);
   * // ...
   * // In response handler for subsequent intent:
   * if (app.isPermissionGranted()) {
   *  // Use the requested permission(s) to get the user a ride
   * }
   *
   * @return {boolean} true if permissions granted.
   * @actionssdk
   */
  isPermissionGranted () {
    debug('isPermissionGranted');
    return this.getArgument(this.BuiltInArgNames.PERMISSION_GRANTED) === 'true';
  }

  /**
   * Returns true if the app is being tested in sandbox mode. Enable sandbox
   * mode in the (Actions console)[console.actions.google.com] to test
   * transactions.
   *
   * @return {boolean} True if app is being used in Sandbox mode.
   * @actionssdk
   */
  isInSandbox () {
    return this.body_ && this.body_.isInSandbox;
  }

  /**
   * Gets the "versionLabel" specified inside the Action Package.
   * Used by app to do version control.
   *
   * @example
   * const app = new ActionsSdkApp({request: request, response: response});
   * const actionVersionLabel = app.getActionVersionLabel();
   *
   * @return {string} The specified version label or null if unspecified.
   * @actionssdk
   */
  getActionVersionLabel () {
    debug('getActionVersionLabel');
    const versionLabel = this.request_.get(CONVERSATION_API_AGENT_VERSION_HEADER);
    if (versionLabel) {
      return versionLabel;
    } else {
      return null;
    }
  }

  /**
   * Gets the unique conversation ID. It's a new ID for the initial query,
   * and stays the same until the end of the conversation.
   *
   * @example
   * const app = new ActionsSdkApp({request: request, response: response});
   * const conversationId = app.getConversationId();
   *
   * @return {string} Conversation ID or null if no value.
   * @actionssdk
   */
  getConversationId () {
    debug('getConversationId');
    if (!this.body_.conversation || !this.body_.conversation.conversationId) {
      this.handleError_('No conversation ID');
      return null;
    }
    return this.body_.conversation.conversationId;
  }

  /**
   * Get the current intent. Alternatively, using a handler Map with
   * {@link AssistantApp#handleRequest|handleRequest}, the client library will
   * automatically handle the incoming intents.
   *
   * @example
   * const app = new ActionsSdkApp({request: request, response: response});
   *
   * function responseHandler (app) {
   *   const intent = app.getIntent();
   *   switch (intent) {
   *     case app.StandardIntents.MAIN:
   *       const inputPrompt = app.buildInputPrompt(false, 'Welcome to action snippets! Say anything.');
   *       app.ask(inputPrompt);
   *       break;
   *
   *     case app.StandardIntents.TEXT:
   *       app.tell('You said ' + app.getRawInput());
   *       break;
   *   }
   * }
   *
   * app.handleRequest(responseHandler);
   *
   * @return {string} Intent id or null if no value.
   * @actionssdk
   */
  getIntent () {
    debug('getIntent');
    const input = this.getTopInput_();
    if (!input) {
      this.handleError_('Missing intent from request body');
      return null;
    }
    return input.intent;
  }

  /**
   * Gets surface capabilities of user device.
   *
   * @return {Array<string>} Supported surface capabilities, as defined in
   *     ActionsSdkApp.SurfaceCapabilities.
   * @actionssdk
   */
  getSurfaceCapabilities () {
    debug('getSurfaceCapabilities');
    if (this.body_.surface &&
      this.body_.surface.capabilities) {
      const capabilities = [];
      for (let capability of this.body_.surface.capabilities) {
        capabilities.push(capability.name);
      }
      return capabilities;
    } else {
      error('No surface capabilities in incoming request');
      return null;
    }
  }

  /**
   * Gets type of input used for this request.
   *
   * @return {number} One of ActionsSdkApp.InputTypes.
   *     Null if no input type given.
   * @actionssdk
   */
  getInputType () {
    debug('getInputType');
    if (this.body_.inputs) {
      for (let input of this.body_.inputs) {
        if (input.rawInputs) {
          for (let rawInput of input.rawInputs) {
            if (rawInput.inputType) {
              return rawInput.inputType;
            }
          }
        }
      }
    } else {
      error('No input type in incoming request');
      return null;
    }
  }

  /**
   * Get the argument value by name from the current intent. If the argument
   * is not a text argument, the entire argument object is returned.
   *
   * Note: If incoming request is using an API version under 2 (e.g. 'v1'),
   * the argument object will be in Proto2 format (snake_case, etc).
   *
   * @param {string} argName Name of the argument.
   * @return {string} Argument value matching argName
   *     or null if no matching argument.
   * @actionssdk
   */
  getArgument (argName) {
    debug('getArgument: argName=%s', argName);
    if (!argName) {
      this.handleError_('Invalid argument name');
      return null;
    }
    const argument = this.getArgument_(argName);
    if (!argument) {
      debug('Failed to get argument value: %s', argName);
      return null;
    } else if (argument.textValue) {
      return argument.textValue;
    } else {
      if (!this.isNotApiVersionOne_()) {
        return transformToSnakeCase(argument);
      } else {
        return argument;
      }
    }
  }

  /**
   * Returns the option key user chose from options response.
   *
   * @example
   * const app = new App({request: req, response: res});
   *
   * function pickOption (app) {
   *   if (app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT)) {
   *     app.askWithCarousel('Which of these looks good?',
   *       app.buildCarousel().addItems(
   *         app.buildOptionItem('another_choice', ['Another choice']).
   *         setTitle('Another choice').setDescription('Choose me!')));
   *   } else {
   *     app.ask('What would you like?');
   *   }
   * }
   *
   * function optionPicked (app) {
   *   app.ask('You picked ' + app.getSelectedOption());
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(app.StandardIntents.TEXT, pickOption);
   * actionMap.set(app.StandardIntents.OPTION, optionPicked);
   *
   * app.handleRequest(actionMap);
   *
   * @return {string} Option key of selected item. Null if no option selected or
   *     if current intent is not OPTION intent.
   * @actionssdk
   */
  getSelectedOption () {
    debug('getSelectedOption');
    if (this.getArgument(this.BuiltInArgNames.OPTION)) {
      return this.getArgument(this.BuiltInArgNames.OPTION);
    }
    debug('Failed to get selected option');
    return null;
  }

  /**
   * Asks to collect user's input; all user's queries need to be sent to
   * the app.
   *
   * @example
   * const app = new ActionsSdkApp({request: request, response: response});
   *
   * function mainIntent (app) {
   *   const inputPrompt = app.buildInputPrompt(true, '<speak>Hi! <break time="1"/> ' +
   *         'I can read out an ordinal like ' +
   *         '<say-as interpret-as="ordinal">123</say-as>. Say a number.</speak>',
   *         ['I didn\'t hear a number', 'If you\'re still there, what\'s the number?', 'What is the number?']);
   *   app.ask(inputPrompt);
   * }
   *
   * function rawInput (app) {
   *   if (app.getRawInput() === 'bye') {
   *     app.tell('Goodbye!');
   *   } else {
   *     const inputPrompt = app.buildInputPrompt(true, '<speak>You said, <say-as interpret-as="ordinal">' +
   *       app.getRawInput() + '</say-as></speak>',
   *         ['I didn\'t hear a number', 'If you\'re still there, what\'s the number?', 'What is the number?']);
   *     app.ask(inputPrompt);
   *   }
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(app.StandardIntents.MAIN, mainIntent);
   * actionMap.set(app.StandardIntents.TEXT, rawInput);
   *
   * app.handleRequest(actionMap);
   *
   * @param {Object|SimpleResponse|RichResponse} inputPrompt Holding initial and
   *     no-input prompts.
   * @param {Object=} dialogState JSON object the app uses to hold dialog state that
   *     will be circulated back by App.
   * @return The response that is sent to Assistant to ask user to provide input.
   * @actionssdk
   */
  ask (inputPrompt, dialogState) {
    debug('ask: inputPrompt=%s, dialogState=%s',
       JSON.stringify(inputPrompt), JSON.stringify(dialogState));
    const expectedIntent = this.buildExpectedIntent_(this.StandardIntents.TEXT, []);
    if (!expectedIntent) {
      error('Error in building expected intent');
      return null;
    }
    return this.buildAskHelper_(inputPrompt, [expectedIntent], dialogState);
  }

  /**
   * Asks to collect user's input with a list.
   *
   * @example
   * const app = new ActionsSdkApp({request, response});
   *
   * function welcomeIntent (app) {
   *   app.askWithlist('Which of these looks good?',
   *     app.buildList('List title')
   *      .addItems([
   *        app.buildOptionItem(SELECTION_KEY_ONE,
   *          ['synonym of KEY_ONE 1', 'synonym of KEY_ONE 2'])
   *          .setTitle('Number one'),
   *        app.buildOptionItem(SELECTION_KEY_TWO,
   *          ['synonym of KEY_TWO 1', 'synonym of KEY_TWO 2'])
   *          .setTitle('Number two'),
   *      ]));
   * }
   *
   * function optionIntent (app) {
   *   if (app.getSelectedOption() === SELECTION_KEY_ONE) {
   *     app.tell('Number one is a great choice!');
   *   } else {
   *     app.tell('Number two is a great choice!');
   *   }
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(app.StandardIntents.TEXT, welcomeIntent);
   * actionMap.set(app.StandardIntents.OPTION, optionIntent);
   * app.handleRequest(actionMap);
   *
   * @param {Object|SimpleResponse|RichResponse} inputPrompt Holding initial and
   *     no-input prompts. Cannot contain basic card.
   * @param {List} list List built with {@link AssistantApp#buildList|buildList}.
   * @param {Object=} dialogState JSON object the app uses to hold dialog state that
   *     will be circulated back by Assistant.
   * @return The response that is sent to Assistant to ask user to provide input.
   * @actionssdk
   */
  askWithList (inputPrompt, list, dialogState) {
    debug('askWithList: inputPrompt=%s, list=%s, dialogState=%s',
      JSON.stringify(inputPrompt), JSON.stringify(list), JSON.stringify(dialogState));
    if (!list || typeof list !== 'object') {
      this.handleError_('Invalid list');
      return null;
    }
    if (list.items.length < 2) {
      this.handleError_('List requires at least 2 items');
      return null;
    }
    const expectedIntent = this.buildExpectedIntent_(this.StandardIntents.OPTION, []);
    if (!expectedIntent) {
      error('Error in building expected intent');
      return null;
    }
    if (this.isNotApiVersionOne_()) {
      expectedIntent.inputValueData = Object.assign({
        [this.ANY_TYPE_PROPERTY_]: this.InputValueDataTypes_.OPTION
      }, {
        listSelect: list
      });
    } else {
      expectedIntent.inputValueSpec = {
        optionValueSpec: {
          listSelect: list
        }
      };
    }
    return this.buildAskHelper_(inputPrompt, [expectedIntent], dialogState);
  }

  /**
   * Asks user for delivery address.
   *
   * @example
   * const app = new ActionsSdkApp({request, response});
   * const WELCOME_INTENT = app.StandardIntents.MAIN;
   * const DELIVERY_INTENT = app.StandardIntents.DELIVERY_ADDRESS;
   *
   * function welcomeIntent (app) {
   *   app.askForDeliveryAddress('To make sure I can deliver to you');
   * }
   *
   * function addressIntent (app) {
   *   const postalCode = app.getDeliveryAddress().postalAddress.postalCode;
   *   if (isInDeliveryZone(postalCode)) {
   *     app.tell('Great looks like you\'re in our delivery area!');
   *   } else {
   *     app.tell('I\'m sorry it looks like we can\'t deliver to you.');
   *   }
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(WELCOME_INTENT, welcomeIntent);
   * actionMap.set(DELIVERY_INTENT, addressIntent);
   * app.handleRequest(actionMap);
   *
   * @param {string} reason Reason given to user for asking delivery address.
   * @param {Object=} dialogState JSON object the app uses to hold dialog state that
   *     will be circulated back by Assistant.
   * @return {Object} HTTP response.
   * @apiai
   */
  askForDeliveryAddress (reason, dialogState) {
    debug('askForDeliveryAddress: reason=%s', reason);
    if (!reason) {
      this.handleError_('reason cannot be empty');
      return null;
    }
    const expectedIntent = this.buildExpectedIntent_(this.StandardIntents.DELIVERY_ADDRESS, []);
    if (!expectedIntent) {
      error('Error in building expected intent');
      return null;
    }
    expectedIntent.inputValueData = Object.assign({
      [this.ANY_TYPE_PROPERTY_]: this.InputValueDataTypes_.DELIVERY_ADDRESS
    }, {
      addressOptions: {
        reason: reason
      }
    });
    const inputPrompt = this.buildInputPrompt(false,
      'PLACEHOLDER_FOR_DELIVERY_ADDRESS');
    return this.buildAskHelper_(inputPrompt, [expectedIntent], dialogState);
  }

  /**
   * Asks to collect user's input with a carousel.
   *
   * @example
   * const app = new ActionsSdkApp({request, response});
   *
   * function welcomeIntent (app) {
   *   app.askWithCarousel('Which of these looks good?',
   *     app.buildCarousel()
   *      .addItems([
   *        app.buildOptionItem(SELECTION_KEY_ONE,
   *          ['synonym of KEY_ONE 1', 'synonym of KEY_ONE 2'])
   *          .setTitle('Number one'),
   *        app.buildOptionItem(SELECTION_KEY_TWO,
   *          ['synonym of KEY_TWO 1', 'synonym of KEY_TWO 2'])
   *          .setTitle('Number two'),
   *      ]));
   * }
   *
   * function optionIntent (app) {
   *   if (app.getSelectedOption() === SELECTION_KEY_ONE) {
   *     app.tell('Number one is a great choice!');
   *   } else {
   *     app.tell('Number two is a great choice!');
   *   }
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(app.StandardIntents.TEXT, welcomeIntent);
   * actionMap.set(app.StandardIntents.OPTION, optionIntent);
   * app.handleRequest(actionMap);
   *
   * @param {Object|SimpleResponse|RichResponse} inputPrompt Holding initial and
   *     no-input prompts. Cannot contain basic card.
   * @param {Carousel} carousel Carousel built with
   *      {@link AssistantApp#buildCarousel|buildCarousel}.
   * @param {Object=} dialogState JSON object the app uses to hold dialog state that
   *     will be circulated back by Assistant.
   * @return The response that is sent to Assistant to ask user to provide input.
   * @actionssdk
   */
  askWithCarousel (inputPrompt, carousel, dialogState) {
    debug('askWithCarousel: inputPrompt=%s, carousel=%s, dialogState=%s',
      JSON.stringify(inputPrompt), JSON.stringify(carousel), JSON.stringify(dialogState));
    if (!carousel || typeof carousel !== 'object') {
      this.handleError_('Invalid carousel');
      return null;
    }
    if (carousel.items.length < 2) {
      this.handleError_('Carousel requires at least 2 items');
      return null;
    }
    const expectedIntent = this.buildExpectedIntent_(this.StandardIntents.OPTION, []);
    if (!expectedIntent) {
      error('Error in building expected intent');
      return null;
    }
    if (this.isNotApiVersionOne_()) {
      expectedIntent.inputValueData = Object.assign({
        [this.ANY_TYPE_PROPERTY_]: this.InputValueDataTypes_.OPTION
      }, {
        carouselSelect: carousel
      });
    } else {
      expectedIntent.inputValueSpec = {
        optionValueSpec: {
          carouselSelect: carousel
        }
      };
    }
    return this.buildAskHelper_(inputPrompt, [expectedIntent], dialogState);
  }

  /**
   * Tells Assistant to render the speech response and close the mic.
   *
   * @example
   * const app = new ActionsSdkApp({request: request, response: response});
   *
   * function mainIntent (app) {
   *   const inputPrompt = app.buildInputPrompt(true, '<speak>Hi! <break time="1"/> ' +
   *         'I can read out an ordinal like ' +
   *         '<say-as interpret-as="ordinal">123</say-as>. Say a number.</speak>',
   *         ['I didn\'t hear a number', 'If you\'re still there, what\'s the number?', 'What is the number?']);
   *   app.ask(inputPrompt);
   * }
   *
   * function rawInput (app) {
   *   if (app.getRawInput() === 'bye') {
   *     app.tell('Goodbye!');
   *   } else {
   *     const inputPrompt = app.buildInputPrompt(true, '<speak>You said, <say-as interpret-as="ordinal">' +
   *       app.getRawInput() + '</say-as></speak>',
   *         ['I didn\'t hear a number', 'If you\'re still there, what\'s the number?', 'What is the number?']);
   *     app.ask(inputPrompt);
   *   }
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(app.StandardIntents.MAIN, mainIntent);
   * actionMap.set(app.StandardIntents.TEXT, rawInput);
   *
   * app.handleRequest(actionMap);
   *
   * @param {string|SimpleResponse|RichResponse} textToSpeech Final response.
   *     Spoken response can be SSML.
   * @return The HTTP response that is sent back to Assistant.
   * @actionssdk
   */
  tell (textToSpeech) {
    debug('tell: textToSpeech=%s', textToSpeech);
    if (!textToSpeech) {
      this.handleError_('Invalid speech response');
      return null;
    }
    const finalResponse = {};
    if (typeof textToSpeech === 'string') {
      if (this.isSsml_(textToSpeech)) {
        finalResponse.speechResponse = {
          ssml: textToSpeech
        };
      } else {
        finalResponse.speechResponse = {
          textToSpeech: textToSpeech
        };
      }
    } else {
      if (textToSpeech.items) {
        finalResponse.richResponse = textToSpeech;
      } else if (textToSpeech.speech) {
        finalResponse.richResponse = this.buildRichResponse()
          .addSimpleResponse(textToSpeech);
      } else {
        this.handleError_('Invalid speech response. Must be string, ' +
          'RichResponse or SimpleResponse.');
        return null;
      }
    }
    const response = this.buildResponseHelper_(null, false, null, finalResponse);
    return this.doResponse_(response, RESPONSE_CODE_OK);
  }

  /**
   * Builds the {@link https://developers.google.com/actions/reference/conversation#InputPrompt|InputPrompt object}
   * from initial prompt and no-input prompts.
   *
   * The App needs one initial prompt to start the conversation. If there is no user response,
   * the App re-opens the mic and renders the no-input prompts three times
   * (one for each no-input prompt that was configured) to help the user
   * provide the right response.
   *
   * Note: we highly recommend app to provide all the prompts required here in order to ensure a
   * good user experience.
   *
   * @example
   * const inputPrompt = app.buildInputPrompt(false, 'Welcome to action snippets! Say a number.',
   *     ['Say any number', 'Pick a number', 'What is the number?']);
   * app.ask(inputPrompt);
   *
   * @param {boolean} isSsml Indicates whether the text to speech is SSML or not.
   * @param {string} initialPrompt The initial prompt the App asks the user.
   * @param {Array<string>=} noInputs Array of re-prompts when the user does not respond (max 3).
   * @return {Object} An {@link https://developers.google.com/actions/reference/conversation#InputPrompt|InputPrompt object}.
   * @actionssdk
   */
  buildInputPrompt (isSsml, initialPrompt, noInputs) {
    debug('buildInputPrompt: isSsml=%s, initialPrompt=%s, noInputs=%s',
      isSsml, initialPrompt, noInputs);
    const initials = [];

    if (noInputs) {
      if (noInputs.length > INPUTS_MAX) {
        this.handleError_('Invalid number of no inputs');
        return null;
      }
    } else {
      noInputs = [];
    }

    this.maybeAddItemToArray_(initialPrompt, initials);
    if (isSsml) {
      return {
        initialPrompts: this.buildPromptsFromSsmlHelper_(initials),
        noInputPrompts: this.buildPromptsFromSsmlHelper_(noInputs)
      };
    } else {
      return {
        initialPrompts: this.buildPromptsFromPlainTextHelper_(initials),
        noInputPrompts: this.buildPromptsFromPlainTextHelper_(noInputs)
      };
    }
  }

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
  getTopInput_ () {
    debug('getTopInput_');
    if (!this.body_.inputs || this.body_.inputs.length === 0) {
      this.handleError_('Missing inputs from request body');
      return null;
    }
    return this.body_.inputs[0];
  }

  /**
   * Builds the response to send back to Assistant.
   *
   * @param {string} conversationToken The dialog state.
   * @param {boolean} expectUserResponse The expected user response.
   * @param {Object} expectedInput The expected response.
   * @param {boolean} finalResponse The final response.
   * @return {Object} Final response returned to server.
   * @private
   * @actionssdk
   */
  buildResponseHelper_ (conversationToken, expectUserResponse, expectedInput, finalResponse) {
    debug('buildResponseHelper_: conversationToken=%s, expectUserResponse=%s, ' +
      'expectedInput=%s, finalResponse=%s',
      conversationToken, expectUserResponse, JSON.stringify(expectedInput),
      JSON.stringify(finalResponse));
    const response = {};
    if (conversationToken) {
      response.conversationToken = conversationToken;
    }
    response.expectUserResponse = expectUserResponse;
    if (expectedInput) {
      response.expectedInputs = expectedInput;
    }
    if (!expectUserResponse && finalResponse) {
      response.finalResponse = finalResponse;
    }
    return response;
  }

  /**
   * Helper to add item to an array.
   *
   * @private
   * @actionssdk
   */
  maybeAddItemToArray_ (item, array) {
    debug('maybeAddItemToArray_: item=%s, array=%s', item, array);
    if (!array) {
      this.handleError_('Invalid array');
      return;
    }
    if (!item) {
      // ignore add
      return;
    }
    array.push(item);
  }

  /**
   * Get the argument by name from the current action.
   *
   * @param {string} argName Name of the argument.
   * @return {Object} Argument value matching argName
         or null if no matching argument.
   * @private
   * @actionssdk
   */
  getArgument_ (argName) {
    debug('getArgument_: argName=%s', argName);
    if (!argName) {
      this.handleError_('Invalid argument name');
      return null;
    }
    const input = this.getTopInput_();
    if (!input) {
      this.handleError_('Missing action');
      return null;
    }
    if (!arguments) {
      debug('No arguments included in request');
      return null;
    }
    for (let i = 0; i < input.arguments.length; i++) {
      if (input.arguments[i].name === argName) {
        return input.arguments[i];
      }
    }
    debug('Failed to find argument: %s', argName);
    return null;
  }

  /**
   * Extract session data from the incoming JSON request.
   *
   * @private
   * @actionssdk
   */
  extractData_ () {
    debug('extractData_');
    if (this.body_.conversation &&
      this.body_.conversation.conversationToken) {
      const json = JSON.parse(this.body_.conversation.conversationToken);
      this.data = json.data;
      this.state = json.state;
    } else {
      this.data = {};
    }
  }

  /**
   * Uses a PermissionsValueSpec object to construct and send a
   * permissions request to user.
   *
   * @param {Object} permissionsSpec PermissionsValueSpec object containing
   *     the permissions prefix and the permissions requested.
   * @param {Object} dialogState JSON object the app uses to hold dialog state that
   *     will be circulated back by Assistant.
   * @return {Object} HTTP response object.
   * @private
   * @actionssdk
   */
  fulfillPermissionsRequest_ (permissionsSpec, dialogState) {
    debug('fulfillPermissionsRequest_: permissionsSpec=%s, dialogState=%s',
      JSON.stringify(permissionsSpec), JSON.stringify(dialogState));
    // Build an Expected Intent object.
    const expectedIntent = {
      intent: this.StandardIntents.PERMISSION
    };
    if (this.isNotApiVersionOne_()) {
      expectedIntent.inputValueData = Object.assign({
        [this.ANY_TYPE_PROPERTY_]: this.InputValueDataTypes_.PERMISSION
      }, permissionsSpec);
    } else {
      expectedIntent.inputValueSpec = {
        permissionValueSpec: permissionsSpec
      };
    }
    const inputPrompt = this.buildInputPrompt(false, 'PLACEHOLDER_FOR_PERMISSION');
    if (!dialogState) {
      dialogState = {
        'state': (this.state instanceof State ? this.state.getName() : this.state),
        'data': this.data
      };
    }
    return this.buildAskHelper_(inputPrompt, [expectedIntent], dialogState);
  }

  /**
   * Uses TransactionRequirementsCheckValueSpec to construct and send a
   * transaction requirements request to Google.
   *
   * @param {Object} transactionRequirementsSpec TransactionRequirementsSpec
   *     object.
   * @param {Object} dialogState JSON object the app uses to hold dialog state that
   *     will be circulated back by Assistant.
   * @return {Object} HTTP response.
   * @private
   * @actionssdk
   */
  fulfillTransactionRequirementsCheck_ (transactionRequirementsSpec, dialogState) {
    debug('fulfillTransactionRequirementsCheck_: transactionRequirementsSpec=%s,' +
      ' dialogState=%s',
      JSON.stringify(transactionRequirementsSpec), JSON.stringify(dialogState));
    // Build an Expected Intent object.
    const expectedIntent = {
      intent: this.StandardIntents.TRANSACTION_REQUIREMENTS_CHECK
    };
    expectedIntent.inputValueData = Object.assign({
      [this.ANY_TYPE_PROPERTY_]: this.InputValueDataTypes_.TRANSACTION_REQ_CHECK
    }, transactionRequirementsSpec);
    const inputPrompt = this.buildInputPrompt(false, 'PLACEHOLDER_FOR_TXN_REQUIREMENTS');
    if (!dialogState) {
      dialogState = {
        'state': (this.state instanceof State ? this.state.getName() : this.state),
        'data': this.data
      };
    }
    return this.buildAskHelper_(inputPrompt, [expectedIntent], dialogState);
  }

  /**
   * Uses TransactionDecisionValueSpec to construct and send a transaction
   * requirements request to Google.
   *
   * @param {Object} transactionDecisionValueSpec TransactionDecisionValueSpec
   *     object.
   * @param {Object} dialogState JSON object the app uses to hold dialog state that
   *     will be circulated back by Assistant.
   * @return {Object} HTTP response.
   * @private
   * @actionssdk
   */
  fulfillTransactionDecision_ (transactionDecisionValueSpec, dialogState) {
    debug('fulfillTransactionDecision_: transactionDecisionValueSpec=%s,' +
        ' dialogState=%s',
      JSON.stringify(transactionDecisionValueSpec), JSON.stringify(dialogState));
    // Build an Expected Intent object.
    const expectedIntent = {
      intent: this.StandardIntents.TRANSACTION_DECISION
    };
    expectedIntent.inputValueData = Object.assign({
      [this.ANY_TYPE_PROPERTY_]: this.InputValueDataTypes_.TRANSACTION_DECISION
    }, transactionDecisionValueSpec);
    // Send an Ask request to Assistant.
    const inputPrompt = this.buildInputPrompt(false, 'PLACEHOLDER_FOR_TXN_DECISION');
    if (!dialogState) {
      dialogState = {
        'state': (this.state instanceof State ? this.state.getName() : this.state),
        'data': this.data
      };
    }
    return this.buildAskHelper_(inputPrompt, [expectedIntent], dialogState);
  }

  /**
   * Uses ConfirmationValueSpec to construct and send a confirmation request to
   * Google.
   *
   * @param {Object} confirmationValueSpec ConfirmationValueSpec object.
   * @return {Object} HTTP response.
   * @private
   * @actionssdk
   */
  fulfillConfirmationRequest_ (confirmationValueSpec, dialogState) {
    debug('fulfillConfirmationRequest_: confirmationValueSpec=%s,' +
      ' dialogState=%s', JSON.stringify(confirmationValueSpec),
      JSON.stringify(dialogState));
    // Build an Expected Intent object.
    const expectedIntent = {
      intent: this.StandardIntents.CONFIRMATION
    };
    expectedIntent.inputValueData = Object.assign({
      [this.ANY_TYPE_PROPERTY_]: this.InputValueDataTypes_.CONFIRMATION
    }, confirmationValueSpec);
    // Send an Ask request to Assistant.
    const inputPrompt = this.buildInputPrompt(false, 'PLACEHOLDER_FOR_CONFIRMATION');
    if (!dialogState) {
      dialogState = {
        'state': (this.state instanceof State ? this.state.getName() : this.state),
        'data': this.data
      };
    }
    return this.buildAskHelper_(inputPrompt, [expectedIntent], dialogState);
  }

  /**
   * Uses DateTimeValueSpec to construct and send a datetime request to Google.
   *
   * @param {Object} dateTimeValueSpec DateTimeValueSpec object.
   * @return {Object} HTTP response.
   * @private
   * @actionssdk
   */
  fulfillDateTimeRequest_ (dateTimeValueSpec, dialogState) {
    debug('fulfillDateTimeRequest_: dateTimeValueSpec=%s,' +
      ' dialogState=%s', JSON.stringify(dateTimeValueSpec),
      JSON.stringify(dialogState));
    // Build an Expected Intent object.
    const expectedIntent = {
      intent: this.StandardIntents.DATETIME
    };
    expectedIntent.inputValueData = Object.assign({
      [this.ANY_TYPE_PROPERTY_]: this.InputValueDataTypes_.DATETIME
    }, dateTimeValueSpec);
    // Send an Ask request to Assistant.
    const inputPrompt = this.buildInputPrompt(false, 'PLACEHOLDER_FOR_DATETIME');
    if (!dialogState) {
      dialogState = {
        'state': (this.state instanceof State ? this.state.getName() : this.state),
        'data': this.data
      };
    }
    return this.buildAskHelper_(inputPrompt, [expectedIntent], dialogState);
  }

  /**
   * Construct and send a sign in request to Google.
   *
   * @return {Object} HTTP response.
   * @private
   * @actionssdk
   */
  fulfillSignInRequest_ (dialogState) {
    debug('fulfillSignInRequest_: dialogState=%s', JSON.stringify(dialogState));
    // Build an Expected Intent object.
    const expectedIntent = {
      intent: this.StandardIntents.SIGN_IN
    };
    expectedIntent.inputValueData = {};
    // Send an Ask request to Assistant.
    const inputPrompt = this.buildInputPrompt(false, 'PLACEHOLDER_FOR_SIGN_IN');
    if (!dialogState) {
      dialogState = {
        'state': (this.state instanceof State ? this.state.getName() : this.state),
        'data': this.data
      };
    }
    return this.buildAskHelper_(inputPrompt, [expectedIntent], dialogState);
  }

  /**
   * Builds the ask response to send back to Assistant.
   *
   * @param {Object} inputPrompt Holding initial and no-input prompts.
   * @param {Array} possibleIntents Array of ExpectedIntents.
   * @param {Object} dialogState JSON object the app uses to hold dialog state that
   *     will be circulated back by Assistant.
   * @return The response that is sent to Assistant to ask user to provide input.
   * @private
   * @actionssdk
   */
  buildAskHelper_ (inputPrompt, possibleIntents, dialogState) {
    debug('buildAskHelper_: inputPrompt=%s, possibleIntents=%s,  dialogState=%s',
      inputPrompt, possibleIntents, JSON.stringify(dialogState));
    if (!inputPrompt) {
      this.handleError_('Invalid input prompt');
      return null;
    }
    if (typeof inputPrompt === 'string') {
      inputPrompt = this.buildInputPrompt(this.isSsml_(inputPrompt), inputPrompt);
    } else {
      if (inputPrompt.speech) {
        inputPrompt = { richInitialPrompt: this.buildRichResponse()
          .addSimpleResponse(inputPrompt) };
      } else if (inputPrompt.items) {
        inputPrompt = { richInitialPrompt: inputPrompt };
      }
    }
    if (!dialogState) {
      dialogState = {
        'state': (this.state instanceof State ? this.state.getName() : this.state),
        'data': this.data
      };
    } else if (Array.isArray(dialogState)) {
      this.handleError_('Invalid dialog state');
      return null;
    }
    const expectedInputs = [{
      inputPrompt: inputPrompt,
      possibleIntents: possibleIntents
    }];
    const response = this.buildResponseHelper_(
      JSON.stringify(dialogState),
      true, // expectedUserResponse
      expectedInputs,
      null // finalResponse is null b/c dialog is active
    );
    return this.doResponse_(response, RESPONSE_CODE_OK);
  }

  /**
   * Builds an ExpectedIntent object. Refer to {@link ActionsSdkApp#newRuntimeEntity} to create the list
   * of runtime entities required by this method. Runtime entities need to be defined in
   * the Action Package.
   *
   * @param {string} intent Developer specified in-dialog intent inside the Action
   *     Package or an App built-in intent like
   *     'assistant.intent.action.TEXT'.
   * @return {Object} An {@link https://developers.google.com/actions/reference/conversation#ExpectedIntent|ExpectedIntent object}
         encapsulating the intent and the runtime entities.
   * @private
   * @actionssdk
   */
  buildExpectedIntent_ (intent) {
    debug('buildExpectedIntent_: intent=%s', intent);
    if (!intent || intent === '') {
      this.handleError_('Invalid intent');
      return null;
    }
    const expectedIntent = {
      intent: intent
    };
    return expectedIntent;
  }
};

module.exports = ActionsSdkApp;
