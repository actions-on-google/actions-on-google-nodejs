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
import { SoloHelper } from '../helper';
/** @public */
export declare type TransactionRequirementsArgument = Api.GoogleActionsV2TransactionRequirementsCheckResult | Api.GoogleActionsTransactionsV3TransactionRequirementsCheckResult;
/**
 * Checks whether user is in transactable state.
 * @public
 */
export declare class TransactionRequirements extends SoloHelper<'actions.intent.TRANSACTION_REQUIREMENTS_CHECK', Api.GoogleActionsV2TransactionRequirementsCheckSpec | Api.GoogleActionsTransactionsV3TransactionRequirementsCheckSpec> {
    /**
     * @param options The raw {@link GoogleActionsV2TransactionRequirementsCheckSpec}
     *     or {@link GoogleActionsTransactionsV3TransactionRequirementsCheckSpec}
     *     if using ordersv3
     * @public
     */
    constructor(options?: Api.GoogleActionsV2TransactionRequirementsCheckSpec | Api.GoogleActionsTransactionsV3TransactionRequirementsCheckSpec);
}
