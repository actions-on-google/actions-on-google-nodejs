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

export class Last {
  /** @public */
  seen?: Date

  constructor(user: Api.GoogleActionsV2User) {
    if (user.lastSeen) {
      this.seen = new Date(user.lastSeen)
    }
  }
}

export class Name {
  /** @public */
  display?: string

  /** @public */
  family?: string

  /** @public */
  given?: string

  constructor(profile: Api.GoogleActionsV2UserProfile) {
    this.display = profile.displayName
    this.family = profile.familyName
    this.given = profile.givenName
  }
}

export class Access {
  /** @public */
  token?: string

  constructor(user: Api.GoogleActionsV2User) {
    this.token = user.accessToken
  }
}

export class User<TUserStorage> {
  /** @public */
  storage: TUserStorage

  /** @public */
  id: string

  /** @public */
  locale: string

  /** @public */
  last: Last

  /** @public */
  permissions: Api.GoogleActionsV2UserPermissions[]

  /** @public */
  name: Name

  /** @public */
  entitlements: Api.GoogleActionsV2PackageEntitlement[]

  /** @public */
  access: Access

  constructor(user: Api.GoogleActionsV2User = {}, initial?: TUserStorage) {
    const { userStorage } = user
    this.storage = userStorage ? JSON.parse(userStorage).data : (initial || {})

    this.id = user.userId!
    this.locale = user.locale!

    this.permissions = user.permissions || []

    this.last = new Last(user)

    const profile = user.profile || {}
    this.name = new Name(profile)

    this.entitlements = user.packageEntitlements || []

    this.access = new Access(user)
  }

  serialize() {
    return JSON.stringify({ data: this.storage })
  }
}
