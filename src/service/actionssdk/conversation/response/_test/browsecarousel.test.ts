/**
 * Copyright 2020 Google Inc. All Rights Reserved.
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

import test from 'ava';

import {BrowseCarouselItem} from '..';

test('browse carousel handle URL in constructor', t => {
  const simpleBrowseCarousel = new BrowseCarouselItem({
    title: 'Title',
    url: 'https://example.com',
  });

  t.deepEqual(simpleBrowseCarousel.openUrlAction, {
    url: 'https://example.com',
  });

  const ampBrowseCarousel = new BrowseCarouselItem({
    title: 'Title',
    openUrlAction: {
      url: 'https://example.com',
      urlTypeHint: 'AMP_CONTENT',
    },
  });

  t.deepEqual(ampBrowseCarousel.openUrlAction, {
    url: 'https://example.com',
    urlTypeHint: 'AMP_CONTENT',
  });
});
