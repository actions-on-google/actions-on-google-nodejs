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
import { ApiClientObjectMap } from '../../../common';
export declare type GoogleCloudDialogflowV2IntentDefaultResponsePlatforms = 'PLATFORM_UNSPECIFIED' | 'FACEBOOK' | 'SLACK' | 'TELEGRAM' | 'KIK' | 'SKYPE' | 'LINE' | 'VIBER' | 'ACTIONS_ON_GOOGLE';
export declare type GoogleCloudDialogflowV2IntentMessagePlatform = 'PLATFORM_UNSPECIFIED' | 'FACEBOOK' | 'SLACK' | 'TELEGRAM' | 'KIK' | 'SKYPE' | 'LINE' | 'VIBER' | 'ACTIONS_ON_GOOGLE';
export declare type GoogleCloudDialogflowV2IntentTrainingPhraseType = 'TYPE_UNSPECIFIED' | 'EXAMPLE' | 'TEMPLATE';
export declare type GoogleCloudDialogflowV2IntentWebhookState = 'WEBHOOK_STATE_UNSPECIFIED' | 'WEBHOOK_STATE_ENABLED' | 'WEBHOOK_STATE_ENABLED_FOR_SLOT_FILLING';
export interface GoogleCloudDialogflowV2Context {
    name?: string;
    lifespanCount?: number;
    parameters?: ApiClientObjectMap<any>;
}
export interface GoogleCloudDialogflowV2EventInput {
    name?: string;
    parameters?: ApiClientObjectMap<any>;
    languageCode?: string;
}
export interface GoogleCloudDialogflowV2Intent {
    name?: string;
    displayName?: string;
    webhookState?: GoogleCloudDialogflowV2IntentWebhookState;
    priority?: number;
    isFallback?: boolean;
    mlDisabled?: boolean;
    inputContextNames?: string[];
    events?: string[];
    trainingPhrases?: GoogleCloudDialogflowV2IntentTrainingPhrase[];
    action?: string;
    outputContexts?: GoogleCloudDialogflowV2Context[];
    resetContexts?: boolean;
    parameters?: GoogleCloudDialogflowV2IntentParameter[];
    messages?: GoogleCloudDialogflowV2IntentMessage[];
    defaultResponsePlatforms?: GoogleCloudDialogflowV2IntentDefaultResponsePlatforms[];
    rootFollowupIntentName?: string;
    parentFollowupIntentName?: string;
    followupIntentInfo?: GoogleCloudDialogflowV2IntentFollowupIntentInfo[];
}
export interface GoogleCloudDialogflowV2IntentFollowupIntentInfo {
    followupIntentName?: string;
    parentFollowupIntentName?: string;
}
export interface GoogleCloudDialogflowV2IntentMessage {
    text?: GoogleCloudDialogflowV2IntentMessageText;
    image?: GoogleCloudDialogflowV2IntentMessageImage;
    quickReplies?: GoogleCloudDialogflowV2IntentMessageQuickReplies;
    card?: GoogleCloudDialogflowV2IntentMessageCard;
    payload?: ApiClientObjectMap<any>;
    simpleResponses?: GoogleCloudDialogflowV2IntentMessageSimpleResponses;
    basicCard?: GoogleCloudDialogflowV2IntentMessageBasicCard;
    suggestions?: GoogleCloudDialogflowV2IntentMessageSuggestions;
    linkOutSuggestion?: GoogleCloudDialogflowV2IntentMessageLinkOutSuggestion;
    listSelect?: GoogleCloudDialogflowV2IntentMessageListSelect;
    carouselSelect?: GoogleCloudDialogflowV2IntentMessageCarouselSelect;
    platform?: GoogleCloudDialogflowV2IntentMessagePlatform;
}
export interface GoogleCloudDialogflowV2IntentMessageBasicCard {
    title?: string;
    subtitle?: string;
    formattedText?: string;
    image?: GoogleCloudDialogflowV2IntentMessageImage;
    buttons?: GoogleCloudDialogflowV2IntentMessageBasicCardButton[];
}
export interface GoogleCloudDialogflowV2IntentMessageBasicCardButton {
    title?: string;
    openUriAction?: GoogleCloudDialogflowV2IntentMessageBasicCardButtonOpenUriAction;
}
export interface GoogleCloudDialogflowV2IntentMessageBasicCardButtonOpenUriAction {
    uri?: string;
}
export interface GoogleCloudDialogflowV2IntentMessageCard {
    title?: string;
    subtitle?: string;
    imageUri?: string;
    buttons?: GoogleCloudDialogflowV2IntentMessageCardButton[];
}
export interface GoogleCloudDialogflowV2IntentMessageCardButton {
    text?: string;
    postback?: string;
}
export interface GoogleCloudDialogflowV2IntentMessageCarouselSelect {
    items?: GoogleCloudDialogflowV2IntentMessageCarouselSelectItem[];
}
export interface GoogleCloudDialogflowV2IntentMessageCarouselSelectItem {
    info?: GoogleCloudDialogflowV2IntentMessageSelectItemInfo;
    title?: string;
    description?: string;
    image?: GoogleCloudDialogflowV2IntentMessageImage;
}
export interface GoogleCloudDialogflowV2IntentMessageImage {
    imageUri?: string;
    accessibilityText?: string;
}
export interface GoogleCloudDialogflowV2IntentMessageLinkOutSuggestion {
    destinationName?: string;
    uri?: string;
}
export interface GoogleCloudDialogflowV2IntentMessageListSelect {
    title?: string;
    items?: GoogleCloudDialogflowV2IntentMessageListSelectItem[];
}
export interface GoogleCloudDialogflowV2IntentMessageListSelectItem {
    info?: GoogleCloudDialogflowV2IntentMessageSelectItemInfo;
    title?: string;
    description?: string;
    image?: GoogleCloudDialogflowV2IntentMessageImage;
}
export interface GoogleCloudDialogflowV2IntentMessageQuickReplies {
    title?: string;
    quickReplies?: string[];
}
export interface GoogleCloudDialogflowV2IntentMessageSelectItemInfo {
    key?: string;
    synonyms?: string[];
}
export interface GoogleCloudDialogflowV2IntentMessageSimpleResponse {
    textToSpeech?: string;
    ssml?: string;
    displayText?: string;
}
export interface GoogleCloudDialogflowV2IntentMessageSimpleResponses {
    simpleResponses?: GoogleCloudDialogflowV2IntentMessageSimpleResponse[];
}
export interface GoogleCloudDialogflowV2IntentMessageSuggestion {
    title?: string;
}
export interface GoogleCloudDialogflowV2IntentMessageSuggestions {
    suggestions?: GoogleCloudDialogflowV2IntentMessageSuggestion[];
}
export interface GoogleCloudDialogflowV2IntentMessageText {
    text?: string[];
}
export interface GoogleCloudDialogflowV2IntentParameter {
    name?: string;
    displayName?: string;
    value?: string;
    defaultValue?: string;
    entityTypeDisplayName?: string;
    mandatory?: boolean;
    prompts?: string[];
    isList?: boolean;
}
export interface GoogleCloudDialogflowV2IntentTrainingPhrase {
    name?: string;
    type?: GoogleCloudDialogflowV2IntentTrainingPhraseType;
    parts?: GoogleCloudDialogflowV2IntentTrainingPhrasePart[];
    timesAddedCount?: number;
}
export interface GoogleCloudDialogflowV2IntentTrainingPhrasePart {
    text?: string;
    entityType?: string;
    alias?: string;
    userDefined?: boolean;
}
export interface GoogleCloudDialogflowV2OriginalDetectIntentRequest {
    source?: string;
    payload?: ApiClientObjectMap<any>;
}
export interface GoogleCloudDialogflowV2QueryResult {
    queryText?: string;
    languageCode?: string;
    speechRecognitionConfidence?: number;
    action?: string;
    parameters?: ApiClientObjectMap<any>;
    allRequiredParamsPresent?: boolean;
    fulfillmentText?: string;
    fulfillmentMessages?: GoogleCloudDialogflowV2IntentMessage[];
    webhookSource?: string;
    webhookPayload?: ApiClientObjectMap<any>;
    outputContexts?: GoogleCloudDialogflowV2Context[];
    intent?: GoogleCloudDialogflowV2Intent;
    intentDetectionConfidence?: number;
    diagnosticInfo?: ApiClientObjectMap<any>;
}
export interface GoogleCloudDialogflowV2WebhookRequest {
    session?: string;
    responseId?: string;
    queryResult?: GoogleCloudDialogflowV2QueryResult;
    originalDetectIntentRequest?: GoogleCloudDialogflowV2OriginalDetectIntentRequest;
}
export interface GoogleCloudDialogflowV2WebhookResponse {
    fulfillmentText?: string;
    fulfillmentMessages?: GoogleCloudDialogflowV2IntentMessage[];
    source?: string;
    payload?: ApiClientObjectMap<any>;
    outputContexts?: GoogleCloudDialogflowV2Context[];
    followupEventInput?: GoogleCloudDialogflowV2EventInput;
}
