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

import * as Api from '../api/v2';
import {OAuth2Client} from 'google-auth-library';
import {
  LoginTicket,
  TokenPayload,
} from 'google-auth-library/build/src/auth/loginticket';
import * as common from '../../../common';

export class Last {
  /**
   * Timestamp for the last access from the user.
   * Undefined if never seen.
   * @public
   */
  seen?: Date;

  /** @hidden */
  constructor(user: Api.GoogleActionsV2User) {
    if (user.lastSeen) {
      this.seen = new Date(user.lastSeen);
    }
  }
}

export class Name {
  /**
   * User's display name.
   * @public
   */
  display?: string;

  /**
   * User's family name.
   * @public
   */
  family?: string;

  /**
   * User's given name.
   * @public
   */
  given?: string;

  /** @hidden */
  constructor(profile: Api.GoogleActionsV2UserProfile) {
    this.display = profile.displayName;
    this.family = profile.familyName;
    this.given = profile.givenName;
  }
}

export class Access {
  /**
   * Unique Oauth2 token. Only available with account linking.
   * @public
   */
  token?: string;

  /** @hidden */
  constructor(user: Api.GoogleActionsV2User) {
    this.token = user.accessToken;
  }
}

export class Profile {
  /**
   * Gets the Profile Payload object encoded in {@link Profile#token|conv.user.profile.token}.
   * Only retrievable with "Google Sign In" linking type set up for account linking in the console.
   *
   * To access just the email in the payload, you can also use {@link User#email|conv.user.email}.
   *
   * @example
   * ```javascript
   *
   * // Dialogflow
   * const app = dialogflow({
   *   clientId: CLIENT_ID,
   * })
   *
   * app.intent('Default Welcome Intent', conv => {
   *   conv.ask(new SignIn('To get your account details'))
   * })
   *
   * // Create a Dialogflow intent with the `actions_intent_SIGN_IN` event
   * app.intent('Get Signin', (conv, params, signin) => {
   *   if (signin.status === 'OK') {
   *     const payload = conv.user.profile.payload
   *     conv.ask(`I got your account details. What do you want to do next?`)
   *   } else {
   *     conv.ask(`I won't be able to save your data, but what do you want to do next?`)
   *   }
   * })
   *
   * // Actions SDK
   * const app = actionssdk({
   *   clientId: CLIENT_ID,
   * })
   *
   * app.intent('actions.intent.MAIN', conv => {
   *   conv.ask(new SignIn('To get your account details'))
   * })
   *
   * app.intent('actions.intent.SIGN_IN', (conv, input, signin) => {
   *   if (signin.status === 'OK') {
   *     const payload = conv.user.profile.payload
   *     conv.ask(`I got your account details. What do you want to do next?`)
   *   } else {
   *     conv.ask(`I won't be able to save your data, but what do you want to do next?`)
   *   }
   * })
   * ```
   *
   * @public
   */
  payload?: TokenPayload;

  /**
   * The `user.idToken` retrieved from account linking.
   * Only retrievable with "Google Sign In" linking type set up for account linking in the console.
   * @public
   */
  token?: string;

  /** @hidden */
  constructor(user: Api.GoogleActionsV2User) {
    this.token = user.idToken;
  }

  /** @hidden */
  async _verify(client: OAuth2Client, id: string) {
    const login = (await client.verifyIdToken({
      idToken: this.token!,
      audience: id,
    })) as LoginTicket;
    this.payload = login.getPayload();
    return this.payload;
  }
}

export class User<TUserStorage> {
  /**
   * The data persistent across sessions in JSON format.
   * It exists in the same context as `conv.user.id`
   *
   * @example
   * ```javascript
   *
   * // Actions SDK
   * app.intent('actions.intent.MAIN', conv => {
   *   conv.user.storage.someProperty = 'someValue'
   * })
   *
   * // Dialogflow
   * app.intent('Default Welcome Intent', conv => {
   *   conv.user.storage.someProperty = 'someValue'
   * })
   * ```
   *
   * @public
   */
  storage: TUserStorage;

