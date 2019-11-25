"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const common = require("../../../../../common");
const toColumnProperties = (columns) => columns.map(column => typeof column === 'string' ? {
    header: column,
} : {
    header: column.header,
    horizontalAlignment: column.horizontalAlignment || column.align,
});
class Table {
    /** @public */
    constructor(options) {
        this.title = options.title;
        this.subtitle = options.subtitle;
        this.image = options.image;
        this.rows = options.rows.map(row => Array.isArray(row) ? {
            cells: row.map(text => ({ text })),
            dividerAfter: options.dividers,
        } : {
            cells: row.cells.map(cell => typeof cell === 'string' ? { text: cell } : cell),
            dividerAfter: typeof row.dividerAfter === 'undefined' ? options.dividers : row.dividerAfter,
        });
        const { columnProperties, columns, buttons } = options;
        if (columnProperties) {
            this.columnProperties = toColumnProperties(columnProperties);
        }
        if (typeof columns !== 'undefined') {
            if (!this.columnProperties) {
                this.columnProperties = [];
            }
            const properties = typeof columns === 'number' ?
                new Array(columns).fill({}) :
                toColumnProperties(columns);
            properties.forEach((v, i) => {
                if (!this.columnProperties[i]) {
                    this.columnProperties[i] = properties[i];
                }
            });
        }
        if (buttons) {
            this.buttons = common.toArray(buttons);
        }
    }
}
exports.Table = Table;
//# sourceMappingURL=table.js.map