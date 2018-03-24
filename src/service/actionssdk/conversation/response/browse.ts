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

/** @public */
export interface BrowseCarouselOptions {
  /** @public */
  display?: Api.GoogleActionsV2UiElementsCarouselBrowseImageDisplayOptions

  /** @public */
  items: Api.GoogleActionsV2UiElementsCarouselBrowseItem[]
}

/** @public */
export interface BrowseCarouselItemOptions {
  /** @public */
  title: string

  /** @public */
  url: string

  /** @public */
  description?: string

  /** @public */
  footer?: string

  /** @public */
  image?: Api.GoogleActionsV2UiElementsImage
}

/** @public */
export interface BrowseCarouselItem extends Api.GoogleActionsV2UiElementsCarouselBrowseItem { }
export class BrowseCarouselItem implements Api.GoogleActionsV2UiElementsCarouselBrowseItem {
  /** @public */
  constructor(options: BrowseCarouselItemOptions) {
    this.title = options.title
    this.openUrlAction = {
      url: options.url,
    }
    this.description = options.description
    this.footer = options.footer
    this.image = options.image
  }
}

/** @public */
export interface BrowseCarousel extends Api.GoogleActionsV2UiElementsCarouselBrowse { }
export class BrowseCarousel implements Api.GoogleActionsV2UiElementsCarouselBrowse {
  /** @public */
  constructor(options: BrowseCarouselOptions)
  /** @public */
  constructor(items: Api.GoogleActionsV2UiElementsCarouselBrowseItem[])
  /** @public */
  constructor(...items: Api.GoogleActionsV2UiElementsCarouselBrowseItem[])
  constructor(
    options?: BrowseCarouselOptions |
      Api.GoogleActionsV2UiElementsCarouselBrowseItem[] |
      Api.GoogleActionsV2UiElementsCarouselBrowseItem,
    ...items: Api.GoogleActionsV2UiElementsCarouselBrowseItem[],
  ) {
    if (!options) {
      this.items = []
      return
    }
    if (Array.isArray(options)) {
      this.items = options
      return
    }
    if (this.isOptions(options)) {
      this.imageDisplayOptions = options.display
      this.items = options.items
      return
    }
    this.items = [options].concat(items)
  }

  private isOptions(
    options: BrowseCarouselOptions | Api.GoogleActionsV2UiElementsCarouselBrowseItem,
  ): options is BrowseCarouselOptions {
    const test = options as BrowseCarouselOptions
    return Array.isArray(test.items)
  }
}
