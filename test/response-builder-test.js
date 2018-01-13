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
const {
  RichResponse,
  BasicCard,
  List,
  Carousel,
  OptionItem
} = require('.././response-builder');

const { clone } = require('./utils/mocking');

const { OrderUpdate } = require('.././transactions');

const { ImageDisplays } = require('.././response-builder');

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
 * Describes the behavior for RichResponse interface.
 */
describe('RichResponse', () => {
  describe('#constructor', () => {
    it('should create valid object', () => {
      const richResponse = new RichResponse();
      expect(clone(richResponse)).to.deep.equal({
        items: [],
        suggestions: []
      });
    });
  });

  describe('#addSimpleResponse', () => {
    let richResponse;

    beforeEach(() => {
      richResponse = new RichResponse();
    });

    it('should add a simple response w/ just speech', () => {
      richResponse.addSimpleResponse('This is speech');
      expect(clone(richResponse)).to.deep.equal({
        items: [
          {
            simpleResponse: {
              textToSpeech: 'This is speech'
            }
          }
        ],
        suggestions: []
      });
    });

    it('should add a simple response w/ just SSML speech', () => {
      richResponse.addSimpleResponse('<speak>This is speech</speak>');
      expect(clone(richResponse)).to.deep.equal({
        items: [
          {
            simpleResponse: {
              ssml: '<speak>This is speech</speak>'
            }
          }
        ],
        suggestions: []
      });
    });

    it('should add a simple response w/ just whitespace padded SSML speech', () => {
      richResponse.addSimpleResponse('   <speak>This is speech</speak>   ');
      expect(clone(richResponse)).to.deep.equal({
        items: [
          {
            simpleResponse: {
              ssml: '   <speak>This is speech</speak>   '
            }
          }
        ],
        suggestions: []
      });
    });

    it('should add a simple response w/ speech and display text', () => {
      richResponse.addSimpleResponse({
        speech: 'This is speech',
        displayText: 'This is display text'
      });
      expect(clone(richResponse)).to.deep.equal({
        items: [
          {
            simpleResponse: {
              textToSpeech: 'This is speech',
              displayText: 'This is display text'
            }
          }
        ],
        suggestions: []
      });
    });

    it('should add a simple response w/ SSML speech and display text', () => {
      richResponse.addSimpleResponse({
        speech: '<speak>This is speech</speak>',
        displayText: 'This is display text'
      });
      expect(clone(richResponse)).to.deep.equal({
        items: [
          {
            simpleResponse: {
              ssml: '<speak>This is speech</speak>',
              displayText: 'This is display text'
            }
          }
        ],
        suggestions: []
      });
    });

    it('should add a simple response w/ whitespace padded SSML speech and display text', () => {
      richResponse.addSimpleResponse({
        speech: '   <speak>This is speech</speak>   ',
        displayText: 'This is display text'
      });
      expect(clone(richResponse)).to.deep.equal({
        items: [
          {
            simpleResponse: {
              ssml: '   <speak>This is speech</speak>   ',
              displayText: 'This is display text'
            }
          }
        ],
        suggestions: []
      });
    });

    it('not add more than two simple responses', () => {
      richResponse.addSimpleResponse('text');
      richResponse.addSimpleResponse('text');
      richResponse.addSimpleResponse('text');
      expect(clone(richResponse)).to.deep.equal({
        items: [
          {
            simpleResponse: {
              textToSpeech: 'text'
            }
          },
          {
            simpleResponse: {
              textToSpeech: 'text'
            }
          }
        ],
        suggestions: []
      });
    });

    it('should replace a basic card at first position', () => {
      richResponse.addBasicCard(new BasicCard());
      richResponse.addSimpleResponse('text');
      expect(richResponse.items[0]).to.deep.equal(
        {
          simpleResponse: {
            textToSpeech: 'text'
          }
        });
    });

    it('should replace a structured response at first position', () => {
      richResponse.addOrderUpdate(new OrderUpdate());
      richResponse.addSimpleResponse('text');
      expect(richResponse.items[0]).to.deep.equal(
        {
          simpleResponse: {
            textToSpeech: 'text'
          }
        });
    });
  });

  describe('#addOrderUpdate', () => {
    let richResponse;

    beforeEach(() => {
      richResponse = new RichResponse();
    });

    it('should add an order update', () => {
      richResponse.addOrderUpdate(new OrderUpdate());
      expect(richResponse.items[0].structuredResponse.orderUpdate).to.exist;
    });

    it('should not add more than one order update', () => {
      richResponse.addOrderUpdate(new OrderUpdate());
      richResponse.addOrderUpdate(new OrderUpdate());
      expect(richResponse.items.length).to.equal(1);
    });
  });

  describe('#addBasicCard', () => {
    let richResponse;

    beforeEach(() => {
      richResponse = new RichResponse();
    });

    it('should add a basic card', () => {
      richResponse.addBasicCard(new BasicCard());
      expect(richResponse.items[0].basicCard).to.exist;
    });

    it('should not add more than one basic card', () => {
      richResponse.addBasicCard(new BasicCard());
      richResponse.addBasicCard(new BasicCard());
      expect(richResponse.items.length).to.equal(1);
    });
  });

  describe('#addSuggestions', () => {
    let richResponse;

    beforeEach(() => {
      richResponse = new RichResponse();
    });

    it('should add a single suggestion', () => {
      richResponse.addSuggestions('suggestion');
      expect(clone(richResponse)).to.deep.equal({
        items: [],
        suggestions: [{
          title: 'suggestion'
        }]
      });
    });

    it('should add multiple suggestions', () => {
      richResponse.addSuggestions(['suggestion one', 'suggestion two']);
      expect(clone(richResponse)).to.deep.equal({
        items: [],
        suggestions: [
          {
            title: 'suggestion one'
          },
          {
            title: 'suggestion two'
          }]
      });
    });

    it('should not add a suggestion longer than 25 characters', () => {
      richResponse.addSuggestions(['suggestion one that is very long', 'suggestion two']);
      expect(clone(richResponse)).to.deep.equal({
        items: [],
        suggestions: [
          {
            title: 'suggestion two'
          }]
      });

      richResponse.addSuggestions('suggestion one that is very long');
      expect(clone(richResponse)).to.deep.equal({
        items: [],
        suggestions: [
          {
            title: 'suggestion two'
          }]
      });
    });
  });

  describe('#addSuggestionLink', () => {
    let richResponse;

    beforeEach(() => {
      richResponse = new RichResponse();
    });

    it('should add a single suggestion link', () => {
      richResponse.addSuggestionLink('title', 'url');
      expect(clone(richResponse)).to.deep.equal({
        items: [],
        suggestions: [],
        linkOutSuggestion: {
          destinationName: 'title',
          url: 'url'
        }
      });
    });

    it('should replace existing suggestion link', () => {
      richResponse.addSuggestionLink('title', 'url');
      richResponse.addSuggestionLink('replacement', 'replacement url');
      expect(clone(richResponse)).to.deep.equal({
        items: [],
        suggestions: [],
        linkOutSuggestion: {
          destinationName: 'replacement',
          url: 'replacement url'
        }
      });
    });
  });
});

