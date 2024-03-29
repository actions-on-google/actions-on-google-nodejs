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

import * as Api from '../../../api/v2';
import {SoloHelper} from '../helper';

/** @public */
export type TransactionDecisionArgument =
  | Api.GoogleActionsV2TransactionDecisionValue
  | Api.GoogleActionsTransactionsV3TransactionDecisionValue;

/**
 * Asks user to confirm transaction information.
 * @public
 */
export class TransactionDecision extends SoloHelper<
  'actions.intent.TRANSACTION_DECISION',
  | Api.GoogleActionsV2TransactionDecisionValueSpec
  | Api.GoogleActionsTransactionsV3TransactionDecisionValueSpec
> {
  /**
   * @param options The raw {@link GoogleActionsV2TransactionDecisionValueSpec}
   *     or {@link GoogleActionsTransactionsV3TransactionDecisionValueSpec}
   *     if using ordersv3
   * @public
   */
  constructor(
    options?:
      | Api.GoogleActionsV2TransactionDecisionValueSpec
      | Api.GoogleActionsTransactionsV3TransactionDecisionValueSpec
  ) {
    super({
      intent: 'actions.intent.TRANSACTION_DECISION',
      type: 'type.googleapis.com/google.actions.v2.TransactionDecisionValueSpec',
      data: options,
    });
  }
}
