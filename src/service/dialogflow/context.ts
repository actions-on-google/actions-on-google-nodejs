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
import * as ApiV1 from './api/v1';
import {values} from '../../common';

/** @public */
export interface Parameters {
  /** @public */
  [parameter: string]: string | Object | undefined;
}

/** @public */
export interface Contexts {
  /** @public */
  [context: string]: Context<Parameters> | undefined;
}

/** @public */
export interface OutputContexts {
  /** @public */
  [context: string]: OutputContext<Parameters> | undefined;
}

/** @public */
export interface Context<TParameters extends Parameters>
  extends OutputContext<TParameters> {
  /**
   * Full name of the context.
   * @public
   */
  name: string;

  /**
   * Remaining number of intents
   * @public
   */
  lifespan: number;

  /**
   * The context parameters from the current intent.
   * Context parameters include parameters collected in previous intents
   * during the lifespan of the given context.
   *
   * See {@link https://dialogflow.com/docs/concept-actions#section-extracting-values-from-contexts|
   *     here}.
   *
   * @example
   * ```javascript
   *
   * app.intent('Tell Greeting', conv => {
   *   const context1 = conv.contexts.get('context1')
   *   const parameters = context1.parameters
   *   const color = parameters.color
   *   const num = parameters.num
   * })
   *
   * // Using destructuring
   * app.intent('Tell Greeting', conv => {
   *   const context1 = conv.contexts.get('context1')
   *   const { color, num } = context1.parameters
   * })
   * ```
   *
   * @public
   */
  parameters: TParameters;
}

/** @public */
export interface OutputContext<TParameters extends Parameters> {
  /** @public */
  lifespan: number;

  /** @public */
  parameters?: TParameters;
}

const isV1 = (
  context: Api.GoogleCloudDialogflowV2Context | ApiV1.DialogflowV1Context
): context is ApiV1.DialogflowV1Context =>
  typeof (context as ApiV1.DialogflowV1Context).lifespan === 'number';

export class ContextValues<TContexts extends Contexts> {
  /** @public */
  input: TContexts;

  /** @public */
  output: OutputContexts;

  /** @hidden */
  constructor(
    outputContexts:
      | Api.GoogleCloudDialogflowV2Context[]
      | ApiV1.DialogflowV1Context[] = [],
    private _session?: string
  ) {
    this.input = {} as TContexts;
    for (const context of outputContexts) {
      const name = context.name!;
      const parameters = context.parameters!;
      if (isV1(context)) {
        const lifespan = context.lifespan!;
        Object.assign(this.input, {
          [name]: {
            name,
            lifespan,
            parameters,
          },
        });
        continue;
      }
      const lifespanCount = context.lifespanCount!;
      const find = /([^/]+)?$/.exec(name);
      Object.assign(this.input, {
        [find ? find[0] : name]: {
          name,
          lifespan: lifespanCount!,
          parameters,
        },
      });
    }
    this.output = {};
  }

  /** @hidden */
  _serialize(): Api.GoogleCloudDialogflowV2Context[] {
    return Object.keys(this.output).map(
      (name): Api.GoogleCloudDialogflowV2Context => {
        const {lifespan, parameters} = this.output[name]!;
        return {
          name: `${this._session}/contexts/${name}`,
          lifespanCount: lifespan,
          parameters,
        };
      }
    );
  }

  /** @hidden */
  _serializeV1(): ApiV1.DialogflowV1Context[] {
    return Object.keys(this.output).map(
      (name): ApiV1.DialogflowV1Context => {
        const {lifespan, parameters} = this.output[name]!;
        return {
          name,
          lifespan,
          parameters,
        };
      }
    );
  }

  /**
   * Returns the incoming context by name for this intent.
   *
   * @example
   * ```javascript
   *
   * const AppContexts = {
   *   NUMBER: 'number',
   * }
   *
   * const app = dialogflow()
   *
   * app.intent('Default Welcome Intent', conv => {
   *   conv.contexts.set(AppContexts.NUMBER, 1)
   *   conv.ask('Welcome to action snippets! Say a number.')
   * })
   *
   * // Create intent with 'number' context as requirement
   * app.intent('Number Input', conv => {
   *   const context = conv.contexts.get(AppContexts.NUMBER)
   * })
   * ```
   *
   * @param name The name of the Context to retrieve.
   * @return Context value matching name or undefined if no matching context.
   * @public
   */
  get(name: keyof TContexts) {
    return this.input[name];
  }

  /**
   * Set a new context for the current intent.
   *
   * @example
   * ```javascript
   *
   * const AppContexts = {
   *   NUMBER: 'number',
   * }
   *
   * const app = dialogflow()
   *
   * app.intent('Default Welcome Intent', conv => {
   *   conv.contexts.set(AppContexts.NUMBER, 1)
   *   conv.ask('Welcome to action snippets! Say a number.')
   * })
   *
   * // Create intent with 'number' context as requirement
   * app.intent('Number Input', conv => {
   *   const context = conv.contexts.get(AppContexts.NUMBER)
   * })
   * ```
   *
   * @param name Name of the context. Dialogflow converts to lowercase.
   * @param lifespan Context lifespan.
   * @param parameters Context parameters.
   * @public
   */
  set(name: string, lifespan: number, parameters?: Parameters) {
    this.output[name] = {
      lifespan,
      parameters,
    };
  }

  /** @public */
  delete(name: string) {
    this.set(name, 0);
  }

  /**
   * Returns the incoming contexts for this intent as an iterator.
   *
   * @example
   * ```javascript
   *
   * const AppContexts = {
   *   NUMBER: 'number',
   * }
   *
   * const app = dialogflow()
   *
   * app.intent('Default Welcome Intent', conv => {
   *   conv.contexts.set(AppContexts.NUMBER, 1)
   *   conv.ask('Welcome to action snippets! Say a number.')
   * })
   *
   * // Create intent with 'number' context as requirement
   * app.intent('Number Input', conv => {
   *   for (const context of conv.contexts) {
   *     // do something with the contexts
   *   }
   * })
   * ```
   *
   * @public
   */
  [Symbol.iterator]() {
    const contexts = values(this.input) as Context<Parameters>[];
    return contexts[Symbol.iterator]();
    // suppose to be Array.prototype.values(), but can't use because of bug:
    // https://bugs.chromium.org/p/chromium/issues/detail?id=615873
  }
}
