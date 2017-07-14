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

'use strict';

const Debug = require('debug');
const debug = Debug('actions-on-google:debug');
const error = Debug('actions-on-google:error');

// RequestExtractor
const RequestExtractor = require('./request-extractor');

// Response Builder classes
const RichResponse = require('./response-builder').RichResponse;
const BasicCard = require('./response-builder').BasicCard;
const List = require('./response-builder').List;
const Carousel = require('./response-builder').Carousel;
const OptionItem = require('./response-builder').OptionItem;
const isSsml = require('./response-builder').isSsml;

// Transaction classes
const TransactionValues = require('./transactions').TransactionValues;
const Order = require('./transactions').Order;
const Cart = require('./transactions').Cart;
const LineItem = require('./transactions').LineItem;
const OrderUpdate = require('./transactions').OrderUpdate;

const transformToSnakeCase = require('./utils/transform').transformToSnakeCase;

// Constants
const ERROR_MESSAGE = 'Sorry, I am unable to process your request.';
const API_ERROR_MESSAGE_PREFIX = 'Action Error: ';
const CONVERSATION_API_VERSION_HEADER = 'Google-Assistant-API-Version';
const ACTIONS_CONVERSATION_API_VERSION_HEADER = 'Google-Actions-API-Version';
const ACTIONS_CONVERSATION_API_VERSION_TWO = 2;
const RESPONSE_CODE_OK = 200;
const RESPONSE_CODE_BAD_REQUEST = 400;
const HTTP_CONTENT_TYPE_HEADER = 'Content-Type';
const HTTP_CONTENT_TYPE_JSON = 'application/json';

// Configure logging for hosting platforms that only support console.log and console.error
debug.log = console.log.bind(console);
error.log = console.error.bind(console);

/**
 * The Actions on Google client library AssistantApp base class.
 *
 * This class contains the methods that are shared between platforms to support the conversation API
 * protocol from Assistant. It also exports the 'State' class as a helper to represent states by
 * name.
 */
