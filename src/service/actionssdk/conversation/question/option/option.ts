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

import * as Api from '../../../api/v2'

/** @public */
export type OptionArgument = string

export interface OptionItems<TOptionItem = OptionItem | string> {
  /**
   * key: Unique string ID for this option.
   * @public
   */
  [key: string]: TOptionItem
}

/**
 * Option item. Used in actions.intent.OPTION intent.
 * @public
 */
export interface OptionItem {
  /**
   * Synonyms that can be used by the user to indicate this option if they do not use the key.
   * @public
   */
  synonyms?: string[]

  /**
   * Name of the item.
   * @public
   */
  title: string

  /**
   * Optional text describing the item.
   * @public
   */
  description?: string

  /**
   * Square image to show for this item.
   * @public
   */
  image?: Api.GoogleActionsV2UiElementsImage
}

/** @hidden */
export interface ApiOptionItem extends Api.GoogleActionsV2UiElementsCarouselSelectCarouselItem { }

/** @hidden */
export const convert = (items: OptionItems) => Object.keys(items).map(key => {
  const value = items[key]
  if (typeof value === 'string') {
    const item: ApiOptionItem = {
      title: value,
      optionInfo: {
        key,
      },
    }
    return item
  }
  const { description, image, synonyms, title } = value
  const item: ApiOptionItem = {
    optionInfo: {
      key,
      synonyms,
    },
    description,
    image,
    title,
  }
  return item
})
