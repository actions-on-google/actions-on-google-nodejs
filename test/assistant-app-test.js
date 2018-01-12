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
const { expect } = chai;
const spies = require('chai-spies');
const { AssistantApp } = require('.././actions-on-google');
const {
  dialogflowAppRequestBodyNewSessionMock,
  headerV1,
  headerV2,
  MockRequest,
  MockResponse,
  clone
} = require('./utils/mocking');

chai.use(spies);

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

describe('AssistantApp', function () {
  let mockResponse;

  beforeEach(function () {
    mockResponse = new MockResponse();
  });
  /**
   * Describes the behavior for Assistant isNotApiVersionOne_ method.
   */
  describe('#isNotApiVersionOne_', function () {
    const invalidHeader = {
      'Content-Type': 'application/json',
      'google-assistant-api-version': 'v1',
      'Google-Actions-API-Version': '1'
    };

    it('Should detect Proto2 when header isn\'t present', function () {
      const mockRequest = new MockRequest(headerV1, {});
      const app = new AssistantApp({ request: mockRequest, response: mockResponse });
      expect(app.isNotApiVersionOne_()).to.equal(false);
    });

    it('Should detect v1 when header is present', function () {
      const mockRequest = new MockRequest(invalidHeader, {});
      const app = new AssistantApp({ request: mockRequest, response: mockResponse });
      expect(app.isNotApiVersionOne_()).to.equal(false);
    });

    it('Should detect v2 when version is present in DialogflowApp req', function () {
      const mockRequest = new MockRequest(headerV1, {
        'originalRequest': {
          'version': 1
        }
      });
      const app = new AssistantApp({ request: mockRequest, response: mockResponse });
      expect(app.isNotApiVersionOne_()).to.equal(false);
    });

    it('Should detect v2 when header is present', function () {
      const headerWithV2 = JSON.parse(JSON.stringify(headerV1));
      headerWithV2['Google-Actions-API-Version'] = '2';
      const mockRequest = new MockRequest(headerWithV2, {});
      const app = new AssistantApp({ request: mockRequest, response: mockResponse });
      expect(app.isNotApiVersionOne_()).to.equal(true);
    });

    it('Should detect v2 when version is present in DialogflowApp req', function () {
      const mockRequest = new MockRequest(headerV1, {
        'originalRequest': {
          'version': 2
        }
      });
      const app = new AssistantApp({ request: mockRequest, response: mockResponse });
      expect(app.isNotApiVersionOne_()).to.equal(true);
    });
  });

  /**
   * Describes the behavior for AssistantApp isSsml_ method.
   */
  describe('#isSsml_', function () {
    // Success case test, when the API returns a valid 200 response with the response object
    it('Should validate SSML syntax.', function () {
      const mockRequest = new MockRequest(headerV1, {});
      const app = new AssistantApp({ request: mockRequest, response: mockResponse });
      expect(app.isSsml_('<speak></speak>')).to.equal(true);
      expect(app.isSsml_('<SPEAK></SPEAK>')).to.equal(true);
      expect(app.isSsml_('  <speak></speak>  ')).to.equal(true);
      expect(app.isSsml_('<speak>  </speak>')).to.equal(true);
      expect(app.isSsml_('<speak version="1.0"></speak>')).to.equal(true);
      expect(app.isSsml_('<speak version="1.0">Hello world!</speak>')).to.equal(true);
      expect(app.isSsml_('<speak>')).to.equal(false);
      expect(app.isSsml_('</speak>')).to.equal(false);
      expect(app.isSsml_('')).to.equal(false);
      expect(app.isSsml_('bla bla bla')).to.equal(false);
      expect(app.isSsml_('<html></html>')).to.equal(false);
      expect(app.isSsml_('bla bla bla<speak></speak>')).to.equal(false);
      expect(app.isSsml_('<speak></speak> bla bla bla')).to.equal(false);
      expect(app.isSsml_('<speak>my SSML content</speak>')).to.equal(true);
      expect(app.isSsml_('<speak>Line 1\nLine 2</speak>')).to.equal(true);
      expect(app.isSsml_(
        '<speak>Step 1, take a deep breath. <break time="2s" />Step 2, exhale.</speak>')).to
        .equal(true);
      expect(app.isSsml_('<speak><say-as interpret-as="cardinal">12345</say-as></speak>')).to
        .equal(true);
      expect(app.isSsml_('<speak><say-as interpret-as="ordinal">1</say-as></speak>')).to
        .equal(true);
      expect(app.isSsml_('<speak><say-as interpret-as="characters">can</say-as></speak>')).to
        .equal(true);
      expect(
        app.isSsml_('<speak><say-as interpret-as="date" format="ymd">1960-09-10</say-as></speak>'))
        .to.equal(true);
      expect(app.isSsml_('<speak>' +
        '<say-as interpret-as="date" format="yyyymmdd" detail="1">1960-09-10</say-as></speak>'))
        .to.equal(true);
      expect(app.isSsml_('<speak><say-as interpret-as="date" format="dm">10-9</say-as></speak>')).to
        .equal(true);
      expect(app.isSsml_(
        '<speak><say-as interpret-as="date" format="dmy" detail="2">10-9-1960</say-as></speak>')).to
        .equal(true);
      expect(
        app.isSsml_('<speak><say-as interpret-as="time" format="hms12">2:30pm</say-as></speak>')).to
        .equal(true);
      expect(app.isSsml_(
        '<speak><audio src="https://somesite.bla/meow.mp3">a cat meowing</audio></speak>')).to
        .equal(true);
      expect(app.isSsml_(
        '<speak><p><s>This is sentence one.</s><s>This is sentence two.</s></p></speak>')).to
        .equal(true);
      expect(app.isSsml_('<speak><sub alias="World Wide Web Consortium">W3C</sub></speak>')).to
        .equal(true);
    });
  });

  describe('#handleRequestAsync', function () {
    let mockRequest;
    let app;

    beforeEach(function () {
      mockRequest = new MockRequest(headerV2, clone(dialogflowAppRequestBodyNewSessionMock));
      app = new AssistantApp({ request: mockRequest, response: mockResponse });

      // mock getIntent
      app.getIntent = () => {
        return mockRequest.body.result.action;
      };
    });

    it('Should resolve a promise when actionMap contains a handler ' +
      'that returns a promise', function (done) {
      const handler = app => {
        return Promise.resolve('success');
      };

      const actionMap = new Map();
      actionMap.set(mockRequest.body.result.action, handler);

      app.handleRequestAsync(actionMap).then(
        (result) => {
          expect(result).to.equal('success');
          done();
        }
      );
    });

    it('Should reject a promise when actionMap contains a handler ' +
      'that returns a promise error', function (done) {
      const handler = app => {
        return Promise.reject(new Error('error'));
      };

      const actionMap = new Map();
      actionMap.set(mockRequest.body.result.action, handler);

      app.handleRequestAsync(actionMap).catch(
        (reason) => {
          expect(reason).to.be.a('Error');
          done();
        }
      );
    });

    it('Should resolve a promise when handler function returns a promise', function (done) {
      const handler = app => {
        return Promise.resolve('success');
      };

      app.handleRequestAsync(handler).then(
        (result) => {
          expect(result).to.equal('success');
          done();
        }
      );
    });

    it('Should reject a promise when handler function returns a promise error', function (done) {
      const handler = app => {
        return Promise.reject(new Error('error'));
      };

      app.handleRequestAsync(handler).catch(
        (reason) => {
          expect(reason).to.be.a('Error');
          done();
        }
      );
    });

    it('Should resolve a promise when handler function does not return a promise', function (done) {
      const handler = app => {
        return 'success';
      };

      app.handleRequestAsync(handler).then(
        (result) => {
          expect(result).to.equal('success');
          done();
        }
      );
    });

    it('Should resolve a promise when actionMap contains a handler ' +
      'that does not return a promise', function (done) {
      const handler = app => {
        return 'success';
      };

      const actionMap = new Map();
      actionMap.set(mockRequest.body.result.action, handler);

      app.handleRequestAsync(actionMap).then(
        (result) => {
          expect(result).to.equal('success');
          done();
        }
      );
    });
  });
});
