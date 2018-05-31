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

import test from 'ava'
import * as sinon from 'sinon'

import * as common from '../../../../common'

import { User, Profile } from '../user'

test('user creates profile object', t => {
  const user = new User()
  t.true(user.profile instanceof Profile)
})

test('profile reads idToken', t => {
  const token = 'test'
  const profile = new Profile({
    idToken: token,
  })
  t.is(profile.token, token)
})

test('user profile reads idToken', t => {
  const token = 'test'
  const user = new User({
    idToken: token,
  })
  t.is(user.profile.token, token)
})

test('user reads userId', t => {
  const id = 'test'
  const user = new User({
    userId: id,
  })
  const stub = sinon.stub(common, 'deprecate')
  t.is(user.id, id)
  t.true(stub.called)
  stub.restore()
})
