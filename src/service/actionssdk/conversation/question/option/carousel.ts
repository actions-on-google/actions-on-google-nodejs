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
import { Question } from '../question'
import { OptionArgument, OptionItems, convert, OptionItem } from './option'

/** @public */
export type CarouselArgument = OptionArgument

/** @public */
export interface CarouselOptionItem extends OptionItem {
  /** @public */
  description: string
}

/** @public */
export interface CarouselOptions {
  /** @public */
  display?: Api.GoogleActionsV2UiElementsCarouselSelectImageDisplayOptions

  /** @public */
  items: OptionItems<CarouselOptionItem> | Api.GoogleActionsV2UiElementsCarouselSelectCarouselItem[]
}

/** @public */
export class Carousel extends Question<Api.GoogleActionsV2OptionValueSpec> {
  constructor(options: CarouselOptions) {
    super('actions.intent.OPTION')

    this.data('type.googleapis.com/google.actions.v2.OptionValueSpec', {
      carouselSelect: {
        items: Array.isArray(options.items) ? options.items : convert(options.items),
        imageDisplayOptions: options.display,
      },
    })
  }
}
