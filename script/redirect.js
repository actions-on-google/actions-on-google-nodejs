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

'use strict'

const fs = require('fs')
const path = require('path')

const docs = path.resolve(__dirname, '../docs')

const ENCODING = 'utf8'

/**
 * Creates a html file to direct reference doc files
 * @param {string} from Original html file
 * @param {string} to Redirect to html file
 */
const redirect = (from, to) => {
  const html = `
<html>
<head>
<meta http-equiv="refresh" content="0;url=/${to}"/>
<title>Page Moved</title>
</head>
<body>
This page has moved to <a href="/${to}">here</a>.
</body>
</html>
`
  fs.writeFileSync(path.resolve(docs, from), html, ENCODING)
}

const questionClasses = [
  'conversation_question.carousel.html',
  'conversation_question.confirmation.html',
  'conversation_question.datetime.html',
  'conversation_question.deeplink.html',
  'conversation_question.deliveryaddress.html',
  'conversation_question.list.html',
  'conversation_question.newsurface.html',
  'conversation_question.permission.html',
  'conversation_question.place.html',
  'conversation_question.registerupdate.html',
  'conversation_question.signin.html',
  'conversation_question.transactiondecision.html',
  'conversation_question.transactionrequirements.html',
  'conversation_question.updatepermission.html',
]

const questions = [
  'modules/conversation_question.html',
  ...questionClasses.map(c => `classes/${c}`)
]

for (const question of questions) {
  redirect(question, question.replace('_question.', '_helper.'))
}
