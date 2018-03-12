/**
 * Copyright 2017 Google Inc. All Rights Reserved.
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

/**
 * A collection of response builders.
 */

'use strict';

const Debug = require('debug');
const debug = Debug('actions-on-google:debug');
const warn = Debug('actions-on-google:warn');
const error = Debug('actions-on-google:error');

// Configure logging for hosting platforms that only support console.log and console.error
debug.log = console.log.bind(console);
error.log = console.error.bind(console);

const Limits = {
  LIST_ITEM_MAX: 30,
  CAROUSEL_ITEM_MAX: 10,
  OPTIONS_MIN: 2,
  SIMPLE_RESPONSE_MAX: 2,
  SUGGESTION_TEXT_MAX: 25
};

/**
 * List of possible options to display the image in a BasicCard.
 * When the aspect ratio of an image is not the same as the surface,
 * this attribute changes how the image is displayed in the card.
 * @readonly
 * @enum {string}
 */
const ImageDisplays = {
  /**
   * Pads the gaps between the image and image frame with a blurred copy of the
   * same image.
   */
  DEFAULT: 'DEFAULT',
  /**
   * Fill the gap between the image and image container with white bars.
   */
  WHITE: 'WHITE',
  /**
   * Image is scaled such that the image width matches the container width. This may crop the top
   * and bottom of the image if the scaled image height is greater than the container height. This
   * is similar to "Zoom Mode" on a widescreen TV when playing a 4:3 video..
   */
  CROPPED: 'CROPPED'
};

/**
 * Values related to supporting media.
 * @readonly
 * @type {Object}
 */
const MediaValues = {
  /**
   * Type of the media within a MediaResponse.
   * @readonly
   * @enum {string}
   */
  Type: {
    /**
     * Unspecified.
     */
    MEDIA_TYPE_UNSPECIFIED: 'MEDIA_TYPE_UNSPECIFIED',
    /**
     * Audio stream.
     */
    AUDIO: 'AUDIO'
  },
  /**
   * List of media control status' returned.
   * @readonly
   * @enum {string}
   */
  Status: {
    /**
     * Unspecified.
     */
    UNSPECIFIED: 'STATUS_UNSPECIFIED',
    /**
     * Finished.
     */
    FINISHED: 'FINISHED'
  },
  /**
   * List of possible item types.
   * @readonly
   * @enum {string}
   */
  ImageType: {
    /**
     * Icon.
     */
    ICON: 'ICON',
    /**
     * Large image.
     */
    LARGE: 'LARGE_IMAGE'
  }
};

/**
 * Simple Response type.
 * @typedef {Object} SimpleResponse
 * @property {string} speech - Speech to be spoken to user. SSML allowed.
 * @property {string} displayText - Optional text to be shown to user
 */

/**
 * Suggestions to show with response.
 * @typedef {Object} Suggestion
 * @property {string} title - Text of the suggestion.
 */

/**
 * Link Out Suggestion. Used in rich response as a suggestion chip which, when
 * selected, links out to external URL.
 * @typedef {Object} LinkOutSuggestion
 * @property {string} title - Text shown on the suggestion chip.
 * @property {string} url - String URL to open.
 */

/**
 * Image type shown on visual elements.
 * @typedef {Object} Image
 * @property {string} url - Image source URL.
 * @property {string} accessibilityText - Text to replace for image for
 *     accessibility.
 * @property {number} width - Width of the image.
 * @property {number} height - Height of the image.
 */

/**
 * Basic Card Button. Shown below basic cards. Open a URL when selected.
 * @typedef {Object} Button
 * @property {string} title - Text shown on the button.
 * @property {Object} openUrlAction - Action to take when selected.
 * @property {string} openUrlAction.url - String URL to open.
 */

/**
 * Option item. Used in actions.intent.OPTION intent.
 * @typedef {Object} OptionItem
 * @property {OptionInfo} optionInfo - Option item identifier information.
 * @property {string} title - Name of the item.
 * @property {string} description - Optional text describing the item.
 * @property {Image} image - Square image to show for this item.
 */

/**
 * Option info. Provides unique identifier for a given OptionItem.
 * @typedef {Object} OptionInfo
 * @property {string} key - Unique string ID for this option.
 * @property {Array<string>} synonyms - Synonyms that can be used by the user
 *     to indicate this option if they do not use the key.
 */

/**
 * @typedef {Object} StructuredResponse
 * @property {OrderUpdate} orderUpdate
 */

