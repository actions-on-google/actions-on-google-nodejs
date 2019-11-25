/**
 * Copyright 2018 Google Inc. All Rights Reserved.d
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
import * as Api from './api/v2';
import * as ApiV1 from './api/v1';
import { Image, Suggestions, BasicCard, SimpleResponse, LinkOutSuggestion, List, Carousel } from '../actionssdk';
import { JsonObject } from '../../common';
export declare type IncomingMessage = string | Image | Suggestions | BasicCard | SimpleResponse | LinkOutSuggestion | List | Carousel | JsonObject;
export declare class Incoming {
    /** @public */
    parsed: IncomingMessage[];
    /** @hidden */
    constructor(fulfillment: Api.GoogleCloudDialogflowV2IntentMessage[] | ApiV1.DialogflowV1Fulfillment | undefined);
    /**
     * Gets the first Dialogflow incoming message with the given type.
     * Messages are converted into client library class instances or a string.
     *
     * Only messages with the platform field unlabeled (for generic use)
     * or labeled `ACTIONS_ON_GOOGLE` (`google` in v1) will be converted and read.
     *
     * The conversation is detailed below for a specific message oneof:
     * * Generic Platform Response
     *   * `text` -> `typeof string`
     *   * `image` -> `Image`
     *   * `quickReplies` -> `Suggestions`
     *   * `card` -> `BasicCard`
     * * Actions on Google Response
     *   * `simpleResponses` -> `SimpleResponse[]`
     *   * `basicCard` -> `BasicCard`
     *   * `suggestions` -> `Suggestions`
     *   * `linkOutSuggestion` -> `LinkOutSuggestion`
     *   * `listSelect` -> `List`
     *   * `carouselSelect` -> `Carousel`
     *   * `payload` -> `typeof object`
     *
     * Dialogflow v1:
     * * Generic Platform Response
     *   * `0` (text) -> `typeof string`
     *   * `3` (image) -> `Image`
     *   * `1` (card) -> `BasicCard`
     *   * `2` (quick replies) -> `Suggestions`
     *   * `4` (custom payload) -> `typeof object`
     * * Actions on Google Response
     *   * `simple_response` -> `SimpleResponse`
     *   * `basic_card` -> `BasicCard`
     *   * `list_card` -> `List`
     *   * `suggestion_chips` -> `Suggestions`
     *   * `carousel_card` -> `Carousel`
     *   * `link_out_chip` -> `LinkOutSuggestion`
     *   * `custom_payload` -> `typeof object`
     *
     * @example
     * ```javascript
     *
     * // Dialogflow
     * const { dialogflow, BasicCard } = require('actions-on-google')
     *
     * const app = dialogflow()
     *
     * // Create an Actions on Google Basic Card in the Dialogflow Console Intent Responses section
     * app.intent('Default Welcome Intent', conv => {
     *   const str = conv.incoming.get('string') // get the first text response
     *   const card = conv.incoming.get(BasicCard) // gets the instance of BasicCard
     *   // Do something with the Basic Card
     * })
     * ```
     *
     * @param type A string checking for the typeof message or a class checking for instanceof message
     * @public
     */
    get<TMessage extends IncomingMessage>(type: new (...args: any[]) => TMessage): TMessage;
    /** @public */
    get(type: 'string'): string;
    /**
     * Gets the Dialogflow incoming messages as an iterator.
     * Messages are converted into client library class instances or a string.
     * See {@link Incoming#get|conv.incoming.get} for details on how the conversion works.
     *
     * @example
     * ```javascript
     *
     * // Dialogflow
     * const app = dialogflow()
     *
     * // Create messages in the Dialogflow Console Intent Responses section
     * app.intent('Default Welcome Intent', conv => {
     *   const messages = [...conv.incoming]
     *   // do something with the messages
     *   // or just spread them out back to the user
     *   conv.ask(`Here's what was set in the Dialogflow console`)
     *   conv.ask(...conv.incoming)
     * }
     * ```
     *
     * @public
     */
    [Symbol.iterator](): IterableIterator<IncomingMessage>;
}
