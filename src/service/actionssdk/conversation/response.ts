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

import * as Api from '../api/v2'
import { toArray } from '../../../common'

/** @public */
export interface LinkOutSuggestionOptions {
  /** @public */
  name: string

  /** @public */
  url: string
}

/** @public */
export interface LinkOutSuggestion extends Api.GoogleActionsV2UiElementsLinkOutSuggestion { }
export class LinkOutSuggestion implements Api.GoogleActionsV2UiElementsLinkOutSuggestion {
  /** @public */
  constructor(options: LinkOutSuggestionOptions) {
    this.destinationName = options.name
    this.url = options.url
  }
}

/** @public */
export interface SimpleResponseOptionsSpeech {
  /** @public */
  speech: string

  /** @public */
  text?: string
}

/** @public */
export interface SimpleResponseOptionsSSML {
  /** @public */
  ssml: string

  /** @public */
  text?: string
}

/** @public */
export type SimpleResponseOptions = SimpleResponseOptionsSpeech | SimpleResponseOptionsSSML

/** @public */
export interface SimpleResponse extends Api.GoogleActionsV2SimpleResponse { }
export class SimpleResponse implements Api.GoogleActionsV2SimpleResponse {
  /** @public */
  constructor(options: SimpleResponseOptions | string) {
    if (typeof options === 'string') {
      this.textToSpeech = options
      return
    }
    this.textToSpeech = (options as SimpleResponseOptionsSpeech).speech
    this.ssml = (options as SimpleResponseOptionsSSML).ssml
    this.displayText = options.text
  }
}

/** @public */
export interface ImageOptions {
  /** @public */
  url: string

  /** @public */
  alt: string

  /** @public */
  height?: number

  /** @public */
  width?: number
}

/** @public */
export interface Image extends Api.GoogleActionsV2UiElementsImage { }
export class Image implements Api.GoogleActionsV2UiElementsImage {
  /** @public */
  constructor(option: ImageOptions) {
    this.url = option.url
    this.accessibilityText = option.alt
    this.height = option.height
    this.width = option.width
  }
}

/** @public */
export interface OpenUrlActionOptions {
  /** @public */
  url: string
}

/** @public */
export interface OpenUrlAction extends Api.GoogleActionsV2UiElementsOpenUrlAction { }
export class OpenUrlAction implements Api.GoogleActionsV2UiElementsOpenUrlAction {
  /** @public */
  constructor(options: OpenUrlActionOptions) {
    this.url = options.url
  }
}

/** @public */
export interface ButtonOptions {
  /** @public */
  title: string

  /** @public */
  url?: string

  /** @public */
  action?: OpenUrlAction | Api.GoogleActionsV2UiElementsOpenUrlAction
}

/** @public */
export interface Button extends Api.GoogleActionsV2UiElementsButton { }
export class Button implements Api.GoogleActionsV2UiElementsButton {
  /** @public */
  constructor(options: ButtonOptions) {
    this.title = options.title
    if (options.url) {
      this.openUrlAction = { url: options.url }
    }
    if (options.action) {
      this.openUrlAction = options.action
    }
  }
}

/** @public */
export interface BasicCardOptions {
  /** @public */
  title?: string

  /** @public */
  subtitle?: string

  /** @public */
  text?: string

  /** @public */
  image?: Image | Api.GoogleActionsV2UiElementsImage

  /** @public */
  buttons?: Button |
    Api.GoogleActionsV2UiElementsButton |
    (Button | Api.GoogleActionsV2UiElementsButton)[]

  /** @public */
  display?: Api.GoogleActionsV2UiElementsBasicCardImageDisplayOptions
}

/** @public */
export interface BasicCard extends Api.GoogleActionsV2UiElementsBasicCard { }
export class BasicCard implements Api.GoogleActionsV2UiElementsBasicCard {
  /** @public */
  constructor(options: BasicCardOptions) {
    this.title = options.title
    this.subtitle = options.subtitle
    this.formattedText = options.text
    this.image = options.image
    const { buttons } = options
    if (buttons) {
      this.buttons = toArray(buttons)
    }
    this.imageDisplayOptions = options.display
  }
}

export interface StructuredResponse extends Api.GoogleActionsV2StructuredResponse { }
export class StructuredResponse implements Api.GoogleActionsV2StructuredResponse {
}

/** @public */
export type RichResponseItem =
  string |
  SimpleResponse |
  BasicCard |
  StructuredResponse |
  LinkOutSuggestion |
  Api.GoogleActionsV2RichResponseItem

/** @public */
export interface RichResponseOptions {
  /** @public */
  items?: RichResponseItem[]

  /** @public */
  suggestions?: string[] | Suggestions

  /** @public */
  link?: Api.GoogleActionsV2UiElementsLinkOutSuggestion
}

/** @public */
export interface RichResponse extends Api.GoogleActionsV2RichResponse { }
export class RichResponse implements Api.GoogleActionsV2RichResponse {
  /** @public */
  constructor(
    options?: RichResponseOptions | RichResponseItem[] | RichResponseItem,
    ...items: RichResponseItem[],
  ) {
    this.items = []
    if (!options) {
      return
    }
    if (Array.isArray(options)) {
      this.add(...options)
      return
    }
    if (this.isOptions(options)) {
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

  private isOptions(
    options: RichResponseOptions | RichResponseItem,
  ): options is RichResponseOptions {
    const test = options as RichResponseOptions
    return typeof test.link === 'object' ||
      Array.isArray(test.items) ||
      Array.isArray(test.suggestions) ||
      test.suggestions instanceof Suggestions
  }

  /** @public */
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
      if (item instanceof StructuredResponse) {
        this.items!.push({ structuredResponse: item })
        continue
      }
      this.items!.push(item)
    }
    return this
  }

  /** @public */
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

/** @public */
export class Suggestions {
  /** @public */
  suggestions: Api.GoogleActionsV2UiElementsSuggestion[] = []

  /** @public */
  constructor(...suggestions: (string[] | string)[]) {
    for (const suggestion of suggestions) {
      this.add(...toArray(suggestion))
    }
  }

  /** @public */
  add(...suggestions: string[]) {
    this.suggestions.push(...suggestions.map(title => ({ title })))
    return this
  }
}
