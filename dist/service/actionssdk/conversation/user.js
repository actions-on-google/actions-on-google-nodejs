"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const common = require("../../../common");
class Last {
    /** @hidden */
    constructor(user) {
        if (user.lastSeen) {
            this.seen = new Date(user.lastSeen);
        }
    }
}
exports.Last = Last;
class Name {
    /** @hidden */
    constructor(profile) {
        this.display = profile.displayName;
        this.family = profile.familyName;
        this.given = profile.givenName;
    }
}
exports.Name = Name;
class Access {
    /** @hidden */
    constructor(user) {
        this.token = user.accessToken;
    }
}
exports.Access = Access;
class Profile {
    /** @hidden */
    constructor(user) {
        this.token = user.idToken;
    }
    /** @hidden */
    _verify(client, id) {
        return __awaiter(this, void 0, void 0, function* () {
            const login = yield client.verifyIdToken({
                idToken: this.token,
                audience: id,
            });
            this.payload = login.getPayload();
            return this.payload;
        });
    }
}
exports.Profile = Profile;
class User {
    /** @hidden */
    constructor(raw = {}, initial) {
        this.raw = raw;
        const { userStorage } = this.raw;
        this.storage = userStorage ? JSON.parse(userStorage).data : (initial || {});
        this.id = this.raw.userId;
        this.locale = this.raw.locale;
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
        return JSON.stringify({ data: this.storage });
    }
    /** @hidden */
    _verifyProfile(client, id) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = yield this.profile._verify(client, id);
            this.email = payload.email;
            return payload;
        });
    }
    /**
     * Random string ID for Google user.
     * @deprecated Use {@link User#storage|conv.user.storage} instead.
     * @public
     */
    get id() {
        common.deprecate('conv.user.id', 'Use conv.user.storage to store data instead');
        return this._id;
    }
    set id(value) {
        this._id = value;
    }
}
exports.User = User;
//# sourceMappingURL=user.js.map