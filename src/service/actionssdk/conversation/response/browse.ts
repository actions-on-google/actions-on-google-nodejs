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
export interface BrowseCarouselOptions {
  /**
   * Sets the display options for the images in this carousel.
   * @public
   */
  display?: Api.GoogleActionsV2UiElementsCarouselBrowseImageDisplayOptions;

  /**
   * List of 2-20 items to show in this carousel.
   * @public
   */
  items: Api.GoogleActionsV2UiElementsCarouselBrowseItem[];
}

/** @public */
export interface BrowseCarouselItemOptions {
  /**
   * Title of the option item.
   * @public
   */
  title: string;

  /**
   * The URL of the link opened by clicking the BrowseCarouselItem.
   * You should either set this field or `openUrlAction` but not both.
   * @public
   */
  url?: string;

  /**
   * Description text of the item.
   * @public
   */
  description?: string;

  /**
   * Footer text of the item.
   * @public
   */
  footer?: string;

  /**
   * Image to show on item.
   * @public
   */
  image?: Api.GoogleActionsV2UiElementsImage;

  /**
   * The URL action that occurs by clicking the BrowseCarouselItem.
   * You should either set this field or `url` but not both.
   * @public
   */
  openUrlAction?: Api.GoogleActionsV2UiElementsOpenUrlAction;
}

/**
 * Class for initializing and constructing BrowseCarousel Items
 * @public
 */
export interface BrowseCarouselItem
  extends Api.GoogleActionsV2UiElementsCarouselBrowseItem {}
export class BrowseCarouselItem
  implements Api.GoogleActionsV2UiElementsCarouselBrowseItem
{
  /**
   * @param options BrowseCarouselItem options
   * @public
   */
  constructor(options: BrowseCarouselItemOptions) {
    this.title = options.title;
    if (options.url) {
      this.openUrlAction = {
        url: options.url,
      };
    }
    if (options.openUrlAction) {
      this.openUrlAction = options.openUrlAction;
    }
    this.description = options.description;
    this.footer = options.footer;
    this.image = options.image;
  }
}

const isOptions = (
  options:
    | BrowseCarouselOptions
    | Api.GoogleActionsV2UiElementsCarouselBrowseItem
): options is BrowseCarouselOptions => {
  const test = options as BrowseCarouselOptions;
  return Array.isArray(test.items);
};

/**
 * Class for initializing and constructing Browse Carousel.
 * @public
 */
export interface BrowseCarousel
  extends Api.GoogleActionsV2UiElementsCarouselBrowse {}
export class BrowseCarousel
  implements Api.GoogleActionsV2UiElementsCarouselBrowse
{
  /**
   * @param options BrowseCarousel options
   * @public
   */
  constructor(options: BrowseCarouselOptions);
  /**
   * @param items BrowseCarousel items
   * @public
   */
  constructor(items: Api.GoogleActionsV2UiElementsCarouselBrowseItem[]);
  /**
   * @param items BrowseCarousel items
   * @public
   */
  constructor(...items: Api.GoogleActionsV2UiElementsCarouselBrowseItem[]);
  constructor(
    options?:
      | BrowseCarouselOptions
      | Api.GoogleActionsV2UiElementsCarouselBrowseItem[]
      | Api.GoogleActionsV2UiElementsCarouselBrowseItem,
    ...items: Api.GoogleActionsV2UiElementsCarouselBrowseItem[]
  ) {
    if (!options) {
      this.items = [];
      return;
    }
    if (Array.isArray(options)) {
      this.items = options;
      return;
    }
    if (isOptions(options)) {
      this.imageDisplayOptions = options.display;
      this.items = options.items;
      return;
    }
    this.items = [options].concat(items);
  }
}
