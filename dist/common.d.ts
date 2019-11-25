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
import * as Debug from 'debug';
import * as https from 'https';
/** @hidden */
export declare const debug: Debug.IDebugger;
/** @hidden */
export declare const warn: Debug.IDebugger;
/** @hidden */
export declare const error: {
    (message?: any, ...optionalParams: any[]): void;
    (message?: any, ...optionalParams: any[]): void;
};
/** @hidden */
export declare const info: {
    (message?: any, ...optionalParams: any[]): void;
    (message?: any, ...optionalParams: any[]): void;
};
/** @hidden */
export declare const deprecate: (feature: string, alternative: string) => void;
/** @public */
export interface JsonObject {
    [key: string]: any;
}
/** @hidden */
export declare const values: <T>(o: {
    [key: string]: T;
}) => T[];
/** @hidden */
export declare const clone: <T>(o: T) => T;
/** @hidden */
export declare const stringify: (root: any, ...exclude: string[]) => string;
/** @hidden */
export declare type ProtoAny<TType, TSpec> = {
    '@type': TType;
} & TSpec;
/** @hidden */
export declare const toArray: <T>(a: T | T[]) => T[];
/** @hidden */
export interface ApiClientObjectMap<TValue> {
    [key: string]: TValue;
}
/** @hidden */
export declare const request: typeof https.request;