class AssistantApp {
  /**
   * Constructor for AssistantApp object.
   * Should not be instantiated; rather instantiate one of the subclasses
   * {@link ActionsSdkApp} or {@link ApiAiApp}.
   *
   * @param {Object} options JSON configuration.
   * @param {Object} options.request Express HTTP request object.
   * @param {Object} options.response Express HTTP response object.
   * @param {Function=} options.sessionStarted Function callback when session starts.
   * @param {function(): *} requestData Function that returns the
   *     request data object to be processed.
   */
  constructor (options, requestData) {
    debug('AssistantApp constructor');

    if (!options) {
      // ignore for JavaScript inheritance to work

      // As a workaround for pre-existing sample code which incorrectly
      // initializes this class without an options object.
      this.StandardIntents = {
        MAIN: 'assistant.intent.action.MAIN',
        TEXT: 'assistant.intent.action.TEXT',
        PERMISSION: 'assistant.intent.action.PERMISSION'
      };
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
     * @private
     * @type {Object}
     */
    this.request_ = options.request;

    /**
     * The Express HTTP response the endpoint will return to Assistant.
     * @private
     * @type {Object}
     */
    this.response_ = options.response;

    /**
     * 'sessionStarted' callback (optional).
     * @private
     * @type {Function}
     */
    this.sessionStarted_ = options.sessionStarted;

    debug('Request from Assistant: %s', JSON.stringify(this.request_.body));

    /**
     * The request body contains query JSON and previous session variables.
     * Assignment using JSON parse/stringify ensures manipulation of this.body_
     * does not affect passed in request body structure.
     * @private
     * @type {Object}
     */
    this.body_ = JSON.parse(JSON.stringify(this.request_.body));

    /**
     * API version describes version of the Actions API request.
     * @private
     * @type {string}
     */
    this.actionsApiVersion_ = null;
    // Populates API version from either request header or APIAI orig request.
    if (this.request_.get(ACTIONS_CONVERSATION_API_VERSION_HEADER)) {
      this.actionsApiVersion_ = this.request_.get(ACTIONS_CONVERSATION_API_VERSION_HEADER);
      debug('Actions API version from header: ' + this.actionsApiVersion_);
    }
    if (this.body_.originalRequest &&
      this.body_.originalRequest.version) {
      this.actionsApiVersion_ = this.body_.originalRequest.version;
      debug('Actions API version from APIAI: ' + this.actionsApiVersion_);
    }

    /**
     * Intent handling data structure.
     * @private
     * @type {Object}
     */
    this.handler_ = null;

    /**
     * Intent mapping data structure.
     * @private
     * @type {Object}
     */
    this.intentMap_ = null;

    /**
     * Intent state data structure.
     * @private
     * @type {Object}
     */
    this.stateMap_ = null;

    /**
     * The session state.
     * @public
     * @type {string}
     */
    this.state = null;

    /**
     * The session data in JSON format.
     * @public
     * @type {Object}
     */
    this.data = {};

    /**
     * The API.AI context.
     * @private
     * @type {Object}
     */
    this.contexts_ = {};

    /**
     * The last error message.
     * @private
     * @type {string}
     */
    this.lastErrorMessage_ = null;

    /**
     * Track if an HTTP response has been sent already.
     * @private
     * @type {boolean}
     */
    this.responded_ = false;

    /**
     * List of standard intents that the app provides.
     * @readonly
     * @enum {string}
     * @actionssdk
     * @apiai
     */
    this.StandardIntents = {
      /** App fires MAIN intent for queries like [talk to $app]. */
      MAIN: this.isNotApiVersionOne_() ? 'actions.intent.MAIN' : 'assistant.intent.action.MAIN',
      /** App fires TEXT intent when action issues ask intent. */
      TEXT: this.isNotApiVersionOne_() ? 'actions.intent.TEXT' : 'assistant.intent.action.TEXT',
      /** App fires PERMISSION intent when action invokes askForPermission. */
      PERMISSION: this.isNotApiVersionOne_() ? 'actions.intent.PERMISSION' : 'assistant.intent.action.PERMISSION',
      /** App fires OPTION intent when user chooses from options provided. */
      OPTION: 'actions.intent.OPTION',
      /** App fires TRANSACTION_REQUIREMENTS_CHECK intent when action sets up transaction. */
      TRANSACTION_REQUIREMENTS_CHECK: 'actions.intent.TRANSACTION_REQUIREMENTS_CHECK',
      /** App fires DELIVERY_ADDRESS intent when action asks for delivery address. */
      DELIVERY_ADDRESS: 'actions.intent.DELIVERY_ADDRESS',
      /** App fires TRANSACTION_DECISION intent when action asks for transaction decision. */
      TRANSACTION_DECISION: 'actions.intent.TRANSACTION_DECISION',
      /** App fires CONFIRMATION intent when requesting affirmation from user. */
      CONFIRMATION: 'actions.intent.CONFIRMATION',
      /** App fires DATETIME intent when requesting date/time from user. */
      DATETIME: 'actions.intent.DATETIME',
      /** App fires SIGN_IN intent when requesting sign-in from user. */
      SIGN_IN: 'actions.intent.SIGN_IN'
    };

    /**
     * List of supported permissions the app supports.
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
      PERMISSION_GRANTED: this.isNotApiVersionOne_() ? 'PERMISSION' : 'permission_granted',
      /** Option selected argument. */
      OPTION: 'OPTION',
      /** Transaction requirements check result argument. */
      TRANSACTION_REQ_CHECK_RESULT: 'TRANSACTION_REQUIREMENTS_CHECK_RESULT',
      /** Delivery address value argument. */
      DELIVERY_ADDRESS_VALUE: 'DELIVERY_ADDRESS_VALUE',
      /** Transactions decision argument. */
      TRANSACTION_DECISION_VALUE: 'TRANSACTION_DECISION_VALUE',
      /** Confirmation argument. */
      CONFIRMATION: 'CONFIRMATION',
      /** DateTime argument. */
      DATETIME: 'DATETIME',
      /** Sign in status argument. */
      SIGN_IN: 'SIGN_IN'
    };

    /**
     * The property name used when specifying an input value data spec.
     * @readonly
     * @type {string}
     * @actionssdk
     * @apiai
     */
    this.ANY_TYPE_PROPERTY_ = '@type';

    /**
     * List of built-in value type names.
     * @private
     * @readonly
     * @enum {string}
     * @actionssdk
     * @apiai
     */
    this.InputValueDataTypes_ = {
      /** Permission Value Spec. */
      PERMISSION: 'type.googleapis.com/google.actions.v2.PermissionValueSpec',
      /** Option Value Spec. */
      OPTION: 'type.googleapis.com/google.actions.v2.OptionValueSpec',
      /** Transaction Requirements Check Value Spec. */
      TRANSACTION_REQ_CHECK: 'type.googleapis.com/google.actions.v2.TransactionRequirementsCheckSpec',
      /** Delivery Address Value Spec. */
      DELIVERY_ADDRESS: 'type.googleapis.com/google.actions.v2.DeliveryAddressValueSpec',
      /** Transaction Decision Value Spec. */
      TRANSACTION_DECISION: 'type.googleapis.com/google.actions.v2.TransactionDecisionValueSpec',
      /** Confirmation Value Spec. */
      CONFIRMATION: 'type.googleapis.com/google.actions.v2.ConfirmationValueSpec',
      /** DateTime Value Spec. */
      DATETIME: 'type.googleapis.com/google.actions.v2.DateTimeValueSpec'
    };

    /**
     * List of possible conversation stages, as defined in the
     * {@link https://developers.google.com/actions/reference/conversation#Conversation|Conversation object}.
     * @readonly
     * @enum {number}
     * @actionssdk
     * @apiai
     */
    this.ConversationStages = {
      /**
       * Unspecified conversation state.
       */
      UNSPECIFIED: this.isNotApiVersionOne_() ? 'UNSPECIFIED' : 0,
      /**
       * A new conversation.
       */
      NEW: this.isNotApiVersionOne_() ? 'NEW' : 1,
      /**
       * An active (ongoing) conversation.
       */
      ACTIVE: this.isNotApiVersionOne_() ? 'ACTIVE' : 2
    };

    /**
     * List of surface capabilities supported by the app.
     * @readonly
     * @enum {string}
     * @actionssdk
     * @apiai
     */
    this.SurfaceCapabilities = {
      /**
       * The ability to output audio.
       */
      AUDIO_OUTPUT: 'actions.capability.AUDIO_OUTPUT',
      /**
       * The ability to output on a screen
       */
      SCREEN_OUTPUT: 'actions.capability.SCREEN_OUTPUT'
    };

    /**
     * List of possible user input types.
     * @readonly
     * @enum {number}
     * @actionssdk
     * @apiai
     */
    this.InputTypes = {
      /**
       * Unspecified.
       */
      UNSPECIFIED: this.isNotApiVersionOne_() ? 'UNSPECIFIED' : 0,
      /**
       * Input given by touch.
       */
      TOUCH: this.isNotApiVersionOne_() ? 'TOUCH' : 1,
      /**
       * Input given by voice (spoken).
       */
      VOICE: this.isNotApiVersionOne_() ? 'VOICE' : 2,
      /**
       * Input given by keyboard (typed).
       */
      KEYBOARD: this.isNotApiVersionOne_() ? 'KEYBOARD' : 3
    };

    /**
     * List of possible sign in result status values.
     * @readonly
     * @enum {string}
     * @actionssdk
     * @apiai
     */
    this.SignInStatus = {
      // Unknown status.
      UNSPECIFIED: 'SIGN_IN_STATUS_UNSPECIFIED',
      // User successfully completed the account linking.
      OK: 'OK',
      // Cancelled or dismissed account linking.
      CANCELLED: 'CANCELLED',
      // System or network error.
      ERROR: 'ERROR'
    };

    /**
     * API version describes version of the Assistant request.
     * @deprecated
     * @private
     * @type {string}
     */
    this.apiVersion_ = null;
    // Populates API version.
    if (this.request_.get(CONVERSATION_API_VERSION_HEADER)) {
      this.apiVersion_ = this.request_.get(CONVERSATION_API_VERSION_HEADER);
      debug('Assistant API version: ' + this.apiVersion_);
    }

    /**
     * Values related to supporting {@link Transactions}.
     * @readonly
     * @type {object}
     */
    this.Transactions = TransactionValues;

    /**
     * RequestExtractor for extracting common request data
     */
    const requestExtractor = new RequestExtractor(requestData);
    requestExtractor.inject(this);
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
   * // API.AI
   * const app = new ApiAIApp({request: req, response: res});
   * const NAME_ACTION = 'make_name';
   * const COLOR_ARGUMENT = 'color';
   * const NUMBER_ARGUMENT = 'number';
   *
   * function makeName (app) {
   *   const number = app.getArgument(NUMBER_ARGUMENT);
   *   const color = app.getArgument(COLOR_ARGUMENT);
   *   app.tell('Alright, your silly name is ' +
   *     color + ' ' + number +
   *     '! I hope you like it. See you next time.');
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(NAME_ACTION, makeName);
   * app.handleRequest(actionMap);
   *
   * @param {(Function|Map)} handler The handler (or Map of handlers) for the request.
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
   * Equivalent to {@link AssistantApp#askForPermission|askForPermission},
   * but allows you to prompt the user for more than one permission at once.
   *
   * Notes:
   *
   * * The order in which you specify the permission prompts does not matter -
   *   it is controlled by the Assistant to provide a consistent user experience.
   * * The user will be able to either accept all permissions at once, or none.
   *   If you wish to allow them to selectively accept one or other, make several
   *   dialog turns asking for each permission independently with askForPermission.
   * * Asking for DEVICE_COARSE_LOCATION and DEVICE_PRECISE_LOCATION at once is
   *   equivalent to just asking for DEVICE_PRECISE_LOCATION
   *
   * @example
   * const app = new ApiAIApp({request: req, response: res});
   * const REQUEST_PERMISSION_ACTION = 'request_permission';
   * const GET_RIDE_ACTION = 'get_ride';
   *
   * function requestPermission (app) {
   *   const permission = [
   *     app.SupportedPermissions.NAME,
   *     app.SupportedPermissions.DEVICE_PRECISE_LOCATION
   *   ];
   *   app.askForPermissions('To pick you up', permissions);
   * }
   *
   * function sendRide (app) {
   *   if (app.isPermissionGranted()) {
   *     const displayName = app.getUserName().displayName;
   *     const address = app.getDeviceLocation().address;
   *     app.tell('I will tell your driver to pick up ' + displayName +
   *         ' at ' + address);
   *   } else {
   *     // Response shows that user did not grant permission
   *     app.tell('Sorry, I could not figure out where to pick you up.');
   *   }
   * }
   * const actionMap = new Map();
   * actionMap.set(REQUEST_PERMISSION_ACTION, requestPermission);
   * actionMap.set(GET_RIDE_ACTION, sendRide);
   * app.handleRequest(actionMap);
   *
   * @param {string} context Context why the permission is being asked; it's the TTS
   *     prompt prefix (action phrase) we ask the user.
   * @param {Array<string>} permissions Array of permissions App supports, each of
   *     which comes from AssistantApp.SupportedPermissions.
   * @param {Object=} dialogState JSON object the app uses to hold dialog state that
   *     will be circulated back by Assistant. Used in {@link ActionsSdkAssistant}.
   * @return A response is sent to Assistant to ask for the user's permission; for any
   *     invalid input, we return null.
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
      optContext: context,
      permissions: permissions
    }, dialogState);
  }

