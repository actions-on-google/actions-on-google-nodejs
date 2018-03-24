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
export interface MediaObjectOptions {
  /** @public */
  url: string

  /** @public */
  description?: string

  /** @public */
  name?: string

  /** @public */
  icon?: Api.GoogleActionsV2UiElementsImage

  /** @public */
  image?: Api.GoogleActionsV2UiElementsImage
}

/** @public */
export interface MediaObject extends Api.GoogleActionsV2MediaObject { }
export class MediaObject implements Api.GoogleActionsV2MediaObject {
  /** @public */
  constructor(options: MediaObjectOptions | string) {
    if (typeof options === 'string') {
      this.contentUrl = options
      return
    }
    this.contentUrl = options.url
    this.description = options.description
    this.icon = options.icon
    this.largeImage = options.image
    this.name = options.name
  }

  static toMediaObject(object: MediaObjectString) {
    if (typeof object === 'string') {
      return new MediaObject(object)
    }
    return object
  }
}

export type MediaObjectString = Api.GoogleActionsV2MediaObject | string

/** @public */
export interface MediaResponseOptions {
  objects: MediaObjectString[]
  type?: Api.GoogleActionsV2MediaResponseMediaType
}

/** @public */
export interface MediaResponse extends Api.GoogleActionsV2MediaResponse { }
export class MediaResponse implements Api.GoogleActionsV2MediaResponse {
  /** @public */
  constructor(options: MediaResponseOptions)
  /** @public */
  constructor(objects: MediaObjectString[])
  /** @public */
  constructor(...objects: MediaObjectString[])
  constructor(
    options?: MediaResponseOptions |
      MediaObjectString[] |
      MediaObjectString,
    ...objects: MediaObjectString[],
  ) {
    this.mediaType = 'AUDIO'

    if (!options) {
      this.mediaObjects = []
      return
    }

    if (Array.isArray(options)) {
      this.mediaObjects = options.map(o => MediaObject.toMediaObject(o))
      return
    }

    if (this.isOptions(options)) {
      this.mediaType = options.type
      this.mediaObjects = options.objects.map(o => MediaObject.toMediaObject(o))
      return
    }
    this.mediaObjects = [options].concat(objects).map(o => MediaObject.toMediaObject(o))
  }

  private isOptions(
    options: MediaResponseOptions | MediaObjectString,
  ): options is MediaResponseOptions {
    const test = options as MediaResponseOptions
    return Array.isArray(test.objects)
  }
}
