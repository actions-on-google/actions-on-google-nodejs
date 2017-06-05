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
const { transformToSnakeCase } = require('./utils/transform');

/**
 * The Actions on Google client library RequestExtractor.
 *
 * This class contains the methods to extract data from the request object.
 */
class RequestExtractor {
  /**
   * @param {function(): *} requestData Function that returns the
   *     request data object to be processed.
   */
  constructor (requestData) {
    this.requestData = requestData;
  }

  /**
   * Get every method in RequestExtractor that doesn't exist in this class
   * and put it in the app class.
   * @param {AssistantApp} app AssistantApp instance to inject methods into.
   */
  inject (app) {
    this.app = app;

    const target = Object.getPrototypeOf(this.app);
    for (const method of Object.getOwnPropertyNames(Object.getPrototypeOf(this))) {
      if (target.hasOwnProperty(method)) {
        continue;
      }
      this.app[method] = this[method].bind(this);
    }
  }

  /**
   * Gets the {@link User} object.
   * The user object contains information about the user, including
   * a string identifier and personal information (requires requesting permissions,
   * see {@link AssistantApp#askForPermissions|askForPermissions}).
   *
   * @example
   * const app = new ApiAiApp({request: request, response: response});
   * or
   * const app = new ActionsSdkApp({request: request, response: response});
   * const userId = app.getUser().userId;
   *
   * @return {User} Null if no value.
   * @requestextractor
   */
  getUser () {
    debug('getUser');
    const data = this.requestData();

    if (!data || !data.user) {
      this.app.handleError_('No user object');
      return null;
    }

    const requestUser = data.user;

    // User object includes original API properties
    const user = Object.assign({}, requestUser);

    // Backwards compatibility
    user.user_id = user.userId;
    user.access_token = user.accessToken;

    const profile = user.profile;
    user.userName = profile ? Object.assign({}, profile) : null;

    return user;
  }

  /**
   * If granted permission to device's location in previous intent, returns device's
   * location (see {@link AssistantApp#askForPermissions|askForPermissions}).
   * If device info is unavailable, returns null.
   *
   * @example
   * const app = new ApiAiApp({request: req, response: res});
   * or
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
   * @requestextractor
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
   * Get the argument value by name from the current intent.
   * If the argument is included in originalRequest, and is not a text argument,
   * the entire argument object is returned.
   *
   * Note: If incoming request is using an API version under 2 (e.g. 'v1'),
   * the argument object will be in Proto2 format (snake_case, etc).
   *
   * @example
   * const app = new ApiAiApp({request: request, response: response});
   * const WELCOME_INTENT = 'input.welcome';
   * const NUMBER_INTENT = 'input.number';
   *
   * function welcomeIntent (app) {
   *   app.ask('Welcome to action snippets! Say a number.');
   * }
   *
   * function numberIntent (app) {
   *   const number = app.getArgument(NUMBER_ARGUMENT);
   *   app.tell('You said ' + number);
   * }
   *
   * const actionMap = new Map();
   * actionMap.set(WELCOME_INTENT, welcomeIntent);
   * actionMap.set(NUMBER_INTENT, numberIntent);
   * app.handleRequest(actionMap);
   *
   * @param {string} argName Name of the argument.
   * @return {Object} Argument value matching argName
   *     or null if no matching argument.
   * @requestextractor
   */
  getArgumentCommon (argName) {
    debug('getArgument: argName=%s', argName);
    if (!argName) {
      this.app.handleError_('Invalid argument name');
      return null;
    }
    const argument = this.findArgument_(argName);
    if (!argument) {
      debug('Failed to get argument value: %s', argName);
      return null;
    } else if (argument.textValue) {
      return argument.textValue;
    } else {
      if (!this.app.isNotApiVersionOne_()) {
        return transformToSnakeCase(argument);
      } else {
        return argument;
      }
    }
  }