  /**
   * Checks whether user is in transactable state.
   *
   * @example
   * const app = new ApiAiApp({request: request, response: response});
   * const WELCOME_INTENT = 'input.welcome';
   * const TXN_REQ_COMPLETE = 'txn.req.complete';
   *
   * let transactionConfig = {
   *     deliveryAddressRequired: false,
   *     type: app.Transactions.PaymentType.BANK,
   *     displayName: 'Checking-1234'
   * };
   * function welcomeIntent (app) {
   *   app.askForTransactionRequirements(transactionConfig);
   * }
   *
   * function txnReqCheck (app) {
   *   if (app.getTransactionRequirementsResult() === app.Transactions.ResultType.OK) {
   *     // continue cart building flow
   *   } else {
   *     // don't continue cart building
   *   }
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(WELCOME_INTENT, welcomeIntent);
   * actionMap.set(TXN_REQ_COMPLETE, txnReqCheck);
   * app.handleRequest(actionMap);
   *
   * @param {ActionPaymentTransactionConfig|GooglePaymentTransactionConfig=}
   *     transactionConfig Configuration for the transaction. Includes payment
   *     options and order options. Optional if order has no payment or
   *     delivery.
   * @param {Object=} dialogState JSON object the app uses to hold dialog state that
   *     will be circulated back by Assistant. Used in {@link ActionsSdkAssistant}.
   * @return {Object} HTTP response.
   * @actionssdk
   * @apiai
   */
  askForTransactionRequirements (transactionConfig, dialogState) {
    debug('checkForTransactionRequirements: transactionConfig=%s,' +
      ' dialogState=%s',
      JSON.stringify(transactionConfig), JSON.stringify(dialogState));
    if (transactionConfig && transactionConfig.type &&
      transactionConfig.cardNetworks) {
      this.handleError_('Invalid transaction configuration. Must be of type' +
        'ActionPaymentTransactionConfig or GooglePaymentTransactionConfig');
      return null;
    }
    const transactionRequirementsCheckSpec = {};
    if (transactionConfig && transactionConfig.deliveryAddressRequired) {
      transactionRequirementsCheckSpec.orderOptions = {
        requestDeliveryAddress: transactionConfig.deliveryAddressRequired
      };
    }
    if (transactionConfig && (transactionConfig.type ||
      transactionConfig.cardNetworks)) {
      transactionRequirementsCheckSpec.paymentOptions =
        this.buildPaymentOptions_(transactionConfig);
    }
    return this.fulfillTransactionRequirementsCheck_(transactionRequirementsCheckSpec,
      dialogState);
  }

