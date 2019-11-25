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
import * as ActionsApi from '../actionssdk/api/v2';
import { AppHandler } from '../../assistant';
import { ExceptionHandler, Argument, ConversationApp, ConversationAppOptions } from '../actionssdk';
import { Contexts, Parameters } from './context';
import { DialogflowConversation } from './conv';
import { BuiltinFrameworkMetadata } from '../../framework';
/** @public */
export interface DialogflowIntentHandler<TConvData, TUserStorage, TContexts extends Contexts, TConversation extends DialogflowConversation<TConvData, TUserStorage, TContexts>, TParameters extends Parameters, TArgument extends Argument> {
    /** @public */
    (conv: TConversation, params: TParameters, 
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
    status: ActionsApi.GoogleRpcStatus | undefined): Promise<any> | any;
}
/** @hidden */
export interface DialogflowIntentHandlers {
    [event: string]: Function | string | undefined;
}
/** @hidden */
export interface DialogflowHandlers<TConvData, TUserStorage, TContexts extends Contexts, TConversation extends DialogflowConversation<TConvData, TUserStorage, TContexts>> {
    intents: DialogflowIntentHandlers;
    catcher: ExceptionHandler<TUserStorage, TConversation>;
    fallback?: Function | string;
}
/** @public */
export interface DialogflowMiddleware<TConversationPlugin extends DialogflowConversation> {
    (
    /** @public */
    conv: DialogflowConversation, 
    /** @public */
    framework: BuiltinFrameworkMetadata): (DialogflowConversation & TConversationPlugin) | void | Promise<DialogflowConversation & TConversationPlugin> | Promise<void>;
}
/** @public */
export declare type DefaultDialogflowIntent = 'Default Welcome Intent' | 'Default Fallback Intent';
/** @public */
export interface DialogflowApp<TConvData, TUserStorage, TContexts extends Contexts, TConversation extends DialogflowConversation<TConvData, TUserStorage, TContexts>> extends ConversationApp<TConvData, TUserStorage> {
    /** @hidden */
    _handlers: DialogflowHandlers<TConvData, TUserStorage, TContexts, TConversation>;
    /**
     * Sets the IntentHandler to be execute when the fulfillment is called
     * with a given Dialogflow intent name.
     *
     * @param intent The Dialogflow intent name to match.
     *     When given an array, sets the IntentHandler for any intent name in the array.
     * @param handler The IntentHandler to be executed when the intent name is matched.
     *     When given a string instead of a function, the intent fulfillment will be redirected
     *     to the IntentHandler of the redirected intent name.
     * @public
     */
    intent<TParameters extends Parameters>(intent: DefaultDialogflowIntent | DefaultDialogflowIntent[], handler: DialogflowIntentHandler<TConvData, TUserStorage, TContexts, TConversation, TParameters, Argument> | string): this;
    /**
     * Sets the IntentHandler to be execute when the fulfillment is called
     * with a given Dialogflow intent name.
     *
     * @param intent The Dialogflow intent name to match.
     *     When given an array, sets the IntentHandler for any intent name in the array.
     * @param handler The IntentHandler to be executed when the intent name is matched.
     *     When given a string instead of a function, the intent fulfillment will be redirected
     *     to the IntentHandler of the redirected intent name.
     * @public
     */
    intent<TArgument extends Argument>(intent: DefaultDialogflowIntent | DefaultDialogflowIntent[], handler: DialogflowIntentHandler<TConvData, TUserStorage, TContexts, TConversation, Parameters, TArgument> | string): this;
    /**
     * Sets the IntentHandler to be execute when the fulfillment is called
     * with a given Dialogflow intent name.
     *
     * @param intent The Dialogflow intent name to match.
     *     When given an array, sets the IntentHandler for any intent name in the array.
     * @param handler The IntentHandler to be executed when the intent name is matched.
     *     When given a string instead of a function, the intent fulfillment will be redirected
     *     to the IntentHandler of the redirected intent name.
     * @public
     */
    intent<TParameters extends Parameters, TArgument extends Argument>(intent: DefaultDialogflowIntent | DefaultDialogflowIntent[], handler: DialogflowIntentHandler<TConvData, TUserStorage, TContexts, TConversation, TParameters, TArgument> | string): this;
    /**
     * Sets the IntentHandler to be execute when the fulfillment is called
     * with a given Dialogflow intent name.
     *
     * @param intent The Dialogflow intent name to match.
     *     When given an array, sets the IntentHandler for any intent name in the array.
     * @param handler The IntentHandler to be executed when the intent name is matched.
     *     When given a string instead of a function, the intent fulfillment will be redirected
     *     to the IntentHandler of the redirected intent name.
     * @public
     */
    intent<TParameters extends Parameters>(intent: string | string[], handler: DialogflowIntentHandler<TConvData, TUserStorage, TContexts, TConversation, TParameters, Argument> | string): this;
    /**
     * Sets the IntentHandler to be execute when the fulfillment is called
     * with a given Dialogflow intent name.
     *
     * @param intent The Dialogflow intent name to match.
     *     When given an array, sets the IntentHandler for any intent name in the array.
     * @param handler The IntentHandler to be executed when the intent name is matched.
     *     When given a string instead of a function, the intent fulfillment will be redirected
     *     to the IntentHandler of the redirected intent name.
     * @public
     */
    intent<TArgument extends Argument>(intent: string | string[], handler: DialogflowIntentHandler<TConvData, TUserStorage, TContexts, TConversation, Parameters, TArgument> | string): this;
    /**
     * Sets the IntentHandler to be execute when the fulfillment is called
     * with a given Dialogflow intent name.
     *
     * @param intent The Dialogflow intent name to match.
     *     When given an array, sets the IntentHandler for any intent name in the array.
     * @param handler The IntentHandler to be executed when the intent name is matched.
     *     When given a string instead of a function, the intent fulfillment will be redirected
     *     to the IntentHandler of the redirected intent name.
     * @public
     */
    intent<TParameters extends Parameters, TArgument extends Argument>(intent: string | string[], handler: DialogflowIntentHandler<TConvData, TUserStorage, TContexts, TConversation, TParameters, TArgument> | string): this;
    /** @public */
    catch(catcher: ExceptionHandler<TUserStorage, TConversation>): this;
    /** @public */
    fallback(handler: DialogflowIntentHandler<TConvData, TUserStorage, TContexts, TConversation, Parameters, Argument> | string): this;
    /** @hidden */
    _middlewares: DialogflowMiddleware<DialogflowConversation<{}, {}, Contexts>>[];
    /** @public */
    middleware<TConversationPlugin extends DialogflowConversation<{}, {}, Contexts>>(middleware: DialogflowMiddleware<TConversationPlugin>): this;
    /** @public */
    verification?: DialogflowVerification | DialogflowVerificationHeaders;
}
/** @public */
export interface DialogflowVerificationHeaders {
    /**
     * A header key value pair to check against.
     * @public
     */
    [key: string]: string;
}
/** @public */
export interface DialogflowVerification {
    /**
     * An object representing the header key to value map to check against,
     * @public
     */
    headers: DialogflowVerificationHeaders;
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
export interface DialogflowOptions<TConvData, TUserStorage> extends ConversationAppOptions<TConvData, TUserStorage> {
    /**
     * Verifies whether the request comes from Dialogflow.
     * Uses header keys and values to check against ones specified by the developer
     * in the Dialogflow Fulfillment settings of the app.
     *
     * HTTP Code 403 will be thrown by default on verification error.
     *
     * @public
     */
    verification?: DialogflowVerification | DialogflowVerificationHeaders;
}
/** @public */
export interface Dialogflow {
    /** @public */
    <TConvData, TUserStorage, TContexts extends Contexts = Contexts, Conversation extends DialogflowConversation<TConvData, TUserStorage, TContexts> = DialogflowConversation<TConvData, TUserStorage, TContexts>>(options?: DialogflowOptions<TConvData, TUserStorage>): AppHandler & DialogflowApp<TConvData, TUserStorage, TContexts, Conversation>;
    /** @public */
    <TContexts extends Contexts, Conversation extends DialogflowConversation<{}, {}, TContexts> = DialogflowConversation<{}, {}, TContexts>>(options?: DialogflowOptions<{}, {}>): AppHandler & DialogflowApp<{}, {}, TContexts, Conversation>;
    /** @public */
    <TConversation extends DialogflowConversation<{}, {}> = DialogflowConversation<{}, {}>>(options?: DialogflowOptions<{}, {}>): AppHandler & DialogflowApp<{}, {}, Contexts, TConversation>;
}
/**
 * This is the function that creates the app instance which on new requests,
 * creates a way to handle the communication with Dialogflow's fulfillment API.
 *
 * Supports Dialogflow v1 and v2.
 *
 * @example
 * ```javascript
 *
 * const app = dialogflow()
 *
 * app.intent('Default Welcome Intent', conv => {
 *   conv.ask('How are you?')
 * })
 * ```
 *
 * @public
 */
export declare const dialogflow: Dialogflow;
