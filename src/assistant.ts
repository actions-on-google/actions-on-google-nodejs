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

import { OmniHandler, StandardHandler, BuiltinFrameworks, builtin } from './framework'
import { debug, values, stringify, info } from './common'

/** @public */
export type AppHandler = OmniHandler & BaseApp

/** @public */
export interface AppOptions {
  /** @public */
  debug?: boolean
}

export interface ServiceBaseApp {
  /** @public */
  handler: StandardHandler
}

/** @public */
export interface Plugin<TService, TPlugin> {
  /** @public */
  <TApp>(app: AppHandler & TService & TApp): (AppHandler & TService & TApp & TPlugin) | void
}

/** @public */
export interface BaseApp extends ServiceBaseApp {
  /** @public */
  frameworks: BuiltinFrameworks

  /** @public */
  use<TService, TPlugin>(
    plugin: Plugin<TService, TPlugin>,
  ): this & TPlugin

  /** @public */
  debug: boolean
}

const create = (options?: AppOptions): BaseApp => ({
  frameworks: Object.assign({}, builtin),
  handler: () => Promise.reject(new Error('StandardHandler not set')),
  use(plugin) {
    return plugin(this) || this
  },
  debug: !!(options && options.debug),
})

export const attach = <TService>(
  service: TService,
  options?: AppOptions,
): AppHandler & TService => {
  let app: (BaseApp & TService) | (AppHandler & TService) = Object.assign(create(options), service)
  // tslint:disable-next-line:no-any automatically detect any inputs
  const omni: OmniHandler = (...args: any[]) => {
    for (const framework of values(app.frameworks)) {
      if (framework.check(...args)) {
        return framework.handle(app.handler)(...args)
      }
    }
    return app.handler(args[0], args[1])
  }
  app = Object.assign(omni, app)
  const handler = app.handler.bind(app)
  const standard: StandardHandler = async (body, headers) => {
    const log = app.debug ? info : debug
    log('Request', stringify(body))
    log('Headers', stringify(headers))
    const response = await handler(body, headers)
    log('Response', stringify(response.body))
    log('Status', response.status)
    return response
  }
  app.handler = standard
  return app as AppHandler & TService
}