/**
 * @typedef {Object} ItemBasicCard
 * @property {BasicCard} basicCard
 */

/**
 * @typedef {Object} ItemSimpleResponse
 * @property {SimpleResponse} simpleResponse
 */

/**
 * @typedef {Object} ItemStructuredResponse
 * @property {StructuredResponse} structuredResponse
 */

/** @typedef {ItemBasicCard | ItemSimpleResponse | ItemStructuredResponse} RichResponseItem */

/**
 * Class for initializing and constructing Rich Responses with chainable interface.
 */
class RichResponse {
  /**
   * Constructor for RichResponse. Accepts optional RichResponse to clone.
   *
   * @param {RichResponse=} richResponse Optional RichResponse to clone.
   */
  constructor (richResponse) {
    /**
     * Ordered list of either SimpleResponse objects or BasicCard objects.
     * First item must be SimpleResponse. There can be at most one card.
     * @type {Array<RichResponseItem>}
     */
    this.items = [];

    /**
     * Ordered list of text suggestions to display. Optional.
     * @type {Array<Suggestion>}
     */
    this.suggestions = [];

    /**
     * Link Out Suggestion chip for this rich response. Optional.
     * @type {LinkOutSuggestion}
     */
    this.linkOutSuggestion = undefined;

    if (richResponse) {
      if (richResponse.items) {
        this.items = richResponse.items;
        for (const item of this.items) {
          if (item.basicCard) {
            item.basicCard = new BasicCard(item.basicCard);
          }
        }
      }
      if (richResponse.suggestions) {
        this.suggestions = richResponse.suggestions;
      }
      if (richResponse.linkOutSuggestion) {
        this.linkOutSuggestion = richResponse.linkOutSuggestion;
      }
    }
  }

  /**
   * Adds a SimpleResponse to list of items.
   *
   * @param {string|SimpleResponse} simpleResponse Simple response to present to
   *     user. If just a string, display text will not be set.
   * @return {RichResponse} Returns current constructed RichResponse.
   */
  addSimpleResponse (simpleResponse) {
    if (!simpleResponse) {
      error('Invalid simpleResponse');
      return this;
    }
    // Validate if RichResponse already contains two SimpleResponse objects
    let simpleResponseCount = 0;
    for (const item of this.items) {
      if (item.simpleResponse) {
        simpleResponseCount++;
      }
      if (simpleResponseCount >= Limits.SIMPLE_RESPONSE_MAX) {
        error(`Cannot include >${Limits.SIMPLE_RESPONSE_MAX} SimpleResponses in RichResponse`);
        return this;
      }
    }
    const simpleResponseObj = {
      simpleResponse: this.buildSimpleResponseHelper_(simpleResponse)
    };
    // Check first if needs to replace BasicCard at beginning of items list
    if (this.items.length > 0 && (this.items[0].basicCard ||
        this.items[0].structuredResponse)) {
      this.items.unshift(simpleResponseObj);
    } else {
      this.items.push(simpleResponseObj);
    }
    return this;
  }

  /**
   * Adds a BasicCard to list of items.
   *
   * @param {BasicCard} basicCard Basic card to include in response.
   * @return {RichResponse} Returns current constructed RichResponse.
   */
  addBasicCard (basicCard) {
    if (!basicCard) {
      error('Invalid basicCard');
      return this;
    }
    // Validate if basic card is already present
    for (const item of this.items) {
      if (item.basicCard) {
        error('Cannot include >1 BasicCard in RichResponse');
        return this;
      }
    }
    this.items.push({ basicCard });
    return this;
  }

  /**
   * Adds media to this response.
   *
   * @param {MediaResponse} mediaResponse MediaResponse to include in response.
   * @return {RichResponse} Returns current constructed RichResponse.
   */
  addMediaResponse (mediaResponse) {
    if (!mediaResponse) {
      error('Invalid MediaResponse');
      return this;
    }
    // Validate if RichResponse already contains MediaResponse object in an item
    for (const item of this.items) {
      if (item.mediaResponse) {
        debug('Cannot include >1 MediaResponse in RichResponse');
        return this;
      }
    }
    this.items.push({ mediaResponse });
    return this;
  }

  /**
   * Adds a Browse Carousel to list of items.
   *
   * @param {string|BrowseCarousel} browseCarousel Browse Carousel to present to
   *     user
   * @return {RichResponse} Returns current constructed RichResponse.
   */
  addBrowseCarousel (browseCarousel) {
    if (!browseCarousel) {
      error('Invalid browse carousel');
      return this;
    }
    this.items.push({ carouselBrowse: browseCarousel });
    return this;
  }

