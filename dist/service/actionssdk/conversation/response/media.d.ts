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
import * as Api from '../../api/v2';
/** @public */
export interface MediaObjectOptions {
    /**
     * MediaObject URL.
     * @public
     */
    url: string;
    /** @public */
    description?: string;
    /**
     * Name of the MediaObject.
     * @public
     */
    name?: string;
    /**
     * Icon image.
     * @public
     */
    icon?: Api.GoogleActionsV2UiElementsImage;
    /**
     * Large image.
     * @public
     */
    image?: Api.GoogleActionsV2UiElementsImage;
}
/**
 * Class for initializing and constructing MediaObject
 * @public
 */
export interface MediaObject extends Api.GoogleActionsV2MediaObject {
}
export declare class MediaObject implements Api.GoogleActionsV2MediaObject {
    /**
     * @param options MediaObject options or just a string for the url
     * @public
     */
    constructor(options: MediaObjectOptions | string);
}
export declare type MediaObjectString = Api.GoogleActionsV2MediaObject | string;
/** @public */
export interface MediaResponseOptions {
    /**
     * Array of MediaObject held in the MediaResponse.
     * @public
     */
    objects: MediaObjectString[];
    /**
     * Type of the media within this MediaResponse.
     * Defaults to 'AUDIO'
     * @public
     */
    type?: Api.GoogleActionsV2MediaResponseMediaType;
}
/**
 * Class for initializing and constructing MediaResponse.
 * @public
 */
export interface MediaResponse extends Api.GoogleActionsV2MediaResponse {
}
export declare class MediaResponse implements Api.GoogleActionsV2MediaResponse {
    /**
     * @param options MediaResponse options
     * @public
     */
    constructor(options: MediaResponseOptions);
    /**
     * @param objects MediaObjects
     * @public
     */
    constructor(objects: MediaObjectString[]);
    /**
     * @param objects MediaObjects
     * @public
     */
    constructor(...objects: MediaObjectString[]);
}
