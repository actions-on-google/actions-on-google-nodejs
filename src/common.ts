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

import * as Debug from 'debug'
import * as https from 'https'
import { AppLogs } from './assistant'

const name = 'actions-on-google'

/** @hidden */
let debug = Debug(`${name}:debug`)
export { debug }

/** @hidden */
let warn = Debug(`${name}:warn`)
export { warn }

/** @hidden */
// tslint:disable-next-line:no-console Allow console binding
let error = console.error.bind(console) as typeof console.error
export { error }

/** @hidden */
// tslint:disable-next-line:no-console Allow console binding
let info = console.log.bind(console) as typeof console.log
export { info }

warn.log = error
debug.log = info

/** @hidden */
export const deprecate = (feature: string, alternative: string) =>
  info(`${feature} is *DEPRECATED*: ${alternative}`)

/** @public */
export interface JsonObject {
  // tslint:disable-next-line:no-any JSON value can be anything
  [key: string]: any
}

/** @hidden */
export const values = <T>(o: { [key: string]: T }) => Object.keys(o).map(k => o[k])

/** @hidden */
export const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o))

export const setLogs = (logs: AppLogs) => {
  debug.log = logs.debug
  info = logs.info
  warn.log = logs.warn
  error = logs.error
}

/** @hidden */
// tslint:disable-next-line:no-any root can be anything
export const stringify = (root: any, ...exclude: string[]) => {
  const excluded = new Set(exclude)
  const filtered = Object.keys(root).reduce((o, k) => {
    if (excluded.has(k)) {
      o[k] = '[Excluded]'
      return o
    }
    const value = root[k]
    try {
      JSON.stringify(value)
      o[k] = value
      return o
    } catch (e) {
      const { message = '' } = e
      o[k] = message.includes('Converting circular structure to JSON') ?
        '[Circular]' : `[Stringify Error] ${e}`
      return o
    }
  }, {} as typeof root)
  return JSON.stringify(filtered, null, 2)
}

/** @hidden */
export type ProtoAny<TType, TSpec> = { '@type': TType } & TSpec

/** @hidden */
export const toArray = <T>(a: T | T[]) => Array.isArray(a) ? a : [a]

/** @hidden */
export interface ApiClientObjectMap<TValue> {
  [key: string]: TValue
}

// Bind this to https to ensure its not implementation dependent
/** @hidden */
export const request: typeof https.request = https.request.bind(https)
