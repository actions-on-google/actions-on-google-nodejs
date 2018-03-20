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

import * as Api from '../../../api/v2'
import { SoloQuestion } from '../question'
import { toArray } from '../../../../../common'

/** @public */
export type PermissionArgument = boolean

/** @public */
export interface PermissionOptions {
  /** @public */
  context?: string

  /** @public */
  permissions: Api.GoogleActionsV2PermissionValueSpecPermissions |
    Api.GoogleActionsV2PermissionValueSpecPermissions[]

  /** @public */
  extra?: Api.GoogleActionsV2PermissionValueSpec
}

/** @public */
export class Permission extends SoloQuestion<Api.GoogleActionsV2PermissionValueSpec> {
  constructor(options: PermissionOptions) {
    super('actions.intent.PERMISSION')

    this.data('type.googleapis.com/google.actions.v2.PermissionValueSpec', {
      optContext: options.context,
      permissions: toArray(options.permissions),
      ...options.extra,
    })
  }
}
