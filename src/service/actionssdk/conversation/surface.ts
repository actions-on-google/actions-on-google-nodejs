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

/** @public */
export type SurfaceCapability =
  'actions.capability.AUDIO_OUTPUT' |
  'actions.capability.SCREEN_OUTPUT' |
  'actions.capability.MEDIA_RESPONSE_AUDIO' |
  'actions.capability.WEB_BROWSER' |
  'actions.capability.INTERACTIVE_CANVAS'

export class Surface {
  /** @public */
  capabilities: Capabilities

  /** @hidden */
  constructor(surface: Api.GoogleActionsV2Surface = {}) {
    this.capabilities = new Capabilities(surface.capabilities)
  }

  /**
   * Checks if surface has an attribute like a capability
   *
   * @example
   * ```javascript
   *
   * app.intent('Default Welcome Intent', conv => {
   *   if (conv.surface.has('actions.capability.AUDIO_OUTPUT')) {
   *     conv.ask('You can hear me! How are you?')
   *   } else {
   *     conv.ask('You can read this! How are you?')
   *   }
   * })
   * ```
   *
   * @param attribute An attribute like SurfaceCapability
   * @public
   */
  has(attribute: SurfaceCapability) {
    if (this.capabilities.has(attribute)) {
      return true
    }
    return false
  }
}

export class Capabilities {
  /**
   * List of surface capabilities of user device.
   * @public
   */
  list: Api.GoogleActionsV2Capability[]

  /** @hidden */
  constructor(list: Api.GoogleActionsV2Capability[] = []) {
    this.list = list
  }

  /**
   * Returns true if user device has a given surface capability.
   * @public
   */
  has(capability: SurfaceCapability) {
    return this.list.map(c => c.name).indexOf(capability) > -1
  }
}

export class AvailableSurfacesCapabilities {
  /** @public */
  surfaces: Surface[]

  /** @hidden */
  constructor(surfaces: Surface[]) {
    this.surfaces = surfaces
  }

  /**
   * Returns true if user has an available surface which includes all given
   * capabilities. Available surfaces capabilities may exist on surfaces other
   * than that used for an ongoing conversation.
   * @public
   */
  has(capability: SurfaceCapability) {
    return this.surfaces.findIndex(surface => surface.capabilities.has(capability)) > -1
  }
}

export class AvailableSurfaces {
  /** @public */
  list: Surface[]

  /** @public */
  capabilities: AvailableSurfacesCapabilities

  /** @hidden */
  constructor(list: Api.GoogleActionsV2Surface[]) {
    this.list = list.map(surface => new Surface(surface))
    this.capabilities = new AvailableSurfacesCapabilities(this.list)
  }

  /**
   * Checks if available surfaces has an attribute like a capability
   *
   * @example
   * ```javascript
   *
   * app.intent('Default Welcome Intent', conv => {
   *   if (conv.available.surfaces.has('actions.capability.SCREEN_OUTPUT')) {
   *     conv.ask('You have a device that can view images! How are you?')
   *   } else {
   *     conv.ask('You do not have a device that can view images! How are you?')
   *   }
   * })
   * ```
   *
   * @param attribute An attribute like SurfaceCapability
   * @public
   */
  has(attribute: SurfaceCapability) {
    if (this.capabilities.has(attribute)) {
      return true
    }
    return false
  }
}

export class Available {
  /** @public */
  surfaces: AvailableSurfaces

  /** @hidden */
  constructor(surfaces: Api.GoogleActionsV2Surface[] = []) {
    this.surfaces = new AvailableSurfaces(surfaces)
  }
}
