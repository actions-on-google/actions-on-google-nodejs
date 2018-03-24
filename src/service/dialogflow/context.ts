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

import * as Api from './api/v2'
import * as ApiV1 from './api/v1'
import { values } from '../../common'

/** @public */
export interface Parameters {
  /** @public */
  [parameter: string]: string | Object | undefined
}

/** @public */
export interface Contexts {
  /** @public */
  [context: string]: Context<Parameters> | undefined
}

/** @public */
export interface OutputContexts {
  /** @public */
  [context: string]: OutputContext<Parameters> | undefined
}

/** @public */
export interface Context<TParameters extends Parameters> extends OutputContext<TParameters> {
  /** @public */
  name: string

  /** @public */
  lifespan: number

  /** @public */
  parameters: TParameters
}

/** @public */
export interface OutputContext<TParameters extends Parameters> {
  /** @public */
  lifespan: number

  /** @public */
  parameters?: TParameters
}

export class ContextValues<TContexts extends Contexts> {
  /** @public */
  input: TContexts

  /** @public */
  output: OutputContexts

  constructor(
    outputContexts: Api.GoogleCloudDialogflowV2Context[] | ApiV1.DialogflowV1Context[] = [],
    private session?: string,
  ) {
    this.input = {} as TContexts
    for (const context of outputContexts) {
      const name = context.name!
      const parameters = context.parameters!
      if (this.isV1(context)) {
        const lifespan = context.lifespan!
        this.input[name] = {
          name,
          lifespan,
          parameters,
        }
        continue
      }
      const lifespanCount = context.lifespanCount!
      const find = /([^/]+)?$/.exec(name)
      this.input[find ? find[0] : name] = {
        name,
        lifespan: lifespanCount!,
        parameters,
      }
    }
    this.output = {}
  }

  private isV1(
    context: Api.GoogleCloudDialogflowV2Context | ApiV1.DialogflowV1Context,
  ): context is ApiV1.DialogflowV1Context {
    return typeof (context as ApiV1.DialogflowV1Context).lifespan === 'number'
  }

  serialize(): Api.GoogleCloudDialogflowV2Context[] {
    return Object.keys(this.output).map((name): Api.GoogleCloudDialogflowV2Context => {
      const { lifespan, parameters } = this.output[name]!
      return {
        name: `${this.session}/contexts/${name}`,
        lifespanCount: lifespan,
        parameters,
      }
    })
  }

  serializeV1(): ApiV1.DialogflowV1Context[] {
    return Object.keys(this.output).map((name): ApiV1.DialogflowV1Context => {
      const { lifespan, parameters } = this.output[name]!
      return {
        name,
        lifespan,
        parameters,
      }
    })
  }

  /** @public */
  get(name: keyof TContexts) {
    return this.input[name]
  }

  /** @public */
  set(name: string, lifespan: number, parameters?: Parameters) {
    this.output[name] = {
      lifespan,
      parameters,
    }
  }

  /** @public */
  delete(name: string) {
    this.set(name, 0)
  }

  /** @public */
  [Symbol.iterator]() {
    return values(this.input).values()
  }
}
