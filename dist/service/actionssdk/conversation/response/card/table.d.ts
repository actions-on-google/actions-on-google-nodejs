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
import * as Api from '../../../api/v2';
/** @public */
export interface TableColumn extends Api.GoogleActionsV2UiElementsTableCardColumnProperties {
    /**
     * Alias for `horizontalAlignment`
     *
     * Horizontal alignment of content w.r.t column. If unspecified, content
     * will be aligned to the leading edge.
     * @public
     */
    align?: Api.GoogleActionsV2UiElementsTableCardColumnPropertiesHorizontalAlignment;
}
/** @public */
export interface TableRow {
    /**
     * Cells in this row.
     * The first 3 cells are guaranteed to be shown but others might be cut on certain surfaces.
     * Please test with the simulator to see which cells will be shown for a given surface.
     *
     * When provided as a string array, creates the cells as text.
     * @public
     */
    cells?: (Api.GoogleActionsV2UiElementsTableCardCell | string)[];
    /**
     * Indicates whether there should be a divider after each row.
     *
     * Overrides top level `dividers` property for this specific row if set.
     * @public
     */
    dividerAfter?: boolean;
}
/** @public */
export interface TableOptions {
    /**
     * Overall title of the table.
     *
     * Must be set if subtitle is set.
     * @public
     */
    title?: string;
    /**
     * Subtitle for the table.
     * @public
     */
    subtitle?: string;
    /**
     * Image associated with the table.
     * @public
     */
    image?: Api.GoogleActionsV2UiElementsImage;
    /**
     * Headers and alignment of columns with shortened name.
     * Alias of `columnProperties` with the additional capability of accepting a number type.
     *
     * This property or `columnProperties` is required.
     *
     * When provided as string array, just the header field is set per column.
     * When provided a number, it represents the number of elements per row.
     * @public
     */
    columns?: (TableColumn | string)[] | number;
    /**
     * Headers and alignment of columns.
     *
     * This property or `columns` is required.
     *
     * When provided as string array, just the header field is set per column.
     * @public
     */
    columnProperties?: (TableColumn | string)[];
    /**
     * Row data of the table.
     *
     * The first 3 rows are guaranteed to be shown but others might be cut on certain surfaces.
     * Please test with the simulator to see which rows will be shown for a given surface.
     *
     * On surfaces that support the WEB_BROWSER capability, you can point the user to
     * a web page with more data.
     * @public
     */
    rows: (TableRow | string[])[];
    /**
     * Default dividerAfter for all rows.
     * Individual rows with `dividerAfter` set will override for that specific row.
     * @public
     */
    dividers?: boolean;
    /**
     * Buttons for the Table.
     * Currently at most 1 button is supported.
     * @public
     */
    buttons?: Api.GoogleActionsV2UiElementsButton | Api.GoogleActionsV2UiElementsButton[];
}
/**
 * Creates a Table card.
 *
 * @example
 * ```javascript
 *
 * // Simple table
 * conv.ask('Simple Response')
 * conv.ask(new Table({
 *   dividers: true,
 *   columns: ['header 1', 'header 2', 'header 3'],
 *   rows: [
 *     ['row 1 item 1', 'row 1 item 2', 'row 1 item 3'],
 *     ['row 2 item 1', 'row 2 item 2', 'row 2 item 3'],
 *   ],
 * }))
 *
 * // All fields
 * conv.ask('Simple Response')
 * conv.ask(new Table({
 *   title: 'Table Title',
 *   subtitle: 'Table Subtitle',
 *   image: new Image({
 *     url: 'https://avatars0.githubusercontent.com/u/23533486',
 *     alt: 'Actions on Google'
 *   }),
 *   columns: [
 *     {
 *       header: 'header 1',
 *       align: 'CENTER',
 *     },
 *     {
 *       header: 'header 2',
 *       align: 'LEADING',
 *     },
 *     {
 *       header: 'header 3',
 *       align: 'TRAILING',
 *     },
 *   ],
 *   rows: [
 *     {
 *       cells: ['row 1 item 1', 'row 1 item 2', 'row 1 item 3'],
 *       dividerAfter: false,
 *     },
 *     {
 *       cells: ['row 2 item 1', 'row 2 item 2', 'row 2 item 3'],
 *       dividerAfter: true,
 *     },
 *     {
 *       cells: ['row 3 item 1', 'row 3 item 2', 'row 3 item 3'],
 *     },
 *   ],
 *   buttons: new Button({
 *     title: 'Button Title',
 *     url: 'https://github.com/actions-on-google'
 *   }),
 * }))
 * ```
 *
 * @public
 */
export interface Table extends Api.GoogleActionsV2UiElementsTableCard {
}
export declare class Table implements Api.GoogleActionsV2UiElementsTableCard {
    /** @public */
    constructor(options: TableOptions);
}
