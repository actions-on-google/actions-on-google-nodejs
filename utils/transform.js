/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
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

'use strict';

// Enable actions-on-google debug logging
process.env.DEBUG = 'actions-on-google:*';

// lodash helpers
const camelCase = require('lodash.camelcase');
const snakeCase = require('lodash.snakecase');

/**
 * Transforms incoming object to new camelCase-keyed object.
 *
 * @example
 * const snakeCaseObject = {
 *   key_one: {
 *     key_two: [
 *       {
 *         key: 'value'
 *       },
 *       'array_item_two'
 *     ]
 *   }
 * };
 * let camelCaseObject = transformToCamelCase(snakeCaseObject);
 * // camelCaseObject === {
 * //   keyOne: {
 * //     keyTwo: [
 * //       {
 * //         key: 'value'
 * //       },
 * //       'array_item_two'
 * //     ]
 * //   }
 * // };
 *
 * @param {Object} object Object to transform.
 * @return {Object} Incoming object deeply mapped to camelCase keys.
 */
function transformToCamelCase (object) {
  return transform(object, camelCase);
}

/**
 * Transforms incoming object to new snake_case-keyed object.
 *
 * @example
 * const camelCaseObject = {
 *   keyOne: {
 *     keyTwo: [
 *       {
 *         key: 'value'
 *       },
 *       'arrayItemTwo'
 *     ]
 *   }
 * };
 * let snakeCaseObject = transformToSnakeCase(camelCaseObject);
 * // snakeCaseObject === {
 * //   key_one: {
 * //     key_two: [
 * //       {
 * //         key: 'value'
 * //       },
 * //       'arrayItemTwo'
 * //     ]
 * //   }
 * // };
 *
 * @param {Object} object Object to transform.
 * @return {Object} Incoming object deeply mapped to camelCase keys.
 */
function transformToSnakeCase (object) {
  return transform(object, snakeCase);
}

/**
 * Generic deep object transformation utility. Recursively converts all object
 * keys, including those of array elements, with some transformation function.
 * Note that classes will get converted to objects.
 *
 * @param {Object} object Object to transform.
 * @param {Function} keyTransformation
 */
function transform (object, keyTransformation) {
  let newObject = object;
  if (Array.isArray(object)) {
    newObject = object.map((element) => {
      return transform(element, keyTransformation);
    });
  } else if (object && typeof object === 'object') {
    newObject = {};
    for (let key of Object.keys(object)) {
      let transformedKey = keyTransformation(key);
      newObject[transformedKey] = transform(object[key], keyTransformation);
    }
  }
  return newObject;
}

module.exports = {
  transformToCamelCase,
  transformToSnakeCase
};