  /**
   * Adds a single suggestion or list of suggestions to list of items.
   *
   * @param {string|Array<string>} suggestions Either a single string suggestion
   *     or list of suggestions to add.
   * @return {RichResponse} Returns current constructed RichResponse.
   */
  addSuggestions (suggestions) {
    if (!suggestions) {
      error('Invalid suggestions');
      return this;
    }
    if (Array.isArray(suggestions)) {
      for (const suggestion of suggestions) {
        if (this.isValidSuggestionText(suggestion)) {
          this.suggestions.push({ title: suggestion });
        } else {
          warn(`Suggestion text can't be longer than 25 characters: ${suggestion}. ` +
            `This suggestion won't be added to the list.`);
        }
      }
    } else if (this.isValidSuggestionText(suggestions)) {
      this.suggestions.push({ title: suggestions });
    } else {
      warn(`Suggestion text can't be longer than 25 characters: ${suggestions}. ` +
        `This suggestion won't be added to the list.`);
    }
    return this;
  }

  /**
   * Returns true if the given suggestion text is valid to be added to the suggestion list.
   * A valid text string is not longer than 25 characters.
   *
   * @param {string} suggestionText Text to validate as suggestion.
   * @return {boolean} True if the text is valid, false otherwise.s
   */
  isValidSuggestionText (suggestionText) {
    return suggestionText && suggestionText.length &&
      suggestionText.length <= Limits.SUGGESTION_TEXT_MAX;
  }

  /**
   * Sets the suggestion link for this rich response. The destination site must be verified
   * (https://developers.google.com/actions/console/brand-verification).
   *
   * @param {string} destinationName Name of the link out destination.
   * @param {string} suggestionUrl - String URL to open when suggestion is used.
   * @return {RichResponse} Returns current constructed RichResponse.
   */
  addSuggestionLink (destinationName, suggestionUrl) {
    if (!destinationName) {
      error('destinationName cannot be empty');
      return this;
    }
    if (!suggestionUrl) {
      error('suggestionUrl cannot be empty');
      return this;
    }
    this.linkOutSuggestion = {
      destinationName: destinationName,
      url: suggestionUrl
    };
    return this;
  }

  /**
   * Adds an order update to this response. Use after a successful transaction
   * decision to confirm the order.
   *
   * @param {OrderUpdate} orderUpdate OrderUpdate object to add.
   * @return {RichResponse} Returns current constructed RichResponse.
   */
  addOrderUpdate (orderUpdate) {
    if (!orderUpdate) {
      error('Invalid orderUpdate');
      return this;
    }
    // Validate if RichResponse already contains StructuredResponse object
    for (const item of this.items) {
      if (item.structuredResponse) {
        debug('Cannot include >1 StructuredResponses in RichResponse');
        return this;
      }
    }
    this.items.push({
      structuredResponse: {
        orderUpdate: orderUpdate
      }
    });
    return this;
  }

  /**
   * Helper to build SimpleResponse from speech and display text.
   *
   * @param {string|SimpleResponse} response String to speak, or SimpleResponse.
   *     SSML allowed.
   * @param {string} response.speech If using SimpleResponse, speech to be spoken
   *     to user.
   * @param {string=} response.displayText If using SimpleResponse, text to be shown
   *     to user.
   * @return {Object} Appropriate SimpleResponse object.
   * @private
   */
  buildSimpleResponseHelper_ (response) {
    if (!response) {
      error('Invalid response');
      return null;
    }
    debug('buildSimpleResponseHelper_: response=%s', JSON.stringify(response));
    let simpleResponseObj = {};
    if (typeof response === 'string') {
      simpleResponseObj = isSsml(response) || isPaddedSsml(response)
        ? { ssml: response } : { textToSpeech: response };
    } else if (response.speech) {
      simpleResponseObj = isSsml(response.speech) || isPaddedSsml(response.speech)
        ? { ssml: response.speech } : { textToSpeech: response.speech };
      simpleResponseObj.displayText = response.displayText;
    } else {
      error('SimpleResponse requires a speech parameter.');
      return null;
    }
    return simpleResponseObj;
  }
}

/**
 * Class for initializing and constructing Basic Cards with chainable interface.
 */
