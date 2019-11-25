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
const common = require("../common");
/** @hidden */
class Lambda {
    handle(standard) {
        return (event, context, callback) => __awaiter(this, void 0, void 0, function* () {
            const metadata = {
                context,
                event,
            };
            const entireBodyFormat = typeof event.headers !== 'object' || Array.isArray(event.headers);
            // convert header keys to lowercase for case insensitive header retrieval
            const headers = entireBodyFormat ? {} :
                Object.keys(event.headers).reduce((o, k) => {
                    o[k.toLowerCase()] = event.headers[k];
                    return o;
                }, {});
            const body = entireBodyFormat ? event :
                (typeof event.body === 'string' ? JSON.parse(event.body) : event.body);
            const result = yield standard(body, headers, { lambda: metadata })
                .catch((e) => {
                common.error(e.stack || e);
                callback(e);
            });
            if (!result) {
                return;
            }
            const { status } = result;
            callback(null, {
                statusCode: status,
                body: JSON.stringify(result.body),
                headers: result.headers,
            });
        });
    }
    isContext(second) {
        return typeof second.succeed === 'function';
    }
    isCallback(third) {
        return typeof third === 'function';
    }
    check(first, second, third) {
        return this.isContext(second) && this.isCallback(third);
    }
}
exports.Lambda = Lambda;
/** @hidden */
exports.lambda = new Lambda();
//# sourceMappingURL=lambda.js.map