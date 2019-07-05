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

import * as Debug from 'debug'

 /** @public */
export interface Logger {
  // tslint:disable-next-line:no-any automatically detect any inputs
  debug(message?: any, ...optionalParams: any[]): void
  // tslint:disable-next-line:no-any automatically detect any inputs
  warn(message?: any, ...optionalParams: any[]): void
  // tslint:disable-next-line:no-any automatically detect any inputs
  info(message?: any, ...optionalParams: any[]): void
  // tslint:disable-next-line:no-any automatically detect any inputs
  error(message?: any, ...optionalParams: any[]): void
  deprecate(feature: string, alternative: string): void
}

/** @hidden */
class DefaultLogger implements Logger {
  private logName = 'actions-on-google'
  private debug_ = Debug(`${this.logName}:debug`)
  private warn_ = Debug(`${this.logName}:warn`)
  // tslint:disable-next-line:no-console Allow console binding
  private error_ = console.error.bind(console) as typeof console.error
  // tslint:disable-next-line:no-console Allow console binding
  private info_ = console.log.bind(console) as typeof console.log

  constructor() {
    this.warn_.log = this.error_
    this.debug_.log = this.info_
  }

  // tslint:disable-next-line:no-any automatically detect any inputs
  debug(message?: any, ...optionalParams: any[]): void {
    this.debug_(message, ...(optionalParams.map(p => JSON.stringify(p, null, 2))))
  }

  // tslint:disable-next-line:no-any automatically detect any inputs
  warn(message?: any, ...optionalParams: any[]): void {
    this.warn_(message, ...optionalParams)
  }

  // tslint:disable-next-line:no-any automatically detect any inputs
  info(message?: any, ...optionalParams: any[]): void {
    this.info_(message, ...(optionalParams.map(p => JSON.stringify(p, null, 2))))
  }

  // tslint:disable-next-line:no-any automatically detect any inputs
  error(message?: any, ...optionalParams: any[]): void {
    this.error_(message, ...optionalParams)
  }

  deprecate(feature: string, alternative: string): void {
    this.info_(`${feature} is *DEPRECATED*: ${alternative}`)
  }
}

class LoggingProxy {
  private logger: Logger

  constructor() {
    this.logger = new DefaultLogger()
  }

  set customLogger(customLogger: Logger) {
    this.logger = customLogger
  }

  // tslint:disable-next-line:no-any automatically detect any inputs
  debug(message?: any, ...optionalParams: any[]): void {
    this.logger.debug(message, ...optionalParams)
  }

  // tslint:disable-next-line:no-any automatically detect any inputs
  warn(message?: any, ...optionalParams: any[]): void {
    this.logger.warn(message, ...optionalParams)
  }

  // tslint:disable-next-line:no-any automatically detect any inputs
  info(message?: any, ...optionalParams: any[]): void {
    this.logger.info(message, ...optionalParams)
  }

  // tslint:disable-next-line:no-any automatically detect any inputs
  error(message?: any, ...optionalParams: any[]): void {
    this.logger.error(message, ...optionalParams)
  }

  deprecate(feature: string, alternative: string): void {
    this.logger.deprecate(feature, alternative)
  }
}

export const logger = new LoggingProxy()