class BasicCard {
  /**
   * Constructor for BasicCard. Accepts optional BasicCard to clone.
   *
   * @param {BasicCard=} basicCard Optional BasicCard to clone.
   */
  constructor (basicCard) {
    /**
     * Title of the card. Optional.
     * @type {string}
     */
    this.title = undefined;

    /**
     * Body text to show on the card. Required, unless image is present.
     * @type {string}
     */
    this.formattedText = '';

    /**
     * Subtitle of the card. Optional.
     * @type {string}
     */
    this.subtitle = undefined;

    /**
     * Image to show on the card. Optional.
     * @type {Image}
     */
    this.image = undefined;

    /**
     * Ordered list of buttons to show below card. Optional.
     * @type {Array<Button>}
     */
    this.buttons = [];

    if (basicCard) {
      if (basicCard.formattedText) {
        this.formattedText = basicCard.formattedText;
      }
      if (basicCard.buttons) {
        this.buttons = basicCard.buttons;
      }
      if (basicCard.title) {
        this.title = basicCard.title;
      }
      if (basicCard.subtitle) {
        this.subtitle = basicCard.subtitle;
      }
      if (basicCard.image) {
        this.image = basicCard.image;
      }
      if (basicCard.imageDisplayOptions) {
        this.imageDisplayOptions = basicCard.imageDisplayOptions;
      }
    }
  }

  /**
   * Sets the title for this Basic Card.
   *
   * @param {string} title Title to show on card.
   * @return {BasicCard} Returns current constructed BasicCard.
   */
  setTitle (title) {
    if (!title) {
      error('title cannot be empty');
      return this;
    }
    this.title = title;
    return this;
  }

  /**
   * Sets the subtitle for this Basic Card.
   *
   * @param {string} subtitle Subtitle to show on card.
   * @return {BasicCard} Returns current constructed BasicCard.
   */
  setSubtitle (subtitle) {
    if (!subtitle) {
      error('subtitle cannot be empty');
      return this;
    }
    this.subtitle = subtitle;
    return this;
  }

  /**
   * Sets the body text for this Basic Card.
   *
   * @param {string} bodyText Body text to show on card.
   * @return {BasicCard} Returns current constructed BasicCard.
   */
  setBodyText (bodyText) {
    if (!bodyText) {
      error('bodyText cannot be empty');
      return this;
    }
    this.formattedText = bodyText;
    return this;
  }

  /**
   * Sets the image for this Basic Card.
   *
   * @param {string} url Image source URL.
   * @param {string} accessibilityText Text to replace for image for
   *     accessibility.
   * @param {number=} width Width of the image.
   * @param {number=} height Height of the image.
   * @return {BasicCard} Returns current constructed BasicCard.
   */
  setImage (url, accessibilityText, width, height) {
    if (!url) {
      error('url cannot be empty');
      return this;
    }
    if (!accessibilityText) {
      error('accessibilityText cannot be empty');
      return this;
    }
    this.image = { url: url, accessibilityText: accessibilityText };
    if (width) {
      this.image.width = width;
    }
    if (height) {
      this.image.height = height;
    }
    return this;
  }

  /**
   * Sets the display options for the image in this Basic Card.
   * Use one of the image display constants. If none is chosen,
   * ImageDisplays.DEFAULT will be enforced.
   *
   * @param {string} option The option for displaying the image.
   * @return {BasicCard} Returns current constructed BasicCard.
   */
  setImageDisplay (option) {
    if (!ImageDisplays[option]) {
      return error(`Image display option ${option} is invalid`);
    }
    this.imageDisplayOptions = option;
    return this;
  }

  /**
   * Adds a button below card.
   *
   * @param {string} text Text to show on button.
   * @param {string} url URL to open when button is selected.
   * @return {BasicCard} Returns current constructed BasicCard.
   */
  addButton (text, url) {
    if (!text) {
      error('text cannot be empty');
      return this;
    }
    if (!url) {
      error('url cannot be empty');
      return this;
    }
    this.buttons.push({
      title: text,
      openUrlAction: {
        url: url
      }
    });
    return this;
  }
}

/**
 * Class for initializing and constructing Lists with chainable interface.
 */
class List {
  /**
   * Constructor for List. Accepts optional List to clone, string title, or
   * list of items to copy.
   *
   * @param {(List|string|Array<OptionItem>)=} list Either a list to clone, a title
   *     to set for a new List, or an array of OptionItem to initialize a new
   *     list.
   */
  constructor (list) {
    /**
     * Title of the list. Optional.
     * @type {string}
     */
    this.title = undefined;

    /**
     * List of 2-20 items to show in this list. Required.
     * @type {Array<OptionItems>}
     */
    this.items = [];

    if (list) {
      if (typeof list === 'string') {
        this.title = list;
      } else if (Array.isArray(list)) {
        for (const item of list) {
          this.items.push(new OptionItem(item));
        }
      } else if (typeof list === 'object') {
        if (list.title) {
          this.title = list.title;
        }
        if (list.items) {
          for (const item of list.items) {
            this.items.push(new OptionItem(item));
          }
        }
      }
    }
  }

