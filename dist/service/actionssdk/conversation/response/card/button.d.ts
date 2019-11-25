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
/** @public */
export interface ButtonOptions {
    /**
     * Text shown on the button.
     * @public
     */
    title: string;
    /**
     * String URL to open.
     * @public
     */
    url?: string;
    /**
     * Action to take when selected. Recommended to use the url property for simple web page url open.
     * @public
     */
    action?: Api.GoogleActionsV2UiElementsOpenUrlAction;
}
/**
 * Card Button. Shown below cards. Open a URL when selected.
 * @public
 */
export interface Button extends Api.GoogleActionsV2UiElementsButton {
}
export declare class Button implements Api.GoogleActionsV2UiElementsButton {
    /**
     * @param options Button options
     * @public
     */
    constructor(options: ButtonOptions);
}
