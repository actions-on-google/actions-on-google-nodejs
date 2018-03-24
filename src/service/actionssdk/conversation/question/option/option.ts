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
  /** @public */
  [key: string]: TOptionItem
}

/** @public */
export interface OptionItem {
  /** @public */
  synonyms?: string[]

  /** @public */
  title: string

  /** @public */
  description?: string

  /** @public */
  image?: Api.GoogleActionsV2UiElementsImage
}

export interface ApiOptionItem extends Api.GoogleActionsV2UiElementsCarouselSelectCarouselItem { }

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
