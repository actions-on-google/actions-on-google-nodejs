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

import * as Api from '../../api/v2'
import { SimpleResponse } from './simple'
import { BasicCard, Table } from './card'
import { BrowseCarousel } from './browse'
import { MediaResponse } from './media'
import { OrderUpdate } from './order'
import { LinkOutSuggestion } from './linkout'
import { Suggestions } from './suggestion'

/** @public */
export type RichResponseItem =
  string |
  SimpleResponse |
  BasicCard |
  Table |
  BrowseCarousel |
  MediaResponse |
  OrderUpdate |
  LinkOutSuggestion |
  Api.GoogleActionsV2RichResponseItem

/** @public */
export interface RichResponseOptions {
  /**
   * Ordered list of either SimpleResponse objects or BasicCard objects.
   * First item must be SimpleResponse. There can be at most one card.
   * @public
   */
  items?: RichResponseItem[]

  /**
   * Ordered list of text suggestions to display. Optional.
   * @public
   */
  suggestions?: string[] | Suggestions

  /**
   * Link Out Suggestion chip for this rich response. Optional.
   * @public
   */
  link?: Api.GoogleActionsV2UiElementsLinkOutSuggestion
}

const isOptions = (
  options: RichResponseOptions | RichResponseItem,
): options is RichResponseOptions => {
  const test = options as RichResponseOptions
  return typeof test.link === 'object' ||
    Array.isArray(test.items) ||
    Array.isArray(test.suggestions) ||
    test.suggestions instanceof Suggestions
}

/**
 * Class for initializing and constructing Rich Responses with chainable interface.
 * @public
 */
export interface RichResponse extends Api.GoogleActionsV2RichResponse { }
export class RichResponse implements Api.GoogleActionsV2RichResponse {
  /**
   * @param options RichResponse options
   * @public
   */
  constructor(options: RichResponseOptions)
  /**
   * @param items RichResponse items
   * @public
   */
  constructor(items: RichResponseItem[])
  /**
   * @param items RichResponse items
   * @public
   */
  constructor(...items: RichResponseItem[])
  constructor(
    options?: RichResponseOptions | RichResponseItem[] | RichResponseItem,
    ...items: RichResponseItem[]
  ) {
    this.items = []
    if (!options) {
      return
    }
    if (Array.isArray(options)) {
      this.add(...options)
      return
    }
    if (isOptions(options)) {
      if (options.items) {
        this.add(...options.items)
      }
      const { link, suggestions } = options
      this.linkOutSuggestion = link
      if (suggestions) {
        if (Array.isArray(suggestions)) {
          this.addSuggestion(...suggestions)
        } else {
          this.addSuggestion(suggestions)
        }
      }
      return
    }
    this.add(options, ...items)
  }

  /**
   * Add a RichResponse item
   * @public
   */
  add(...items: RichResponseItem[]) {
    for (const item of items) {
      if (typeof item === 'string') {
        this.add(new SimpleResponse(item))
        continue
      }
      if (item instanceof LinkOutSuggestion) {
        this.linkOutSuggestion = item
        continue
      }
      if (item instanceof SimpleResponse) {
        this.items!.push({ simpleResponse: item })
        continue
      }
      if (item instanceof BasicCard) {
        this.items!.push({ basicCard: item })
        continue
      }
      if (item instanceof Table) {
        this.items!.push({ tableCard: item })
        continue
      }
      if (item instanceof BrowseCarousel) {
        this.items!.push({ carouselBrowse: item })
        continue
      }
      if (item instanceof MediaResponse) {
        this.items!.push({ mediaResponse: item })
        continue
      }
      if (item instanceof OrderUpdate) {
        this.items!.push({ structuredResponse: { orderUpdate: item } })
        continue
      }
      this.items!.push(item)
    }
    return this
  }

  /**
   * Adds a single suggestion or list of suggestions to list of items.
   * @public
   */
  addSuggestion(...suggestions: (string | Suggestions)[]) {
    if (!this.suggestions) {
      this.suggestions = []
    }
    for (const suggestion of suggestions) {
      if (typeof suggestion === 'string') {
        this.addSuggestion(new Suggestions(suggestion))
        continue
      }
      this.suggestions.push(...suggestion.suggestions)
    }
    return this
  }
}
