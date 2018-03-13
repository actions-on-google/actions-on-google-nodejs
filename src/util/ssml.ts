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

declare global {
  namespace JSX {
    type Element = string
    interface SpeakElement {
    }
    interface BreakElement {
      time?: string
      strength?: 'x-weak' | 'weak' | 'medium' | 'strong' | 'x-strong' | 'none'
    }
    interface SayAsElement {
      'interpret-as':
        'cardinal' |
        'ordinal' |
        'characters' |
        'fraction' |
        'expletive' |
        'bleep' |
        'unit' |
        'verbatim' |
        'spell-out' |
        'date' |
        'time' |
        'telephone'
      format?: string
      detail?: string
    }
    interface AudioElement {
      src: string
      clipBegin?: string
      clipEnd?: string
      speed?: string
      repeatCount?: number
      repeatDur?: string
      soundLevel?: string
    }
    interface DescElement {
    }
    interface PElement {
    }
    interface SElement {
    }
    interface SubElement {
      alias: string
    }
    interface ProsodyElement {
      rate?: 'x-slow' | 'slow' | 'medium' | 'fast' | 'x-fast' | 'default'
      volume?: 'silent' | 'x-soft' | 'soft' | 'medium' | 'loud' | 'x-loud' | 'default'
      pitch?: 'x-low' | 'low' | 'medium' | 'high' | 'x-high' | 'default' | string
    }
    interface EmphasisElement {
      level?: 'strong' | 'moderate' | 'none' | 'reduced'
    }
    interface ParElement {
    }
    interface SeqElement {
    }
    interface MediaElement {
      xmlId?: string
      begin?: string
      end?: string
      repeatCount?: number
      repeatDur?: string
      soundLevel?: string
      fadeInDur?: string
      fadeOutDur?: string
    }
    interface IntrinsicElements {
      speak: SpeakElement
      break: BreakElement
      'say-as': SayAsElement
      audio: AudioElement
      desc: DescElement
      p: PElement
      s: SElement
      sub: SubElement
      prosody: ProsodyElement
      emphasis: EmphasisElement
      par: ParElement
      seq: SeqElement
      media: MediaElement
    }
  }
}

export interface Props {
  [key: string]: string | number
}

interface Aliases {
  [key: string]: string
}

const aliases: Aliases = {
  xmlId: 'xml:id',
}

const sanitize = (value: string) =>
  value.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const expand = (props: Props) =>
  Object.keys(props).map(key => `${aliases[key] || key}="${
    sanitize(props[key].toString())
  }"`).join(' ')

const create = (tag: string, props: Props | null, ...children: string[]) => {
  const expanded = props ? expand(props) : ''
  return children.length ?
    `<${tag}${expanded.length ? ` ${expanded}` : expanded}>${children.join('')}</${tag}>` :
    `<${tag}${expanded.length ? ` ${expanded}` : expanded}/>`
}

/**
 * Sanitize template literal inputs by escaping characters into XML entities to use in SSML
 * Also normalize the extra spacing for better text rendering in SSML
 * A [tag function](https://goo.gl/asZ8DK) used by ES6 tagged template literals
 *
 * @example
 * const equation = '"1 + 1 > 1"';
 * const response = ssml`
 *   <speak>
 *     ${equation}
 *   </speak>
 * `;
 * // Equivalent to ssml`\n  <speak>\n    ${equation}\n  </speak>\n`
 * console.log(response);
 * // Prints: '<speak>&quot;1 + 1 &gt; 1&quot;</speak>'
 *
 * @param {TemplateStringsArray} template Non sanitized constant strings in the template literal
 * @param {Array<string>} inputs Computed expressions to be sanitized surrounded by ${}
 */
const tag = (template: TemplateStringsArray, ...inputs: string[]) =>
  template.reduce((out, str, i) => i ? out + sanitize(inputs[i - 1]) + str : str,
).trim().replace(/\s+/g, ' ').replace(/ </g, '<').replace(/> /g, '>')

export const ssml = Object.assign(tag, { create })
