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
import { ApiClientObjectMap, JsonObject } from '../../../common';
import * as ActionsApi from '../../actionssdk/api/v2';
export interface DialogflowV1OriginalRequest {
    source?: string;
    version?: string;
    data?: ActionsApi.GoogleActionsV2AppRequest;
}
export interface DialogflowV1Parameters {
    [parameter: string]: string | Object | undefined;
}
export interface DialogflowV1Context {
    name?: string;
    parameters?: DialogflowV1Parameters;
    lifespan?: number;
}
export interface DialogflowV1Metadata {
    intentId?: string;
    webhookUsed?: string;
    webhookForSlotFillingUsed?: string;
    nluResponseTime?: number;
    intentName?: string;
}
export interface DialogflowV1Button {
    text?: string;
    postback?: string;
}
export interface DialogflowV1BaseMessage<TType extends number> {
    platform?: 'facebook' | 'kik' | 'line' | 'skype' | 'slack' | 'telegram' | 'viber';
    type?: TType;
}
export interface DialogflowV1MessageText extends DialogflowV1BaseMessage<0> {
    speech?: string;
}
export interface DialogflowV1MessageImage extends DialogflowV1BaseMessage<3> {
    imageUrl?: string;
}
export interface DialogflowV1MessageCard extends DialogflowV1BaseMessage<1> {
    buttons?: DialogflowV1Button[];
    imageUrl?: string;
    subtitle?: string;
    title?: string;
}
export interface DialogflowV1MessageQuickReplies extends DialogflowV1BaseMessage<2> {
    replies?: string[];
    title?: string;
}
export interface DialogflowV1MessageCustomPayload extends DialogflowV1BaseMessage<4> {
    payload?: JsonObject;
}
export interface DialogflowV1BaseGoogleMessage<TType extends string> {
    platform: 'google';
    type?: TType;
}
export interface DialogflowV1MessageSimpleResponse extends DialogflowV1BaseGoogleMessage<'simple_response'> {
    displayText?: string;
    textToSpeech?: string;
}
export interface DialogflowV1MessageBasicCardButtonAction {
    url?: string;
}
export interface DialogflowV1MessageBasicCardButton {
    openUrlAction?: DialogflowV1MessageBasicCardButtonAction;
    title?: string;
}
export interface DialogflowV1MessageImage {
    url?: string;
}
export interface DialogflowV1MessageBasicCard extends DialogflowV1BaseGoogleMessage<'basic_card'> {
    buttons?: DialogflowV1MessageBasicCardButton[];
    formattedText?: string;
    image?: DialogflowV1MessageImage;
    subtitle?: string;
    title?: string;
}
export interface DialogflowV1MessageOptionInfo {
    key?: string;
    synonyms?: string[];
}
export interface DialogflowV1MessageOptionItem {
    description?: string;
    image?: DialogflowV1MessageImage;
    optionInfo?: DialogflowV1MessageOptionInfo;
    title?: string;
}
export interface DialogflowV1MessageList extends DialogflowV1BaseGoogleMessage<'list_card'> {
    items?: DialogflowV1MessageOptionItem[];
    title?: string;
}
export interface DialogflowV1MessageSuggestion {
    title?: string;
}
export interface DialogflowV1MessageSuggestions extends DialogflowV1BaseGoogleMessage<'suggestion_chips'> {
    suggestions?: DialogflowV1MessageSuggestion[];
}
export interface DialogflowV1MessageCarousel extends DialogflowV1BaseGoogleMessage<'carousel_card'> {
    items?: DialogflowV1MessageOptionItem[];
}
export interface DialogflowV1MessageLinkOut extends DialogflowV1BaseGoogleMessage<'link_out_chip'> {
    destinationName?: string;
    url?: string;
}
export interface DialogflowV1MessageGooglePayload extends DialogflowV1BaseGoogleMessage<'custom_payload'> {
    payload?: ApiClientObjectMap<any>;
}
export declare type DialogflowV1Message = DialogflowV1MessageText | DialogflowV1MessageImage | DialogflowV1MessageCard | DialogflowV1MessageQuickReplies | DialogflowV1MessageCustomPayload | DialogflowV1MessageSimpleResponse | DialogflowV1MessageBasicCard | DialogflowV1MessageList | DialogflowV1MessageSuggestions | DialogflowV1MessageCarousel | DialogflowV1MessageLinkOut | DialogflowV1MessageGooglePayload;
export interface DialogflowV1Fulfillment {
    speech?: string;
    messages?: DialogflowV1Message[];
}
export interface DialogflowV1Result {
    source?: string;
    resolvedQuery?: string;
    speech?: string;
    action?: string;
    actionIncomplete?: boolean;
    parameters?: DialogflowV1Parameters;
    contexts?: DialogflowV1Context[];
    metadata?: DialogflowV1Metadata;
    fulfillment?: DialogflowV1Fulfillment;
    score?: number;
}
export interface DialogflowV1Status {
    code?: number;
    errorType?: string;
    webhookTimedOut?: boolean;
}
export interface DialogflowV1WebhookRequest {
    originalRequest?: DialogflowV1OriginalRequest;
    id?: string;
    sessionId?: string;
    timestamp?: string;
    timezone?: string;
    lang?: string;
    result?: DialogflowV1Result;
    status?: DialogflowV1Status;
}
export interface DialogflowV1FollowupEvent {
    name?: string;
    data?: DialogflowV1Parameters;
}
export interface DialogflowV1WebhookResponse {
    speech?: string;
    displayText?: string;
    messages?: DialogflowV1Message[];
    data?: ApiClientObjectMap<any>;
    contextOut?: DialogflowV1Context[];
    source?: string;
    followupEvent?: DialogflowV1FollowupEvent;
}
