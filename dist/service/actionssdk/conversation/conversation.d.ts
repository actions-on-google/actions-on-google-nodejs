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
import * as Api from '../api/v2';
import { Headers } from '../../../framework';
import { Surface, Available } from './surface';
import { User } from './user';
import { Image, RichResponse, Suggestions, RichResponseItem, MediaObject, SimpleResponse } from './response';
import { Helper } from './helper';
import { Arguments } from './argument';
import { Device } from './device';
import { Input } from './input';
import { JsonObject } from '../../../common';
import { ServiceBaseApp, AppOptions } from '../../../assistant';
import { OAuth2Client } from 'google-auth-library';
/** @public */
export declare type Intent = 'actions.intent.MAIN' | 'actions.intent.TEXT' | 'actions.intent.PERMISSION' | 'actions.intent.OPTION' | 'actions.intent.TRANSACTION_REQUIREMENTS_CHECK' | 'actions.intent.DELIVERY_ADDRESS' | 'actions.intent.TRANSACTION_DECISION' | 'actions.intent.CONFIRMATION' | 'actions.intent.DATETIME' | 'actions.intent.SIGN_IN' | 'actions.intent.NO_INPUT' | 'actions.intent.CANCEL' | 'actions.intent.NEW_SURFACE' | 'actions.intent.REGISTER_UPDATE' | 'actions.intent.CONFIGURE_UPDATES' | 'actions.intent.PLACE' | 'actions.intent.LINK' | 'actions.intent.MEDIA_STATUS' | 'actions.intent.COMPLETE_PURCHASE' | 'actions.intent.DIGITAL_PURCHASE_CHECK';
/** @hidden */
export declare type InputValueSpec = 'type.googleapis.com/google.actions.v2.PermissionValueSpec' | 'type.googleapis.com/google.actions.v2.OptionValueSpec' | 'type.googleapis.com/google.actions.v2.TransactionRequirementsCheckSpec' | 'type.googleapis.com/google.actions.v2.DeliveryAddressValueSpec' | 'type.googleapis.com/google.actions.v2.TransactionDecisionValueSpec' | 'type.googleapis.com/google.actions.v2.ConfirmationValueSpec' | 'type.googleapis.com/google.actions.v2.DateTimeValueSpec' | 'type.googleapis.com/google.actions.v2.NewSurfaceValueSpec' | 'type.googleapis.com/google.actions.v2.RegisterUpdateValueSpec' | 'type.googleapis.com/google.actions.v2.SignInValueSpec' | 'type.googleapis.com/google.actions.v2.PlaceValueSpec' | 'type.googleapis.com/google.actions.v2.LinkValueSpec' | 'type.googleapis.com/google.actions.transactions.v3.CompletePurchaseValueSpec' | 'type.googleapis.com/google.actions.transactions.v3.TransactionDecisionValueSpec' | 'type.googleapis.com/google.actions.transactions.v3.TransactionRequirementsCheckSpec' | 'type.googleapis.com/google.actions.transactions.v3.DigitalPurchaseCheckSpec';
/** @hidden */
export declare type DialogSpec = 'type.googleapis.com/google.actions.v2.PlaceValueSpec.PlaceDialogSpec' | 'type.googleapis.com/google.actions.v2.LinkValueSpec.LinkDialogSpec';
/** @public */
export declare type Response = RichResponse | RichResponseItem | Image | Suggestions | MediaObject | Helper<Intent, JsonObject>;
/** @hidden */
export interface ConversationResponse {
    richResponse: Api.GoogleActionsV2RichResponse;
    expectUserResponse: boolean;
    userStorage: string;
    expectedIntent?: Api.GoogleActionsV2ExpectedIntent;
    noInputPrompts?: Api.GoogleActionsV2SimpleResponse[];
    speechBiasingHints?: string[];
}
export interface ConversationOptionsInit<TConvData, TUserStorage> {
    /** @public */
    data?: TConvData;
    /** @public */
    storage?: TUserStorage;
}
/** @hidden */
export interface ConversationBaseOptions<TConvData, TUserStorage> {
    /** @public */
    headers?: Headers;
    /** @public */
    init?: ConversationOptionsInit<TConvData, TUserStorage>;
    /** @public */
    debug?: boolean;
    /** @public */
    ordersv3?: boolean;
}
/** @hidden */
export interface ConversationOptions<TUserStorage> {
    /** @public */
    request?: Api.GoogleActionsV2AppRequest;
    /** @public */
    headers?: Headers;
    /** @public */
    init?: ConversationOptionsInit<{}, TUserStorage>;
    /** @public */
    ordersv3?: boolean;
}
/**
 * Throw an UnauthorizedError in an intent handler to make the library
 * respond with a HTTP 401 Status Code.
 *
 * @example
 * ```javascript
 * const app = dialogflow()
 *
 * // If using Actions SDK:
 * // const app = actionssdk()
 *
 * app.intent('intent', conv => {
 *   // ...
 *
 *   // given a function to check if a user auth is still valid
 *   const valid = checkUserAuthValid(conv)
 *   if (!valid) {
 *     throw new UnauthorizedError()
 *   }
 *
 *   // ...
 * })
 *
 * ```
 *
 * @public
 */
