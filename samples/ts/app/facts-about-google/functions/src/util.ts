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

export const values = <T>(o: { [key: string]: T }) => Object.keys(o).map(k => o[k])

export const concat = (...messages: string[]) => messages.map(message => message.trim()).join(' ')

export const random = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)]

export const randomPop = (array: string[]) => {
  if (!array.length) {
    return null
  }
  const element = random(array)
  array.splice(array.indexOf(element), 1)
  return element
}
