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
import { Intent, InputValueSpec } from '../conversation'
import { ProtoAny } from '../../../../common'

/** @hidden */
export interface Question<
  TIntent extends Intent,
  TValueSpec
> extends Api.GoogleActionsV2ExpectedIntent { }
export abstract class Question<
  TIntent extends Intent,
  TValueSpec
> implements Api.GoogleActionsV2ExpectedIntent {
  inputValueData: ProtoAny<InputValueSpec, TValueSpec>

  constructor(public intent: TIntent) {
  }

  _data(type: InputValueSpec, spec?: TValueSpec) {
    this.inputValueData = Object.assign({ '@type': type }, spec)
  }
}

/** @hidden */
export abstract class SoloQuestion<
  TIntent extends Intent,
  TValueSpec
> extends Question<TIntent, TValueSpec> {
}
