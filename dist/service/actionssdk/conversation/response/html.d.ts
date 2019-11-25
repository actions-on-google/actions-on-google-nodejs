/**
 * Copyright 2019 Google Inc. All Rights Reserved.
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
import * as Api from '../../api/v2';
import { JsonObject } from '../../../../common';
/** @public */
export interface HtmlResponseOptions<TData extends JsonObject = JsonObject> {
    /**
     * The url of the web app.
     *
     * @public
     */
    url?: string;
    /**
     * Configure if the mic is closed after this html response.
     *
     * Alias of `suppressMic`
     * @public
     */
    suppress?: boolean;
    /**
     * Communicate the following JSON object to the web app.
     *
     * Alias of `updatedState`
     * @public
     */
    data?: TData;
}
/**
 * Html Canvas Response
 * @public
 */
export interface HtmlResponse extends Api.GoogleActionsV2UiElementsHtmlResponse {
}
export declare class HtmlResponse<TData extends JsonObject = JsonObject> implements Api.GoogleActionsV2UiElementsHtmlResponse {
    /**
     * @param options Canvas options
     * @public
     */
    constructor(options?: HtmlResponseOptions<TData> | Api.GoogleActionsV2UiElementsHtmlResponse);
    /** @public */
    /** @public */
    suppress: boolean;
    /** @public */
    /** @public */
    data: TData;
}
