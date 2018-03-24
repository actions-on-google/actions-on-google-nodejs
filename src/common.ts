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

const name = 'actions-on-google'

export const debug = Debug(`${name}:debug`)
export const warn = Debug(`${name}:warn`)

export const error = console.error.bind(console) as typeof console.error
export const info = console.log.bind(console) as typeof console.log

warn.log = error
debug.log = info

export interface JsonObject {
  // tslint:disable-next-line:no-any JSON value can be anything
  [key: string]: any
}

export const values = <T>(o: { [key: string]: T }) => Object.keys(o).map(k => o[k])

export const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o))

export const stringify =
  (o: {}, override?: {}) => JSON.stringify(Object.assign(clone(o), override), null, 2)

export type ProtoAny<TType, TSpec> = { '@type': TType } & TSpec

export const toArray = <T>(a: T | T[]) => Array.isArray(a) ? a : [a]

export interface ApiClientObjectMap<TValue> {
  [key: string]: TValue
}
