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
  /**
   * Timestamp for the last access from the user.
   * Undefined if never seen.
   * @public
   */
  seen?: Date

  constructor(user: Api.GoogleActionsV2User) {
    if (user.lastSeen) {
      this.seen = new Date(user.lastSeen)
    }
  }
}

export class Name {
  /**
   * User's display name.
   * @public
   */
  display?: string

  /**
   * User's family name.
   * @public
   */
  family?: string

  /**
   * User's given name.
   * @public
   */
  given?: string

  constructor(profile: Api.GoogleActionsV2UserProfile) {
    this.display = profile.displayName
    this.family = profile.familyName
    this.given = profile.givenName
  }
}

export class Access {
  /**
   * Unique Oauth2 token. Only available with account linking.
   * @public
   */
  token?: string

  constructor(user: Api.GoogleActionsV2User) {
    this.token = user.accessToken
  }
}

export class User<TUserStorage> {
  /**
   * The data persistent across sessions in JSON format.
   * It exists in the same context as `conv.user.id`
   *
   * @example
   * // Actions SDK
   * app.intent('actions.intent.MAIN', conv => {
   *   conv.user.storage.someProperty = 'someValue'
   * })
   *
   * // Dialogflow
   * app.intent('Default Welcome Intent', conv => {
   *   conv.user.storage.someProperty = 'someValue'
   * })
   *
   * @public
   */
  storage: TUserStorage

  /**
   * Random string ID for Google user.
   * @public
   */
  id: string

  /**
   * The user locale. String represents the regional language
   * information of the user set in their Assistant settings.
   * For example, 'en-US' represents US English.
   * @public
   */
  locale: string

  /** @public */
  last: Last

  /** @public */
  permissions: Api.GoogleActionsV2UserPermissions[]

  /**
   * User's permissioned name info.
   * Properties will be undefined if not request with {@link Permission|conv.ask(new Permission)}
   * @public
   */
  name: Name

  /**
   * The list of all digital goods that your user purchased from
   * your published Android apps. To enable this feature, see the instructions
   * in the (documentation)[https://developers.google.com/actions/identity/digital-goods].
   * @public
   */
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

  _serialize() {
    return JSON.stringify({ data: this.storage })
  }
}
