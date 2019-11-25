"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const simple_1 = require("./simple");
const card_1 = require("./card");
const browse_1 = require("./browse");
const media_1 = require("./media");
const order_1 = require("./order");
const linkout_1 = require("./linkout");
const suggestion_1 = require("./suggestion");
const html_1 = require("./html");
const isOptions = (options) => {
    const test = options;
    return typeof test.link === 'object' ||
        Array.isArray(test.items) ||
        Array.isArray(test.suggestions) ||
        test.suggestions instanceof suggestion_1.Suggestions;
};
class RichResponse {
    constructor(options, ...items) {
        this.items = [];
        if (!options) {
            return;
        }
        if (Array.isArray(options)) {
            this.add(...options);
            return;
        }
        if (isOptions(options)) {
            if (options.items) {
                this.add(...options.items);
            }
            const { link, suggestions } = options;
            this.linkOutSuggestion = link;
            if (suggestions) {
                if (Array.isArray(suggestions)) {
                    this.addSuggestion(...suggestions);
                }
                else {
                    this.addSuggestion(suggestions);
                }
            }
            return;
        }
        this.add(options, ...items);
    }
    /**
     * Add a RichResponse item
     * @public
     */
    add(...items) {
        const raw = this.items;
        for (const item of items) {
            if (typeof item === 'string') {
                this.add(new simple_1.SimpleResponse(item));
                continue;
            }
            if (item instanceof linkout_1.LinkOutSuggestion) {
                this.linkOutSuggestion = item;
                continue;
            }
            if (item instanceof simple_1.SimpleResponse) {
                raw.push({ simpleResponse: item });
                continue;
            }
            if (item instanceof card_1.BasicCard) {
                raw.push({ basicCard: item });
                continue;
            }
            if (item instanceof card_1.Table) {
                raw.push({ tableCard: item });
                continue;
            }
            if (item instanceof browse_1.BrowseCarousel) {
                raw.push({ carouselBrowse: item });
                continue;
            }
            if (item instanceof media_1.MediaResponse) {
                raw.push({ mediaResponse: item });
                continue;
            }
            if (item instanceof order_1.OrderUpdate) {
                raw.push({ structuredResponse: { orderUpdate: item } });
                continue;
            }
            if (item instanceof html_1.HtmlResponse) {
                raw.push({ htmlResponse: item });
                continue;
            }
            raw.push(item);
        }
        return this;
    }
    /**
     * Adds a single suggestion or list of suggestions to list of items.
     * @public
     */
    addSuggestion(...suggestions) {
        if (!this.suggestions) {
            this.suggestions = [];
        }
        for (const suggestion of suggestions) {
            if (typeof suggestion === 'string') {
                this.addSuggestion(new suggestion_1.Suggestions(suggestion));
                continue;
            }
            this.suggestions.push(...suggestion.suggestions);
        }
        return this;
    }
}
exports.RichResponse = RichResponse;
//# sourceMappingURL=rich.js.map