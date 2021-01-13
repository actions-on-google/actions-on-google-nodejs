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
import {
  Image,
  Suggestions,
  BasicCard,
  SimpleResponse,
  LinkOutSuggestion,
  List,
  Carousel,
  Button,
} from '../actionssdk';
import {JsonObject} from '../../common';

export type IncomingMessage =
  | string
  | Image
  | Suggestions
  | BasicCard
  | SimpleResponse
  | LinkOutSuggestion
  | List
  | Carousel
  | JsonObject;

const toImage = (imageUri: string | undefined) => {
  if (imageUri) {
    return new Image({
      url: imageUri,
      alt: '',
    });
  }
  return undefined;
};

export class Incoming {
  /** @public */
  parsed: IncomingMessage[] = [];

  /** @hidden */
  constructor(
    fulfillment:
      | Api.GoogleCloudDialogflowV2IntentMessage[]
      | ApiV1.DialogflowV1Fulfillment
      | undefined
  ) {
    if (typeof fulfillment === 'undefined') {
      return;
    }
    if (Array.isArray(fulfillment)) {
      // Dialogflow v2
      for (const message of fulfillment) {
        const {
          text,
          image,
          quickReplies,
          card,
          simpleResponses,
          basicCard,
          suggestions,
          linkOutSuggestion,
          listSelect,
          carouselSelect,
          platform,
          payload,
        } = message;
        if (
          platform &&
          platform !== 'ACTIONS_ON_GOOGLE' &&
          platform !== 'PLATFORM_UNSPECIFIED'
        ) {
          continue;
        }
        if (text) {
          this.parsed.push(...text.text!);
          continue;
        }
        if (image) {
          this.parsed.push(
            new Image({
              url: image.imageUri!,
              alt: image.accessibilityText!,
            })
          );
          continue;
        }
        if (quickReplies) {
          this.parsed.push(new Suggestions(quickReplies.quickReplies!));
          continue;
        }
        if (card) {
          const {buttons} = card;
          this.parsed.push(
            new BasicCard({
              title: card.title,
              subtitle: card.subtitle,
              image: toImage(card.imageUri),
              buttons: buttons
                ? buttons.map(
                    b =>
                      new Button({
                        title: b.text!,
                        url: b.postback,
                      })
                  )
                : undefined,
            })
          );
          continue;
        }
        if (simpleResponses) {
          this.parsed.push(
            ...simpleResponses.simpleResponses!.map(
              s =>
                new SimpleResponse({
                  speech: s.textToSpeech || s.ssml!,
                  text: s.displayText,
                })
            )
          );
          continue;
        }
        if (basicCard) {
          const {image, buttons} = basicCard;
          this.parsed.push(
            new BasicCard({
              title: basicCard.title,
              subtitle: basicCard.subtitle,
              text: basicCard.formattedText,
              image: image
                ? new Image({
                    url: image.imageUri!,
                    alt: image.accessibilityText!,
                  })
                : undefined,
              buttons: buttons
                ? buttons.map(
                    b =>
                      new Button({
                        title: b.title!,
                        url: b.openUriAction!.uri,
                      })
                  )
                : undefined,
            })
          );
          continue;
        }
        if (suggestions) {
          this.parsed.push(
            new Suggestions(suggestions.suggestions!.map(s => s.title!))
          );
          continue;
        }
        if (linkOutSuggestion) {
          this.parsed.push(
            new LinkOutSuggestion({
              name: linkOutSuggestion.destinationName!,
              url: linkOutSuggestion.uri!,
            })
          );
          continue;
        }
        if (listSelect) {
          this.parsed.push(
            new List({
              title: listSelect.title,
              items: listSelect.items!,
            })
          );
          continue;
        }
        if (carouselSelect) {
          this.parsed.push(
            new Carousel({
              items: carouselSelect.items!,
            })
          );
          continue;
        }
        if (payload) {
          this.parsed.push(payload);
          continue;
        }
      }
    } else {
      // Dialogflow v1
      const {speech, messages} = fulfillment;
      if (speech) {
        this.parsed.push(speech);
      }
      if (typeof messages !== 'undefined') {
        for (const message of messages) {
          const {platform, type} = message;
          if (platform && platform !== 'google') {
            continue;
          }
          if (type === 0) {
            const assumed = message as ApiV1.DialogflowV1MessageText;
            this.parsed.push(assumed.speech!);
            continue;
          }
          if (type === 3) {
            const assumed = message as ApiV1.DialogflowV1MessageImage;
            this.parsed.push(toImage(assumed.imageUrl)!);
            continue;
          }
          if (type === 1) {
            const assumed = message as ApiV1.DialogflowV1MessageCard;
            const {buttons} = assumed;
            this.parsed.push(
              new BasicCard({
                title: assumed.title,
                subtitle: assumed.subtitle,
                image: toImage(assumed.imageUrl),
                buttons: buttons
                  ? buttons.map(
                      b =>
                        new Button({
                          title: b.text!,
                          url: b.postback,
                        })
                    )
                  : undefined,
              })
            );
            continue;
          }
          if (type === 2) {
            const assumed = message as ApiV1.DialogflowV1MessageQuickReplies;
            this.parsed.push(new Suggestions(assumed.replies!));
            continue;
          }
          if (type === 4) {
            const assumed = message as ApiV1.DialogflowV1MessageCustomPayload;
            this.parsed.push(assumed.payload!);
            continue;
          }
          if (type === 'simple_response') {
            const assumed = message as ApiV1.DialogflowV1MessageSimpleResponse;
            this.parsed.push(
              new SimpleResponse({
                text: assumed.displayText,
                speech: assumed.textToSpeech!,
              })
            );
            continue;
          }
          if (type === 'basic_card') {
            const assumed = message as ApiV1.DialogflowV1MessageBasicCard;
            const {image = {}, buttons} = assumed;
            this.parsed.push(
              new BasicCard({
                title: assumed.title,
                subtitle: assumed.subtitle,
                text: assumed.formattedText,
                image: toImage(image.url),
                buttons: buttons
                  ? buttons.map(
                      b =>
                        new Button({
                          title: b.title!,
                          url: b.openUrlAction!.url,
                        })
                    )
                  : undefined,
              })
            );
            continue;
          }
          if (type === 'list_card') {
            const assumed = message as ApiV1.DialogflowV1MessageList;
            this.parsed.push(
              new List({
                title: assumed.title,
                items: assumed.items!,
              })
            );
            continue;
          }
          if (type === 'suggestion_chips') {
            const assumed = message as ApiV1.DialogflowV1MessageSuggestions;
            this.parsed.push(
              new Suggestions(assumed.suggestions!.map(s => s.title!))
            );
            continue;
          }
          if (type === 'carousel_card') {
            const assumed = message as ApiV1.DialogflowV1MessageCarousel;
            this.parsed.push(
              new Carousel({
                items: assumed.items!,
              })
            );
            continue;
          }
          if (type === 'link_out_chip') {
            const assumed = message as ApiV1.DialogflowV1MessageLinkOut;
            this.parsed.push(
              new LinkOutSuggestion({
                name: assumed.destinationName!,
                url: assumed.url!,
              })
            );
            continue;
          }
          if (type === 'custom_payload') {
            const assumed = message as ApiV1.DialogflowV1MessageGooglePayload;
            this.parsed.push(assumed.payload!);
            continue;
          }
        }
      }
    }
  }

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
  // tslint:disable-next-line:no-any allow constructors with any type of arguments
  get<TMessage extends IncomingMessage>(
    type: new (...args: any[]) => TMessage
  ): TMessage;
  /** @public */
  get(type: 'string'): string;
  // tslint:disable-next-line:no-any allow constructors with any type of arguments
  get<TMessage extends IncomingMessage>(
    type: 'string' | (new (...args: any[]) => TMessage)
  ) {
    for (const message of this) {
      if (typeof type === 'string') {
        if (typeof message === type) {
          return message;
        }
        continue;
      }
      if (message instanceof type) {
        return message;
      }
    }
    return null;
  }

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
  [Symbol.iterator]() {
    return this.parsed[Symbol.iterator]();
    // suppose to be Array.prototype.values(), but can't use because of bug:
    // https://bugs.chromium.org/p/chromium/issues/detail?id=615873
  }
}
