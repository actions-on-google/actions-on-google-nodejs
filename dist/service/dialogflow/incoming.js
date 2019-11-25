"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const actionssdk_1 = require("../actionssdk");
const toImage = (imageUri) => {
    if (imageUri) {
        return new actionssdk_1.Image({
            url: imageUri,
            alt: '',
        });
    }
    return undefined;
};
class Incoming {
    /** @hidden */
    constructor(fulfillment) {
        /** @public */
        this.parsed = [];
        if (typeof fulfillment === 'undefined') {
            return;
        }
        if (Array.isArray(fulfillment)) {
            // Dialogflow v2
            for (const message of fulfillment) {
                const { text, image, quickReplies, card, simpleResponses, basicCard, suggestions, linkOutSuggestion, listSelect, carouselSelect, platform, payload, } = message;
                if (platform && platform !== 'ACTIONS_ON_GOOGLE' && platform !== 'PLATFORM_UNSPECIFIED') {
                    continue;
                }
                if (text) {
                    this.parsed.push(...text.text);
                    continue;
                }
                if (image) {
                    this.parsed.push(new actionssdk_1.Image({
                        url: image.imageUri,
                        alt: image.accessibilityText,
                    }));
                    continue;
                }
                if (quickReplies) {
                    this.parsed.push(new actionssdk_1.Suggestions(quickReplies.quickReplies));
                    continue;
                }
                if (card) {
                    const { buttons } = card;
                    this.parsed.push(new actionssdk_1.BasicCard({
                        title: card.title,
                        subtitle: card.subtitle,
                        image: toImage(card.imageUri),
                        buttons: buttons ? buttons.map(b => new actionssdk_1.Button({
                            title: b.text,
                            url: b.postback,
                        })) : undefined,
                    }));
                    continue;
                }
                if (simpleResponses) {
                    this.parsed.push(...simpleResponses.simpleResponses.map(s => new actionssdk_1.SimpleResponse({
                        speech: s.textToSpeech || s.ssml,
                        text: s.displayText,
                    })));
                    continue;
                }
                if (basicCard) {
                    const { image, buttons } = basicCard;
                    this.parsed.push(new actionssdk_1.BasicCard({
                        title: basicCard.title,
                        subtitle: basicCard.subtitle,
                        text: basicCard.formattedText,
                        image: image ? new actionssdk_1.Image({
                            url: image.imageUri,
                            alt: image.accessibilityText,
                        }) : undefined,
                        buttons: buttons ? buttons.map(b => new actionssdk_1.Button({
                            title: b.title,
                            url: b.openUriAction.uri,
                        })) : undefined,
                    }));
                    continue;
                }
                if (suggestions) {
                    this.parsed.push(new actionssdk_1.Suggestions(suggestions.suggestions.map(s => s.title)));
                    continue;
                }
                if (linkOutSuggestion) {
                    this.parsed.push(new actionssdk_1.LinkOutSuggestion({
                        name: linkOutSuggestion.destinationName,
                        url: linkOutSuggestion.uri,
                    }));
                    continue;
                }
                if (listSelect) {
                    this.parsed.push(new actionssdk_1.List({
                        title: listSelect.title,
                        items: listSelect.items,
                    }));
                    continue;
                }
                if (carouselSelect) {
                    this.parsed.push(new actionssdk_1.Carousel({
                        items: carouselSelect.items,
                    }));
                    continue;
                }
                if (payload) {
                    this.parsed.push(payload);
                    continue;
                }
            }
        }
        else {
            // Dialogflow v1
            const { speech, messages } = fulfillment;
            if (speech) {
                this.parsed.push(speech);
            }
            if (typeof messages !== 'undefined') {
                for (const message of messages) {
                    const { platform, type } = message;
                    if (platform && platform !== 'google') {
                        continue;
                    }
                    if (type === 0) {
                        const assumed = message;
                        this.parsed.push(assumed.speech);
                        continue;
                    }
                    if (type === 3) {
                        const assumed = message;
                        this.parsed.push(toImage(assumed.imageUrl));
                        continue;
                    }
                    if (type === 1) {
                        const assumed = message;
                        const { buttons } = assumed;
                        this.parsed.push(new actionssdk_1.BasicCard({
                            title: assumed.title,
                            subtitle: assumed.subtitle,
                            image: toImage(assumed.imageUrl),
                            buttons: buttons ? buttons.map(b => new actionssdk_1.Button({
                                title: b.text,
                                url: b.postback,
                            })) : undefined,
                        }));
                        continue;
                    }
                    if (type === 2) {
                        const assumed = message;
                        this.parsed.push(new actionssdk_1.Suggestions(assumed.replies));
                        continue;
                    }
                    if (type === 4) {
                        const assumed = message;
                        this.parsed.push(assumed.payload);
                        continue;
                    }
                    if (type === 'simple_response') {
                        const assumed = message;
                        this.parsed.push(new actionssdk_1.SimpleResponse({
                            text: assumed.displayText,
                            speech: assumed.textToSpeech,
                        }));
                        continue;
                    }
                    if (type === 'basic_card') {
                        const assumed = message;
                        const { image = {}, buttons } = assumed;
                        this.parsed.push(new actionssdk_1.BasicCard({
                            title: assumed.title,
                            subtitle: assumed.subtitle,
                            text: assumed.formattedText,
                            image: toImage(image.url),
                            buttons: buttons ? buttons.map(b => new actionssdk_1.Button({
                                title: b.title,
                                url: b.openUrlAction.url,
                            })) : undefined,
                        }));
                        continue;
                    }
                    if (type === 'list_card') {
                        const assumed = message;
                        this.parsed.push(new actionssdk_1.List({
                            title: assumed.title,
                            items: assumed.items,
                        }));
                        continue;
                    }
                    if (type === 'suggestion_chips') {
                        const assumed = message;
                        this.parsed.push(new actionssdk_1.Suggestions(assumed.suggestions.map(s => s.title)));
                        continue;
                    }
                    if (type === 'carousel_card') {
                        const assumed = message;
                        this.parsed.push(new actionssdk_1.Carousel({
                            items: assumed.items,
                        }));
                        continue;
                    }
                    if (type === 'link_out_chip') {
                        const assumed = message;
                        this.parsed.push(new actionssdk_1.LinkOutSuggestion({
                            name: assumed.destinationName,
                            url: assumed.url,
                        }));
                        continue;
                    }
                    if (type === 'custom_payload') {
                        const assumed = message;
                        this.parsed.push(assumed.payload);
                        continue;
                    }
                }
            }
        }
    }
    // tslint:disable-next-line:no-any allow constructors with any type of arguments
    get(type) {
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
exports.Incoming = Incoming;
//# sourceMappingURL=incoming.js.map