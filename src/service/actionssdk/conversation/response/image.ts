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