  /**
   * Asks user to confirm transaction information.
   *
   * @example
   * const app = new ApiAiApp({request: request, response: response});
   * const WELCOME_INTENT = 'input.welcome';
   * const TXN_COMPLETE = 'txn.complete';
   *
   * let transactionConfig = {
   *     deliveryAddressRequired: false,
   *     type: app.Transactions.PaymentType.BANK,
   *     displayName: 'Checking-1234'
   * };
   *
   * let order = app.buildOrder();
   * // fill order cart
   *
   * function welcomeIntent (app) {
   *   app.askForTransaction(order, transactionConfig);
   * }
   *
   * function txnComplete (app) {
   *   // respond with order update
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(WELCOME_INTENT, welcomeIntent);
   * actionMap.set(TXN_COMPLETE, txnComplete);
   * app.handleRequest(actionMap);
   *
   * @param {Object} order Order built with buildOrder().
   * @param {ActionPaymentTransactionConfig|GooglePaymentTransactionConfig}
   *     transactionConfig Configuration for the transaction. Includes payment
   *     options and order options.
   * @param {Object=} dialogState JSON object the app uses to hold dialog state that
   *     will be circulated back by Assistant. Used in {@link ActionsSdkAssistant}.
   * @apiai
   */
  askForTransactionDecision (order, transactionConfig, dialogState) {
    debug('askForTransactionDecision: order=%s, transactionConfig=%s,' +
      ' dialogState=%s', JSON.stringify(order),
      JSON.stringify(transactionConfig), JSON.stringify(dialogState));
    if (!order) {
      this.handleError_('Invalid order');
      return null;
    }
    if (transactionConfig && transactionConfig.type &&
      transactionConfig.cardNetworks) {
      this.handleError_('Invalid transaction configuration. Must be of type' +
        'ActionPaymentTransactionConfig or GooglePaymentTransactionConfig');
      return null;
    }
    const transactionDecisionValueSpec = {
      proposedOrder: order
    };
    if (transactionConfig && transactionConfig.deliveryAddressRequired) {
      transactionDecisionValueSpec.orderOptions = {
        requestDeliveryAddress: transactionConfig.deliveryAddressRequired
      };
    }
    if (transactionConfig && (transactionConfig.type ||
      transactionConfig.cardNetworks)) {
      transactionDecisionValueSpec.paymentOptions =
        this.buildPaymentOptions_(transactionConfig);
    }
    if (transactionConfig && transactionConfig.customerInfoOptions) {
      if (!transactionDecisionValueSpec.orderOptions) {
        transactionDecisionValueSpec.orderOptions = {};
      }
      transactionDecisionValueSpec.orderOptions.customerInfoOptions =
        transactionConfig.customerInfoOptions;
    }
    return this.fulfillTransactionDecision_(transactionDecisionValueSpec,
      dialogState);
  }

