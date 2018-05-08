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
import * as common from '../../../../../../common'
import { Table } from '../table'
import { Image } from '../../image'
import { Button } from '..'

test('basic complete use case works', t => {
  const table = new Table({
    title: 'title',
    subtitle: 'subtitle',
    image: new Image({
      url: 'image url',
      alt: 'alt',
    }),
    columns: [
      {
        header: 'column 1',
        align: 'CENTER',
      },
      {
        header: 'column 2',
        align: 'LEADING',
      },
      {
        header: 'column 2',
        align: 'TRAILING',
      },
    ],
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
        dividerAfter: false,
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
        dividerAfter: true,
      },
    ],
    buttons: [
      new Button({
        title: 'title',
        url: 'button url',
      }),
    ],
  })
  t.deepEqual(common.clone(table), {
    title: 'title',
    subtitle: 'subtitle',
    image: {
      url: 'image url',
      accessibilityText: 'alt',
    },
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
        dividerAfter: false,
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
        dividerAfter: true,
      },
    ],
    columnProperties: [
      {
        header: 'column 1',
        horizontalAlignment: 'CENTER',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'LEADING',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'TRAILING',
      },
    ],
    buttons: [
      {
        title: 'title',
        openUrlAction: {
          url: 'button url',
        },
      },
    ],
  })
})

test('strings as rows work', t => {
  const table = new Table({
    columns: [
      {
        header: 'column 1',
        align: 'CENTER',
      },
      {
        header: 'column 2',
        align: 'LEADING',
      },
      {
        header: 'column 2',
        align: 'TRAILING',
      },
    ],
    rows: [
      ['first', 'second', 'third'],
      ['first 2', 'second 2', 'third 2'],
    ],
  })
  t.deepEqual(common.clone(table), {
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
      },
    ],
    columnProperties: [
      {
        header: 'column 1',
        horizontalAlignment: 'CENTER',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'LEADING',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'TRAILING',
      },
    ],
  })
})

test('rows work with default dividers true', t => {
  const table = new Table({
    columns: [
      {
        header: 'column 1',
        align: 'CENTER',
      },
      {
        header: 'column 2',
        align: 'LEADING',
      },
      {
        header: 'column 2',
        align: 'TRAILING',
      },
    ],
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
      },
    ],
    dividers: true,
  })
  t.deepEqual(common.clone(table), {
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
        dividerAfter: true,
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
        dividerAfter: true,
      },
    ],
    columnProperties: [
      {
        header: 'column 1',
        horizontalAlignment: 'CENTER',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'LEADING',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'TRAILING',
      },
    ],
  })
})

test('rows work with default dividers true and overridden by dividerAfter', t => {
  const table = new Table({
    columns: [
      {
        header: 'column 1',
        align: 'CENTER',
      },
      {
        header: 'column 2',
        align: 'LEADING',
      },
      {
        header: 'column 2',
        align: 'TRAILING',
      },
    ],
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
        dividerAfter: false,
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
        dividerAfter: true,
      },
    ],
    dividers: true,
  })
  t.deepEqual(common.clone(table), {
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
        dividerAfter: false,
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
        dividerAfter: true,
      },
    ],
    columnProperties: [
      {
        header: 'column 1',
        horizontalAlignment: 'CENTER',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'LEADING',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'TRAILING',
      },
    ],
  })
})

test('rows work with default dividers false and overridden by dividerAfter', t => {
  const table = new Table({
    columns: [
      {
        header: 'column 1',
        align: 'CENTER',
      },
      {
        header: 'column 2',
        align: 'LEADING',
      },
      {
        header: 'column 2',
        align: 'TRAILING',
      },
    ],
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
        dividerAfter: false,
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
        dividerAfter: true,
      },
    ],
    dividers: false,
  })
  t.deepEqual(common.clone(table), {
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
        dividerAfter: false,
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
        dividerAfter: true,
      },
    ],
    columnProperties: [
      {
        header: 'column 1',
        horizontalAlignment: 'CENTER',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'LEADING',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'TRAILING',
      },
    ],
  })
})

test('strings as rows work with default dividers true', t => {
  const table = new Table({
    columns: [
      {
        header: 'column 1',
        align: 'CENTER',
      },
      {
        header: 'column 2',
        align: 'LEADING',
      },
      {
        header: 'column 2',
        align: 'TRAILING',
      },
    ],
    rows: [
      ['first', 'second', 'third'],
      ['first 2', 'second 2', 'third 2'],
    ],
    dividers: true,
  })
  t.deepEqual(common.clone(table), {
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
        dividerAfter: true,
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
        dividerAfter: true,
      },
    ],
    columnProperties: [
      {
        header: 'column 1',
        horizontalAlignment: 'CENTER',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'LEADING',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'TRAILING',
      },
    ],
  })
})