  /**
   * Gets transactability of user. Only use after calling
   * askForTransactionRequirements. Null if no result given.
   *
   * @return {string} One of Transactions.ResultType.
   * @requestextractor
   */
  getTransactionRequirementsResult () {
    debug('getTransactionRequirementsResult');
    const argument = this.findArgument_(this.app.BuiltInArgNames.TRANSACTION_REQ_CHECK_RESULT);
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
   * @requestextractor
   */
  getDeliveryAddress () {
    debug('getDeliveryAddress');
    const {
      DELIVERY_ADDRESS_VALUE,
      TRANSACTION_DECISION_VALUE
    } = this.app.BuiltInArgNames;
    const argument = this.findArgument_(DELIVERY_ADDRESS_VALUE, TRANSACTION_DECISION_VALUE);
    if (argument && argument.extension) {
      if (argument.extension.userDecision === this.app.Transactions.DeliveryAddressDecision.ACCEPTED) {
        const { location } = argument.extension;
        if (!location.postalAddress) {
          debug('User accepted, but may not have configured address in app');
          return null;
        }
        return location;
      } else {
        debug('User rejected giving delivery address');
        return null;
      }
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
   *     Transactions.ConfirmationDecision. Null if no decision given.
   * @requestextractor
   */
  getTransactionDecision () {
    debug('getTransactionDecision');
    const argument = this.findArgument_(this.app.BuiltInArgNames.TRANSACTION_DECISION_VALUE);
    if (argument && argument.extension) {
      return argument.extension;
    }
    debug('Failed to get order decision information');
    return null;
  }

  /**
   * Gets confirmation decision. Use after askForConfirmation.
   *
   *     False if user replied with negative response. Null if no user
   *     confirmation decision given.
   * @requestextractor
   */
  getUserConfirmation () {
    debug('getUserConfirmation');
    const argument = this.findArgument_(this.app.BuiltInArgNames.CONFIRMATION);
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
   * @requestextractors
   */
  getDateTime () {
    debug('getDateTime');
    const argument = this.findArgument_(this.app.BuiltInArgNames.DATETIME);
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
   * ApiAiApp.SignInStatus or ActionsSdkApp.SignInStatus
   * Null if no sign in status.
   * @requestextractor
   */
  getSignInStatus () {
    debug('getSignInStatus');
    const argument = this.findArgument_(this.app.BuiltInArgNames.SIGN_IN);
    if (argument && argument.extension && argument.extension.status) {
      return argument.extension.status;
    }
    debug('Failed to get sign in status');
    return null;
  }

  /**
   * Returns true if the app is being tested in sandbox mode. Enable sandbox
   * mode in the (Actions console)[console.actions.google.com] to test
   * transactions.
   *
   * @return {boolean} True if app is being used in Sandbox mode.
   * @requestextractor
   */
  isInSandbox () {
    const data = this.requestData();
    return data && data.isInSandbox;
  }

  /**
   * Gets surface capabilities of user device.
   *
   * @return {Array<string>} Supported surface capabilities, as defined in
   *     AssistantApp.SurfaceCapabilities.
   * @apiai
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
    } else {
      error('No surface capabilities in incoming request');
      return null;
    }
  }

  /**
   * Gets type of input used for this request.
   *
   * @return {number} One of ApiAiApp.InputTypes.
   *     Null if no input type given.
   * @requestextractor
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
   * Returns true if the request follows a previous request asking for
   * permission from the user and the user granted the permission(s). Otherwise,
   * false. Use with {@link AssistantApp#askForPermissions|askForPermissions}.
   *
   * @example
   * const app = new ActionsSdkApp({request: request, response: response});
   * or
   * const app = new ApiAiApp({request: request, response: response});
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
   * @requestextractor
   */
  isPermissionGranted () {
    debug('isPermissionGranted');
    return this.getArgumentCommon(this.app.BuiltInArgNames.PERMISSION_GRANTED) === 'true';
  }
}

module.exports = RequestExtractor;