  /**
   * Sets the title for this List.
   *
   * @param {string} title Title to show on list.
   * @return {List} Returns current constructed List.
   */
  setTitle (title) {
    if (!title) {
      error('title cannot be empty');
      return this;
    }
    this.title = title;
    return this;
  }

  /**
   * Adds a single item or list of items to the list.
   *
   * @param {OptionItem|Array<OptionItem>} optionItems OptionItems to add.
   * @return {List} Returns current constructed List.
   */
  addItems (optionItems) {
    if (!optionItems) {
      error('optionItems cannot be null');
      return this;
    }
    if (Array.isArray(optionItems)) {
      for (const item of optionItems) {
        this.items.push(item);
      }
    } else {
      this.items.push(optionItems);
    }
    if (this.items.length > Limits.LIST_ITEM_MAX) {
      this.items = this.items.slice(0, Limits.LIST_ITEM_MAX);
      warn(`List can have no more than ${Limits.LIST_ITEM_MAX} items`);
    }
    return this;
  }
}

/**
 * Class for initializing and constructing Browse Carousel with chainable interface.
 */
class BrowseCarousel {
  /**
   * Constructor for BrowseCarousel. Accepts optional BrowseCarousel to
   * clone or list of items to copy.
   *
   * @param {(BrowseCarousel|Array<BrowseItem>)=} carousel Either a carousel
   *     to clone or an array of BrowseItem to initialize a new carousel
   */
  constructor (carousel) {
    /**
     * List of 2-20 items to show in this carousel. Required.
     * @type {Array<BrowseItem>}
     */
    this.items = [];

    if (carousel) {
      if (Array.isArray(carousel)) {
        for (const item of carousel) {
          this.items.push(new BrowseItem(item));
        }
      } else if (typeof carousel === 'object') {
        if (carousel.items) {
          for (const item of carousel.items) {
            this.items.push(new BrowseItem(item));
          }
        }
      }
    }
  }

  /**
   * Adds a single item or list of items to the carousel.
   *
   * @param {BrowseItem|Array<BrowseItem>} browseItems BrowseItems to add.
   * @return {BrowseCarousel} Returns current constructed Browse Carousel.
   */
  addItems (browseItems) {
    if (!browseItems) {
      error('optionItems cannot be null');
      return this;
    }
    if (Array.isArray(browseItems)) {
      for (const item of browseItems) {
        this.items.push(item);
      }
    } else {
      this.items.push(browseItems);
    }
    if (this.items.length > Limits.CAROUSEL_ITEM_MAX) {
      this.items = this.items.slice(0, Limits.CAROUSEL_ITEM_MAX);
      error(`Carousel can have no more than ${Limits.CAROUSEL_ITEM_MAX} items`);
    }
    return this;
  }

  /**
   * Sets the display options for the images in this carousel.
   * Use one of the image display constants. If none is chosen,
   * ImageDisplays.DEFAULT will be enforced.
   *
   * @param {string} option The option for displaying the image.
   * @return {BrowseCarousel} Returns current constructed Browse Carousel.
   */
  setImageDisplay (option) {
    if (!ImageDisplays[option]) {
      return error(`Image display option ${option} is invalid`);
    }
    this.imageDisplayOptions = option;
    return this;
  }
}

/**
 * Class for initializing and constructing Carousel with chainable interface.
 */
class Carousel {
  /**
   * Constructor for Carousel. Accepts optional Carousel to clone or list of
   * items to copy.
   *
   * @param {(Carousel|Array<OptionItem>)=} carousel Either a carousel to clone
   *     or an array of OptionItem to initialize a new carousel
   */
  constructor (carousel) {
    /**
     * List of 2-20 items to show in this carousel. Required.
     * @type {Array<OptionItems>}
     */
    this.items = [];

    if (carousel) {
      if (Array.isArray(carousel)) {
        for (const item of carousel) {
          this.items.push(new OptionItem(item));
        }
      } else if (typeof carousel === 'object') {
        if (carousel.items) {
          for (const item of carousel.items) {
            this.items.push(new OptionItem(item));
          }
        }
      }
    }
  }

