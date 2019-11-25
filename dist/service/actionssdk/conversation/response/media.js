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
const toMediaObject = (object) => {
    if (typeof object === 'string') {
        return new MediaObject(object);
    }
    return object;
};
class MediaObject {
    /**
     * @param options MediaObject options or just a string for the url
     * @public
     */
    constructor(options) {
        if (typeof options === 'string') {
            this.contentUrl = options;
            return;
        }
        this.contentUrl = options.url;
        this.description = options.description;
        this.icon = options.icon;
        this.largeImage = options.image;
        this.name = options.name;
    }
}
exports.MediaObject = MediaObject;
const isOptions = (options) => {
    const test = options;
    return Array.isArray(test.objects);
};
class MediaResponse {
    constructor(options, ...objects) {
        this.mediaType = 'AUDIO';
        if (!options) {
            this.mediaObjects = [];
            return;
        }
        if (Array.isArray(options)) {
            this.mediaObjects = options.map(o => toMediaObject(o));
            return;
        }
        if (isOptions(options)) {
            this.mediaType = options.type || this.mediaType;
            this.mediaObjects = options.objects.map(o => toMediaObject(o));
            return;
        }
        this.mediaObjects = [options].concat(objects).map(o => toMediaObject(o));
    }
}
exports.MediaResponse = MediaResponse;
//# sourceMappingURL=media.js.map