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
Object.defineProperty(exports, "__esModule", { value: true });
const getValue = (arg) => {
    for (const key in arg) {
        if (key === 'name' || key === 'textValue' || key === 'status') {
            continue;
        }
        return arg[key];
    }
    // Manually handle the PERMISSION argument because of a bug not returning boolValue
    if (arg.name === 'PERMISSION') {
        return !!arg.boolValue;
    }
    return arg.textValue;
};
class Parsed {
    /** @hidden */
    constructor(raw) {
        /** @public */
        this.input = {};
        this.list = raw.map((arg, i) => {
            const value = getValue(arg);
            const name = arg.name;
            this.input[name] = value;
            return value;
        });
    }
    get(name) {
        return this.input[name];
    }
}
exports.Parsed = Parsed;
class Status {
    /** @hidden */
    constructor(raw) {
        /** @public */
        this.input = {};
        this.list = raw.map((arg, i) => {
            const name = arg.name;
            const status = arg.status;
            this.input[name] = status;
            return status;
        });
    }
    /** @public */
    get(name) {
        return this.input[name];
    }
}
exports.Status = Status;
class Raw {
    /** @hidden */
    constructor(list) {
        this.list = list;
        this.input = list.reduce((o, arg) => {
            o[arg.name] = arg;
            return o;
        }, {});
    }
    /** @public */
    get(name) {
        return this.input[name];
    }
}
exports.Raw = Raw;
class Arguments {
    /** @hidden */
    constructor(raw = []) {
        this.parsed = new Parsed(raw);
        this.status = new Status(raw);
        this.raw = new Raw(raw);
    }
    get(name) {
        return this.parsed.get(name);
    }
    /** @public */
    [Symbol.iterator]() {
        return this.raw.list[Symbol.iterator]();
        // suppose to be Array.prototype.values(), but can't use because of bug:
        // https://bugs.chromium.org/p/chromium/issues/detail?id=615873
    }
}
exports.Arguments = Arguments;
//# sourceMappingURL=argument.js.map