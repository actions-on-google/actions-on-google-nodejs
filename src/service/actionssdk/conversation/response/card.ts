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
import { toArray } from '../../../../common'

/** @public */
export interface ButtonOptions {
  /** @public */
  title: string

  /** @public */
  url?: string

  /** @public */
  action?: Api.GoogleActionsV2UiElementsOpenUrlAction
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
  image?: Api.GoogleActionsV2UiElementsImage

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
