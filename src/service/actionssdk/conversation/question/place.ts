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
import { SoloQuestion } from './question'
import { ProtoAny } from '../../../../common'
import { DialogSpec } from '../conversation'

/** @public */
export interface PlaceOptions {
  /** @public */
  context: string

  /** @public */
  prompt: string
}

/** @public */
export type PlaceArgument = Api.GoogleActionsV2Location | undefined

/** @public */
export class Place extends SoloQuestion<Api.GoogleActionsV2PlaceValueSpec> {
  constructor(options: PlaceOptions) {
    super('actions.intent.PLACE')

    const extension: ProtoAny<DialogSpec, Api.GoogleActionsV2PlaceValueSpecPlaceDialogSpec> = {
      '@type': 'type.googleapis.com/google.actions.v2.PlaceValueSpec.PlaceDialogSpec',
      permissionContext: options.context,
      requestPrompt: options.prompt,
    }

    this.data('type.googleapis.com/google.actions.v2.PlaceValueSpec', {
      dialogSpec: {
        extension,
      },
    })
  }
}