test('strings as rows work with default dividers false', t => {
  const table = new Table({
    columns: [
      {
        header: 'column 1',
        align: 'CENTER',
      },
      {
        header: 'column 2',
        align: 'LEADING',
      },
      {
        header: 'column 2',
        align: 'TRAILING',
      },
    ],
    rows: [
      ['first', 'second', 'third'],
      ['first 2', 'second 2', 'third 2'],
    ],
    dividers: false,
  })
  t.deepEqual(common.clone(table), {
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
        dividerAfter: false,
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
        dividerAfter: false,
      },
    ],
    columnProperties: [
      {
        header: 'column 1',
        horizontalAlignment: 'CENTER',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'LEADING',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'TRAILING',
      },
    ],
  })
})

test('raw columnProperties works with align alias', t => {
  const table = new Table({
    columnProperties: [
      {
        header: 'column 1',
        align: 'CENTER',
      },
      {
        header: 'column 2',
        align: 'LEADING',
      },
      {
        header: 'column 2',
        align: 'TRAILING',
      },
    ],
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
      },
    ],
  })
  t.deepEqual(common.clone(table), {
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
      },
    ],
    columnProperties: [
      {
        header: 'column 1',
        horizontalAlignment: 'CENTER',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'LEADING',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'TRAILING',
      },
    ],
  })
})

test('raw columnProperties works with raw alignment property', t => {
  const table = new Table({
    columnProperties: [
      {
        header: 'column 1',
        horizontalAlignment: 'CENTER',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'LEADING',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'TRAILING',
      },
    ],
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
      },
    ],
  })
  t.deepEqual(common.clone(table), {
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
      },
    ],
    columnProperties: [
      {
        header: 'column 1',
        horizontalAlignment: 'CENTER',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'LEADING',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'TRAILING',
      },
    ],
  })
})

test('columns works with raw alignment property', t => {
  const table = new Table({
    columns: [
      {
        header: 'column 1',
        horizontalAlignment: 'CENTER',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'LEADING',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'TRAILING',
      },
    ],
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
      },
    ],
  })
  t.deepEqual(common.clone(table), {
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
      },
    ],
    columnProperties: [
      {
        header: 'column 1',
        horizontalAlignment: 'CENTER',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'LEADING',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'TRAILING',
      },
    ],
  })
})

test('columns works with number', t => {
  const table = new Table({
    columns: 3,
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
      },
    ],
  })
  t.deepEqual(common.clone(table), {
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
      },
    ],
    columnProperties: [
      {},
      {},
      {},
    ],
  })
})

test('columns works with number and columnProperties already set', t => {
  const table = new Table({
    columnProperties: [
      {
        header: 'test',
      },
    ],
    columns: 3,
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
      },
    ],
  })
  t.deepEqual(common.clone(table), {
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
      },
    ],
    columnProperties: [
      {
        header: 'test',
      },
      {},
      {},
    ],
  })
})

test('a single Button works', t => {
  const table = new Table({
    columns: [
      {
        header: 'column 1',
        align: 'CENTER',
      },
      {
        header: 'column 2',
        align: 'LEADING',
      },
      {
        header: 'column 2',
        align: 'TRAILING',
      },
    ],
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
      },
    ],
    buttons: new Button({
      title: 'title',
      url: 'button url',
    }),
  })
  t.deepEqual(common.clone(table), {
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
      },
    ],
    columnProperties: [
      {
        header: 'column 1',
        horizontalAlignment: 'CENTER',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'LEADING',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'TRAILING',
      },
    ],
    buttons: [
      {
        title: 'title',
        openUrlAction: {
          url: 'button url',
        },
      },
    ],
  })
})

test('cells as strings works', t => {
  const table = new Table({
    columns: [
      {
        header: 'column 1',
        align: 'CENTER',
      },
      {
        header: 'column 2',
        align: 'LEADING',
      },
      {
        header: 'column 2',
        align: 'TRAILING',
      },
    ],
    rows: [
      {
        cells: ['first', 'second', 'third'],
        dividerAfter: false,
      },
      {
        cells: ['first 2', 'second 2', 'third 2'],
        dividerAfter: true,
      },
    ],
  })
  t.deepEqual(common.clone(table), {
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
        dividerAfter: false,
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
        dividerAfter: true,
      },
    ],
    columnProperties: [
      {
        header: 'column 1',
        horizontalAlignment: 'CENTER',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'LEADING',
      },
      {
        header: 'column 2',
        horizontalAlignment: 'TRAILING',
      },
    ],
  })
})

test('columns as strings work', t => {
  const table = new Table({
    columns: ['column 1', 'column 2', 'column 2'],
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
      },
    ],
  })
  t.deepEqual(common.clone(table), {
    rows: [
      {
        cells: [
          {
            text: 'first',
          },
          {
            text: 'second',
          },
          {
            text: 'third',
          },
        ],
      },
      {
        cells: [
          {
            text: 'first 2',
          },
          {
            text: 'second 2',
          },
          {
            text: 'third 2',
          },
        ],
      },
    ],
    columnProperties: [
      {
        header: 'column 1',
      },
      {
        header: 'column 2',
      },
      {
        header: 'column 2',
      },
    ],
  })
})
