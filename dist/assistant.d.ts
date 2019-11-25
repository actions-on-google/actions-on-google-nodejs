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
import { OmniHandler, StandardHandler, BuiltinFrameworks } from './framework';
/** @public */
export declare type AppHandler = OmniHandler & BaseApp;
/** @public */
export interface AppOptions {
    /** @public */
    debug?: boolean;
}
/** @hidden */
export interface ServiceBaseApp {
    /** @public */
    handler: StandardHandler;
}
/** @public */
export interface Plugin<TService, TPlugin> {
    /** @public */
    <TApp>(app: AppHandler & TService & TApp): (AppHandler & TService & TApp & TPlugin) | void;
}
/** @public */
export interface BaseApp extends ServiceBaseApp {
    /** @public */
    frameworks: BuiltinFrameworks;
    /** @public */
    use<TService, TPlugin>(plugin: Plugin<TService, TPlugin>): this & TPlugin;
    /** @public */
    debug: boolean;
}
/** @hidden */
export declare const attach: <TService>(service: TService, options?: AppOptions | undefined) => OmniHandler & BaseApp & TService;
