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
const common = require("../common");
/** @hidden */
class Express {
    handle(standard) {
        return (request, response) => {
            const metadata = {
                request,
                response,
            };
            standard(request.body, request.headers, { express: metadata })
                .then(({ status, body, headers }) => {
                if (headers) {
                    for (const key in headers) {
                        response.setHeader(key, headers[key]);
                    }
                }
                response.status(status).send(body);
            })
                .catch((e) => {
                common.error(e.stack || e);
                response.status(500).send({ error: e.message || e });
            });
        };
    }
    isResponse(second) {
        return typeof second.send === 'function';
    }
    isRequest(first) {
        return typeof first.get === 'function';
    }
    check(first, second) {
        return this.isRequest(first) && this.isResponse(second);
    }
}
exports.Express = Express;
/** @hidden */
exports.express = new Express();
//# sourceMappingURL=express.js.map