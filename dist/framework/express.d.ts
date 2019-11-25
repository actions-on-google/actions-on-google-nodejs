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
 * @file Add built in plug and play web framework support for express using body-parser
 */
import { Framework, StandardHandler } from './framework';
import { Request, Response } from 'express';
export interface ExpressHandler {
    /** @public */
    (request: Request, response: Response): void;
}
export interface ExpressMetadata {
    /** @public */
    request: Request;
    /** @public */
    response: Response;
}
/** @hidden */
export declare class Express implements Framework<ExpressHandler> {
    handle(standard: StandardHandler): (request: Request, response: Response) => void;
    isResponse(second: {}): second is Response;
    isRequest(first: {}): first is Request;
    check(first: {}, second: {}): boolean;
}
/** @hidden */
export declare const express: Express;
