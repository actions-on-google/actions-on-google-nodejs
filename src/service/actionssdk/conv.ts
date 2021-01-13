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
import {JsonObject} from '../../common';
import {
  Conversation,
  ConversationBaseOptions,
  ConversationOptionsInit,
} from './conversation';

/** @public */
export interface ActionsSdkConversationOptions<TConvData, TUserStorage>
  extends ConversationBaseOptions<TConvData, TUserStorage> {
  /** @public */
  body?: Api.GoogleActionsV2AppRequest;
}

const serializeData = <TConvData>(data: TConvData) => JSON.stringify({data});

const deserializeData = <TConvData>(
  body: Api.GoogleActionsV2AppRequest,
  defaultData?: TConvData
) => {
  const {conversation = {}} = body;
  const {conversationToken} = conversation;
  const data: TConvData = conversationToken
    ? JSON.parse(conversationToken).data
    : Object.assign({}, defaultData);
  return data;
};

/** @public */
export class ActionsSdkConversation<
  TConvData = JsonObject,
  TUserStorage = JsonObject
> extends Conversation<TUserStorage> {
  /** @public */
  body: Api.GoogleActionsV2AppRequest;

  /**
   * Get the current Actions SDK intent.
   *
   * @example
   * ```javascript
   *
   * app.intent('actions.intent.MAIN', conv => {
   *   const intent = conv.intent // will be 'actions.intent.MAIN'
   * })
   * ```
   *
   * @public
   */
  intent: string;

  /**
   * The session data in JSON format.
   * Stored using conversationToken.
   *
   * @example
   * ```javascript
   *
   * app.intent('actions.intent.MAIN', conv => {
   *   conv.data.someProperty = 'someValue'
   * })
   * ```
   *
   * @public
   */
  data: TConvData;

  /** @hidden */
  _init: ConversationOptionsInit<TConvData, TUserStorage>;

  /** @public */
  constructor(
    options: ActionsSdkConversationOptions<TConvData, TUserStorage> = {}
  ) {
    const {body = {}} = options;
    super({
      request: body,
      headers: options.headers,
      init: options.init,
      ordersv3: options.ordersv3,
    });

    this.body = body;

    const {inputs = []} = body;
    const [firstInput = {}] = inputs;

    const {intent = ''} = firstInput;

    this.intent = intent;

    this.data = deserializeData<TConvData>(this.body, this._init.data);
  }

  /** @public */
  serialize(): Api.GoogleActionsV2AppResponse {
    if (this._raw) {
      return this._raw;
    }
    const {
      richResponse,
      expectUserResponse,
      userStorage,
      expectedIntent,
      noInputPrompts,
      speechBiasingHints,
    } = this.response();
    const inputPrompt: Api.GoogleActionsV2InputPrompt = {
      noInputPrompts,
    };
    if (richResponse.items!.length) {
      inputPrompt.richInitialPrompt = richResponse;
    }
    const possibleIntents: Api.GoogleActionsV2ExpectedIntent[] = [
      expectedIntent || {
        intent: 'actions.intent.TEXT',
      },
    ];
    const expectedInput: Api.GoogleActionsV2ExpectedInput = {
      possibleIntents,
      speechBiasingHints,
    };
    if (inputPrompt.richInitialPrompt || inputPrompt.noInputPrompts) {
      expectedInput.inputPrompt = inputPrompt;
    }
    const response: Api.GoogleActionsV2AppResponse = {
      expectUserResponse,
    };
    if (expectUserResponse) {
      response.expectedInputs = [expectedInput];
    } else {
      response.finalResponse = {richResponse};
    }
    const convDataDefault = deserializeData<TConvData>({}, this._init.data);
    const convDataDefaultSerialized = serializeData(convDataDefault);
    const convDataDefaulted = deserializeData<TConvData>(
      this.body,
      this._init.data
    );
    const convDataIn = serializeData(convDataDefaulted);
    const convDataOut = serializeData(this.data);
    if (
      convDataOut !== convDataDefaultSerialized ||
      convDataOut !== convDataIn
    ) {
      response.conversationToken = convDataOut;
    }
    if (userStorage) {
      response.userStorage = userStorage;
    }
    return response;
  }
}
