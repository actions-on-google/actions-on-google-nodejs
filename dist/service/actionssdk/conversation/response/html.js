"use strict";
/**
 * Copyright 2019 Google Inc. All Rights Reserved.
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
class HtmlResponse {
    /**
     * @param options Canvas options
     * @public
     */
    constructor(options = {}) {
        const abstracted = options;
        const raw = options;
        this.url = options.url;
        this.suppressMic = typeof raw.suppressMic !== 'undefined' ?
            raw.suppressMic : abstracted.suppress;
        this.updatedState = raw.updatedState || abstracted.data;
    }
    /** @public */
    get suppress() {
        return !!this.suppressMic;
    }
    /** @public */
    set suppress(suppress) {
        this.suppressMic = suppress;
    }
    /** @public */
    get data() {
        return this.updatedState;
    }
    /** @public */
    set data(data) {
        this.updatedState = data;
    }
}
exports.HtmlResponse = HtmlResponse;
//# sourceMappingURL=html.js.map