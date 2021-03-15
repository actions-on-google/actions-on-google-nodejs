# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.14.0]
### Added
- Add CHANGELOG.md

### Changed
- Deprecate SmartHomeApp homegraph wrapper methods: use [Google APIs Node.js
  Client for Home Graph](https://www.npmjs.com/package/@googleapis/homegraph).

## [2.13.0] - 2020-08-26
### Added
- Add conv.canvas.state feature
- Add express-serve-static-core dependency
- Add test script for CI, update `test:ci`

## [2.12.0] - 2019-08-16
Bump version to MINOR release 2.12.0

### Added
- Add support for order reservations

## [2.11.0] - 2019-08-07
Bump version to MINOR release 2.11.0

### Added
- Add support for ordersv3

## [2.10.0] - 2019-08-01
Bump version to MINOR release 2.10.0

### Fixed
- Fix typedoc outline
- Pin typedoc dependency to allow for build

### Added
- Add support for HtmlResponse

## [2.9.1] - 2019-07-19
### Fixed
- Fix googleapis dependency vulnerabilities

## [2.9.0] - 2019-07-15
### Added
- Add support for DigitalPurchaseCheck

## [2.8.0] - 2019-06-27
### Added
- Add support for user verification
- Add surface capability shortcut
- Add otherDeviceIds to smart home sync response

## [2.7.1] - 2019-06-06
### Fixed
- Fix dependency vulnerabilities

## [2.7.0] - 2019-05-07
### Added
- Add support for Developer Preview features under a new preview tag
- Add roomHint property to smart home response
- Adds types for 2FA in smart home request/responses

### Fixed
- Fix conv.data not set when init.data has changed issue
- Fix package.json to correct Node version >=6.13.0
- Add warning for using DeepLink

### Changed
- Update dependencies for security
- Change library development tooling

## [2.6.0] - 2019-02-20
### Added
- Add ability to respond with an HTTP 401 Status Code
- Add support for other lambda formats
- Add more error handling for report state

### Fixed
- Fix unhandled exception in jwtClient.authorize

### Changed
- Upgrade to TypeScript 3
- Add package security audit to CI process
- Change typedoc theme
- Add source code links for Typedoc config
- Selectively install yarn version 1.13.0 for travis
- Upgrade ava and nyc to resolve yarn audit vulnerabilities

## [2.5.0] - 2018-11-16
### Added
- Add support for speech biasing

### Changed
- Make Smart Home execution response states a map of any type
- Fix conversationToken resetting for Actions SDK
- Make simple response detection more precise
- Hide conversation module from reference doc table of contents

## [2.4.1] - 2018-10-05
- Only set conv.data and user storage when changed
- Add TypeScript autocomplete for default Dialogflow intents
- Fix jsdoc for BrowseCarousel url
- Make simulator detection more strict
- Add a better error message when a simple response is required
- Fix simulator response for Dialogflow v1

## [2.4.0] - 2018-10-03
### Added
- Add support for conv.followup persisting context information (like conv.data)
- Add support for CompletePurchase to perform [Digital Transactions](https://developers.google.com/actions/transactions/digital/dev-guide-digital)
- Attempt to send helpful text when request is from Dialogflow simulator

### Changed
- Refactor Question classes to Helper
- Fix agentUserId to make it optional
- Add more informative error when intent is empty
- Change requestSync to prefer a jwt

## [2.3.0] - 2018-08-03
### Added
- Add support for static reprompts
- Add new DISCONNECT intent for Smart Home

### Changed
- Change express snippet to use multiple routes
- Fix deeplink Dialogflow snippet typo
- Add eofline rule to tslint
- Regenerate GoogleActionsV2OrdersReceipt
- Add @hidden to _middlewares
- Add typedoc.json to npm ignore

## [2.2.0] - 2018-06-21
- Add support for async middleware
- Add parameter to middleware to expose extra framework data
- Verify JWT is generated before sending report state
- Add headers parameter to smart home service handler
- Remove options check in API call methods

## [2.1.3] - 2018-05-31
- Add deprecation notice for conv.user.id

## [2.1.2] - 2018-05-21
- Add error handling for common.stringify

## [2.1.1] - 2018-05-10
- Fix to make v2 the default version if version is not specified

## [2.1.0] - 2018-05-08
- Various fixes and improvements for reference documentation
- Convert lambda header keys to lowercase
- Consolidate common conversation types
- Add intent array matching
- Add screen surface capability shortcut
- Add ability to send back headers
- Add clearer examples for GitHub readme
- Regenerate transaction types to support new transaction features
- Add ROUTINES to GoogleActionsV2TriggerContextTimeContextFrequency
- Add deprecated fields previously not generated
- Add support for profile retrieval
- Add support for Table card response type
- Add service for Smart Home
- Add clearer examples for GitHub readme

## [1.11.0] - 2018-05-08
Last feature release for v1.

- Add support for followup events
- Fix type annotation bugs
- Change No userStorage Found to debug message
- Remove en_- locale warning from askForSignIn
- Fix MEDIA_STATUS enum being incorrect

## [2.0.1] - 2018-05-08
- Exclude npm packed extracted contents from npm publish

## [2.0.0] - 2018-05-08

### Changed
#### From Major Version 1
- Rewrote to use TypeScript with main API intended for JavaScript
- Separate `app` instance to a cross conversational `app` instance and a per conversation `conv` instance
- Redesign objects to use an API backbone from protobufs that define the Conversation API
- Redesign API to be overloaded and sent through `conv.ask` so that it can build the response for the developer incrementally
- Redesign API to use more idiomatic JavaScript
- Create frameworks system to support different platforms seamlessly
- Create clear separations of services so APIs are distinctly separate
- Add new modular architecture that allows plugins to extend functionality
- Drop support for Actions SDK v1 and various legacy features
#### From Alpha
- Remove plugins and utils from library repo
- Various bug fixes
- Add support for all features from v1 besides legacy features
- Clean up arguments and create separate status parsing out
- Add ability to send raw JSON
- Add fallback handler
- Add status and error customization for Dialogflow verification
- Add support for Dialogflow followup events

## [1.10.0] - 2018-03-09
- Adds support for Package Entitlements
- Add support for media response
- Adds WEB_BROWSER surface capability
- Add BrowseCarousel to the client library
- Issues a warning instead of an error in carousel and lists

## [1.9.0] - 2018-02-26
- Add support for askToDeepLink
- Add askForPlace
- Add error message for Dialogflow v2 webhook requests
- Adds a call to action to debug intent error
- Handles error if userStorage is invalid JSON
- Adds console binding for debug logs
- Add imageDisplayOptions to Carousel
- Escalates deprecation logs to warnings
- Removes unnecessary semicolons

## [1.8.2] - 2018-02-05
- Correct token verification for google-auth-library
- Adds package version logging


## [1.8.1] - 2018-01-31
- Fix argument values of reprompts

## [1.8.0] - 2018-01-26
- Update dependency google-auth-library
- Add a JSON output script for coverage
- Update error output type for ImageDisplayOption
- Adds DIRECT tokenization type
- Add object-curly-spacing eslint rule
- Updates description of CROPPED image display option
- Run CI on node version 6 and 8

## [1.7.0] - 2017-12-28
-  Fix handleRequestAsync jsdoc example
- Add notice to askFor that works only for en_- locales.
- Allow whitespace padding in SSML input
- Add tests for app.data behavior
- Add notice that Dialogflow v2 is not supported
-  Add tests for app.data behavior
- Standardize class declaration syntax
- Set Dialogflow speech for SSML in SimpleResponse
- Add @private to getArgumentCommon
- Add max-len 100 eslint rule
- Expose ImageDisplay enum on AssistantApp instances
- Add no-magic-numbers eslint rule
- Move Enums to prototype of AssisstantApp
- Add stricter eslint autofix rules
- Add @private type annotation to ANY_TYPE_PROPERTY_
- Add note about Brand Verification
- Adds description for ImageDisplays enum
- Fixes typo in example for askForSignIn

## [1.6.1] - 2017-11-21
- Adds custom transaction token type
- Adds JSDoc for ImageDisplayOptions

## [1.6.0] - 2017-11-15
- Add support for Updates API
- Add support for imageDisplayOption in BasicCard
- Add support for userStorage and lastSeen
- Add handleRequestAsync for Promise support
- Bug fixes for transactions
- Updates transaction enums to match documentation
- Rename isRequestFromAssistant to isRequestFromGoogle

## [1.5.1] - 2017-10-13
- Fix buildLineItem parameters mixup
- Fix isRequestFromAssistant JSDoc return description
- Add linting rules for JSDoc and fix existing violations

## [1.5.0] - 2017-10-10
- Rename API.AI to Dialogflow

## [1.4.0] - 2017-10-04
- No input prompts sent with rich responses
- Add support for new NO_INPUT and CANCEL intents
- Add support for NEW_SURFACE intent

## [1.3.1] - 2017-09-20
- Bug fix for sublines in transactions
- Small JSDoc fixes

## [1.3.0] - 2017-09-08
- Adds signature verification

## [1.2.1] - 2017-08-15
- Refactored the Assistant App base class
- Refactored getter methods and error handling, adding better logs
- "Data extraction" now happens in the classes' constructor, not requiring a call to "handleRequest" anymore
- Updates to the JSDocs
- Added validation to suggestion chips
- REGION_NOT_SUPPORTED now has the correct string value

## [1.2.0] - 2017-07-19

[Unreleased]: https://github.com/actions-on-google/actions-on-google-nodejs/compare/v2.14.0...HEAD
[2.14.0]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/2.13.0...v2.14.0
[2.13.0]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/2.12.0...v2.13.0
[2.12.0]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/2.11.0...v2.12.0
[2.11.0]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/2.10.0...v2.11.0
[2.10.0]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/2.9.1...v2.10.0
[2.9.1]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/2.9.0...v2.9.1
[2.9.0]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/2.8.0...v2.9.0
[2.8.0]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/2.7.1...v2.8.0
[2.7.1]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/2.7.0...v2.7.1
[2.7.0]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/2.6.0...v2.7.0
[2.6.0]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/2.5.0...v2.6.0
[2.5.0]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/2.4.1...v2.5.0
[2.4.1]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/2.4.0...v2.4.1
[2.4.0]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/2.3.0...v2.4.0
[2.3.0]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/2.2.0...v2.3.0
[2.2.0]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/2.1.3...v2.2.0
[2.1.3]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/2.1.2...v2.1.3
[2.1.2]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/2.1.1...v2.1.2
[2.1.1]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/2.1.0...v2.1.1
[2.1.0]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/1.11.0...v2.1.0
[1.11.0]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/2.0.1...v1.11.0
[2.0.1]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/2.0.0...v2.0.1
[2.0.0]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/1.10.0...v2.0.0
[1.10.0]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/1.9.0...1.10.0
[1.9.0]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/1.8.2...v1.9.0
[1.8.2]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/1.8.1...v1.8.2
[1.8.1]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/1.8.0...v1.8.1
[1.8.0]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/1.7.0...v1.8.0
[1.7.0]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/1.6.1...v1.7.0
[1.6.1]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/1.6.0...v1.6.1
[1.6.0]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/1.5.1...v1.6.0
[1.5.1]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/1.5.0...v1.5.1
[1.5.0]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/1.4.0...v1.5.0
[1.4.0]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/1.3.1...v1.4.0
[1.3.1]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/1.3.0...v1.3.1
[1.3.0]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/1.2.1...v1.3.0
[1.2.1]: https://github.com/actions-on-google/assistant-conversation-nodejs/compare/1.2.0...v1.2.1
[1.2.0]: https://github.com/actions-on-google/assistant-conversation-nodejs/tag/v1.2.0