  /**
   * Adds a single item or list of items to the carousel.
   *
   * @param {OptionItem|Array<OptionItem>} optionItems OptionItems to add.
   * @return {Carousel} Returns current constructed Carousel.
   */
  addItems (optionItems) {
    if (!optionItems) {
      error('optionItems cannot be null');
      return this;
    }
    if (Array.isArray(optionItems)) {
      for (const item of optionItems) {
        this.items.push(item);
      }
    } else {
      this.items.push(optionItems);
    }
    if (this.items.length > Limits.CAROUSEL_ITEM_MAX) {
      this.items = this.items.slice(0, Limits.CAROUSEL_ITEM_MAX);
      warn(`Carousel can have no more than ${Limits.CAROUSEL_ITEM_MAX} items`);
    }
    return this;
  }

  /**
   * Sets the display options for the images in this carousel.
   * Use one of the image display constants. If none is chosen,
   * ImageDisplays.DEFAULT will be enforced.
   *
   * @param {string} option The option for displaying the image.
   * @return {Carousel} Returns current constructed Carousel.
   */
  setImageDisplay (option) {
    if (!ImageDisplays[option]) {
      return error(`Image display option ${option} is invalid`);
    }
    this.imageDisplayOptions = option;
    return this;
  }
}

/**
 * Class for initializing and constructing Option Items with chainable interface.
 */
class BrowseItem {
  /**
   * Constructor for BrowseItem. Accepts a title and URL for the Browse Item
   * card.
   *
   * @param {string=} title The title of the Browse Item card.
   * @param {string=} url The URL of the link opened by clicking the  Browse Item card.
   */
  constructor (title, url) {
    const { URL_TYPE_HINT_UNSPECIFIED } = this.urlTypeHints();

    /**
     * Title of the option item. Required.
     * @type {string}
     */
    this.title = '';

    /**
     * Description text of the item. Optional.
     * @type {string}
     */
    this.description = undefined;

    /**
     * Footer text of the item. Optional.
     * @type {string}
     */
    this.footer = undefined;

    /**
     * Image to show on item. Optional.
     * @type {Image}
     */
    this.image = undefined;

    /**
     * Url to that clicking the card opens. Optional.
     *
     * @type {Object}
     */
    this.openUrlAction = {
      url: undefined,
      urlTypeHint: URL_TYPE_HINT_UNSPECIFIED
    };

    if (title) {
      this.setTitle(title);
    }
    if (url) {
      this.setOpenUrlAction(url);
    }
  }

  /**
   * @return {Object} Returns the possible valid values for URL type hints
   */
  urlTypeHints () {
    return {
      URL_TYPE_HINT_UNSPECIFIED: 'URL_TYPE_HINT_UNSPECIFIED',
      AMP_CONTENT: 'AMP_CONTENT'
    };
  }

  /**
   * Sets the title for this Option Item.
   *
   * @param {string} title Title to show on item.
   * @return {OptionItem} Returns current constructed OptionItem.
   */
  setTitle (title) {
    if (!title) {
      error('title cannot be empty');
      return this;
    }
    this.title = title;
    return this;
  }

  /**
   * Sets the description for this Browse Item.
   *
   * @param {string} description Description to show on item.
   * @return {BrowseItem} Returns current constructed BrowseItem.
   */
  setDescription (description) {
    if (!description) {
      error('descriptions cannot be empty');
      return this;
    }
    this.description = description;
    return this;
  }

  /**
   * Sets the footer for this Browse Item.
   *
   * @param {string} footerText text to show on item.
   * @return {BrowseItem} Returns current constructed BrowseItem.
   */
  setFooter (footerText) {
    if (!footerText) {
      error('footer cannot be empty');
      return this;
    }
    this.footer = footerText;
    return this;
  }

  /**
   * Sets the image for this Browse Item.
   *
   * @param {string} url Image source URL.
   * @param {string} accessibilityText Text to replace for image for
   *     accessibility.
   * @param {number=} width Width of the image.
   * @param {number=} height Height of the image.
   * @return {BrowseItem} Returns current constructed BrowseItem.
   */
  setImage (url, accessibilityText, width, height) {
    if (!url) {
      error('url cannot be empty');
      return this;
    }
    if (!accessibilityText) {
      error('accessibilityText cannot be empty');
      return this;
    }
    this.image = { url, accessibilityText };
    if (width) {
      this.image.width = width;
    }
    if (height) {
      this.image.height = height;
    }
    return this;
  }

