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
export declare type DeliveryAddressArgument = Api.GoogleActionsV2DeliveryAddressValue;
/**
 * Asks user for delivery address.
 * @public
 */
export declare class DeliveryAddress extends SoloHelper<'actions.intent.DELIVERY_ADDRESS', Api.GoogleActionsV2DeliveryAddressValueSpec> {
    /**
     * @param options The raw {@link GoogleActionsV2DeliveryAddressValueSpec}
     * @public
     */
    constructor(options?: Api.GoogleActionsV2DeliveryAddressValueSpec);
}
