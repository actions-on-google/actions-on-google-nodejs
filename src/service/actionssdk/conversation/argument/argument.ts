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
} from '..'
import {
  RepromptArgument,
  FinalRepromptArgument,
} from './noinput'

/** @public */
export type Argument = Api.GoogleActionsV2Argument[keyof Api.GoogleActionsV2Argument]

export interface ArgumentsNamed {
  /** @public */
  PERMISSION?: PermissionArgument

  /** @public */
  OPTION?: OptionArgument

  /** @public */
  TRANSACTION_REQUIREMENTS_CHECK_RESULT?: Argument

  /** @public */
  DELIVERY_ADDRESS_VALUE?: Argument

  /** @public */
  TRANSACTION_DECISION_VALUE?: Argument

  /** @public */
  CONFIRMATION?: ConfirmationArgument

  /** @public */
  DATETIME?: DateTimeArgument

  /** @public */
  SIGN_IN?: SignInArgument

  /** @public */
  REPROMPT_COUNT?: RepromptArgument

  /** @public */
  IS_FINAL_REPROMPT?: FinalRepromptArgument

  /** @public */
  NEW_SURFACE?: NewSurfaceArgument

  /** @public */
  REGISTER_UPDATE?: Argument

  /** @public */
  PLACE?: PlaceArgument

  /** @public */
  LINK?: DeepLinkArgument
}

export interface ArgumentsInput extends ArgumentsNamed {
  /** @public */
  [name: string]: Argument | undefined
}

export interface ArgumentsIndexable {
  [key: string]: Argument
}

export class Arguments {
  /** @public */
  list: Argument[]

  /** @public */
  input: ArgumentsInput

  constructor(list: Api.GoogleActionsV2Argument[] = []) {
    this.input = {}
    this.list = list.map(arg => {
      const value = this.getValue(arg)
      const name = arg.name!
      this.input[name] = value
      return value
    })
  }

  private getValue(arg: Api.GoogleActionsV2Argument): Argument {
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
    if (arg.textValue) {
      return arg.textValue
    }
    return arg.status
  }

  /** @public */
  get<TName extends keyof ArgumentsNamed>(argument: TName): ArgumentsNamed[TName]
  /** @public */
  get(argument: string): Argument
  get(argument: string) {
    return this.input[argument]
  }
}
