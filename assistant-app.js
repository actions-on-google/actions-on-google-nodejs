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

// Response Builder classes
const {
  RichResponse,
  BasicCard,
  List,
  Carousel,
  BrowseCarousel,
  OptionItem,
  BrowseItem,
  isSsml,
  isPaddedSsml,
  ImageDisplays,
  MediaResponse,
  MediaObject,
  MediaValues
} = require('./response-builder');

// Transaction classes
const {
  TransactionValues,
  Order,
  Cart,
  LineItem,
  OrderUpdate
} = require('./transactions');

const { transformToSnakeCase } = require('./utils/transform');

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
   * {@link ActionsSdkApp} or {@link DialogflowApp}.
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

    this.requestData = requestData;

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
    // Populates API version from either request header or Dialogflow orig request.
    if (this.request_.get(ACTIONS_CONVERSATION_API_VERSION_HEADER)) {
      this.actionsApiVersion_ = this.request_.get(ACTIONS_CONVERSATION_API_VERSION_HEADER);
      debug(`Actions API version from header: ${this.actionsApiVersion_}`);
    }
    if (this.body_.originalRequest &&
      this.body_.originalRequest.version) {
      this.actionsApiVersion_ = this.body_.originalRequest.version;
      debug(`Actions API version from Dialogflow: ${this.actionsApiVersion_}`);
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
     * The data persistent across sessions in JSON format.
     * It exists in the same context as getUser().userId
     *
     * @example
     * // Actions SDK
     * const app = new ActionsSdkApp({request: request, response: response});
     * app.userStorage.someProperty = 'someValue';
     * // Dialogflow
     * const app = new DialogflowApp({request: request, response: response});
     * app.userStorage.someProperty = 'someValue';
     *
     * @public
     * @type {Object}
     */
    this.userStorage = {};

    /**
     * The Dialogflow context.
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

    if (!this.isNotApiVersionOne_()) {
      // Type annotations declared on the prototype below
      this.StandardIntents = Object.assign({}, this.StandardIntents, {
        MAIN: 'assistant.intent.action.MAIN',
        TEXT: 'assistant.intent.action.TEXT',
        PERMISSION: 'assistant.intent.action.PERMISSION'
      });

      // Type annotations declared on the prototype below
      this.BuiltInArgNames = Object.assign({}, this.BuiltInArgNames, {
        PERMISSION_GRANTED: 'permission_granted'
      });
    }

    /* eslint-disable no-magic-numbers */
    /**
     * List of possible conversation stages, as defined in the
     * {@link https://developers.google.com/actions/reference/conversation#Conversation|
     *     Conversation object}.
     * @readonly
     * @enum {number}
     * @actionssdk
     * @dialogflow
     * @deprecated Use {@link ConversationTypes} instead.
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
     * List of possible conversation types, as defined in the
     * {@link https://developers.google.com/actions/reference/conversation#Conversation|
     *     Conversation object}.
     * @readonly
     * @enum {number}
     * @actionssdk
     * @dialogflow
     */
    this.ConversationTypes = {
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
     * List of possible user input types.
     * @readonly
     * @enum {number}
     * @actionssdk
     * @dialogflow
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
    /* eslint-enable no-magic-numbers */

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
      debug(`Assistant API version: ${this.apiVersion_}`);
    }

    /**
     * Possible update trigger time context frequencies.
     * @readonly
     * @type {object}
     */
    this.TimeContextFrequency = {
      DAILY: 'DAILY'
    };

    // Extracts the data from the request
    this.extractData_();
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
   * const noInputs = [
   *   `I didn't hear a number`,
   *   `If you're still there, what's the number?`,
   *   'What is the number?'
   * ];
   *
   * function mainIntent (app) {
   *   const ssml = '<speak>Hi! <break time="1"/> ' +
   *     'I can read out an ordinal like ' +
   *     '<say-as interpret-as="ordinal">123</say-as>. Say a number.</speak>';
   *   const inputPrompt = app.buildInputPrompt(true, ssml, noInputs);
   *   app.ask(inputPrompt);
   * }
   *
   * function rawInput (app) {
   *   if (app.getRawInput() === 'bye') {
   *     app.tell('Goodbye!');
   *   } else {
   *     const ssml = '<speak>You said, <say-as interpret-as="ordinal">' +
   *       app.getRawInput() + '</say-as></speak>';
   *     const inputPrompt = app.buildInputPrompt(true, ssml, noInputs);
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
   * // Dialogflow
   * const app = new DialogflowApp({request: req, response: res});
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
   * @return {undefined}
   * @actionssdk
   * @dialogflow
   */
  handleRequest (handler) {
    debug('handleRequest: handler=%s', handler);
    this.handleRequestAsync(handler);
  }

  /**
   * Asynchronously handles the incoming Assistant request using a handler or Map of handlers.
   * Each handler can be a function callback or Promise.
   *
   * @example
   * // Actions SDK
   * const app = new ActionsSdkApp({request: request, response: response});
   *
   * const noInputs = [
   *   `I didn't hear a number`,
   *   `If you're still there, what's the number?`,
   *   'What is the number?'
   * ];
   *
   * function mainIntent (app) {
   *   const ssml = '<speak>Hi! <break time="1"/> ' +
   *     'I can read out an ordinal like ' +
   *     '<say-as interpret-as="ordinal">123</say-as>. Say a number.</speak>';
   *   const inputPrompt = app.buildInputPrompt(true, ssml, noInputs);
   *   app.ask(inputPrompt);
   * }
   *
   * function rawInput (app) {
   *   if (app.getRawInput() === 'bye') {
   *     app.tell('Goodbye!');
   *   } else {
   *     const ssml = '<speak>You said, <say-as interpret-as="ordinal">' +
   *       app.getRawInput() + '</say-as></speak>';
   *     const inputPrompt = app.buildInputPrompt(true, ssml, noInputs);
   *     app.ask(inputPrompt);
   *   }
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(app.StandardIntents.MAIN, mainIntent);
   * actionMap.set(app.StandardIntents.TEXT, rawInput);
   *
   * app.handleRequestAsync(actionMap)
   * .then(
   *   (result) => {
   *     // handle the result
   *   })
   * .catch(
   *   (reason) => {
   *     // handle an error
   *   });
   *
   * // Dialogflow
   * const app = new DialogflowApp({request: req, response: res});
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
   *
   * app.handleRequestAsync(actionMap)
   * .then(
   *   (result) => {
   *     // handle the result
   *   })
   * .catch(
   *   (reason) => {
   *     // handle an error
   *   });
   *
   * @param {(Function|Map)} handler The handler (or Map of handlers) for the request.
   * @return {Promise} to resolve the result of the handler that was invoked.
   * @actionssdk
   * @dialogflow
   */
  handleRequestAsync (handler) {
    debug('handleRequestAsync: handler=%s', handler);
    if (!handler) {
      this.handleError_('request handler can NOT be empty.');
      return Promise.reject(new Error('request handler can NOT be empty.'));
    }
    if (typeof handler === 'function') {
      debug('handleRequestAsync: function');
      // simple function handler
      this.handler_ = handler;
      const handlerResult = handler(this);
      if (handlerResult instanceof Promise) {
        return handlerResult.then(
          (result) => {
            debug(result);
            return result;
          })
        .catch(
          (reason) => {
            this.handleError_('function failed: %s', reason.message);
            this.tell(!reason.message ? ERROR_MESSAGE : reason.message);
            return Promise.reject(reason);
          });
      }
        // Handle functions
      return Promise.resolve(handlerResult);
    } else if (handler instanceof Map) {
      debug('handleRequest: map');
      const intent = this.getIntent();
      return this.invokeIntentHandler_(handler, intent)
        .then(
          (result) => {
            debug(result);
            return result;
          })
        .catch(
          (reason) => {
            this.tell(!this.lastErrorMessage_ ? ERROR_MESSAGE : this.lastErrorMessage_);
            return Promise.reject(reason);
          }
        );
    }
    // Could not handle intent
    this.handleError_(`invalid intent handler type: ${typeof handler}`);
    this.tell(ERROR_MESSAGE);
    return Promise.reject(ERROR_MESSAGE);
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
   * const app = new DialogflowApp({request: req, response: res});
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
   *     will be circulated back by Assistant. Used in {@link ActionsSdkApp}.
   * @return {(Object|null)} A response is sent to Assistant to ask for the user's permission.
   *     For any invalid input, we return null.
   * @actionssdk
   * @dialogflow
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
   * Prompts the user for permission to send proactive updates at any time.
   *
   * @example
   * const app = new DialogflowApp({request, response});
   * const REQUEST_PERMISSION_ACTION = 'request.permission';
   * const PERMISSION_REQUESTED = 'permission.requested';
   * const SHOW_IMAGE = 'show.image';
   *
   * function requestPermission (app) {
   *   app.askForUpdatePermission('show.image', [
   *     {
   *       name: 'image_to_show',
   *       textValue: 'image_type_1'
   *     }
   *   ]);
   * }
   *
   * function checkPermission (app) {
   *   if (app.isPermissionGranted()) {
   *     app.tell(`Great, I'll send an update whenever I notice a change`);
   *   } else {
   *     // Response shows that user did not grant permission
   *     app.tell('Alright, just let me know whenever you need the weather!');
   *   }
   * }
   *
   * function showImage (app) {
   *   showPicture(app.getArgument('image_to_show'));
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(REQUEST_PERMISSION_ACTION, requestPermission);
   * actionMap.set(PERMISSION_REQUESTED, checkPermission);
   * actionMap.set(SHOW_IMAGE, showImage);
   * app.handleRequest(actionMap);
   *
   * @param {string} intent If using Dialogflow, the action name of the intent
   *     to be triggered when the update is received. If using Actions SDK, the
   *     intent name to be triggered when the update is received.
   * @param {Array<IntentArgument>} intentArguments The necessary arguments
   *     to fulfill the intent triggered on update. These can be retrieved using
   *     {@link AssistantApp#getArgument}.
   * @param {Object=} dialogState JSON object the app uses to hold dialog state that
   *     will be circulated back by Assistant. Used in {@link ActionsSdkApp}.
   * @return {(Object|null)} A response is sent to Assistant to ask for the user's permission.
   *     For any invalid input, we return null.
   * @actionssdk
   * @dialogflow
   */
  askForUpdatePermission (intent, intentArguments, dialogState) {
    debug('askForUpdatePermission: intent=%s, intentArguments=%s, dialogState=%s',
      intent, intentArguments, JSON.stringify(dialogState));
    if (!intent) {
      this.handleError_('Name of intent to trigger on update must be specified');
      return null;
    }
    const updatePermissionValueSpec = {
      intent
    };
    if (intentArguments) {
      updatePermissionValueSpec.arguments = intentArguments;
    }
    return this.fulfillPermissionsRequest_({
      permissions: [this.SupportedPermissions.UPDATE],
      updatePermissionValueSpec
    }, dialogState);
  }

  /**
   * Checks whether user is in transactable state.
   *
   * @example
   * const app = new DialogflowApp({request: request, response: response});
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
   *     will be circulated back by Assistant. Used in {@link ActionsSdkApp}.
   * @return {(Object|null)} HTTP response.
   * @actionssdk
   * @dialogflow
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
    return this.fulfillSystemIntent_(this.StandardIntents.TRANSACTION_REQUIREMENTS_CHECK,
      this.InputValueDataTypes_.TRANSACTION_REQ_CHECK, transactionRequirementsCheckSpec,
      'PLACEHOLDER_FOR_TXN_REQUIREMENTS', dialogState);
  }

  /**
   * Asks user to confirm transaction information.
   *
   * @example
   * const app = new DialogflowApp({request: request, response: response});
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
   *     will be circulated back by Assistant. Used in {@link ActionsSdkApp}.
   * @return {(Object|null)} HTTP response
   * @dialogflow
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
    return this.fulfillSystemIntent_(this.StandardIntents.TRANSACTION_DECISION,
      this.InputValueDataTypes_.TRANSACTION_DECISION, transactionDecisionValueSpec,
      'PLACEHOLDER_FOR_TXN_DECISION', dialogState);
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
   * app.StandardIntents.PERMISSION with a boolean argument: app.BuiltInArgNames.PERMISSION_GRANTED
   * and, if granted, the information that you requested.
   *
   * Read more:
   *
   * * {@link https://developers.google.com/actions/reference/conversation#ExpectedIntent|
   *       Supported Permissions}
   * * Check if the permission has been granted with
   *       {@link AssistantApp#isPermissionGranted|isPermissionsGranted}
   * * {@link AssistantApp#getDeviceLocation|getDeviceLocation}
   * * {@link AssistantApp#getUserName|getUserName}
   *
   * @example
   * const app = new DialogflowApp({request: req, response: res});
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
   * @return {(Object|null)} A response is sent to the Assistant to ask for the user's permission;
   *     for any invalid input, we return null.
   * @actionssdk
   * @dialogflow
   */
  askForPermission (context, permission, dialogState) {
    debug('askForPermission: context=%s, permission=%s, dialogState=%s',
      context, permission, JSON.stringify(dialogState));
    return this.askForPermissions(context, [permission], dialogState);
  }

  /**
   * Returns true if the request follows a previous request asking for
   * permission from the user and the user granted the permission(s). Otherwise,
   * false. Use with {@link AssistantApp#askForPermissions|askForPermissions}.
   *
   * @example
   * const app = new ActionsSdkApp({request: request, response: response});
   * // or
   * const app = new DialogflowApp({request: request, response: response});
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
   * @dialogflow
   * @actionssdk
   */
  isPermissionGranted () {
    debug('isPermissionGranted');
    return this.getArgumentCommon(this.BuiltInArgNames.PERMISSION_GRANTED) === 'true';
  }

  /**
   * Asks user for delivery address.
   *
   * @example
   * // For DialogflowApp:
   * const app = new DialogflowApp({request, response});
   * const WELCOME_INTENT = 'input.welcome';
   * const DELIVERY_INTENT = 'delivery.address';
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
   * // For ActionsSdkApp:
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
   * @actionssdk
   * @dialogflow
   */
  askForDeliveryAddress (reason, dialogState) {
    debug('askForDeliveryAddress: reason=%s, dialogState=%s', reason, dialogState);
    if (!reason) {
      this.handleError_('reason cannot be empty');
      return null;
    }
    const deliveryValueSpec = {
      addressOptions: {
        reason: reason
      }
    };
    return this.fulfillSystemIntent_(this.StandardIntents.DELIVERY_ADDRESS,
      this.InputValueDataTypes_.DELIVERY_ADDRESS, deliveryValueSpec,
      'PLACEHOLDER_FOR_DELIVERY_ADDRESS', dialogState);
  }

  /**
   * Asks user to provide a geo-located place, possibly using contextual information,
   * like a store near the user's location or a contact's address.
   *
   * Developer provides custom text prompts to tailor the request handled by Google.
   *
   * @example
   * // For DialogflowApp:
   *
   * // Dialogflow Actions
   * const Actions = {
   *   WELCOME: 'input.welcome',
   *   PLACE: 'get.place' // Create Dialogflow Action with actions_intent_PLACE event
   * };
   *
   * const app = new DialogflowApp({request, response});
   *
   * function handleWelcome (app) {
   *   const requestPrompt = 'Where do you want to get picked up?';
   *   const permissionContext = 'To find a place to pick you up';
   *   app.askForPlace(requestPrompt, permissionContext);
   * }
   *
   * function handlePlace (app) {
   *   const place = app.getPlace();
   *   if (place) {
   *     app.tell(`Ah, I see. You want to get picked up at ${place.address}`);
   *   } else {
   *     app.tell(`Sorry, I couldn't find where you want to get picked up`);
   *   }
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(Actions.WELCOME, handleWelcome);
   * actionMap.set(Actions.PLACE, handlePlace);
   * app.handleRequest(actionMap);
   *
   * // For ActionsSdkApp:
   * const app = new ActionsSdkApp({ request, response });
   *
   * function handleWelcome (app) {
   *   const requestPrompt = 'Where do you want to get picked up?';
   *   const permissionContext = 'To find a place to pick you up';
   *   app.askForPlace(requestPrompt, permissionContext);
   * }
   *
   * function handlePlace (app) {
   *   const place = app.getPlace();
   *   if (place) {
   *     app.tell(`Ah, I see. You want to get picked up at ${place.address}`);
   *   } else {
   *     app.tell(`Sorry, I couldn't find where you want to get picked up`);
   *   }
   * }
   *
   * const actionsMap = new Map();
   * actionsMap.set(app.StandardIntents.MAIN, handleWelcome);
   * actionsMap.set(app.StandardIntents.PLACE, handlePlace);
   * app.handleRequest(actionsMap);
   *
   * @param {string} requestPrompt This is the initial response by location sub-dialog.
   *     For example: "Where do you want to get picked up?"
   * @param {string} permissionContext This is the context for seeking permissions.
   *     For example: "To find a place to pick you up"
   *     Prompt to user: "*To find a place to pick you up*, I just need to check your location.
   *       Can I get that from Google?".
   * @param {Object=} dialogState JSON object the app uses to hold dialog state that
   *     will be circulated back by Assistant.
   * @return {Object} HTTP response.
   * @actionssdk
   * @dialogflow
   */
  askForPlace (requestPrompt, permissionContext, dialogState) {
    debug('askForPlace: requestPrompt=%s, permissionContext=%s, dialogState=%s',
      requestPrompt, permissionContext, dialogState);
    if (!requestPrompt) {
      this.handleError_('requestPrompt cannot be empty');
      return null;
    }
    if (!permissionContext) {
      this.handleError_('permissionContext cannot be empty');
      return null;
    }
    const placeValueSpec = {
      dialogSpec: {
        extension: {
          [this.ANY_TYPE_PROPERTY_]: this.DialogSpecTypes_.PLACE,
          requestPrompt,
          permissionContext
        }
      }
    };
    return this.fulfillSystemIntent_(this.StandardIntents.PLACE,
      this.InputValueDataTypes_.PLACE, placeValueSpec,
      'PLACEHOLDER_FOR_PLACE', dialogState);
  }

  /**
   * Asks user for a confirmation.
   *
   * @example
   * const app = new DialogflowApp({ request, response });
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
   *     will be circulated back by Assistant. Used in {@link ActionsSdkApp}.
   * @return {(Object|null)} HTTP response.
   * @actionssdk
   * @dialogflow
   */
  askForConfirmation (prompt, dialogState) {
    debug('askForConfirmation: prompt=%s, dialogState=%s', prompt,
      JSON.stringify(dialogState));
    const confirmationValueSpec = {};
    if (prompt) {
      confirmationValueSpec.dialogSpec = {
        requestConfirmationText: prompt
      };
    }
    return this.fulfillSystemIntent_(this.StandardIntents.CONFIRMATION,
      this.InputValueDataTypes_.CONFIRMATION, confirmationValueSpec,
      'PLACEHOLDER_FOR_CONFIRMATION', dialogState);
  }

  /**
   * Asks user for a timezone-agnostic date and time.
   *
   * @example
   * const app = new DialogflowApp({ request, response });
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
   *     will be circulated back by Assistant. Used in {@link ActionsSdkApp}.
   * @return {(Object|null)} HTTP response.
   * @actionssdk
   * @dialogflow
   */
  askForDateTime (initialPrompt, datePrompt, timePrompt, dialogState) {
    debug('askForDateTime: initialPrompt=%s, datePrompt=%s, ' +
      'timePrompt=%s, dialogState=%s', initialPrompt, datePrompt, timePrompt,
      JSON.stringify(dialogState));
    const dateTimeValueSpec = {};
    if (initialPrompt || datePrompt || timePrompt) {
      dateTimeValueSpec.dialogSpec = {
        requestDatetimeText: initialPrompt || undefined,
        requestDateText: datePrompt || undefined,
        requestTimeText: timePrompt || undefined
      };
    }
    return this.fulfillSystemIntent_(this.StandardIntents.DATETIME,
      this.InputValueDataTypes_.DATETIME, dateTimeValueSpec,
      'PLACEHOLDER_FOR_DATETIME', dialogState);
  }

  /**
   * Hands the user off to a web sign in flow. App sign in and OAuth credentials
   * are set in the {@link https://console.actions.google.com|Actions Console}.
   * Retrieve the access token in subsequent intents using
   * app.getUser().accessToken.
   *
   * @example
   * const app = new DialogflowApp({ request, response });
   * const WELCOME_INTENT = 'input.welcome';
   * const SIGN_IN = 'sign.in';
   *
   * function welcomeIntent (app) {
   *   app.askForSignIn();
   * }
   *
   * function signIn (app) {
   *   if (app.getSignInStatus() === app.SignInStatus.OK) {
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
   *     will be circulated back by Assistant. Used in {@link ActionsSdkApp}.
   * @return {(Object|null)} HTTP response.
   * @actionssdk
   * @dialogflow
   */
  askForSignIn (dialogState) {
    debug('askForSignIn: dialogState=%s', JSON.stringify(dialogState));
    return this.fulfillSystemIntent_(this.StandardIntents.SIGN_IN,
      this.InputValueDataTypes_.SIGN_IN, null,
      'PLACEHOLDER_FOR_SIGN_IN', dialogState);
  }

  /**
   * Requests the user to switch to another surface during the conversation.
   * Works only for en-* locales.
   *
   * @example
   * const app = new DialogflowApp({ request, response });
   * const WELCOME_INTENT = 'input.welcome';
   * const SHOW_IMAGE = 'show.image';
   *
   * function welcomeIntent (app) {
   *   if (app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT)) {
   *     showPicture(app);
   *   } else if (app.hasAvailableSurfaceCapabilities(app.SurfaceCapabilities.SCREEN_OUTPUT)) {
   *     app.askForNewSurface('To show you an image',
   *       'Check out this image',
   *       [app.SurfaceCapabilities.SCREEN_OUTPUT]
   *     );
   *   } else {
   *     app.tell('This part of the app only works on screen devices. Sorry about that');
   *   }
   * }
   *
   * function showImage (app) {
   *   if (!app.isNewSurface()) {
   *     app.tell('Ok, I understand. You don't want to see pictures. Bye');
   *   } else {
   *     showPicture(app, pictureType);
   *   }
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(WELCOME_INTENT, welcomeIntent);
   * actionMap.set(SHOW_IMAGE, showImage);
   * app.handleRequest(actionMap);
   *
   * @param {string} context Context why new surface is requested; it's the TTS
   *     prompt prefix (action phrase) we ask the user.
   * @param {string} notificationTitle Title of the notification appearing on
   *     new surface device.
   * @param {Array<string>} capabilities The list of capabilities required in
   *     the surface.
   * @param {Object=} dialogState JSON object the app uses to hold dialog state that
   *     will be circulated back by Assistant. Used in {@link ActionsSdkApp}.
   * @return {(Object|null)} HTTP response.
   * @dialogflow
   * @actionssdk
   */
  askForNewSurface (context, notificationTitle, capabilities, dialogState) {
    debug('askForNewSurface: context=%s, notificationTitle=%s, ' +
        'capabilities=%s, dialogState=%s', context, notificationTitle,
        JSON.stringify(capabilities), dialogState);
    const newSurfaceValueSpec = { context, notificationTitle, capabilities };
    return this.fulfillSystemIntent_(this.StandardIntents.NEW_SURFACE,
       this.InputValueDataTypes_.NEW_SURFACE, newSurfaceValueSpec,
       'PLACEHOLDER_FOR_NEW_SURFACE', dialogState);
  }

  /**
   * Requests the user to register for daily updates.
   *
   * @example
   * const app = new DialogflowApp({ request, response });
   * const WELCOME_INTENT = 'input.welcome';
   * const SHOW_IMAGE = 'show.image';
   *
   * function welcomeIntent (app) {
   *   app.askToRegisterDailyUpdate('show.image', [
   *     {
   *       name: 'image_to_show',
   *       textValue: 'image_type_1'
   *     }
   *   ]);
   * }
   *
   * function showImage (app) {
   *   showPicture(app.getArgument('image_to_show'));
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(WELCOME_INTENT, welcomeIntent);
   * actionMap.set(SHOW_IMAGE, showImage);
   * app.handleRequest(actionMap);
   *
   * @param {string} intent If using Dialogflow, the action name of the intent
   *     to be triggered when the update is received. If using Actions SDK, the
   *     intent name to be triggered when the update is received.
   * @param {Array<IntentArgument>} intentArguments The necessary arguments
   *     to fulfill the intent triggered on update. These can be retrieved using
   *     {@link AssistantApp#getArgument}.
   * @param {Object=} dialogState JSON object the app uses to hold dialog state that
   *     will be circulated back by Assistant. Used in {@link ActionsSdkApp}.
   * @return {(Object|null)} HTTP response.
   * @dialogflow
   * @actionssdk
   */
  askToRegisterDailyUpdate (intent, intentArguments, dialogState) {
    debug('askToRegisterDailyUpdate: intent=%s, intentArguments=%s, ' +
        'dialogState=%s', intent, intentArguments, dialogState);
    if (!intent) {
      this.handleError_('Name of intent to trigger on update must be specified');
      return null;
    }
    const registerUpdateValueSpec = {
      intent,
      triggerContext: {
        timeContext: {
          frequency: this.TimeContextFrequency.DAILY
        }
      }
    };
    if (intentArguments) {
      registerUpdateValueSpec.arguments = intentArguments;
    }
    return this.fulfillSystemIntent_(this.StandardIntents.REGISTER_UPDATE,
       this.InputValueDataTypes_.REGISTER_UPDATE, registerUpdateValueSpec,
       'PLACEHOLDER_FOR_REGISTER_UPDATE', dialogState);
  }

  /**
   * Requests the user to transfer to a linked out Android app intent. Using this feature
   * requires verifying the linked app in the (Actions console)[console.actions.google.com].
   *
   * @example
   * // For DialogflowApp:
   *
   * // Dialogflow Actions
   * const WELCOME_ACTION = 'input.welcome';
   * const HANDLE_LINK = 'handle.link'; // Create Dialogflow Action with actions_intent_LINK event
   *
   * const app = new DialogflowApp({ request, response });
   *
   * console.log('Request headers: ' + JSON.stringify(request.headers));
   * console.log('Request body: ' + JSON.stringify(request.body));
   *
   * function requestLink (app) {
   *   app.askToDeepLink('Great! Looks like we can do that in the app.', 'Google',
   *     'example://gizmos', 'com.example.gizmos', 'handle this for you');
   * }
   *
   * function handleLink (app) {
   *   const linkStatus = app.getLinkStatus();
   *   app.tell('Okay maybe we can take care of that another time.');
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(WELCOME_ACTION, requestLink);
   * actionMap.set(HANDLE_LINK, handleLink);
   * app.handleRequest(actionMap);
   *
   * // For ActionsSdkApp
   * const app = new ActionsSdkApp({ request, response });
   *
   * console.log('Request headers: ' + JSON.stringify(request.headers));
   * console.log('Request body: ' + JSON.stringify(request.body));
   *
   * function requestLink (app) {
   *   app.askToDeepLink('Great! Looks like we can do that in the app.', 'Google',
   *     'example://gizmos', 'com.example.gizmos', 'handle this for you.');
   * }
   *
   * function handleLink (app) {
   *   const linkStatus = app.getLinkStatus();
   *   app.tell('Okay maybe we can take care of that another time.');
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(app.StandardIntents.MAIN, requestLink);
   * actionMap.set(app.StandardIntents.LINK, handleLink);
   * app.handleRequest(actionMap);
   *
   * @param {(string|SimpleResponse|null)} prompt A simple response to prepend to the link request.
   * @param {string} destinationName The name of the link destination.
   * @param {string} url URL of Android deep link.
   * @param {string} packageName Android app package name to which to link.
   * @param {(string|null)=} reason The reason to transfer the user. This may be appended to a
   *     Google-specified prompt.
   * @param {Object=} dialogState JSON object the app uses to hold dialog state that
   *     will be circulated back by Assistant. Used in {@link ActionsSdkApp}.
   * @return {(Object|null)} HTTP response.
   * @dialogflow
   * @actionssdk
   */
  askToDeepLink (prompt, destinationName, url, packageName, reason, dialogState) {
    debug('askToDeepLink: prompt=%s, destinationName=%s, url=%s, packageName=%s, reason=%s,' +
      'dialogState=%s', JSON.stringify(prompt), destinationName, url, packageName, reason,
      JSON.stringify(dialogState));
    const linkValueSpec = {
      openUrlAction: {
        url,
        androidApp: {
          packageName
        }
      },
      dialogSpec: {
        extension: {
          [this.ANY_TYPE_PROPERTY_]: this.DialogSpecTypes_.LINK,
          destinationName,
          requestLinkReason: reason || undefined
        }
      }
    };
    return this.fulfillSystemIntent_(this.StandardIntents.LINK,
       this.InputValueDataTypes_.LINK, linkValueSpec, prompt, dialogState);
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
   * @typedef {Object} LocationCoordinates
   * @property {number} latitude
   * @property {number} longitude
   */

  /**
   * Location information.
   * @typedef {Object} Location
   * @property {LocationCoordinates} coordinates - {latitude, longitude}.
   *     Requested with SupportedPermissions.DEVICE_PRECISE_LOCATION.
   * @property {string} address - Full, formatted street address.
   *     Requested with SupportedPermissions.DEVICE_PRECISE_LOCATION.
   * @property {string} zipCode - Zip code.
   *     Requested with SupportedPermissions.DEVICE_COARSE_LOCATION.
   * @property {string} city - Device city.
   *     Requested with SupportedPermissions.DEVICE_COARSE_LOCATION.
   */

  /**
   * User's permissioned device location.
   * @typedef {Location} DeviceLocation
   */

  /**
   * Place information
   * @typedef {Location} Place
   * @property {string} placeId Used with Places API to fetch details of a place.
   * See {@link https://developers.google.com/places/web-service/place-id}
   */

  /**
   * User object.
   * @typedef {Object} User
   * @property {string} userId - Random string ID for Google user.
   * @property {UserName} userName - User name information. Null if not requested with
   *     {@link AssistantApp#askForPermission|askForPermission(SupportedPermissions.NAME)}.
   * @property {string} accessToken - Unique Oauth2 token. Only available with account linking.
   * @property {Timestamp} lastSeen - Timestamp for the last access from the user.
   *     Retrieve using app.getLastSeen() to get a Date object or null if never seen.
   * @property {string} userStorage - A string persistent across sessions.
   *    Retrieved and set using app.userStorage which allows you to store it like an JSON object
   *    which is abstracted for convenience by the client library.
  */

  /**
   * Google Play Android App Package Entitlements
   * @typedef {Object} PackageEntitlement
   * @property {string} packageName - Name of the Android app package.
   * @property {Array<Entitlement>} entitlements - List of entitlements for a given app.
   */

  /**
   * A user's digital entitlement.
   * @typedef {Object} Entitlement
   * @property {string} sku - Product SKU. Matches getSku() in Google Play InApp Billing API.
   * @property {string} skuType - The type of SKU. One of EntitlementSkuType.
   * @property {Object} inAppDetails - For in app purchases/subscriptions, relevant details.
   * @property {Object} inAppDetails.inAppPurchaseData - JSON data of the in app purchase.
   * @property {Object} inAppDetails.inAppDataSignature - Matches IN_APP_DATA_SIGNATURE from
   *     getPurchases() method in Play InApp Billing API.
   */

  /**
   * Actions on Google Surface.
   * @typedef {Object} Surface
   * @property {Array<Capability>} capabilities - Capabilities of the surface.
   */

  /**
   * Surface capability.
   * @typedef {Object} Capability
   * @property {string} name - Name of the capability.
   */

   /**
   * Intent Argument. For incoming intents, the argument value can be retrieved
   * using {@link AssistantApp#getArgument}.
   * @typedef {Object} IntentArgument
   * @property {string} name - Name of the argument.
   * @property {string} textValue - Text value of the argument.
   */

  /**
   * Gets the {@link User} object.
   * The user object contains information about the user, including
   * a string identifier and personal information (requires requesting permissions,
   * see {@link AssistantApp#askForPermissions|askForPermissions}).
   *
   * @example
   * const app = new DialogflowApp({request: request, response: response});
   * // or
   * const app = new ActionsSdkApp({request: request, response: response});
   * const userId = app.getUser().userId;
   *
   * @return {User} Null if no value.
   * @actionssdk
   * @dialogflow
   */
  getUser () {
    debug('getUser');
    const data = this.requestData();

    if (!data || !data.user) {
      error('No user object');
      return null;
    }

    const requestUser = data.user;

    // User object includes original API properties
    const user = Object.assign({}, requestUser);

    // Backwards compatibility
    user.user_id = user.userId;
    user.access_token = user.accessToken;

    const { profile } = user;
    user.userName = profile ? Object.assign({}, profile) : null;

    return user;
  }

  /**
   * If granted permission to user's name in previous intent, returns user's
   * display name, family name, and given name. If name info is unavailable,
   * returns null.
   *
   * @example
   * const app = new DialogflowApp({request: req, response: res});
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
   * @dialogflow
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
   * const app = new DialogflowApp({request, response});
   * const locale = app.getUserLocale();
   *
   * @return {string} User's locale, e.g. 'en-US'. Null if no locale given.
   * @actionssdk
   * @dialogflow
   */
  getUserLocale () {
    debug('getUserLocale');
    return this.getUser() && this.getUser().locale
      ? this.getUser().locale : null;
  }

  /**
   * Get the user's last seen time as a Date object.
   * Not supported in V1.
   *
   * @example
   * const app = new DialogflowApp({request, response});
   * const lastSeen = app.getLastSeen();
   *
   * @return {Date | null} User's last seen date or null if never seen
   */
  getLastSeen () {
    debug('getLastSeen');
    const user = this.getUser();
    if (!user) {
      return null;
    }
    /** @type {string} */
    const { lastSeen } = user;
    if (!lastSeen) {
      return null;
    }
    return new Date(lastSeen);
  }

  /**
   * Get the the list of all digital goods that your user purchased from
   * your published Android apps. To enable this feature, see the instructions
   * in the (documentation)[https://developers.google.com/actions/identity/digital-goods].
   *
   * @example
   * const app = new DialogflowApp({request, response});
   * const packageEntitlements = app.getPackageEntitlements();
   *
   * @return {Array<PackageEntitlement> | null} The list of digital goods purchased by the user in
   *     any verified Android app package. Null if no Package Entitlements present in the request.
   */
  getPackageEntitlements () {
    debug('getPackageEntitlements');
    const user = this.getUser();
    if (!user) {
      return null;
    }
    /** @type {Array<PackageEntitlement>} */
    const { packageEntitlements } = user;
    if (!packageEntitlements) {
      return null;
    }
    return packageEntitlements;
  }

  /**
   * If granted permission to device's location in previous intent, returns device's
   * location (see {@link AssistantApp#askForPermissions|askForPermissions}).
   * If device info is unavailable, returns null.
   *
   * @example
   * const app = new DialogflowApp({request: req, response: res});
   * // or
   * const app = new ActionsSdkApp({request: req, response: res});
   * app.askForPermission("To get you a ride",
   *   app.SupportedPermissions.DEVICE_PRECISE_LOCATION);
   * // ...
   * // In response handler for permissions fallback intent:
   * if (app.isPermissionGranted()) {
   *   sendCarTo(app.getDeviceLocation().coordinates);
   * }
   *
   * @return {DeviceLocation} Null if location permission is not granted.
   * @actionssdk
   * @dialogflow
   */
  getDeviceLocation () {
    debug('getDeviceLocation');
    const data = this.requestData();
    if (!data || !data.device || !data.device.location) {
      return null;
    }
    const deviceLocation = Object.assign({}, data.device.location);
    deviceLocation.address = deviceLocation.formattedAddress;
    return deviceLocation;
  }

  /**
   * Gets type of input used for this request.
   *
   * @return {number} One of AssistantApp.InputTypes.
   *     Null if no input type given.
   * @dialogflow
   * @actionssdk
   */
  getInputType () {
    debug('getInputType');
    const data = this.requestData();
    if (data && data.inputs) {
      for (const input of data.inputs) {
        if (input.rawInputs) {
          for (const rawInput of input.rawInputs) {
            if (rawInput.inputType) {
              return rawInput.inputType;
            }
          }
        }
      }
    }
    error('No input type in incoming request');
    return null;
  }

  /**
   * Utility function for the common getArgument logic between Dialogflow and ActionsSDK.
   *
   * Note this private method does not follow naming convention to have a underscore
   * for backwards compatibility before this was labeled private.
   *
   * @param {string} argName Name of the argument.
   * @return {Object} Argument value matching argName
   *     or null if no matching argument.
   * @private
   */
  getArgumentCommon (argName) {
    debug('getArgument: argName=%s', argName);
    if (!argName) {
      error('Invalid argument name');
      return null;
    }
    const argument = this.findArgument_(argName);
    if (!argument) {
      debug('Failed to get argument value: %s', argName);
      return null;
    } else if (argument.textValue) {
      return argument.textValue;
    }
    if (!this.isNotApiVersionOne_()) {
      return transformToSnakeCase(argument);
    }
    return argument;
  }

  /**
   * Gets transactability of user. Only use after calling
   * askForTransactionRequirements. Null if no result given.
   *
   * @return {string} One of Transactions.ResultType.
   * @dialogflow
   * @actionssdk
   */
  getTransactionRequirementsResult () {
    debug('getTransactionRequirementsResult');
    const argument = this.findArgument_(this.BuiltInArgNames.TRANSACTION_REQ_CHECK_RESULT);
    if (argument && argument.extension && argument.extension.resultType) {
      return argument.extension.resultType;
    }
    debug('Failed to get transaction requirements result');
    return null;
  }

  /**
   * Gets order delivery address. Only use after calling askForDeliveryAddress.
   *
   * @return {DeliveryAddress} Delivery address information. Null if user
   *     denies permission, or no address given.
   * @dialogflow
   * @actionssdk
   */
  getDeliveryAddress () {
    debug('getDeliveryAddress');
    const {
      DELIVERY_ADDRESS_VALUE,
      TRANSACTION_DECISION_VALUE
    } = this.BuiltInArgNames;
    const argument = this.findArgument_(DELIVERY_ADDRESS_VALUE, TRANSACTION_DECISION_VALUE);
    if (argument && argument.extension) {
      const { userDecision } = argument.extension;
      if (userDecision === this.Transactions.DeliveryAddressUserDecision.ACCEPTED) {
        const { location } = argument.extension;
        if (!location.postalAddress) {
          debug('User accepted, but may not have configured address in app');
          return null;
        }
        return location;
      }
      debug('User rejected giving delivery address');
      return null;
    }
    debug('Failed to get order delivery address');
    return null;
  }

  /**
   * Gets transaction decision information. Only use after calling
   * askForTransactionDecision.
   *
   * @return {TransactionDecision} Transaction decision data. Returns object with
   *     userDecision only if user declines. userDecision will be one of
   *     Transactions.TransactionUserDecision. Null if no decision given.
   * @dialogflow
   * @actionssdk
   */
  getTransactionDecision () {
    debug('getTransactionDecision');
    const argument = this.findArgument_(this.BuiltInArgNames.TRANSACTION_DECISION_VALUE);
    if (argument && argument.extension) {
      return argument.extension;
    }
    debug('Failed to get order decision information');
    return null;
  }

  /**
   * Gets the user provided place. Use after askForPlace.
   *
   * @return {(Place|null)} Place information given by the user. Null if no place given.
   * @dialogflow
   * @actionssdk
   */
  getPlace () {
    debug('getPlace');
    const argument = this.findArgument_(this.BuiltInArgNames.PLACE);
    if (argument) {
      const place = argument.placeValue;
      if (!place) {
        return null;
      }
      place.address = place.formattedAddress;
      return place;
    }
    debug('Failed to get place place information');
    return null;
  }

  /**
   * Gets confirmation decision. Use after askForConfirmation.
   *
   * @return {(boolean|null)} False if user replied with negative response. Null if no user
   *     confirmation decision given.
   * @dialogflow
   * @actionssdk
   */
  getUserConfirmation () {
    debug('getUserConfirmation');
    const argument = this.findArgument_(this.BuiltInArgNames.CONFIRMATION);
    if (argument) {
      return argument.boolValue;
    }
    debug('Failed to get confirmation decision information');
    return null;
  }

  /**
   * Gets user provided date and time. Use after askForDateTime.
   *
   * @return {DateTime} Date and time given by the user. Null if no user
   *     date and time given.
   * @dialogflow
   * @actionssdk
   */
  getDateTime () {
    debug('getDateTime');
    const argument = this.findArgument_(this.BuiltInArgNames.DATETIME);
    if (argument) {
      return argument.datetimeValue;
    }
    debug('Failed to get date/time information');
    return null;
  }

  /**
   * Gets status of user sign in request.
   *
   * @return {string} Result of user sign in request. One of
   * DialogflowApp.SignInStatus or ActionsSdkApp.SignInStatus
   * Null if no sign in status.
   * @dialogflow
   * @actionssdk
   */
  getSignInStatus () {
    debug('getSignInStatus');
    const argument = this.findArgument_(this.BuiltInArgNames.SIGN_IN);
    if (argument && argument.extension && argument.extension.status) {
      return argument.extension.status;
    }
    debug('Failed to get sign in status');
    return null;
  }

  /**
   * Get status of MEDIA_STATUS intent.
   *
   * @example
   * const app = new DialogflowApp({request: request, response: response});
   *
   * function mediaStatusIntent (app) {
   *   const status = app.getMediaStatus();
   *   if (status === app.Media.Status.FINISHED) {
   *     app.tell('Oh, I see you are done playing the media!');
   *   } else {
   *     app.tell(`I don't understand the current media status: ${status}`);
   *   }
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(app.StandardIntents.MEDIA_STATUS, mediaStatusIntent);
   * app.handleRequest(actionMap);
   *
   * @return {string} Result of media status intent. One of
   *   AssistantApp.Media.Status
   *   Null if no media status
   * @dialogflow
   * @actionssdk
   */
  getMediaStatus () {
    debug('getMediaStatus');
    const argument = this.findArgument_(this.BuiltInArgNames.MEDIA_STATUS);
    if (argument && argument.extension && argument.extension.status) {
      return argument.extension.status;
    }
    debug('Failed to get media status');
    return null;
  }

  /**
   * Returns true if user device has a given surface capability.
   *
   * @param {string} requestedCapability Must be one of {@link SurfaceCapabilities}.
   * @return {boolean} True if user device has the given capability.
   *
   * @example
   * const app = new DialogflowApp({request: req, response: res});
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
   * @dialogflow
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
   * @return {Array<string>} Supported surface capabilities, as defined in
   *     AssistantApp.SurfaceCapabilities.
   * @dialogflow
   * @actionssdk
   */
  getSurfaceCapabilities () {
    debug('getSurfaceCapabilities');
    const data = this.requestData();
    if (!data || !data.surface || !data.surface.capabilities) {
      error('No surface capabilities in incoming request');
      return null;
    }
    if (data && data.surface && data.surface.capabilities) {
      return data.surface.capabilities.map(capability => capability.name);
    }
    error('No surface capabilities in incoming request');
    return null;
  }

  /**
   * Returns the set of other available surfaces for the user.
   *
   * @return {Array<Surface>} Empty if no available surfaces.
   * @actionssdk
   * @dialogflow
   */
  getAvailableSurfaces () {
    debug('getAvailableSurfaces');
    return this.requestData().availableSurfaces || [];
  }

  /**
   * Returns true if user has an available surface which includes all given
   * capabilities. Available surfaces capabilities may exist on surfaces other
   * than that used for an ongoing conversation.
   *
   * @param {string|Array<string>} capabilities Must be one of
   *     {@link SurfaceCapabilities}.
   * @return {boolean} True if user has a capability available on some surface.
   *
   * @dialogflow
   * @actionssdk
   */
  hasAvailableSurfaceCapabilities (capabilities) {
    debug('hasAvailableSurfaceCapabilities: capabilities=%s', capabilities);
    const capabilitiesArray = Array.isArray(capabilities) ? capabilities
      : [capabilities];
    const { availableSurfaces } = this.requestData();
    if (availableSurfaces) {
      for (const surface of availableSurfaces) {
        const availableCapabilities = surface.capabilities.map(capability => capability.name);
        const unavailableCapabilities = capabilitiesArray
          .filter(capability => !availableCapabilities.includes(capability));
        if (!unavailableCapabilities.length) {
          return true;
        }
      }
    }
    return false;
  }

 /**
  * Returns the result of the AskForNewSurface helper.
  *
  * @return {boolean} True if user has triggered conversation on a new device
  *     following the NEW_SURFACE intent.
  * @actionssdk
  * @dialogflow
  */
  isNewSurface () {
    debug('isNewSurface');
    const argument = this.findArgument_(this.BuiltInArgNames.NEW_SURFACE);
    return argument && argument.extension && argument.extension.status &&
      argument.extension.status === 'OK';
  }

  /**
   * Returns true if the app is being tested in sandbox mode. Enable sandbox
   * mode in the (Actions console)[console.actions.google.com] to test
   * transactions.
   *
   * @return {boolean} True if app is being used in Sandbox mode.
   * @dialogflow
   * @actionssdk
   */
  isInSandbox () {
    debug('isInSandbox');
    const data = this.requestData();
    return data && data.isInSandbox;
  }

  /**
   * Returns the number of subsequent reprompts related to silent input from the
   * user. This should be used along with the NO_INPUT intent to reprompt the
   * user for input in cases where the Google Assistant could not pick up any
   * speech.
   *
   * @example
   * const app = new ActionsSdkApp({request, response});
   *
   * function welcome (app) {
   *   app.ask('Welcome to your app!');
   * }
   *
   * function noInput (app) {
   *   if (app.getRepromptCount() === 0) {
   *     app.ask(`What was that?`);
   *   } else if (app.getRepromptCount() === 1) {
   *     app.ask(`Sorry I didn't catch that. Could you repeat yourself?`);
   *   } else if (app.isFinalReprompt()) {
   *     app.tell(`Okay let's try this again later.`);
   *   }
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(app.StandardIntents.MAIN, welcome);
   * actionMap.set(app.StandardIntents.NO_INPUT, noInput);
   * app.handleRequest(actionMap);
   *
   * @return {number} The current reprompt count. Null if no reprompt count
   *     available (e.g. not in the NO_INPUT intent).
   * @dialogflow
   * @actionssdk
   */
  getRepromptCount () {
    debug('getRepromptCount');
    const repromptArg = this.getArgumentCommon(this.BuiltInArgNames.REPROMPT_COUNT);
    if (repromptArg && repromptArg.intValue) {
      return parseInt(repromptArg.intValue, 10);
    }
    return null;
  }

  /**
   * Returns true if it is the final reprompt related to silent input from the
   * user. This should be used along with the NO_INPUT intent to give the final
   * response to the user after multiple silences and should be an app.tell
   * which ends the conversation.
   *
   * @example
   * const app = new ActionsSdkApp({request, response});
   *
   * function welcome (app) {
   *   app.ask('Welcome to your app!');
   * }
   *
   * function noInput (app) {
   *   if (app.getRepromptCount() === 0) {
   *     app.ask(`What was that?`);
   *   } else if (app.getRepromptCount() === 1) {
   *     app.ask(`Sorry I didn't catch that. Could you repeat yourself?`);
   *   } else if (app.isFinalReprompt()) {
   *     app.tell(`Okay let's try this again later.`);
   *   }
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(app.StandardIntents.MAIN, welcome);
   * actionMap.set(app.StandardIntents.NO_INPUT, noInput);
   * app.handleRequest(actionMap);
   *
   * @return {boolean} True if in a NO_INPUT intent and this is the final turn
   *     of dialog.
   * @dialogflow
   * @actionssdk
   */
  isFinalReprompt () {
    debug('isFinalReprompt');
    const finalRepromptArg = this.getArgumentCommon(this.BuiltInArgNames.IS_FINAL_REPROMPT);
    if (finalRepromptArg && finalRepromptArg.boolValue) {
      return finalRepromptArg.boolValue;
    }
    return false;
  }

  /**
   * Returns true if user accepted update registration request. Used with
   * {@link AssistantApp#askToRegisterDailyUpdate}
   *
   * @return {boolean} True if user accepted update registration request.
   * @dialogflow
   * @actionssdk
   */
  isUpdateRegistered () {
    debug('isUpdateRegistered');
    const argument = this.findArgument_(this.BuiltInArgNames.REGISTER_UPDATE);
    return argument && argument.extension && argument.extension.status === 'OK';
  }

  /**
   * Returns the status of a link request. Used with
   * {@link AssistantApp#askToDeepLink}
   *
   * @return {number} The status code of the request to link.
   * @dialogflow
   * @actionssdk
   */
  getLinkStatus () {
    debug('getLinkStatus');
    const argument = this.findArgument_(this.BuiltInArgNames.LINK);
    if (argument && argument.status && argument.status.code) {
      return argument.status.code;
    }
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
   * Constructs a Browse Carousel with chainable property setters.
   *
   * @return {BrowseCarousel} Constructed Browse Carousel.
   */
  buildBrowseCarousel () {
    return new BrowseCarousel();
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
    const optionItem = new OptionItem();
    if (key) {
      optionItem.setKey(key);
    }
    if (synonyms) {
      optionItem.addSynonyms(synonyms);
    }
    return optionItem;
  }

/**
   * Constructs BrowseItem for the Browse Carousel with chainable property setters.
   *
   * @param {string=} title The displayed title of the Browse Carousel card.
   * @param {string=} url The URL linked to by clicking the card.
   * @return {BrowseItem} Constructed BrowseItem.
   */
  buildBrowseItem (title, url) {
    const browseItem = new BrowseItem();
    if (title) {
      browseItem.setTitle(title);
    }
    if (url) {
      browseItem.setOpenUrlAction(url);
    }
    return browseItem;
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
   * Because of a previous bug, the parameters are swapped compared to
   * the LineItem constructor to prevent a breaking change.
   *
   * @param {string} name Name of the line item.
   * @param {string} id Unique identifier for the item.
   * @return {LineItem} Constructed LineItem.
   */
  buildLineItem (name, id) {
    return new LineItem(id, name);
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
  //                   Media Builders
  // ---------------------------------------------------------------------------

  /**
   * Constructs Media Response with chainable property setters.
   *
   * @return {MediaResponse} Constructed Media Response.
   */
  buildMediaResponse () {
    return new MediaResponse();
  }

  /**
   * Constructs MediaObject with chainable property setters.
   *
   * @param {string} name Name of media file.
   * @param {string} contentUrl Location of media file.
   * @return {MediaObject} Constructed MediaObject.
   */
  buildMediaObject (name, contentUrl) {
    return new MediaObject(name, contentUrl);
  }

  // ---------------------------------------------------------------------------
  //                   Private Helpers
  // ---------------------------------------------------------------------------

  /**
   * Utility function to invoke an intent handler.
   *
   * @param {Object} handler The handler for the request.
   * @param {string} intent The intent to handle.
   * @return {Promise} to resolve the result of the handler that was invoked.
   * @private
   */
  invokeIntentHandler_ (handler, intent) {
    debug('invokeIntentHandler_: handler=%s, intent=%s', handler, intent);
    this.lastErrorMessage_ = null;
    // map of intents or states
    for (const key of handler.keys()) {
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
      debug(`name=${name}`);
      if (value instanceof Map) {
        debug(`state=${this.state instanceof State ? this.state.getName() : this.state}`);
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
        const handlerResult = value(this);
        if (handlerResult instanceof Promise) {
          return handlerResult.then(
            (result) => {
              // No-op
              return result;
            })
          .catch(
            (reason) => {
              error(reason.message);
              this.handleError_('intent handler failed: %s', reason.message);
              this.lastErrorMessage_ = reason.message;
              return Promise.reject(reason);
            });
        }
          // Handle functions
        return Promise.resolve(handlerResult);
      }
    }
    this.handleError_(`no matching intent handler for: ${intent}`);
    return Promise.reject(new Error(`no matching intent handler for: ${intent}`));
  }

  /**
   * Find argument with requirements
   * @param {Array<string>} targets Argument to find
   * @return {*} The argument
   */
  findArgument_ (...targets) {
    const data = this.requestData();
    if (data && data.inputs) {
      for (const input of data.inputs) {
        if (input.arguments) {
          for (const argument of input.arguments) {
            for (const target of targets) {
              if (argument.name === target) {
                return argument;
              }
            }
          }
        }
      }
    }
    return null;
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
      error('Text can NOT be empty');
      return false;
    }
    return isSsml(text) || isPaddedSsml(text);
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
   * @return {undefined}
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
   * @param {string} responseCode The HTTP response code.
   * @return {(Object|null)} HTTP response.
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
   * Used in subclasses for Actions SDK and Dialogflow.
   * @return {undefined}
   * @private
   */
  extractData_ () {
    debug('extractData_');
    this.data = {};
  }

  /**
   * Extract data persistent across sessions from the incoming JSON request.
   *
   * Used in subclasses for Actions SDK and Dialogflow.
   * @return {undefined}
   * @private
   */
  extractUserStorage_ () {
    debug('extractUserStorage_');
    const user = this.getUser();
    if (!user) {
      error('No user object found');
      return;
    }
    const { userStorage } = user;
    if (!userStorage) {
      debug('No userStorage found');
      return;
    }
    try {
      this.userStorage = JSON.parse(userStorage).data || {};
    } catch (e) {
      error('Unable to parse userStorage', e);
    }
  }

  /**
   * Add userStorage to response object if needed.
   *
   * Used in subclasses for Actions SDK and Dialogflow.
   * @param {Object} response The response object to send back to Google
   * @return {undefined}
   * @private
   */
  addUserStorageToResponse_ (response) {
    if (this.userStorage) {
      const user = this.getUser();
      if (user) {
        const { userStorage } = user;
        const json = JSON.stringify({
          data: this.userStorage // store as a sub property in case we want to add new features
        });
        if (userStorage !== json) {
          // Only send if the JSON string is different.
          // Will also send if the JSON keys have been reordered.
          // This was a design choice for computational and network saving tradeoff.
          response.userStorage = json;
        }
      }
    }
  }

  /**
   * Uses a PermissionsValueSpec object to construct and send a
   * permissions request to user.
   *
   * Used in subclasses for Actions SDK and Dialogflow.
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
   * Used in subclasses for Actions SDK and Dialogflow.
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
   * Used in subclasses for Actions SDK and Dialogflow.
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
   * Used in subclasses for Actions SDK and Dialogflow.
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
   * Used in subclasses for Actions SDK and Dialogflow.
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
   * Used in subclasses for Actions SDK and Dialogflow.
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
   * @return {Object} paymentOptions
   * @private
   */
  buildPaymentOptions_ (transactionConfig) {
    debug('buildPromptsFromPlainTextHelper_: transactionConfig=%s',
      JSON.stringify(transactionConfig));
    const paymentOptions = {};
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
          tokenizationType: transactionConfig.tokenizationType ||
            TransactionValues.PaymentMethodTokenizationType.PAYMENT_GATEWAY,
          parameters: transactionConfig.tokenizationParameters
        };
      }
    }
    return paymentOptions;
  }
}

/**
 * List of possible sign in result status values.
 * @readonly
 * @enum {string}
 * @actionssdk
 * @dialogflow
 */
AssistantApp.prototype.SignInStatus = {
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
 * List of surface capabilities supported by the app.
 * @readonly
 * @enum {string}
 * @actionssdk
 * @dialogflow
 */
AssistantApp.prototype.SurfaceCapabilities = {
  /**
   * The ability to output audio.
   */
  AUDIO_OUTPUT: 'actions.capability.AUDIO_OUTPUT',
  /**
   * The ability to output on a screen
   */
  SCREEN_OUTPUT: 'actions.capability.SCREEN_OUTPUT',
  /**
   * The ability to output a MediaResponse
   */
  MEDIA_RESPONSE_AUDIO: 'actions.capability.MEDIA_RESPONSE_AUDIO',
  /**
   * The ability to open a web URL
   */
  WEB_BROWSER: 'actions.capability.WEB_BROWSER'
};

/**
 * List of supported permissions the app supports.
 * @readonly
 * @enum {string}
 * @actionssdk
 * @dialogflow
 */
AssistantApp.prototype.SupportedPermissions = {
  /**
   * The user's name as defined in the
   * {@link https://developers.google.com/actions/reference/conversation#UserProfile|
   *     UserProfile object}
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
  DEVICE_COARSE_LOCATION: 'DEVICE_COARSE_LOCATION',
  /**
   * Confirmation to receive proactive content at any time from the app.
   */
  UPDATE: 'UPDATE'
};

/**
 * The property name used when specifying an input value data spec.
 * @private
 * @readonly
 * @type {string}
 * @actionssdk
 * @dialogflow
 */
AssistantApp.prototype.ANY_TYPE_PROPERTY_ = '@type';

/**
 * List of built-in DialogSpec type names.
 * @private
 * @readonly
 * @enum {string}
 * @actionssdk
 * @dialogflow
 */
AssistantApp.prototype.DialogSpecTypes_ = {
  /** Place Dialog Spec. */
  PLACE: 'type.googleapis.com/google.actions.v2.PlaceValueSpec.PlaceDialogSpec',
  /** Link Dialog Spec. */
  LINK: 'type.googleapis.com/google.actions.v2.LinkValueSpec.LinkDialogSpec'
};

/**
 * List of built-in value type names.
 * @private
 * @readonly
 * @enum {string}
 * @actionssdk
 * @dialogflow
 */
AssistantApp.prototype.InputValueDataTypes_ = {
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
  /** Place Value Spec. */
  PLACE: 'type.googleapis.com/google.actions.v2.PlaceValueSpec',
  /** Confirmation Value Spec. */
  CONFIRMATION: 'type.googleapis.com/google.actions.v2.ConfirmationValueSpec',
  /** DateTime Value Spec. */
  DATETIME: 'type.googleapis.com/google.actions.v2.DateTimeValueSpec',
  /** New Surface Value Spec. */
  NEW_SURFACE: 'type.googleapis.com/google.actions.v2.NewSurfaceValueSpec',
  /** Register Update Value Spec. */
  REGISTER_UPDATE: 'type.googleapis.com/google.actions.v2.RegisterUpdateValueSpec',
  /** Link Value Spec */
  LINK: 'type.googleapis.com/google.actions.v2.LinkValueSpec'
};

/**
 * List of standard intents that the app provides.
 * @readonly
 * @enum {string}
 * @actionssdk
 * @dialogflow
 */
AssistantApp.prototype.StandardIntents = {
  /** App fires MAIN intent for queries like [talk to $app]. */
  MAIN: 'actions.intent.MAIN',
  /** App fires TEXT intent when action issues ask intent. */
  TEXT: 'actions.intent.TEXT',
  /** App fires PERMISSION intent when action invokes askForPermission. */
  PERMISSION: 'actions.intent.PERMISSION',
  /** App fires OPTION intent when user chooses from options provided. */
  OPTION: 'actions.intent.OPTION',
  /** App fires TRANSACTION_REQUIREMENTS_CHECK intent when action sets up transaction. */
  TRANSACTION_REQUIREMENTS_CHECK: 'actions.intent.TRANSACTION_REQUIREMENTS_CHECK',
  /** App fires DELIVERY_ADDRESS intent when action asks for delivery address. */
  DELIVERY_ADDRESS: 'actions.intent.DELIVERY_ADDRESS',
  /** App fires TRANSACTION_DECISION intent when action asks for transaction decision. */
  TRANSACTION_DECISION: 'actions.intent.TRANSACTION_DECISION',
  /** App fires PLACE intent when action asks for place. */
  PLACE: 'actions.intent.PLACE',
  /** App fires CONFIRMATION intent when requesting affirmation from user. */
  CONFIRMATION: 'actions.intent.CONFIRMATION',
  /** App fires DATETIME intent when requesting date/time from user. */
  DATETIME: 'actions.intent.DATETIME',
  /** App fires SIGN_IN intent when requesting sign-in from user. */
  SIGN_IN: 'actions.intent.SIGN_IN',
  /** App fires NO_INPUT intent when user doesn't provide input. */
  NO_INPUT: 'actions.intent.NO_INPUT',
  /** App fires CANCEL intent when user exits app mid-dialog. */
  CANCEL: 'actions.intent.CANCEL',
  /** App fires NEW_SURFACE intent when requesting handoff to a new surface from user. */
  NEW_SURFACE: 'actions.intent.NEW_SURFACE',
  /** App fires REGISTER_UPDATE intent when requesting user to register for proactive updates. */
  REGISTER_UPDATE: 'actions.intent.REGISTER_UPDATE',
  /** App receives CONFIGURE_UPDATES intent to indicate a REGISTER_UPDATE intent should be sent. */
  CONFIGURE_UPDATES: 'actions.intent.CONFIGURE_UPDATES',
  /** App fires LINK intent to request user to open to link. */
  LINK: 'actions.intent.LINK',
  /** App receives MEDIA_STATUS intent when the MediaResponse status is updated from user. */
  MEDIA_STATUS: 'actions.intent.MEDIA_STATUS'
};

/**
 * List of built-in argument names.
 * @readonly
 * @enum {string}
 * @actionssdk
 * @dialogflow
 */
AssistantApp.prototype.BuiltInArgNames = {
  /** Permission granted argument. */
  PERMISSION_GRANTED: 'PERMISSION',
  /** Option selected argument. */
  OPTION: 'OPTION',
  /** Transaction requirements check result argument. */
  TRANSACTION_REQ_CHECK_RESULT: 'TRANSACTION_REQUIREMENTS_CHECK_RESULT',
  /** Delivery address value argument. */
  DELIVERY_ADDRESS_VALUE: 'DELIVERY_ADDRESS_VALUE',
  /** Transactions decision argument. */
  TRANSACTION_DECISION_VALUE: 'TRANSACTION_DECISION_VALUE',
  /** Place value argument. */
  PLACE: 'PLACE',
  /** Confirmation argument. */
  CONFIRMATION: 'CONFIRMATION',
  /** DateTime argument. */
  DATETIME: 'DATETIME',
  /** Sign in status argument. */
  SIGN_IN: 'SIGN_IN',
  /** Reprompt count for consecutive NO_INPUT intents. */
  REPROMPT_COUNT: 'REPROMPT_COUNT',
  /** Flag representing finality of NO_INPUT intent. */
  IS_FINAL_REPROMPT: 'IS_FINAL_REPROMPT',
  /** New surface value argument. */
  NEW_SURFACE: 'NEW_SURFACE',
  /** Update registration value argument. */
  REGISTER_UPDATE: 'REGISTER_UPDATE',
  /** Link request result argument. */
  LINK: 'LINK',
  /** MediaStatus value argument. */
  MEDIA_STATUS: 'MEDIA_STATUS'
};

/**
 * Values related to supporting {@link ImageDisplays}.
 * @readonly
 * @type {object}
 */
AssistantApp.prototype.ImageDisplays = ImageDisplays;

/**
 * Values related to supporting {@link Transactions}.
 * @readonly
 * @type {object}
 */
AssistantApp.prototype.Transactions = TransactionValues;

/**
 * Values related to supporting {@link Media}.
 * @readonly
 * @type {object}
 */
AssistantApp.prototype.Media = MediaValues;

/**
 * SKU (Stock Keeping Units) types for Play Package Entitlements.
 * @readonly
 * @type {object}
 */
AssistantApp.prototype.EntitlementSkuTypes = {
  /** In app purchase */
  IN_APP: 'IN_APP',
  /** In app subscription */
  SUBSCRIPTION: 'SUBSCRIPTION',
  /** Paid app. */
  APP: 'APP'
};

/**
 * Utility class for representing intents by name.
 *
 * @private
 */
class Intent {
    /**
   * Constructor for Intent object.
   *
   * @param {string} name The name of the intent.
   */
  constructor (name) {
    this.name_ = name;
  }

  /**
   * Getter for the Intent name.
   *
   * @return {string} The name of the intent.
   */
  getName () {
    return this.name_;
  }
}

/**
 * Utility class for representing states by name.
 *
 * @private
 */
class State {
  /**
   * Constructor for State object.
   *
   * @param {string} name The name of the state.
   */
  constructor (name) {
    this.name_ = name;
  }

  /**
   * Getter for the State name.
   *
   * @return {string} The name of the state.
   */
  getName () {
    return this.name_;
  }
}

module.exports = {
  AssistantApp: AssistantApp,
  State: State
};
