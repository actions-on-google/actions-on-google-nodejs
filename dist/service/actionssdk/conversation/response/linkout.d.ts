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
import * as Api from '../../api/v2';
/** @public */
export interface LinkOutSuggestionOptions {
    /**
     * Text shown on the suggestion chip.
     * @public
     */
    name: string;
    /**
     * String URL to open.
     * @public
     */
    url: string;
}
/**
 * Link Out Suggestion.
 * Used in rich response as a suggestion chip which, when selected, links out to external URL.
 * @public
 */
export interface LinkOutSuggestion extends Api.GoogleActionsV2UiElementsLinkOutSuggestion {
}
export declare class LinkOutSuggestion implements Api.GoogleActionsV2UiElementsLinkOutSuggestion {
    /**
     * @param options LinkOutSuggestion options
     * @public
     */
    constructor(options: LinkOutSuggestionOptions);
}