/**
 * Describes the behavior for BasicCard interface.
 */
describe('BasicCard', () => {
  describe('#constructor', () => {
    it('should create valid object', () => {
      const basicCard = new BasicCard();
      expect(clone(basicCard)).to.deep.equal({
        formattedText: '',
        buttons: []
      });
    });
  });

  describe('#setTitle', () => {
    let basicCard;

    beforeEach(() => {
      basicCard = new BasicCard();
    });

    it('should set title', () => {
      basicCard.setTitle('Title');
      expect(clone(basicCard)).to.deep.equal({
        title: 'Title',
        formattedText: '',
        buttons: []
      });
    });

    it('should overwrite previously set title', () => {
      basicCard.setTitle('Title');
      basicCard.setTitle('New title');
      expect(clone(basicCard)).to.deep.equal({
        title: 'New title',
        formattedText: '',
        buttons: []
      });
    });
  });

  describe('#setSubtitle', () => {
    let basicCard;

    beforeEach(() => {
      basicCard = new BasicCard();
    });

    it('should set subtitle', () => {
      basicCard.setSubtitle('Subtitle');
      expect(clone(basicCard)).to.deep.equal({
        subtitle: 'Subtitle',
        formattedText: '',
        buttons: []
      });
    });

    it('should overwrite previously set subtitle', () => {
      basicCard.setSubtitle('Subtitle');
      basicCard.setSubtitle('New Subtitle');
      expect(clone(basicCard)).to.deep.equal({
        subtitle: 'New Subtitle',
        formattedText: '',
        buttons: []
      });
    });
  });

  describe('#setBodyText', () => {
    let basicCard;

    beforeEach(() => {
      basicCard = new BasicCard();
    });

    it('should set body text', () => {
      basicCard.setBodyText('body text');
      expect(clone(basicCard)).to.deep.equal({
        formattedText: 'body text',
        buttons: []
      });
    });

    it('should overwrite previously set body text', () => {
      basicCard.setBodyText('body text');
      basicCard.setBodyText('New body text');
      expect(clone(basicCard)).to.deep.equal({
        formattedText: 'New body text',
        buttons: []
      });
    });
  });

  describe('#setImage', () => {
    let basicCard;

    beforeEach(() => {
      basicCard = new BasicCard();
    });

    it('should set image', () => {
      basicCard.setImage('url', 'accessibilityText');
      expect(clone(basicCard)).to.deep.equal({
        formattedText: '',
        buttons: [],
        image: {
          url: 'url',
          accessibilityText: 'accessibilityText'
        }
      });
    });

    it('should overwrite previously set image', () => {
      basicCard.setImage('url', 'accessibilityText');
      basicCard.setImage('new.url', 'new_accessibilityText');
      expect(clone(basicCard)).to.deep.equal({
        formattedText: '',
        buttons: [],
        image: {
          url: 'new.url',
          accessibilityText: 'new_accessibilityText'
        }
      });
    });
  });

  describe('#setImageDisplay', () => {
    let basicCard;

    beforeEach(() => {
      basicCard = new BasicCard();
    });

    it('constructor should have undefined image options', () => {
      expect(basicCard.imageDisplayOptions).to.equal(undefined);
    });

    it('should ignore invalid image display option', () => {
      basicCard.setImageDisplay('INVALID');
      expect(clone(basicCard)).to.deep.equal({
        formattedText: '',
        buttons: []
      });
    });

    it('should set image display options', () => {
      basicCard.setImageDisplay(ImageDisplays.WHITE);
      expect(clone(basicCard)).to.deep.equal({
        formattedText: '',
        buttons: [],
        imageDisplayOptions: ImageDisplays.WHITE
      });
    });

    it('should overwrite previously set image display', () => {
      basicCard.setImageDisplay(ImageDisplays.WHITE);
      basicCard.setImageDisplay(ImageDisplays.CROPPED);
      expect(clone(basicCard)).to.deep.equal({
        formattedText: '',
        buttons: [],
        imageDisplayOptions: ImageDisplays.CROPPED
      });
    });
  });

  describe('#addButton', () => {
    let basicCard;

    beforeEach(() => {
      basicCard = new BasicCard();
    });

    it('should add a single button', () => {
      basicCard.addButton('button', 'url');
      expect(clone(basicCard)).to.deep.equal({
        formattedText: '',
        buttons: [{
          title: 'button',
          openUrlAction: {
            url: 'url'
          }
        }]
      });
    });

    it('should add multiple buttons', () => {
      basicCard.addButton('button one', 'url.one');
      basicCard.addButton('button two', 'url.two');
      basicCard.addButton('button three', 'url.three');
      expect(clone(basicCard)).to.deep.equal({
        formattedText: '',
        buttons: [
          {
            title: 'button one',
            openUrlAction: {
              url: 'url.one'
            }
          },
          {
            title: 'button two',
            openUrlAction: {
              url: 'url.two'
            }
          },
          {
            title: 'button three',
            openUrlAction: {
              url: 'url.three'
            }
          }
        ]
      });
    });
  });
});

