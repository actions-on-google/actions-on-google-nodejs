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
import { Question } from './question'
import { ProtoAny } from '../../../../common'
import { DialogSpec } from '..'

/** @public */
export interface DeepLinkOptions {
  /** @public */
  destination: string

  /** @public */
  url: string

  /** @public */
  package: string

  /** @public */
  reason?: string
}

/** @public */
export type DeepLinkArgument = undefined

/** @public */
export class DeepLink extends Question<Api.GoogleActionsV2LinkValueSpec> {
  constructor(options: DeepLinkOptions) {
    super('actions.intent.LINK')

    const extension: ProtoAny<DialogSpec, Api.GoogleActionsV2LinkValueSpecLinkDialogSpec> = {
      '@type': 'type.googleapis.com/google.actions.v2.LinkValueSpec.LinkDialogSpec',
      destinationName: options.destination,
      requestLinkReason: options.reason,
    }

    this.data('type.googleapis.com/google.actions.v2.LinkValueSpec', {
      openUrlAction: {
        url: options.url,
        androidApp: {
          packageName: options.package,
        },
      },
      dialogSpec: {
        extension,
      },
    })
  }
}
