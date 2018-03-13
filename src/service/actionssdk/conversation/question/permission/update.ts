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
import { PermissionArgument, Permission } from './permission'

/** @public */
export type UpdatePermissionArgument = PermissionArgument

/** @public */
export interface UpdatePermissionOptions {
  /** @public */
  intent: string

  /** @public */
  arguments?: Api.GoogleActionsV2Argument[]
}

/** @public */
export class UpdatePermission extends Permission {
  constructor(options: UpdatePermissionOptions) {
    super({
      permissions: 'UPDATE',
      extra: {
        updatePermissionValueSpec: {
          arguments: options.arguments,
          intent: options.intent,
        },
      },
    })
  }
}