/**
 * Describes the behavior for List interface.
 */
describe('List', () => {
  describe('#constructor', () => {
    it('should create valid object', () => {
      const list = new List();
      expect(clone(list)).to.deep.equal({
        items: []
      });
    });
  });

  describe('#setTitle', () => {
    let list;

    beforeEach(() => {
      list = new List();
    });

    it('should set title', () => {
      list.setTitle('Title');
      expect(clone(list)).to.deep.equal({
        title: 'Title',
        items: []
      });
    });

    it('should overwrite previously set title', () => {
      list.setTitle('Title');
      list.setTitle('New title');
      expect(clone(list)).to.deep.equal({
        title: 'New title',
        items: []
      });
    });
  });

  describe('#addItems', () => {
    let list;

    beforeEach(() => {
      list = new List();
    });

    it('should add a single item', () => {
      list.addItems(new OptionItem());
      expect(clone(list)).to.deep.equal({
        items: [{
          title: '',
          optionInfo: {
            key: '',
            synonyms: []
          }
        }]
      });
    });

    it('should add multiple items', () => {
      list.addItems([new OptionItem(), new OptionItem(), new OptionItem()]);
      expect(clone(list)).to.deep.equal({
        items: [
          {
            title: '',
            optionInfo: {
              key: '',
              synonyms: []
            }
          },
          {
            title: '',
            optionInfo: {
              key: '',
              synonyms: []
            }
          },
          {
            title: '',
            optionInfo: {
              key: '',
              synonyms: []
            }
          }
        ]
      });
    });

    it('should add no more than 30 items', () => {
      const optionItems = [];
      for (let i = 0; i < 35; i++) {
        const optionItem = new OptionItem().setKey(i.toString());
        optionItems.push(optionItem);
      }
      list.addItems(optionItems);
      expect(list.items.length).to.equal(30);
      for (let i = 0; i < list.items.length; i++) {
        expect(list.items[i].optionInfo.key).to.equal(i.toString());
      }
    });
  });
});

