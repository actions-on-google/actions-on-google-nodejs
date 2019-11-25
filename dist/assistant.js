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
const framework_1 = require("./framework");
const common = require("./common");
/** @hidden */
const create = (options) => ({
    frameworks: Object.assign({}, framework_1.builtin),
    handler: () => Promise.reject(new Error('StandardHandler not set')),
    use(plugin) {
        return plugin(this) || this;
    },
    debug: !!(options && options.debug),
});
/** @hidden */
exports.attach = (service, options) => {
    let app = Object.assign(create(options), service);
    // tslint:disable-next-line:no-any automatically detect any inputs
    const omni = (...args) => {
        for (const framework of common.values(app.frameworks)) {
            if (framework.check(...args)) {
                return framework.handle(app.handler)(...args);
            }
        }
        return app.handler(args[0], args[1]);
    };
    app = Object.assign(omni, app);
    const handler = app.handler.bind(app);
    const standard = (body, headers, metadata) => __awaiter(this, void 0, void 0, function* () {
        const log = app.debug ? common.info : common.debug;
        log('Request', common.stringify(body));
        log('Headers', common.stringify(headers));
        const response = yield handler(body, headers, metadata);
        if (!response.headers) {
            response.headers = {};
        }
        response.headers['content-type'] = 'application/json;charset=utf-8';
        log('Response', common.stringify(response));
        return response;
    });
    app.handler = standard;
    return app;
};
//# sourceMappingURL=assistant.js.map