  /**
   * Asks the Assistant to guide the user to grant a permission. For example,
   * if you want your app to get access to the user's name, you would invoke
   * the askForPermission method with a context containing the reason for the request,
   * and the AssistantApp.SupportedPermissions.NAME permission. With this, the Assistant will ask
   * the user, in your agent's voice, the following: '[Context with reason for the request],
   * I'll just need to get your name from Google, is that OK?'.
   *
   * Once the user accepts or denies the request, the Assistant will fire another intent:
   * assistant.intent.action.PERMISSION with a boolean argument: AssistantApp.BuiltInArgNames.PERMISSION_GRANTED
   * and, if granted, the information that you requested.
   *
   * Read more:
   *
   * * {@link https://developers.google.com/actions/reference/conversation#ExpectedIntent|Supported Permissions}
   * * Check if the permission has been granted with {@link ActionsSdkApp#isPermissionGranted|isPermissionsGranted}
   * * {@link ActionsSdkApp#getDeviceLocation|getDeviceLocation}
   * * {@link AssistantApp#getUserName|getUserName}
   *
   * @example
   * const app = new ApiAiApp({request: req, response: res});
   * const REQUEST_PERMISSION_ACTION = 'request_permission';
   * const GET_RIDE_ACTION = 'get_ride';
   *
   * function requestPermission (app) {
   *   const permission = app.SupportedPermissions.NAME;
   *   app.askForPermission('To pick you up', permission);
   * }
   *
   * function sendRide (app) {
   *   if (app.isPermissionGranted()) {
   *     const displayName = app.getUserName().displayName;
   *     app.tell('I will tell your driver to pick up ' + displayName);
   *   } else {
   *     // Response shows that user did not grant permission
   *     app.tell('Sorry, I could not figure out who to pick up.');
   *   }
   * }
   * const actionMap = new Map();
   * actionMap.set(REQUEST_PERMISSION_ACTION, requestPermission);
   * actionMap.set(GET_RIDE_ACTION, sendRide);
   * app.handleRequest(actionMap);
   *
   * @param {string} context Context why permission is asked; it's the TTS
   *     prompt prefix (action phrase) we ask the user.
   * @param {string} permission One of the permissions Assistant supports, each of
   *     which comes from AssistantApp.SupportedPermissions.
   * @param {Object=} dialogState JSON object the app uses to hold dialog state that
   *     will be circulated back by Assistant.
   * @return A response is sent to the Assistant to ask for the user's permission;
   *     for any invalid input, we return null.
   * @actionssdk
   * @apiai
   */
  askForPermission (context, permission, dialogState) {
    debug('askForPermission: context=%s, permission=%s, dialogState=%s',
      context, permission, JSON.stringify(dialogState));
    return this.askForPermissions(context, [permission], dialogState);
  }

  /**
   * Asks user for a confirmation.
   *
   * @example
   * const app = new ApiAiApp({ request, response });
   * const WELCOME_INTENT = 'input.welcome';
   * const CONFIRMATION = 'confirmation';
   *
   * function welcomeIntent (app) {
   *   app.askForConfirmation('Are you sure you want to do that?');
   * }
   *
   * function confirmation (app) {
   *   if (app.getUserConfirmation()) {
   *     app.tell('Great! I\'m glad you want to do it!');
   *   } else {
   *     app.tell('That\'s okay. Let\'s not do it now.');
   *   }
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(WELCOME_INTENT, welcomeIntent);
   * actionMap.set(CONFIRMATION, confirmation);
   * app.handleRequest(actionMap);
   *
   * @param {string=} prompt The confirmation prompt presented to the user to
   *     query for an affirmative or negative response. If undefined or null,
   *     Google will use a generic yes/no prompt.
   * @param {Object=} dialogState JSON object the app uses to hold dialog state that
   *     will be circulated back by Assistant. Used in {@link ActionsSdkAssistant}.
   * @actionssdk
   * @apiai
   */
  askForConfirmation (prompt, dialogState) {
    debug('askForConfirmation: prompt=%s, dialogState=%s', prompt,
      JSON.stringify(dialogState));
    let confirmationValueSpec = {};
    if (prompt) {
      confirmationValueSpec.dialogSpec = {
        requestConfirmationText: prompt
      };
    }
    return this.fulfillConfirmationRequest_(confirmationValueSpec, dialogState);
  }