/**
 * Describes the behavior for Carousel interface.
 */
describe('Carousel', () => {
  describe('#constructor', () => {
    it('should create valid object', () => {
      const carousel = new Carousel();
      expect(clone(carousel)).to.deep.equal({
        items: []
      });
    });
  });

  describe('#addItems', () => {
    let carousel;

    beforeEach(() => {
      carousel = new Carousel();
    });

    it('should add a single item', () => {
      carousel.addItems(new OptionItem());
      expect(clone(carousel)).to.deep.equal({
        items: [{
          title: '',
          optionInfo: {
            key: '',
            synonyms: []
          }
        }]
      });
    });

    it('should add multiple items', () => {
      carousel.addItems([new OptionItem(), new OptionItem(), new OptionItem()]);
      expect(clone(carousel)).to.deep.equal({
        items: [
          {
            title: '',
            optionInfo: {
              key: '',
              synonyms: []
            }
          },
          {
            title: '',
            optionInfo: {
              key: '',
              synonyms: []
            }
          },
          {
            title: '',
            optionInfo: {
              key: '',
              synonyms: []
            }
          }
        ]
      });
    });

    it('should add no more than 10 items', () => {
      const optionItems = [];
      for (let i = 0; i < 15; i++) {
        const optionItem = new OptionItem().setKey(i.toString());
        optionItems.push(optionItem);
      }
      carousel.addItems(optionItems);
      expect(carousel.items.length).to.equal(10);
      for (let i = 0; i < carousel.items.length; i++) {
        expect(carousel.items[i].optionInfo.key).to.equal(i.toString());
      }
    });
  });
});

/**
 * Describes the behavior for OptionItem interface.
 */
describe('OptionItem', () => {
  describe('#constructor', () => {
    it('should create valid object', () => {
      const optionItem = new OptionItem();
      expect(clone(optionItem)).to.deep.equal({
        title: '',
        optionInfo: {
          key: '',
          synonyms: []
        }
      });
    });
  });

  describe('#setTitle', () => {
    let optionItem;

    beforeEach(() => {
      optionItem = new OptionItem();
    });

    it('should set title', () => {
      optionItem.setTitle('Title');
      expect(clone(optionItem)).to.deep.equal({
        title: 'Title',
        optionInfo: {
          key: '',
          synonyms: []
        }
      });
    });

    it('should overwrite previously set title', () => {
      optionItem.setTitle('Title');
      optionItem.setTitle('New title');
      expect(clone(optionItem)).to.deep.equal({
        title: 'New title',
        optionInfo: {
          key: '',
          synonyms: []
        }
      });
    });
  });

  describe('#setDescription', () => {
    let optionItem;

    beforeEach(() => {
      optionItem = new OptionItem();
    });

    it('should set subtitle', () => {
      optionItem.setDescription('Description');
      expect(clone(optionItem)).to.deep.equal({
        title: '',
        description: 'Description',
        optionInfo: {
          key: '',
          synonyms: []
        }
      });
    });

    it('should overwrite previously set description', () => {
      optionItem.setDescription('Description');
      optionItem.setDescription('New Description');
      expect(clone(optionItem)).to.deep.equal({
        title: '',
        description: 'New Description',
        optionInfo: {
          key: '',
          synonyms: []
        }
      });
    });
  });

  describe('#setImage', () => {
    let optionItem;

    beforeEach(() => {
      optionItem = new OptionItem();
    });

    it('should set image', () => {
      optionItem.setImage('url', 'accessibilityText');
      expect(clone(optionItem)).to.deep.equal({
        title: '',
        optionInfo: {
          key: '',
          synonyms: []
        },
        image: {
          url: 'url',
          accessibilityText: 'accessibilityText'
        }
      });
    });

    it('should overwrite previously set image', () => {
      optionItem.setImage('url', 'accessibilityText');
      optionItem.setImage('new.url', 'new_accessibilityText');
      expect(clone(optionItem)).to.deep.equal({
        title: '',
        optionInfo: {
          key: '',
          synonyms: []
        },
        image: {
          url: 'new.url',
          accessibilityText: 'new_accessibilityText'
        }
      });
    });
  });
});