  /**
   * Sets the Open URL action - which includes the url and possibly the typeHint
   *
   * @param {string} url Image source URL.
   * @param {!string} urlTypeHint One of the typeHints enumerated by
   *    this.urlTypeHints()
   * @return {BrowseItem} Returns the current constructed BrowseItem
   */
  setOpenUrlAction (url, urlTypeHint) {
    this.setUrl(url);
    return urlTypeHint ? this.setUrlTypeHint(urlTypeHint) : this;
  }

  /**
   * Sets the URL target of the BrowseItem card
   *
   * @param {string} url Image source URL.
   * @return {BrowseItem} Returns the current constructed BrowseItem
   */
  setUrl (url) {
    if (!url) {
      error('url cannot be empty');
      return this;
    }
    this.openUrlAction.url = url;
    return this;
  }

  /**
   * Sets the URL type hint for the BrowseItem card
   *
   * @param {!string} urlTypeHint One of the typeHints enumerated by
   *    this.urlTypeHints()
   * @return {BrowseItem} Returns the current constructed BrowseItem
   */
  setUrlTypeHint (urlTypeHint) {
    const possibleValues = Object.values(this.urlTypeHints());
    const urlTypeHintIsInvalid = possibleValues.indexOf(urlTypeHint) === -1;
    if (urlTypeHintIsInvalid) {
      error('URL type hint must be valid');
      return this;
    }
    this.openUrlAction.urlTypeHint = urlTypeHint;
    return this;
  }
}

/**
 * Class for initializing and constructing Option Items with chainable interface.
 */
class OptionItem {
  /**
   * Constructor for OptionItem. Accepts optional OptionItem to clone.
   *
   * @param {OptionItem=} optionItem Optional OptionItem to clone.
   */
  constructor (optionItem) {
    /**
     * Option info of the option item. Required.
     * @type {OptionInfo}
     */
    this.optionInfo = {
      key: '',
      synonyms: []
    };

    /**
     * Title of the option item. Required.
     * @type {string}
     */
    this.title = '';

    /**
     * Description text of the item. Optional.
     * @type {string}
     */
    this.description = undefined;

    /**
     * Image to show on item. Optional.
     * @type {Image}
     */
    this.image = undefined;

    if (optionItem) {
      if (optionItem.optionInfo) {
        if (optionItem.optionInfo.key) {
          this.optionInfo.key = optionItem.optionInfo.key;
        }
        if (optionItem.optionInfo.synonyms) {
          this.optionInfo.synonyms = optionItem.optionInfo.synonyms;
        }
      }
      if (optionItem.title) {
        this.title = optionItem.title;
      }
      if (optionItem.description) {
        this.description = optionItem.description;
      }
      if (optionItem.image) {
        this.image = optionItem.image;
      }
    }
  }

  /**
   * Sets the title for this Option Item.
   *
   * @param {string} title Title to show on item.
   * @return {OptionItem} Returns current constructed OptionItem.
   */
  setTitle (title) {
    if (!title) {
      error('title cannot be empty');
      return this;
    }
    this.title = title;
    return this;
  }

  /**
   * Sets the description for this Option Item.
   *
   * @param {string} description Description to show on item.
   * @return {OptionItem} Returns current constructed OptionItem.
   */
  setDescription (description) {
    if (!description) {
      error('descriptions cannot be empty');
      return this;
    }
    this.description = description;
    return this;
  }

  /**
   * Sets the image for this Option Item.
   *
   * @param {string} url Image source URL.
   * @param {string} accessibilityText Text to replace for image for
   *     accessibility.
   * @param {number=} width Width of the image.
   * @param {number=} height Height of the image.
   * @return {OptionItem} Returns current constructed OptionItem.
   */
  setImage (url, accessibilityText, width, height) {
    if (!url) {
      error('url cannot be empty');
      return this;
    }
    if (!accessibilityText) {
      error('accessibilityText cannot be empty');
      return this;
    }
    this.image = { url: url, accessibilityText: accessibilityText };
    if (width) {
      this.image.width = width;
    }
    if (height) {
      this.image.height = height;
    }
    return this;
  }

  /**
   * Sets the key for the OptionInfo of this Option Item. This will be returned
   * as an argument in the resulting actions.intent.OPTION intent.
   *
   * @param {string} key Key to uniquely identify this item.
   * @return {OptionItem} Returns current constructed OptionItem.
   */
  setKey (key) {
    if (!key) {
      error('key cannot be empty');
      return this;
    }
    this.optionInfo.key = key;
    return this;
  }

