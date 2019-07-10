/**
 * Copyright 2018 Google Inc. All Rights Reserved.
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

import * as Api from '../../api/v2'
import {
  NewSurfaceArgument,
  PermissionArgument,
  OptionArgument,
  ConfirmationArgument,
  DateTimeArgument,
  SignInArgument,
  PlaceArgument,
  DeepLinkArgument,
  TransactionDecisionArgument,
  TransactionRequirementsArgument,
  DeliveryAddressArgument,
  RegisterUpdateArgument,
  UpdatePermissionUserIdArgument,
  CompletePurchaseArgument,
  DigitalPurchaseCheckArgument,
} from '..'
import {
  RepromptArgument,
  FinalRepromptArgument,
} from './noinput'
import {
  MediaStatusArgument,
} from './media'

// Need to import because of https://github.com/Microsoft/TypeScript/issues/9944
import { ApiClientObjectMap } from '../../../../common'
// Need to use type to avoid unused local linter errors
export { ApiClientObjectMap }

/** @public */
export type Argument = Api.GoogleActionsV2Argument[keyof Api.GoogleActionsV2Argument]

export interface ArgumentsNamed {
  /**
   * True if the request follows a previous request asking for
   * permission from the user and the user granted the permission(s).
   * Otherwise, false.
   * Only use after calling {@link Permission|conv.ask(new Permission)}
   * or {@link UpdatePermission|conv.ask(new UpdatePermission)}.
   * @public
   */
  PERMISSION?: PermissionArgument

  /**
   * The option key user chose from options response.
   * Only use after calling {@link List|conv.ask(new List)}
   * or {@link Carousel|conv.ask(new Carousel)}.
   * @public
   */
  OPTION?: OptionArgument

  /**
   * The transactability of user.
   * Only use after calling {@link TransactionRequirements|conv.ask(new TransactionRequirements)}.
   * Undefined if no result given.
   * @public
   */
  TRANSACTION_REQUIREMENTS_CHECK_RESULT?: TransactionRequirementsArgument

  /**
   * The order delivery address.
   * Only use after calling {@link DeliveryAddress|conv.ask(new DeliveryAddress)}.
   * @public
   */
  DELIVERY_ADDRESS_VALUE?: DeliveryAddressArgument

  /**
   * The transaction decision information.
   * Is object with userDecision only if user declines.
   * userDecision will be one of {@link GoogleActionsV2TransactionDecisionValueUserDecision}.
   * Only use after calling {@link TransactionDecision|conv.ask(new TransactionDecision)}.
   * @public
   */
  TRANSACTION_DECISION_VALUE?: TransactionDecisionArgument

  /**
   * The complete purchase information.
   * Only use after calling {@link CompletePurchase|conv.ask(new CompletePurchase)}.
   * @public
   */
  COMPLETE_PURCHASE_VALUE?: CompletePurchaseArgument

  /**
   * Only use after calling {@link DigitalPurchaseCheck|conv.ask(new DigitalPurchaseCheck)}.
   * @public
   */
  DIGITAL_PURCHASE_CHECK_RESULT?: DigitalPurchaseCheckArgument

  /**
   * The confirmation decision.
   * Use after {@link Confirmation|conv.ask(new Confirmation)}
   * @public
   */
  CONFIRMATION?: ConfirmationArgument

  /**
   * The user provided date and time.
   * Use after {@link DateTime|conv.ask(new DateTime)}
   * @public
   */
  DATETIME?: DateTimeArgument

  /**
   * The status of user sign in request.
   * Use after {@link SignIn|conv.ask(new SignIn)}
   * @public
   */
  SIGN_IN?: SignInArgument

  /**
   * The number of subsequent reprompts related to silent input from the user.
   * This should be used along with the `actions.intent.NO_INPUT` intent to reprompt the
   * user for input in cases where the Google Assistant could not pick up any speech.
   * @public
   */
  REPROMPT_COUNT?: RepromptArgument

  /**
   * True if it is the final reprompt related to silent input from the user.
   * This should be used along with the `actions.intent.NO_INPUT` intent to give the final
   * response to the user after multiple silences and should be an `conv.close`
   * which ends the conversation.
   * @public
   */
  IS_FINAL_REPROMPT?: FinalRepromptArgument

  /**
   * The result of {@link NewSurface|conv.ask(new NewSurface)}
   * True if user has triggered conversation on a new device following the
   * `actions.intent.NEW_SURFACE` intent.
   * @public
   */
  NEW_SURFACE?: NewSurfaceArgument

  /**
   * True if user accepted update registration request.
   * Used with {@link RegisterUpdate|conv.ask(new RegisterUpdate)}
   * @public
   */
  REGISTER_UPDATE?: RegisterUpdateArgument

