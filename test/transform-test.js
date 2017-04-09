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

/**
 * Test suite for the actions client library.
 */
const winston = require('winston');
const chai = require('chai');
const expect = chai.expect;
const transformToSnakeCase = require('../utils/transform').transformToSnakeCase;
const transformToCamelCase = require('../utils/transform').transformToCamelCase;

// Default logger
winston.loggers.add('DEFAULT_LOGGER', {
  console: {
    level: 'error',
    colorize: true,
    label: 'Default logger',
    json: true,
    timestamp: true
  }
});

/**
 * Describes transformToSnakeCase function.
 */
describe('transformToSnakeCase', function () {
  it('Converts camelCase object to snake_case', function () {
    const camelCaseObject = {
      keyOne: {
        keyTwo: [
          {
            keyThree: 'value',
            nestedKey: {
              keyFour: 'value'
            }
          },
          'arrayItemTwo'
        ]
      }
    };
    expect(transformToSnakeCase(camelCaseObject)).to.deep.equal({
      key_one: {
        key_two: [
          {
            key_three: 'value',
            nested_key: {
              key_four: 'value'
            }
          },
          'arrayItemTwo'
        ]
      }
    });
  });
  it('Leaves the original object untouched', function () {
    const camelCaseObject = {
      keyOne: {
        keyTwo: [
          {
            key: 'value'
          },
          'arrayItemTwo'
        ]
      }
    };
    transformToSnakeCase(camelCaseObject);
    expect(camelCaseObject).to.deep.equal({
      keyOne: {
        keyTwo: [
          {
            key: 'value'
          },
          'arrayItemTwo'
        ]
      }
    });
  });
  it('Does not convert incoming function to object', function () {
    let stubFunc = function () {};
    const camelCaseObject = {
      keyOne: {
        keyTwo: [
          {
            key: 'value'
          },
          'arrayItemTwo'
        ],
        keyThree: stubFunc
      }
    };
    expect(transformToSnakeCase(camelCaseObject)).to.deep.equal({
      key_one: {
        key_two: [
          {
            key: 'value'
          },
          'arrayItemTwo'
        ],
        key_three: stubFunc
      }
    });
  });
  it('Does not convert incoming null to object', function () {
    const camelCaseObject = {
      keyOne: {
        keyTwo: [
          {
            key: 'value'
          },
          'arrayItemTwo'
        ],
        keyThree: null
      }
    };
    expect(transformToSnakeCase(camelCaseObject)).to.deep.equal({
      key_one: {
        key_two: [
          {
            key: 'value'
          },
          'arrayItemTwo'
        ],
        key_three: null
      }
    });
  });
});

/**
 * Describes transformToCamelCase function.
 */
describe('transformToCamelCase', function () {
  it('Converts snake object to camelCase', function () {
    const snakeCaseObject = {
      key_one: {
        key_two: [
          {
            key_three: 'value',
            nested_key: {
              key_four: 'value'
            }
          },
          'array_item_two'
        ]
      }
    };
    expect(transformToCamelCase(snakeCaseObject)).to.deep.equal({
      keyOne: {
        keyTwo: [
          {
            keyThree: 'value',
            nestedKey: {
              keyFour: 'value'
            }
          },
          'array_item_two'
        ]
      }
    });
  });
  it('Leaves the original object untouched', function () {
    const snakeCaseObject = {
      key_one: {
        key_two: [
          {
            key: 'value'
          },
          'array_item_two'
        ]
      }
    };
    transformToCamelCase(snakeCaseObject);
    expect(snakeCaseObject).to.deep.equal({
      key_one: {
        key_two: [
          {
            key: 'value'
          },
          'array_item_two'
        ]
      }
    });
  });
  it('Does not convert incoming function to object', function () {
    let stubFunc = function () {};
    const snakeCaseObject = {
      key_one: {
        key_two: [
          {
            key: 'value'
          },
          'array_item_two'
        ],
        key_three: stubFunc
      }
    };
    expect(transformToCamelCase(snakeCaseObject)).to.deep.equal({
      keyOne: {
        keyTwo: [
          {
            key: 'value'
          },
          'array_item_two'
        ],
        keyThree: stubFunc
      }
    });
  });

  it('Does not convert incoming null to object', function () {
    const snakeCaseObject = {
      key_one: {
        key_two: [
          {
            key: 'value'
          },
          'array_item_two'
        ],
        key_three: null
      }
    };
    expect(transformToCamelCase(snakeCaseObject)).to.deep.equal({
      keyOne: {
        keyTwo: [
          {
            key: 'value'
          },
          'array_item_two'
        ],
        keyThree: null
      }
    });
  });
});
