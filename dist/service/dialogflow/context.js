"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../../common");
const isV1 = (context) => typeof context.lifespan === 'number';
class ContextValues {
    /** @hidden */
    constructor(outputContexts = [], _session) {
        this._session = _session;
        this.input = {};
        for (const context of outputContexts) {
            const name = context.name;
            const parameters = context.parameters;
            if (isV1(context)) {
                const lifespan = context.lifespan;
                Object.assign(this.input, {
                    [name]: {
                        name,
                        lifespan,
                        parameters,
                    },
                });
                continue;
            }
            const lifespanCount = context.lifespanCount;
            const find = /([^/]+)?$/.exec(name);
            Object.assign(this.input, {
                [find ? find[0] : name]: {
                    name,
                    lifespan: lifespanCount,
                    parameters,
                },
            });
        }
        this.output = {};
    }
    /** @hidden */
    _serialize() {
        return Object.keys(this.output).map((name) => {
            const { lifespan, parameters } = this.output[name];
            return {
                name: `${this._session}/contexts/${name}`,
                lifespanCount: lifespan,
                parameters,
            };
        });
    }
    /** @hidden */
    _serializeV1() {
        return Object.keys(this.output).map((name) => {
            const { lifespan, parameters } = this.output[name];
            return {
                name,
                lifespan,
                parameters,
            };
        });
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
    get(name) {
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
    set(name, lifespan, parameters) {
        this.output[name] = {
            lifespan,
            parameters,
        };
    }
    /** @public */
    delete(name) {
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
        const contexts = common_1.values(this.input);
        return contexts[Symbol.iterator]();
        // suppose to be Array.prototype.values(), but can't use because of bug:
        // https://bugs.chromium.org/p/chromium/issues/detail?id=615873
    }
}
exports.ContextValues = ContextValues;
//# sourceMappingURL=context.js.map