  /**
   * The updates user id.
   * Only use after calling {@link UpdatePermission|conv.ask(new UpdatePermission)}.
   * @public
   */
  UPDATES_USER_ID?: UpdatePermissionUserIdArgument

  /**
   * The user provided place.
   * Use after {@link Place|conv.ask(new Place)}.
   * @public
   */
  PLACE?: PlaceArgument

  /**
   * The link non status argument.
   * Is undefined as a noop.
   * Use {@link Status#get|conv.arguments.status.get('LINK')} to explicitly get the status.
   * @public
   * @deprecated
   */
  LINK?: DeepLinkArgument

  /**
   * The status of MEDIA_STATUS intent.
   * @public
   */
  MEDIA_STATUS?: MediaStatusArgument
}

export interface ArgumentsParsed extends ArgumentsNamed {
  /** @public */
  [name: string]: Argument | undefined
}

/** @hidden */
export interface ArgumentsIndexable {
  [key: string]: Argument
}

export interface ArgumentsStatus {
  /** @public */
  [name: string]: Api.GoogleRpcStatus | undefined
}

export interface ArgumentsRaw {
  /** @public */
  [name: string]: Api.GoogleActionsV2Argument
}

const getValue = (arg: Api.GoogleActionsV2Argument): Argument => {
  for (const key in arg) {
    if (key === 'name' || key === 'textValue' || key === 'status') {
      continue
    }
    return (arg as ArgumentsIndexable)[key]
  }
  // Manually handle the PERMISSION argument because of a bug not returning boolValue
  if (arg.name === 'PERMISSION') {
    return !!arg.boolValue
  }
  return arg.textValue
}

export class Parsed {
  /** @public */
  list: Argument[]

  /** @public */
  input: ArgumentsParsed = {}

  /** @hidden */
  constructor(raw: Api.GoogleActionsV2Argument[]) {
    this.list = raw.map((arg, i) => {
      const value = getValue(arg)
      const name = arg.name!
      this.input[name] = value
      return value
    })
  }

  /** @public */
  get<TName extends keyof ArgumentsNamed>(name: TName): ArgumentsNamed[TName]
  /** @public */
  get(name: string): Argument
  get(name: string) {
    return this.input[name]
  }
}

export class Status {
  /** @public */
  list: (Api.GoogleRpcStatus | undefined)[]

  /** @public */
  input: ArgumentsStatus = {}

  /** @hidden */
  constructor(raw: Api.GoogleActionsV2Argument[]) {
    this.list = raw.map((arg, i) => {
      const name = arg.name!
      const status = arg.status
      this.input[name] = status
      return status
    })
  }

  /** @public */
  get(name: string) {
    return this.input[name]
  }
}

export class Raw {
  /** @public */
  input: ArgumentsRaw

  /** @hidden */
  constructor(public list: Api.GoogleActionsV2Argument[]) {
    this.input = list.reduce((o, arg) => {
      o[arg.name!] = arg
      return o
    }, {} as ArgumentsRaw)
  }

  /** @public */
  get(name: string) {
    return this.input[name]
  }
}

export class Arguments {
  /** @public */
  parsed: Parsed

  /** @public */
  status: Status

  /** @public */
  raw: Raw

  /** @hidden */
  constructor(raw: Api.GoogleActionsV2Argument[] = []) {
    this.parsed = new Parsed(raw)
    this.status = new Status(raw)
    this.raw = new Raw(raw)
  }

  /**
   * Get the argument value by name from the current intent.
   * The first property value not named `name` or `status` will be returned.
   * Will retrieve `textValue` last.
   * If there is no other properties, return undefined.
   *
   * @example
   * ```javascript
   *
   * // Actions SDK
   * app.intent('actions.intent.PERMISSION', conv => {
   *   const granted = conv.arguments.get('PERMISSION') // boolean true if granted, false if not
   * })
   *
   * // Dialogflow
   * // Create a Dialogflow intent with the `actions_intent_PERMISSION` event
   * app.intent('Get Permission', conv => {
   *   const granted = conv.arguments.get('PERMISSION') // boolean true if granted, false if not
   * })
   * ```
   *
   * @param argument Name of the argument.
   * @return First property not named 'name' or 'status' with 'textValue' given last priority
   *     or undefined if no other properties.
   *
   * @public
   */
  get<TName extends keyof ArgumentsNamed>(name: TName): ArgumentsNamed[TName]
  /** @public */
  get(name: string): Argument
  get(name: string) {
    return this.parsed.get(name)
  }

  /** @public */
  [Symbol.iterator]() {
    return this.raw.list[Symbol.iterator]()
    // suppose to be Array.prototype.values(), but can't use because of bug:
    // https://bugs.chromium.org/p/chromium/issues/detail?id=615873
  }
}