export declare class UnauthorizedError extends Error {
}
/** @public */
export declare class Conversation<TUserStorage> {
    /** @public */
    request: Api.GoogleActionsV2AppRequest;
    /** @public */
    headers: Headers;
    /** @public */
    responses: Response[];
    /** @public */
    expectUserResponse: boolean;
    /** @public */
    surface: Surface;
    /** @public */
    available: Available;
    /** @public */
    digested: boolean;
    /**
     * True if the app is being tested in sandbox mode. Enable sandbox
     * mode in the [Actions console](console.actions.google.com) to test
     * transactions.
     * @public
     */
    sandbox: boolean;
    /** @public */
    input: Input;
    /**
     * Gets the {@link User} object.
     * The user object contains information about the user, including
     * a string identifier and personal information (requires requesting permissions,
     * see {@link Permission|conv.ask(new Permission)}).
     * @public
     */
    user: User<TUserStorage>;
    /** @public */
    arguments: Arguments;
    /** @public */
    device: Device;
    /**
     * Gets the unique conversation ID. It's a new ID for the initial query,
     * and stays the same until the end of the conversation.
     *
     * @example
     * ```javascript
     *
     * app.intent('actions.intent.MAIN', conv => {
     *   const conversationId = conv.id
     * })
     * ```
     *
     * @public
     */
    id: string;
    /** @public */
    type: Api.GoogleActionsV2ConversationType;
    /**
     * Shortcut for
     * {@link Capabilities|conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')}
     * @public
     */
    screen: boolean;
    /**
     * Set reprompts when users don't provide input to this action (no-input errors).
     * Each reprompt represents as the {@link SimpleResponse}, but raw strings also can be specified
     * for convenience (they're passed to the constructor of {@link SimpleResponse}).
     * Notice that this value is not kept over conversations. Thus, it is necessary to set
     * the reprompts per each conversation response.
     *
     * @example
     * ```javascript
     *
     * app.intent('actions.intent.MAIN', conv => {
     *   conv.noInputs = [
     *     'Are you still there?',
     *     'Hello?',
     *     new SimpleResponse({
     *       text: 'Talk to you later. Bye!',
     *       speech: '<speak>Talk to you later. Bye!</speak>'
     *     })
     *   ]
     *   conv.ask('What's your favorite color?')
     * })
     * ```
     *
     * @public
     */
    noInputs: (string | SimpleResponse)[];
    /**
     * Sets speech biasing options.
     *
     * @example
     * ``` javascript
     *
     * app.intent('actions.intent.MAIN', conv => {
     *   conv.speechBiasing = ['red', 'blue', 'green']
     *   conv.ask('What is your favorite color out of red, blue, and green?')
     * })
     * ```
     *
     * @public
     */
    speechBiasing: string[];
    /** @hidden */
    _raw?: JsonObject;
    /** @hidden */
    _responded: boolean;
    /** @hidden */
    _init: ConversationOptionsInit<{}, TUserStorage>;
    /** @hidden */
    _ordersv3: boolean;
    /** @hidden */
    constructor(options?: ConversationOptions<TUserStorage>);
    /** @public */
    json<T = JsonObject>(json: T): this;
    /** @public */
    add(...responses: Response[]): this;
    /**
     * Asks to collect user's input. All user's queries need to be sent to the app.
     * {@link https://developers.google.com/actions/policies/general-policies#user_experience|
     *     The guidelines when prompting the user for a response must be followed at all times}.
     *
     * @example
     * ```javascript
     *
     * // Actions SDK
     * const app = actionssdk()
     *
     * app.intent('actions.intent.MAIN', conv => {
     *   const ssml = '<speak>Hi! <break time="1"/> ' +
     *     'I can read out an ordinal like <say-as interpret-as="ordinal">123</say-as>. ' +
     *     'Say a number.</speak>'
     *   conv.ask(ssml)
     * })
     *
     * app.intent('actions.intent.TEXT', (conv, input) => {
     *   if (input === 'bye') {
     *     return conv.close('Goodbye!')
     *   }
     *   const ssml = `<speak>You said, <say-as interpret-as="ordinal">${input}</say-as></speak>`
     *   conv.ask(ssml)
     * })
     *
     * // Dialogflow
     * const app = dialogflow()
     *
     * app.intent('Default Welcome Intent', conv => {
     *   conv.ask('Welcome to action snippets! Say a number.')
     * })
     *
     * app.intent('Number Input', (conv, {num}) => {
     *   conv.close(`You said ${num}`)
     * })
     * ```
     *
     * @param responses A response fragment for the library to construct a single complete response
     * @public
     */
    ask(...responses: Response[]): this;
    /**
     * Have Assistant render the speech response and close the mic.
     *
     * @example
     * ```javascript
     *
     * // Actions SDK
     * const app = actionssdk()
     *
     * app.intent('actions.intent.MAIN', conv => {
     *   const ssml = '<speak>Hi! <break time="1"/> ' +
     *     'I can read out an ordinal like <say-as interpret-as="ordinal">123</say-as>. ' +
     *     'Say a number.</speak>'
     *   conv.ask(ssml)
     * })
     *
     * app.intent('actions.intent.TEXT', (conv, input) => {
     *   if (input === 'bye') {
     *     return conv.close('Goodbye!')
     *   }
     *   const ssml = `<speak>You said, <say-as interpret-as="ordinal">${input}</say-as></speak>`
     *   conv.ask(ssml)
     * })
     *
     * // Dialogflow
     * const app = dialogflow()
     *
     * app.intent('Default Welcome Intent', conv => {
     *   conv.ask('Welcome to action snippets! Say a number.')
     * })
     *
     * app.intent('Number Input', (conv, {num}) => {
     *   conv.close(`You said ${num}`)
     * })
     * ```
     *
     * @param responses A response fragment for the library to construct a single complete response
     * @public
     */
    close(...responses: Response[]): this;
    /** @public */
    response(): ConversationResponse;
}
export interface ExceptionHandler<TUserStorage, TConversation extends Conversation<TUserStorage>> {
    /** @public */
    (conv: TConversation, error: Error): Promise<any> | any;
}
/** @hidden */
export interface Traversed {
    [key: string]: boolean;
}
/** @hidden */
export interface ConversationAppOptions<TConvData, TUserStorage> extends AppOptions {
    /** @public */
    init?: () => ConversationOptionsInit<TConvData, TUserStorage>;
    /**
     * Client ID for User Profile Payload Verification
     * See {@link Profile#payload|conv.user.profile.payload}
     * @public
     */
    clientId?: string;
    /** @public */
    ordersv3?: boolean;
}
export interface OAuth2ConfigClient {
    /** @public */
    id: string;
}
export interface OAuth2Config {
    /** @public */
    client: OAuth2ConfigClient;
}
export interface ConversationApp<TConvData, TUserStorage> extends ServiceBaseApp {
    /** @public */
    init?: () => ConversationOptionsInit<TConvData, TUserStorage>;
    /** @public */
    auth?: OAuth2Config;
    /** @public */
    ordersv3: boolean;
    /** @hidden */
    _client?: OAuth2Client;
}
