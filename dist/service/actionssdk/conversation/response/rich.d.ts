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
import { SimpleResponse } from './simple';
import { BasicCard, Table } from './card';
import { BrowseCarousel } from './browse';
import { MediaResponse } from './media';
import { OrderUpdate } from './order';
import { LinkOutSuggestion } from './linkout';
import { Suggestions } from './suggestion';
import { HtmlResponse } from './html';
/** @public */
export declare type RichResponseItem = string | SimpleResponse | BasicCard | Table | BrowseCarousel | MediaResponse | OrderUpdate | LinkOutSuggestion | HtmlResponse | Api.GoogleActionsV2RichResponseItem;
/** @public */
export interface RichResponseOptions {
    /**
     * Ordered list of either SimpleResponse objects or BasicCard objects.
     * First item must be SimpleResponse. There can be at most one card.
     * @public
     */
    items?: RichResponseItem[];
    /**
     * Ordered list of text suggestions to display. Optional.
     * @public
     */
    suggestions?: string[] | Suggestions;
    /**
     * Link Out Suggestion chip for this rich response. Optional.
     * @public
     */
    link?: Api.GoogleActionsV2UiElementsLinkOutSuggestion;
}
/**
 * Class for initializing and constructing Rich Responses with chainable interface.
 * @public
 */
export interface RichResponse extends Api.GoogleActionsV2RichResponse {
}
export declare class RichResponse implements Api.GoogleActionsV2RichResponse {
    /**
     * @param options RichResponse options
     * @public
     */
    constructor(options: RichResponseOptions);
    /**
     * @param items RichResponse items
     * @public
     */
    constructor(items: RichResponseItem[]);
    /**
     * @param items RichResponse items
     * @public
     */
    constructor(...items: RichResponseItem[]);
    /**
     * Add a RichResponse item
     * @public
     */
    add(...items: RichResponseItem[]): this;
    /**
     * Adds a single suggestion or list of suggestions to list of items.
     * @public
     */
    addSuggestion(...suggestions: (string | Suggestions)[]): this;
}