  /**
   * The user locale. String represents the regional language
   * information of the user set in their Assistant settings.
   * For example, 'en-US' represents US English.
   * @public
   */
  locale: string;

  /** @public */
  last: Last;

  /** @public */
  permissions: Api.GoogleActionsV2UserPermissions[];

  /**
   * User's permissioned name info.
   * Properties will be undefined if not request with {@link Permission|conv.ask(new Permission)}
   * @public
   */
  name: Name;

  /**
   * The list of all digital goods that your user purchased from
   * your published Android apps. To enable this feature, see the instructions
   * in the {@link https://developers.google.com/actions/identity/digital-goods|documentation}.
   * @public
   */
  entitlements: Api.GoogleActionsV2PackageEntitlement[];

  /** @public */
  access: Access;

  /** @public */
  profile: Profile;

  /** @hidden */
  _id: string;

  /**
   * Gets the user profile email.
   * Only retrievable with "Google Sign In" linking type set up for account linking in the console.
   *
   * See {@link Profile#payload|conv.user.profile.payload} for all the payload properties.
   *
   * @example
   * ```javascript
   *
   * // Dialogflow
   * const app = dialogflow({
   *   clientId: CLIENT_ID,
   * })
   *
   * app.intent('Default Welcome Intent', conv => {
   *   conv.ask(new SignIn('To get your account details'))
   * })
   *
   * // Create a Dialogflow intent with the `actions_intent_SIGN_IN` event
   * app.intent('Get Signin', (conv, params, signin) => {
   *   if (signin.status === 'OK') {
   *     const email = conv.user.email
   *     conv.ask(`I got your email as ${email}. What do you want to do next?`)
   *   } else {
   *     conv.ask(`I won't be able to save your data, but what do you want to next?`)
   *   }
   * })
   *
   * // Actions SDK
   * const app = actionssdk({
   *   clientId: CLIENT_ID,
   * })
   *
   * app.intent('actions.intent.MAIN', conv => {
   *   conv.ask(new SignIn('To get your account details'))
   * })
   *
   * app.intent('actions.intent.SIGN_IN', (conv, input, signin) => {
   *   if (signin.status === 'OK') {
   *     const email = conv.user.email
   *     conv.ask(`I got your email as ${email}. What do you want to do next?`)
   *   } else {
   *     conv.ask(`I won't be able to save your data, but what do you want to next?`)
   *   }
   * })
   * ```
   *
   * @public
   */
  email?: string;

  /**
   * Determine if the user is 'GUEST' or 'VERIFIED'
   * @public
   */
  verification?: Api.GoogleActionsV2UserUserVerificationStatus;

  /** @hidden */
  constructor(
    public raw: Api.GoogleActionsV2User = {},
    initial?: TUserStorage
  ) {
    const {userStorage} = this.raw;
    this.storage = userStorage ? JSON.parse(userStorage).data : initial || {};

    this.id = this.raw.userId!;
    this.locale = this.raw.locale!;

    this.verification = this.raw.userVerificationStatus;

    this.permissions = this.raw.permissions || [];

    this.last = new Last(this.raw);

    const profile = this.raw.profile || {};
    this.name = new Name(profile);

    this.entitlements = this.raw.packageEntitlements || [];

    this.access = new Access(this.raw);

    this.profile = new Profile(this.raw);
  }

  /** @hidden */
  _serialize() {
    return JSON.stringify({data: this.storage});
  }

  /** @hidden */
  async _verifyProfile(client: OAuth2Client, id: string) {
    const payload = await this.profile._verify(client, id);
    this.email = payload!.email;
    return payload;
  }

  /**
   * Random string ID for Google user.
   * @deprecated Use {@link User#storage|conv.user.storage} instead.
   * @public
   */
  get id() {
    common.deprecate(
      'conv.user.id',
      'Use conv.user.storage to store data instead'
    );
    return this._id;
  }

  set id(value) {
    this._id = value;
  }
}
