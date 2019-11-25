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
/**
 * @file Add built in plug and play web framework support for lambda API gateway
 */
import { Framework, StandardHandler } from './framework';
import { JsonObject } from '../common';
import { Context, Callback } from 'aws-lambda';
export interface LambdaHandler {
    /** @public */
    (event: JsonObject, context: Context, callback: Callback): Promise<void>;
}
export interface LambdaMetadata {
    /** @public */
    event: JsonObject;
    /** @public */
    context: Context;
}
/** @hidden */
export declare class Lambda implements Framework<LambdaHandler> {
    handle(standard: StandardHandler): (event: JsonObject, context: Context, callback: Callback<any>) => Promise<void>;
    isContext(second: {}): second is Context;
    isCallback(third: {}): third is Callback;
    check(first: {}, second: {}, third: {}): boolean;
}
/** @hidden */
export declare const lambda: Lambda;
