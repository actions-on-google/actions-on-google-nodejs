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

import * as Api from '../../api/v2'
import { toArray } from '../../../../common'

/**
 * Suggestions to show with response.
 * @public
 */
export class Suggestions {
  /** @public */
  suggestions: Api.GoogleActionsV2UiElementsSuggestion[] = []

  /**
   * @param suggestions Texts of the suggestions.
   * @public
   */
  constructor(...suggestions: (string[] | string)[]) {
    for (const suggestion of suggestions) {
      this.add(...toArray(suggestion))
    }
  }

  /** @public */
  add(...suggestions: string[]) {
    this.suggestions.push(...suggestions.map(title => ({ title })))
    return this
  }
}