  /**
   * Asks user for a timezone-agnostic date and time.
   *
   * @example
   * const app = new ApiAiApp({ request, response });
   * const WELCOME_INTENT = 'input.welcome';
   * const DATETIME = 'datetime';
   *
   * function welcomeIntent (app) {
   *   app.askForDateTime('When do you want to come in?',
   *     'Which date works best for you?',
   *     'What time of day works best for you?');
   * }
   *
   * function datetime (app) {
   *   app.tell({speech: 'Great see you at your appointment!',
   *     displayText: 'Great, we will see you on '
   *     + app.getDateTime().date.month
   *     + '/' + app.getDateTime().date.day
   *     + ' at ' + app.getDateTime().time.hours
   *     + (app.getDateTime().time.minutes || '')});
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(WELCOME_INTENT, welcomeIntent);
   * actionMap.set(DATETIME, datetime);
   * app.handleRequest(actionMap);
   *
   * @param {string=} initialPrompt The initial prompt used to ask for a
   *     date and time. If undefined or null, Google will use a generic
   *     prompt.
   * @param {string=} datePrompt The prompt used to specifically ask for the
   *     date if not provided by user. If undefined or null, Google will use a
   *     generic prompt.
   * @param {string=} timePrompt The prompt used to specifically ask for the
   *     time if not provided by user. If undefined or null, Google will use a
   *     generic prompt.
   * @param {Object=} dialogState JSON object the app uses to hold dialog state that
   *     will be circulated back by Assistant. Used in {@link ActionsSdkAssistant}.
   * @actionssdk
   * @apiai
   */
  askForDateTime (initialPrompt, datePrompt, timePrompt, dialogState) {
    debug('askForConfirmation: initialPrompt=%s, datePrompt=%s, ' +
      'timePrompt=%s, dialogState=%s', initialPrompt, datePrompt, timePrompt,
      JSON.stringify(dialogState));
    let confirmationValueSpec = {};
    if (initialPrompt || datePrompt || timePrompt) {
      confirmationValueSpec.dialogSpec = {
        requestDatetimeText: initialPrompt || undefined,
        requestDateText: datePrompt || undefined,
        requestTimeText: timePrompt || undefined
      };
    }
    return this.fulfillDateTimeRequest_(confirmationValueSpec, dialogState);
  }

  /**
   * Hands the user off to a web sign in flow. App sign in and OAuth credentials
   * are set in the {@link https://console.actions.google.com|Actions Console}.
   * Retrieve the access token in subsequent intents using
   * app.getUser().accessToken.
   *
   * Note: Currently this API requires enabling the app for Transactions APIs.
   * To do this, fill out the App Info section of the Actions Console project
   * and check the box indicating the use of Transactions under "Privacy and
   * consent".
   *
   * @example
   * const app = new ApiAiApp({ request, response });
   * const WELCOME_INTENT = 'input.welcome';
   * const SIGN_IN = 'sign.in';
   *
   * function welcomeIntent (app) {
   *   app.askForSignIn();
   * }
   *
   * function signIn (app) {
   *   if (app.getSignInStatus() === app.SignInstatus.OK) {
   *     let accessToken = app.getUser().accessToken;
   *     app.ask('Great, thanks for signing in!');
   *   } else {
   *     app.ask('I won\'t be able to save your data, but let\'s continue!');
   *   }
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(WELCOME_INTENT, welcomeIntent);
   * actionMap.set(SIGN_IN, signIn);
   * app.handleRequest(actionMap);
   *
   * @param {Object=} dialogState JSON object the app uses to hold dialog state that
   *     will be circulated back by Assistant. Used in {@link ActionsSdkAssistant}.
   * @actionssdk
   * @apiai
   */
  askForSignIn (dialogState) {
    debug('askForSignIn: dialogState=%s', JSON.stringify(dialogState));
    return this.fulfillSignInRequest_(dialogState);
  }

  /**
   * User provided date/time info.
   * @typedef {Object} DateTime
   * @property {Object} date
   * @property {number} date.year
   * @property {number} date.month
   * @property {number} date.day
   * @property {Object} time
   * @property {number} time.hours
   * @property {number} time.minutes
   * @property {number} time.seconds
   * @property {number} time.nanos
   */
  /**
   * User's permissioned name info.
   * @typedef {Object} UserName
   * @property {string} displayName - User's display name.
   * @property {string} givenName - User's given name.
   * @property {string} familyName - User's family name.
   */

  /**
   * User's permissioned device location.
   * @typedef {Object} DeviceLocation
   * @property {Object} coordinates - {latitude, longitude}. Requested with
   *     SupportedPermissions.DEVICE_PRECISE_LOCATION.
   * @property {string} address - Full, formatted street address. Requested with
   *     SupportedPermissions.DEVICE_PRECISE_LOCATION.
   * @property {string} zipCode - Zip code. Requested with
   *      SupportedPermissions.DEVICE_COARSE_LOCATION.
   * @property {string} city - Device city. Requested with
   *     SupportedPermissions.DEVICE_COARSE_LOCATION.
   */

   /**
   * User object.
   * @typedef {Object} User
   * @property {string} userId - Random string ID for Google user.
   * @property {UserName} userName - User name information. Null if not
   *     requested with {@link AssistantApp#askForPermission|askForPermission(SupportedPermissions.NAME)}.
   * @property {string} accessToken - Unique Oauth2 token. Only available with
   *     account linking.
   */

