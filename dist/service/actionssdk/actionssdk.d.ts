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
import * as Api from './api/v2';
import { AppHandler } from '../../assistant';
import { ExceptionHandler, Argument, Intent, ConversationAppOptions, ConversationApp } from './conversation';
import { ActionsSdkConversation } from './conv';
import { BuiltinFrameworkMetadata } from '../../framework';
/** @public */
export interface ActionsSdkIntentHandler<TConvData, TUserStorage, TConversation extends ActionsSdkConversation<TConvData, TUserStorage>, TArgument extends Argument> {
    /** @public */
    (conv: TConversation, 
    /**
     * The user's raw input query.
     * See {@link Input#raw|Input.raw}
     * Same as `conv.input.raw`
     */
    input: string, 
    /**
     * The first argument value from the current intent.
     * See {@link Arguments#get|Arguments.get}
     * Same as `conv.arguments.parsed.list[0]`
     */
    argument: TArgument, 
    /**
     * The first argument status from the current intent.
     * See {@link Arguments#status|Arguments.status}
     * Same as `conv.arguments.status.list[0]`
     */
    status: Api.GoogleRpcStatus | undefined): Promise<any> | any;
}
/** @hidden */
export interface ActionSdkIntentHandlers {
    [intent: string]: ActionsSdkIntentHandler<{}, {}, ActionsSdkConversation<{}, {}>, Argument> | string | undefined;
}
/** @hidden */
export interface ActionsSdkHandlers<TConvData, TUserStorage, TConversation extends ActionsSdkConversation<TConvData, TUserStorage>> {
    intents: ActionSdkIntentHandlers;
    catcher: ExceptionHandler<TUserStorage, TConversation>;
    fallback?: ActionsSdkIntentHandler<{}, {}, ActionsSdkConversation<{}, {}>, Argument> | string;
}
/** @public */
export interface ActionsSdkMiddleware<TConversationPlugin extends ActionsSdkConversation<{}, {}>> {
    /** @public */
    (
    /** @public */
    conv: ActionsSdkConversation<{}, {}>, 
    /** @public */
    framework: BuiltinFrameworkMetadata): (ActionsSdkConversation<{}, {}> & TConversationPlugin) | void | Promise<ActionsSdkConversation<{}, {}> & TConversationPlugin> | Promise<void>;
}
/** @public */
export interface ActionsSdkApp<TConvData, TUserStorage, TConversation extends ActionsSdkConversation<TConvData, TUserStorage>> extends ConversationApp<TConvData, TUserStorage> {
    /** @hidden */
    _handlers: ActionsSdkHandlers<TConvData, TUserStorage, TConversation>;
    /**
     * Sets the IntentHandler to be executed when the fulfillment is called
     * with a given Actions SDK intent.
     *
     * @param intent The Actions SDK intent to match.
     *     When given an array, sets the IntentHandler for any intent in the array.
     * @param handler The IntentHandler to be executed when the intent is matched.
     *     When given a string instead of a function, the intent fulfillment will be redirected
     *     to the IntentHandler of the redirected intent.
     * @public
     */
    intent<TArgument extends Argument>(intent: Intent | Intent[], handler: ActionsSdkIntentHandler<TConvData, TUserStorage, TConversation, TArgument> | Intent): this;
    /**
     * Sets the IntentHandler to be executed when the fulfillment is called
     * with a given Actions SDK intent.
     *
     * @param intent The Actions SDK intent to match.
     *     When given an array, sets the IntentHandler for any intent in the array.
     * @param handler The IntentHandler to be executed when the intent is matched.
     *     When given a string instead of a function, the intent fulfillment will be redirected
     *     to the IntentHandler of the redirected intent.
     * @public
     */
    intent<TArgument extends Argument>(intent: string | string[], handler: ActionsSdkIntentHandler<TConvData, TUserStorage, TConversation, TArgument> | string): this;
    /** @public */
    catch(catcher: ExceptionHandler<TUserStorage, TConversation>): this;
    /** @public */
    fallback(handler: ActionsSdkIntentHandler<TConvData, TUserStorage, TConversation, Argument> | string): this;
    /** @hidden */
    _middlewares: ActionsSdkMiddleware<ActionsSdkConversation<{}, {}>>[];
    /** @public */
    middleware<TConversationPlugin extends ActionsSdkConversation<{}, {}>>(middleware: ActionsSdkMiddleware<TConversationPlugin>): this;
    /** @public */
    verification?: ActionsSdkVerification | string;
}
/** @public */
export interface ActionsSdk {
    /** @public */
    <TConvData, TUserStorage, Conversation extends ActionsSdkConversation<TConvData, TUserStorage> = ActionsSdkConversation<TConvData, TUserStorage>>(options?: ActionsSdkOptions<TConvData, TUserStorage>): AppHandler & ActionsSdkApp<TConvData, TUserStorage, Conversation>;
    /** @public */
    <Conversation extends ActionsSdkConversation<{}, {}> = ActionsSdkConversation<{}, {}>>(options?: ActionsSdkOptions<{}, {}>): AppHandler & ActionsSdkApp<{}, {}, Conversation>;
}
/** @public */
export interface ActionsSdkVerification {
    /**
     * Google Cloud Project ID for the Assistant app.
     * @public
     */
    project: string;
    /**
     * Custom status code to return on verification error.
     * @public
     */
    status?: number;
    /**
     * Custom error message as a string or a function that returns a string
     * given the original error message set by the library.
     *
     * The message will get sent back in the JSON top level `error` property.
     * @public
     */
    error?: string | ((error: string) => string);
}
/** @public */
export interface ActionsSdkOptions<TConvData, TUserStorage> extends ConversationAppOptions<TConvData, TUserStorage> {
    /**
     * Validates whether request is from Google through signature verification.
     * Uses Google-Auth-Library to verify authorization token against given Google Cloud Project ID.
     * Auth token is given in request header with key, "authorization".
     *
     * HTTP Code 403 will be thrown by default on verification error.
     *
     * @example
     * ```javascript
     *
     * const app = actionssdk({ verification: 'nodejs-cloud-test-project-1234' })
     * ```
     *
     * @public
     */
    verification?: ActionsSdkVerification | string;
}
/**
 * This is the function that creates the app instance which on new requests,
 * creates a way to interact with the conversation API directly from Assistant,
 * providing implementation for all the methods available in the API.
 *
 * Only supports Actions SDK v2.
 *
 * @example
 * ```javascript
 *
 * const app = actionssdk()
 *
 * app.intent('actions.intent.MAIN', conv => {
 *   conv.ask('How are you?')
 * })
 * ```
 *
 * @public
 */
export declare const actionssdk: ActionsSdk;