  /**
   * Adds a single synonym or list of synonyms to item.
   *
   * @param {string|Array<string>} synonyms Either a single string synonyms
   *     or list of synonyms to add.
   * @return {OptionItem} Returns current constructed OptionItem.
   */
  addSynonyms (synonyms) {
    if (!synonyms) {
      error('Invalid synonyms');
      return this;
    }
    if (Array.isArray(synonyms)) {
      for (const synonym of synonyms) {
        this.optionInfo.synonyms.push(synonym);
      }
    } else {
      this.optionInfo.synonyms.push(synonyms);
    }
    return this;
  }
}

/**
 * Class for initializing and constructing MediaResponse with chainable interface.
 */
const MediaResponse = class {
  /**
   * Constructor for MediaResponse.
   * @param {MediaValues.Type=} mediaType Type of the media which defaults to MediaValues.Type.AUDIO
   */
  constructor (mediaType = MediaValues.Type.AUDIO) {
    /**
     * Array of MediaObject held in the MediaResponse.
     * @type {Array<MediaObject>}
     */
    this.mediaObjects = [];

    /**
     * Type of the media within this MediaResponse
     */
    this.mediaType = mediaType;
  }

  /**
   * Adds a single media file or list of media files to the cart.
   *
   * @param {MediaObject | Array<MediaObject>} items Single or Array of MediaObject to add.
   * @return {MediaResponse} Returns current constructed MediaResponse.
   */
  addMediaObjects (items) {
    if (!items) {
      error('items cannot be null');
      return this;
    }
    this.mediaObjects.push(...(Array.isArray(items) ? items : [items]));
    return this;
  }
};

/**
 * Class for initializing and constructing MediaObject with chainable interface.
 */
const MediaObject = class {
  /**
   * Constructor for MediaObject.
   *
   * @param {string} name Name of the MediaObject.
   * @param {string} contentUrl URL of the MediaObject.
   */
  constructor (name, contentUrl) {
    /**
     * Name of the MediaObject.
     * @type {string}
     */
    this.name = name;

    /**
     * MediaObject URL.
     * @type {string}
     */
    this.contentUrl = contentUrl;

    /**
     * Description of the MediaObject.
     * @type {string | undefined}
     */
    this.description = undefined;

    /**
     * Large image.
     * @type {Image | undefined}
     */
    this.largeImage = undefined;

    /**
     * Icon image.
     * @type {Image | undefined}
     */
    this.icon = undefined;
  }

  /**
   * Set the description of the item.
   *
   * @param {string} description Description of the item.
   * @return {MediaObject} Returns current constructed MediaObject.
   */
  setDescription (description) {
    if (!description) {
      error('description cannot be empty');
      return this;
    }
    this.description = description;
    return this;
  }

  /**
   * Sets the image for this item.
   *
   * @param {string} url Image source URL.
   * @param {MediaValues.ImageType} type Type of image (LARGE or ICON).
   * @return {MediaObject} Returns current constructed MediaObject.
   */
  setImage (url, type) {
    if (!url) {
      error('url cannot be empty');
      return this;
    }
    if (!type) {
      error('type cannot be empty');
      return this;
    }
    if (type === MediaValues.ImageType.ICON) {
      this.icon = { url };
      this.largeImage = undefined;
    } else if (type === MediaValues.ImageType.LARGE) {
      this.largeImage = { url };
      this.icon = undefined;
    } else {
      error('Invalid type');
      return this;
    }
    return this;
  }
};

/**
 * Check if given text contains SSML.
 *
 * @param {string} text Text to check.
 * @return {boolean} True if text contains SSML, false otherwise.
 */
const isSsml = text => /^<speak\b[^>]*>([^]*?)<\/speak>$/gi.test(text);

/**
 * Check if given text contains SSML, allowing for whitespace padding.
 *
 * @param {string} text Text to check.
 * @return {boolean} True if text contains possibly whitespace padded SSML,
 *     false otherwise.
 */
const isPaddedSsml = text => /^\s*<speak\b[^>]*>([^]*?)<\/speak>\s*$/gi.test(text);

module.exports = {
  RichResponse,
  BasicCard,
  List,
  Carousel,
  BrowseCarousel,
  BrowseItem,
  OptionItem,
  isSsml,
  isPaddedSsml,
  ImageDisplays,
  Limits,
  MediaValues,
  MediaResponse,
  MediaObject
};