  /**
   * If granted permission to user's name in previous intent, returns user's
   * display name, family name, and given name. If name info is unavailable,
   * returns null.
   *
   * @example
   * const app = new ApiAIApp({request: req, response: res});
   * const REQUEST_PERMISSION_ACTION = 'request_permission';
   * const SAY_NAME_ACTION = 'get_name';
   *
   * function requestPermission (app) {
   *   const permission = app.SupportedPermissions.NAME;
   *   app.askForPermission('To know who you are', permission);
   * }
   *
   * function sayName (app) {
   *   if (app.isPermissionGranted()) {
   *     app.tell('Your name is ' + app.getUserName().displayName));
   *   } else {
   *     // Response shows that user did not grant permission
   *     app.tell('Sorry, I could not get your name.');
   *   }
   * }
   * const actionMap = new Map();
   * actionMap.set(REQUEST_PERMISSION_ACTION, requestPermission);
   * actionMap.set(SAY_NAME_ACTION, sayName);
   * app.handleRequest(actionMap);
   * @return {UserName} Null if name permission is not granted.
   * @actionssdk
   * @apiai
   */
  getUserName () {
    debug('getUserName');
    return this.getUser() && this.getUser().userName
      ? this.getUser().userName : null;
  }

  /**
   * Gets the user locale. Returned string represents the regional language
   * information of the user set in their Assistant settings.
   * For example, 'en-US' represents US English.
   *
   * @example
   * const app = new ApiAiApp({request, response});
   * const locale = app.getUserLocale();
   *
   * @return {string} User's locale, e.g. 'en-US'. Null if no locale given.
   * @actionssdk
   * @apiai
   */
  getUserLocale () {
    debug('getUserLocale');
    return this.getUser() && this.getUser().locale
      ? this.getUser().locale : null;
  }

  /**
   * Returns true if user device has a given surface capability.
   *
   * @param {string} capability Must be one of {@link SurfaceCapabilities}.
   * @return {boolean} True if user device has the given capability.
   *
   * @example
   * const app = new ApiAIApp({request: req, response: res});
   * const DESCRIBE_SOMETHING = 'DESCRIBE_SOMETHING';
   *
   * function describe (app) {
   *   if (app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT)) {
   *     app.tell(richResponseWithBasicCard);
   *   } else {
   *     app.tell('Let me tell you about ...');
   *   }
   * }
   * const actionMap = new Map();
   * actionMap.set(DESCRIBE_SOMETHING, describe);
   * app.handleRequest(actionMap);
   *
   * @apiai
   * @actionssdk
   */
  hasSurfaceCapability (requestedCapability) {
    debug('hasSurfaceCapability: requestedCapability=%s', requestedCapability);
    const capabilities = this.getSurfaceCapabilities();
    if (!capabilities) {
      error('No incoming capabilities to search ' +
        'for request capability: %s', requestedCapability);
      return false;
    }
    return capabilities.includes(requestedCapability);
  }

  /**
   * Gets surface capabilities of user device.
   *
   * Implemented in subclasses for Actions SDK and API.AI.
   * @return {Object} HTTP response.
   * @apiai
   * @actionssdk
   */
  getSurfaceCapabilities () {
    debug('getSurfaceCapabilities');
    return [];
  }

  // ---------------------------------------------------------------------------
  //                   Response Builders
  // ---------------------------------------------------------------------------

  /**
   * Constructs RichResponse with chainable property setters.
   *
   * @param {RichResponse=} richResponse RichResponse to clone.
   * @return {RichResponse} Constructed RichResponse.
   */
  buildRichResponse (richResponse) {
    return new RichResponse(richResponse);
  }

  /**
   * Constructs BasicCard with chainable property setters.
   *
   * @param {string=} bodyText Body text of the card. Can be set using setTitle
   *     instead.
   * @return {BasicCard} Constructed BasicCard.
   */
  buildBasicCard (bodyText) {
    const card = new BasicCard();
    if (bodyText) {
      card.setBodyText(bodyText);
    }
    return card;
  }

  /**
   * Constructs List with chainable property setters.
   *
   * @param {string=} title A title to set for a new List.
   * @return {List} Constructed List.
   */
  buildList (title) {
    return new List(title);
  }

  /**
   * Constructs Carousel with chainable property setters.
   *
   * @return {Carousel} Constructed Carousel.
   */
  buildCarousel () {
    return new Carousel();
  }

  /**
   * Constructs OptionItem with chainable property setters.
   *
   * @param {string=} key A unique key to identify this option. This key will
   *     be returned as an argument in the resulting actions.intent.OPTION
   *     intent.
   * @param {string|Array<string>=} synonyms A list of synonyms which the user may
   *     use to identify this option instead of the option key.
   * @return {OptionItem} Constructed OptionItem.
   */
  buildOptionItem (key, synonyms) {
    let optionItem = new OptionItem();
    if (key) {
      optionItem.setKey(key);
    }
    if (synonyms) {
      optionItem.addSynonyms(synonyms);
    }
    return optionItem;
  }

  // ---------------------------------------------------------------------------
  //                   Transaction Builders
  // ---------------------------------------------------------------------------

  /**
   * Constructs Order with chainable property setters.
   *
   * @param {string} orderId Unique identifier for the order.
   * @return {Order} Constructed Order.
   */
  buildOrder (orderId) {
    return new Order(orderId);
  }

  /**
   * Constructs Cart with chainable property setters.
   *
   * @param {string=} cartId Unique identifier for the cart.
   * @return {Cart} Constructed Cart.
   */
  buildCart (cartId) {
    return new Cart(cartId);
  }

  /**
   * Constructs LineItem with chainable property setters.
   *
   * @param {string} name Name of the line item.
   * @param {string} id Unique identifier for the item.
   * @return {LineItem} Constructed LineItem.
   */
  buildLineItem (name, id) {
    return new LineItem(name, id);
  }

  /**
   * Constructs OrderUpdate with chainable property setters.
   *
   * @param {string} orderId Unique identifier of the order.
   * @param {boolean} isGoogleOrderId True if the order ID is provided by
   *     Google. False if the order ID is app provided.
   * @return {OrderUpdate} Constructed OrderUpdate.
   */
  buildOrderUpdate (orderId, isGoogleOrderId) {
    return new OrderUpdate(orderId, isGoogleOrderId);
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
    return isSsml(text);
  }

  /**
   * Utility function to detect incoming request format.
   *
   * @return {boolean} true if request is not Action API Version 1.
   * @private
   */
  isNotApiVersionOne_ () {
    debug('isNotApiVersionOne_');
    return this.actionsApiVersion_ !== null &&
      parseInt(this.actionsApiVersion_, 10) >= ACTIONS_CONVERSATION_API_VERSION_TWO;
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
    // Tell app to say error
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
   * @return {Object} HTTP response.
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
    // If request was in Proto2 format, convert response to Proto2
    if (!this.isNotApiVersionOne_()) {
      if (response.data) {
        response.data = transformToSnakeCase(response.data);
      } else {
        response = transformToSnakeCase(response);
      }
    }
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
   * Uses a ConfirmationValueSpec object to construct and send a
   * confirmation request to user.
   *
   * Used in subclasses for Actions SDK and API.AI.
   * @return {Object} HTTP response.
   * @private
   */
  fulfillConfirmationRequest_ () {
    debug('fulfillConfirmationRequest_');
    return {};
  }

  /**
   * Uses a DateTimeValueSpec object to construct and send a
   * date time request to user.
   *
   * Used in subclasses for Actions SDK and API.AI.
   * @return {Object} HTTP response.
   * @private
   */
  fulfillDateTimeRequest_ () {
    debug('fulfillDateTimeRequest_');
    return {};
  }

  /**
   * Construct and send a sign in request to user.
   *
   * Used in subclasses for Actions SDK and API.AI.
   * @return {Object} HTTP response.
   * @private
   */
  fulfillSignInRequest_ () {
    debug('fulfillSignInRequest_');
    return {};
  }

  /**
   * Uses a TransactionRequirementsCheckValueSpec object to construct and send a
   * transaction requirements request to user.
   *
   * Used in subclasses for Actions SDK and API.AI.
   * @return {Object} HTTP response.
   * @private
   */
  fulfillTransactionRequirementsCheck_ () {
    debug('fulfillTransactionRequirementsCheck_');
    return {};
  }

  /**
   * Uses a TransactionDecisionValueSpec object to construct and send a
   * transaction confirmation request to user.
   *
   * Used in subclasses for Actions SDK and API.AI.
   * @return {Object} HTTP response.
   * @private
   */
  fulfillTransactionDecision_ () {
    debug('fulfillTransactionDecision_');
    return {};
  }

  /**
   * Helper to build prompts from SSML's.
   *
   * @param {Array<string>} ssmls Array of ssml.
   * @return {Array<Object>} Array of SpeechResponse objects.
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
   * @param {Array<string>} plainTexts Array of plain text to speech.
   * @return {Array<Object>} Array of SpeechResponse objects.
   * @private
   */
  buildPromptsFromPlainTextHelper_ (plainTexts) {
    debug('buildPromptsFromPlainTextHelper_: plainTexts=%s', plainTexts);
    const prompts = [];
    for (let i = 0; i < plainTexts.length; i++) {
      const prompt = {
        textToSpeech: plainTexts[i]
      };
      prompts.push(prompt);
    }
    return prompts;
  }

  /**
   * Helper to process a transaction config and create a payment options object.
   *
   * @param {ActionPaymentTransactionConfig|GooglePaymentTransactionConfig}
   *     transactionConfig Configuration for the transaction. Includes payment
   *     options and order options.
   * @return {object} paymentOptions
   * @private
   */
  buildPaymentOptions_ (transactionConfig) {
    debug('buildPromptsFromPlainTextHelper_: transactionConfig=%s',
      JSON.stringify(transactionConfig));
    let paymentOptions = {};
    if (transactionConfig.type) { // Action payment
      paymentOptions.actionProvidedOptions = {
        paymentType: transactionConfig.type,
        displayName: transactionConfig.displayName
      };
    } else { // Google payment
      paymentOptions.googleProvidedOptions = {
        supportedCardNetworks: transactionConfig.cardNetworks,
        prepaidCardDisallowed: transactionConfig.prepaidCardDisallowed
      };
      if (transactionConfig.tokenizationParameters) {
        paymentOptions.googleProvidedOptions.tokenizationParameters = {
          tokenizationType: 'PAYMENT_GATEWAY',
          parameters: transactionConfig.tokenizationParameters
        };
      }
    }
    return paymentOptions;
  }
}

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
  AssistantApp: AssistantApp,
  State: State
};
