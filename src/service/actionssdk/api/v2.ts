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

// DO NOT MANUALLY EDIT: this file contains types generated from protobuf messages

/* tslint:disable:no-any max-line-length auto generated from protobufs */

import { ApiClientObjectMap } from '../../../common'


export type GoogleActionsV2ConversationType = 'TYPE_UNSPECIFIED' | 'NEW' | 'ACTIVE'


export type GoogleActionsV2DeliveryAddressValueUserDecision = 'UNKNOWN_USER_DECISION' | 'ACCEPTED' | 'REJECTED'


export type GoogleActionsV2EntitlementSkuType = 'TYPE_UNSPECIFIED' | 'IN_APP' | 'SUBSCRIPTION' | 'APP'


export type GoogleActionsV2MediaResponseMediaType = 'MEDIA_TYPE_UNSPECIFIED' | 'AUDIO'


export type GoogleActionsV2MediaStatusStatus = 'STATUS_UNSPECIFIED' | 'FINISHED'


export type GoogleActionsV2NewSurfaceValueStatus = 'NEW_SURFACE_STATUS_UNSPECIFIED' | 'CANCELLED' | 'OK'


export type GoogleActionsV2OrdersActionProvidedPaymentOptionsPaymentType = 'PAYMENT_TYPE_UNSPECIFIED' | 'PAYMENT_CARD' | 'BANK' | 'LOYALTY_PROGRAM' | 'ON_FULFILLMENT' | 'GIFT_CARD'


export type GoogleActionsV2OrdersCustomerInfoOptionsCustomerInfoProperties = 'CUSTOMER_INFO_PROPERTY_UNSPECIFIED' | 'EMAIL'


export type GoogleActionsV2OrdersGoogleProvidedPaymentOptionsSupportedCardNetworks = 'UNSPECIFIED_CARD_NETWORK' | 'AMEX' | 'DISCOVER' | 'MASTERCARD' | 'VISA' | 'JCB'


export type GoogleActionsV2OrdersLineItemType = 'UNSPECIFIED' | 'REGULAR' | 'TAX' | 'DISCOUNT' | 'GRATUITY' | 'DELIVERY' | 'SUBTOTAL' | 'FEE'


export type GoogleActionsV2OrdersOrderLocationType = 'UNKNOWN' | 'DELIVERY' | 'BUSINESS' | 'ORIGIN' | 'DESTINATION' | 'PICK_UP'


export type GoogleActionsV2OrdersOrderUpdateActionType = 'UNKNOWN' | 'VIEW_DETAILS' | 'MODIFY' | 'CANCEL' | 'RETURN' | 'EXCHANGE' | 'EMAIL' | 'CALL' | 'REORDER' | 'REVIEW' | 'CUSTOMER_SERVICE' | 'FIX_ISSUE'


export type GoogleActionsV2OrdersPaymentInfoPaymentType = 'PAYMENT_TYPE_UNSPECIFIED' | 'PAYMENT_CARD' | 'BANK' | 'LOYALTY_PROGRAM' | 'ON_FULFILLMENT' | 'GIFT_CARD'


export type GoogleActionsV2OrdersPaymentMethodTokenizationParametersTokenizationType = 'UNSPECIFIED_TOKENIZATION_TYPE' | 'PAYMENT_GATEWAY' | 'DIRECT'


export type GoogleActionsV2OrdersPriceType = 'UNKNOWN' | 'ESTIMATE' | 'ACTUAL'


export type GoogleActionsV2OrdersRejectionInfoType = 'UNKNOWN' | 'PAYMENT_DECLINED' | 'INELIGIBLE' | 'PROMO_NOT_APPLICABLE' | 'UNAVAILABLE_SLOT'


export type GoogleActionsV2OrdersTimeType = 'UNKNOWN' | 'DELIVERY_DATE' | 'ETA' | 'RESERVATION_SLOT'


export type GoogleActionsV2PermissionValueSpecPermissions = 'UNSPECIFIED_PERMISSION' | 'NAME' | 'DEVICE_PRECISE_LOCATION' | 'DEVICE_COARSE_LOCATION' | 'UPDATE'


export type GoogleActionsV2RawInputInputType = 'UNSPECIFIED_INPUT_TYPE' | 'TOUCH' | 'VOICE' | 'KEYBOARD'


export type GoogleActionsV2RegisterUpdateValueStatus = 'REGISTER_UPDATE_STATUS_UNSPECIFIED' | 'OK' | 'CANCELLED'


export type GoogleActionsV2SignInValueStatus = 'SIGN_IN_STATUS_UNSPECIFIED' | 'OK' | 'CANCELLED' | 'ERROR'


export type GoogleActionsV2TransactionDecisionValueUserDecision = 'UNKNOWN_USER_DECISION' | 'ORDER_ACCEPTED' | 'ORDER_REJECTED' | 'DELIVERY_ADDRESS_UPDATED' | 'CART_CHANGE_REQUESTED'


export type GoogleActionsV2TransactionRequirementsCheckResultResultType = 'RESULT_TYPE_UNSPECIFIED' | 'OK' | 'USER_ACTION_REQUIRED' | 'ASSISTANT_SURFACE_NOT_SUPPORTED' | 'REGION_NOT_SUPPORTED'


export type GoogleActionsV2TriggerContextTimeContextFrequency = 'FREQUENCY_UNSPECIFIED' | 'DAILY' | 'ROUTINES'


export type GoogleActionsV2UiElementsBasicCardImageDisplayOptions = 'DEFAULT' | 'WHITE' | 'CROPPED'


export type GoogleActionsV2UiElementsCarouselBrowseImageDisplayOptions = 'DEFAULT' | 'WHITE' | 'CROPPED'


export type GoogleActionsV2UiElementsCarouselSelectImageDisplayOptions = 'DEFAULT' | 'WHITE' | 'CROPPED'


export type GoogleActionsV2UiElementsOpenUrlActionUrlTypeHint = 'URL_TYPE_HINT_UNSPECIFIED' | 'AMP_CONTENT'


export type GoogleActionsV2UiElementsTableCardColumnPropertiesHorizontalAlignment = 'LEADING' | 'CENTER' | 'TRAILING'


export type GoogleActionsV2UserPermissions = 'UNSPECIFIED_PERMISSION' | 'NAME' | 'DEVICE_PRECISE_LOCATION' | 'DEVICE_COARSE_LOCATION' | 'UPDATE'



export interface GoogleActionsV2AppRequest {
  /**
   * Surfaces available for cross surface handoff.
   */
  availableSurfaces?: GoogleActionsV2Surface[]
  /**
   * Holds session data like the conversation ID and conversation token.
   */
  conversation?: GoogleActionsV2Conversation
  /**
   * Information about the device the user is using to interact with the app.
   */
  device?: GoogleActionsV2Device
  /**
   * List of inputs corresponding to the expected inputs specified by the app.
   * For the initial conversation trigger, the input contains information on
   * how the user triggered the conversation.
   */
  inputs?: GoogleActionsV2Input[]
  /**
   * Indicates whether the request should be handled in sandbox mode.
   */
  isInSandbox?: boolean
  /**
   * Information about the surface the user is interacting with, e.g. whether it
   * can output audio or has a screen.
   */
  surface?: GoogleActionsV2Surface
  /**
   * User who initiated the conversation.
   */
  user?: GoogleActionsV2User
}

export interface GoogleActionsV2AppResponse {
  /**
   * An opaque token that is recirculated to the app every conversation
   * turn.
   */
  conversationToken?: string
  /**
   * Custom Push Message allows developers to send structured data to Google
   * for interactions on the Assistant.
   */
  customPushMessage?: GoogleActionsV2CustomPushMessage
  /**
   * Indicates whether the app is expecting a user response. This is true when
   * the conversation is ongoing, false when the conversation is done.
   */
  expectUserResponse?: boolean
  /**
   * List of inputs the app expects, each input can be a built-in intent, or an
   * input taking list of possible intents. Only one input is supported for now.
   */
  expectedInputs?: GoogleActionsV2ExpectedInput[]
  /**
   * Final response when the app does not expect user's input.
   */
  finalResponse?: GoogleActionsV2FinalResponse
  /**
   * Indicates whether the response should be handled in sandbox mode. This
   * bit is needed to push structured data to Google in sandbox mode.
   */
  isInSandbox?: boolean
  /**
   * Whether to clear the persisted user_storage. If set to true, then in the
   * next interaction with the user, the user_storage field will be empty.
   */
  resetUserStorage?: boolean
  /**
   * An opaque token controlled by the application that is persisted across
   * conversations for a particular user. If empty or unspecified, the
   * existing persisted token will be unchanged.
   * The maximum size of the string is 10k bytes.
   * If multiple dialogs are occurring concurrently for the same user, then
   * updates to this token can overwrite each other unexpectedly.
   */
  userStorage?: string
}

export interface GoogleActionsV2Argument {
  /**
   * Specified when query pattern includes a `$org.schema.type.YesNo` type or
   * expected input has a built-in intent: `actions.intent.CONFIRMATION`.
   * NOTE: if the boolean value is missing, it represents `false`.
   */
  boolValue?: boolean
  /**
   * Specified for the built-in intent: `actions.intent.DATETIME`.
   */
  datetimeValue?: GoogleActionsV2DateTime
  /**
   * Extension whose type depends on the argument.
   * For example, if the argument name is `SIGN_IN` for the
   * `actions.intent.SIGN_IN` intent, then this extension will
   * contain a SignInValue value.
   */
  extension?: ApiClientObjectMap<any>
  /**
   * Specified for built-in intent: \"actions.intent.NUMBER\"
   */
  floatValue?: number
  /**
   * Specified when query pattern includes a $org.schema.type.Number type or
   * expected input has a built-in intent: \"assistant.intent.action.NUMBER\".
   */
  intValue?: string
  /**
   * Name of the argument being provided for the input.
   */
  name?: string
  /**
   * Specified when query pattern includes a $org.schema.type.Location type or
   * expected input has a built-in intent: \"actions.intent.PLACE\".
   */
  placeValue?: GoogleActionsV2Location
  /**
   * The raw text, typed or spoken, that provided the value for the argument.
   */
  rawText?: string
  /**
   * Specified when an error was encountered while computing the argument. For
   * example, the built-in intent \"actions.intent.PLACE\" can return an error
   * status if the user denied the permission to access their device location.
   */
  status?: GoogleRpcStatus
  /**
   * Specified when Google needs to pass data value in JSON format.
   */
  structuredValue?: ApiClientObjectMap<any>
  /**
   * Specified when query pattern includes a `$org.schema.type.Text` type or
   * expected input has a built-in intent: `actions.intent.TEXT`, or
   * `actions.intent.OPTION`. Note that for the `OPTION` intent, we set the
   * `text_value` as option key, the `raw_text` above will indicate the raw
   * span in user's query.
   */
  textValue?: string
}

export interface GoogleActionsV2Capability {
  /**
   * The name of the capability, e.g. `actions.capability.AUDIO_OUTPUT`
   */
  name?: string
}

export interface GoogleActionsV2ConfirmationValueSpec {
  /**
   * Configures dialog that asks for confirmation.
   */
  dialogSpec?: GoogleActionsV2ConfirmationValueSpecConfirmationDialogSpec
}

export interface GoogleActionsV2ConfirmationValueSpecConfirmationDialogSpec {
  /**
   * This is the question asked by confirmation sub-dialog. For example \"Are
   * you sure about that?\"
   */
  requestConfirmationText?: string
}

export interface GoogleActionsV2Conversation {
  /**
   * Unique ID for the multi-turn conversation. It's assigned for the first
   * turn. After that it remains the same for subsequent conversation turns
   * until the conversation is terminated.
   */
  conversationId?: string
  /**
   * Opaque token specified by the app in the last conversation turn. It can
   * be used by an app to track the conversation or to store conversation
   * related data.
   */
  conversationToken?: string
  /**
   * Type indicates the state of the conversation in its life cycle.
   */
  type?: GoogleActionsV2ConversationType
}

export interface GoogleActionsV2CustomPushMessage {
  /**
   * An order update updating orders placed through transaction APIs.
   */
  orderUpdate?: GoogleActionsV2OrdersOrderUpdate
  /**
   * The specified target for the push request.
   */
  target?: GoogleActionsV2CustomPushMessageTarget
  /**
   * If specified, displays a notification to the user with specified title
   * and text.
   */
  userNotification?: GoogleActionsV2UserNotification
}

export interface GoogleActionsV2CustomPushMessageTarget {
  /**
   * The argument to target for an intent. For V1, only one Argument is
   * supported.
   */
  argument?: GoogleActionsV2Argument
  /**
   * The intent to target.
   */
  intent?: string
  /**
   * The locale to target. Follows IETF BCP-47 language code.
   * Can be used by a multi-lingual app to target a user on a specified
   * localized app. If not specified, it will default to en-US.
   */
  locale?: string
  /**
   * The user to target.
   */
  userId?: string
}

export interface GoogleActionsV2DateTime {
  /**
   * Date value
   */
  date?: GoogleTypeDate
  /**
   * Time value
   */
  time?: GoogleTypeTimeOfDay
}

export interface GoogleActionsV2DateTimeValueSpec {
  /**
   * Control datetime prompts.
   */
  dialogSpec?: GoogleActionsV2DateTimeValueSpecDateTimeDialogSpec
}

export interface GoogleActionsV2DateTimeValueSpecDateTimeDialogSpec {
  /**
   * This is used to create prompt to ask for date only.
   * For example: What date are you looking for?
   */
  requestDateText?: string
  /**
   * This is used to create initial prompt by datetime sub-dialog.
   * Example question: \"What date and time do you want?\"
   */
  requestDatetimeText?: string
  /**
   * This is used to create prompt to ask for time only.
   * For example: What time?
   */
  requestTimeText?: string
}

export interface GoogleActionsV2DeliveryAddressValue {
  /**
   * Contains delivery address only when user agrees to share the delivery
   * address.
   */
  location?: GoogleActionsV2Location
  /**
   * User's decision regarding the request.
   */
  userDecision?: GoogleActionsV2DeliveryAddressValueUserDecision
}

export interface GoogleActionsV2DeliveryAddressValueSpec {
  /**
   * Configuration for delivery address dialog.
   */
  addressOptions?: GoogleActionsV2DeliveryAddressValueSpecAddressOptions
}

export interface GoogleActionsV2DeliveryAddressValueSpecAddressOptions {
  /**
   * App can optionally pass a short text giving user a hint why delivery
   * address is requested. For example, \"Grubhub is asking your address for
   * [determining the service area].\", the text in `[]` is the custom TTS
   * that should be populated here.
   */
  reason?: string
}

export interface GoogleActionsV2Device {
  /**
   * Represents actual device location such as lat, lng, and formatted address.
   * Requires the
   * DEVICE_COARSE_LOCATION
   * or
   * DEVICE_PRECISE_LOCATION
   * permission.
   */
  location?: GoogleActionsV2Location
}

export interface GoogleActionsV2DevicesAndroidApp {
  /**
   * Package name
   * Package name must be specified when specifing Android Fulfillment.
   */
  packageName?: string
  /**
   * When multiple filters are specified, any filter match will trigger the app.
   */
  versions?: GoogleActionsV2DevicesAndroidAppVersionFilter[]
}

export interface GoogleActionsV2DevicesAndroidAppVersionFilter {
  /**
   * Max version code, inclusive.
   * The range considered is [min_version:max_version].
   * A null range implies any version.
   * Examples:
   * To specify a single version use: [target_version:target_version].
   * To specify any version leave min_version and max_version unspecified.
   * To specify all versions until max_version, leave min_version unspecified.
   * To specify all versions from min_version, leave max_version unspecified.
   */
  maxVersion?: number
  /**
   * Min version code or 0, inclusive.
   */
  minVersion?: number
}

export interface GoogleActionsV2DialogSpec {
  /**
   * Holds helper specific dialog specs if any. For example:
   * ConfirmationDialogSpec for confirmation helper.
   */
  extension?: ApiClientObjectMap<any>
}

export interface GoogleActionsV2Entitlement {
  /**
   * Only present for in-app purchase and in-app subs.
   */
  inAppDetails?: GoogleActionsV2SignedData
  /**
   * Product sku. Package name for paid app, suffix of Finsky docid for
   * in-app purchase and in-app subscription.
   * Match getSku() in Play InApp Billing API.
   */
  sku?: string
  skuType?: GoogleActionsV2EntitlementSkuType
}

export interface GoogleActionsV2ExpectedInput {
  /**
   * The customized prompt used to ask user for input.
   */
  inputPrompt?: GoogleActionsV2InputPrompt
  /**
   * List of intents that can be used to fulfill this input.
   * To have the Google Assistant just return the raw user input, the app
   * should ask for the `actions.intent.TEXT` intent.
   */
  possibleIntents?: GoogleActionsV2ExpectedIntent[]
  /**
   * List of phrases the app wants Google to use for speech biasing.
   * Up to 1000 phrases are allowed.
   */
  speechBiasingHints?: string[]
}

export interface GoogleActionsV2ExpectedIntent {
  /**
   * Additional configuration data required by a built-in intent. Possible
   * values for the built-in intents: `actions.intent.OPTION ->`
   * [google.actions.v2.OptionValueSpec], `actions.intent.CONFIRMATION ->`
   * [google.actions.v2.ConfirmationValueSpec],
   * `actions.intent.TRANSACTION_REQUIREMENTS_CHECK ->`
   * [google.actions.v2.TransactionRequirementsCheckSpec],
   * `actions.intent.DELIVERY_ADDRESS ->`
   * [google.actions.v2.DeliveryAddressValueSpec],
   * `actions.intent.TRANSACTION_DECISION ->`
   * [google.actions.v2.TransactionDecisionValueSpec],
   * `actions.intent.PLACE ->`
   * [google.actions.v2.PlaceValueSpec],
   * `actions.intent.Link ->`
   * [google.actions.v2.LinkValueSpec]
   */
  inputValueData?: ApiClientObjectMap<any>
  /**
   * The built-in intent name, e.g. `actions.intent.TEXT`, or intents
   * defined in the action package. If the intent specified is not a built-in
   * intent, it is only used for speech biasing and the input provided by the
   * Google Assistant will be the `actions.intent.TEXT` intent.
   */
  intent?: string
  /**
   * Optionally, a parameter of the intent that is being requested. Only valid
   * for requested intents. Used for speech biasing.
   */
  parameterName?: string
}

export interface GoogleActionsV2FinalResponse {
  /**
   * Rich response when user is not required to provide an input.
   */
  richResponse?: GoogleActionsV2RichResponse
  /**
   * Spoken response when user is not required to provide an input.
   */
  speechResponse?: GoogleActionsV2SpeechResponse
}

export interface GoogleActionsV2Input {
  /**
   * A list of provided argument values for the input requested by the app.
   */
  arguments?: GoogleActionsV2Argument[]
  /**
   * Indicates the user's intent. For the first conversation turn, the intent
   * will refer to the intent of the action that is being triggered. For
   * subsequent conversation turns, the intent will be a built-in intent.
   * For example, if the expected input is `actions.intent.OPTION`, then the
   * the intent specified here will either be `actions.intent.OPTION` if the
   * Google Assistant was able to satisfy that intent, or
   * `actions.intent.TEXT` if the user provided other information.
   */
  intent?: string
  /**
   * Raw input transcription from each turn of conversation that was used to
   * provide this input.
   * Multiple conversation turns that don't involve the app may be required
   * for the assistant to provide some types of input.
   */
  rawInputs?: GoogleActionsV2RawInput[]
}

export interface GoogleActionsV2InputPrompt {
  /**
   * Initial prompts asking user to provide an input.
   * Only a single initial_prompt is supported.
   */
  initialPrompts?: GoogleActionsV2SpeechResponse[]
  /**
   * Prompt used to ask user when there is no input from user.
   */
  noInputPrompts?: GoogleActionsV2SimpleResponse[]
  /**
   * Prompt payload.
   */
  richInitialPrompt?: GoogleActionsV2RichResponse
}

export interface GoogleActionsV2LinkValueSpec {
  dialogSpec?: GoogleActionsV2DialogSpec
  /**
   * Destination that the app should link to. Could be a web URL, a
   * conversational link or an Android intent. A web URL is used to handoff the
   * flow to some website. A conversational link is used to provide a deep link
   * into another AoG app. An Android intent URI is used to trigger an Android
   * intent. This requires the package_name to be specified.
   */
  openUrlAction?: GoogleActionsV2UiElementsOpenUrlAction
}

export interface GoogleActionsV2LinkValueSpecLinkDialogSpec {
  /**
   * The name of the app or site this request wishes to linking to.
   * The TTS will be created with the title \"Open <destination_name>\". Also
   * used during confirmation, \"Can I send you to <destination_name>?\" If we
   * know the actual title of the link that is being handed off to, we will
   * ignore this field and use the appropriate title.
   * Max 20 chars.
   */
  destinationName?: string
  /**
   * A string that is added to the end of the confirmation prompt to explain
   * why we need to link out. Example: \"navigate to pick up your coffee?\" This
   * can be appended to the confirmation prompt like \"Can I send you to Google
   * Maps to navigate to pick up your coffee?\"
   */
  requestLinkReason?: string
}

export interface GoogleActionsV2Location {
  /**
   * City.
   * Requires the DEVICE_PRECISE_LOCATION or
   * DEVICE_COARSE_LOCATION permission.
   */
  city?: string
  /**
   * Geo coordinates.
   * Requires the DEVICE_PRECISE_LOCATION permission.
   */
  coordinates?: GoogleTypeLatLng
  /**
   * Display address, e.g., \"1600 Amphitheatre Pkwy, Mountain View, CA 94043\".
   * Requires the DEVICE_PRECISE_LOCATION permission.
   */
  formattedAddress?: string
  /**
   * Name of the place.
   */
  name?: string
  /**
   * Notes about the location.
   */
  notes?: string
  /**
   * Phone number of the location, e.g. contact number of business location or
   * phone number for delivery location.
   */
  phoneNumber?: string
  /**
   * Postal address.
   * Requires the DEVICE_PRECISE_LOCATION or
   * DEVICE_COARSE_LOCATION permission.
   */
  postalAddress?: GoogleTypePostalAddress
  /**
   * Zip code.
   * Requires the DEVICE_PRECISE_LOCATION or
   * DEVICE_COARSE_LOCATION permission.
   */
  zipCode?: string
}

export interface GoogleActionsV2MediaObject {
  /**
   * The url pointing to the media content.
   */
  contentUrl?: string
  /**
   * Description of this media object.
   */
  description?: string
  /**
   * A small image icon displayed on the right from the title.
   * It's resized to 36x36 dp.
   */
  icon?: GoogleActionsV2UiElementsImage
  /**
   * A large image, such as the cover of the album, etc.
   */
  largeImage?: GoogleActionsV2UiElementsImage
  /**
   * Name of this media object.
   */
  name?: string
}

export interface GoogleActionsV2MediaResponse {
  /**
   * The list of media objects.
   */
  mediaObjects?: GoogleActionsV2MediaObject[]
  /**
   * Type of the media within this response.
   */
  mediaType?: GoogleActionsV2MediaResponseMediaType
}

export interface GoogleActionsV2MediaStatus {
  /**
   * The status of the media
   */
  status?: GoogleActionsV2MediaStatusStatus
}

export interface GoogleActionsV2NewSurfaceValue {
  status?: GoogleActionsV2NewSurfaceValueStatus
}

export interface GoogleActionsV2NewSurfaceValueSpec {
  /**
   * The list of capabilities required from the surface. Eg,
   * [\"actions.capability.SCREEN_OUTPUT\"]
   */
  capabilities?: string[]
  /**
   * Context describing the content the user will receive on the new surface.
   * Eg, \"[Sure, I know of 10 that are really popular. The highest-rated one is
   * at Mount Marcy.] Is it okay if I send that to your phone?\"
   */
  context?: string
  /**
   * Title of the notification which prompts the user to continue on the new
   * surface.
   */
  notificationTitle?: string
}

export interface GoogleActionsV2OptionInfo {
  /**
   * A unique key that will be sent back to the agent if this response is given.
   */
  key?: string
  /**
   * A list of synonyms that can also be used to trigger this item in dialog.
   */
  synonyms?: string[]
}

export interface GoogleActionsV2OptionValueSpec {
  /**
   * A select with a card carousel GUI
   */
  carouselSelect?: GoogleActionsV2UiElementsCarouselSelect
  /**
   * A select with a list card GUI
   */
  listSelect?: GoogleActionsV2UiElementsListSelect
  /**
   * A simple select with no associated GUI
   */
  simpleSelect?: GoogleActionsV2SimpleSelect
}

export interface GoogleActionsV2OrdersActionProvidedPaymentOptions {
  /**
   * Name of the instrument displayed on the receipt.
   * Required for action-provided payment info.
   * For `PAYMENT_CARD`, this could be \"VISA-1234\".
   * For `BANK`, this could be \"Chase Checking-1234\".
   * For `LOYALTY_PROGRAM`, this could be \"Starbuck's points\".
   * For `ON_FULFILLMENT`, this could be something like \"pay on delivery\".
   */
  displayName?: string
  /**
   * Type of payment.
   * Required.
   */
  paymentType?: GoogleActionsV2OrdersActionProvidedPaymentOptionsPaymentType
}

export interface GoogleActionsV2OrdersCancellationInfo {
  /**
   * Reason for cancellation.
   */
  reason?: string
}

export interface GoogleActionsV2OrdersCart {
  /**
   * Extension to the cart based on the type of order.
   */
  extension?: ApiClientObjectMap<any>
  /**
   * Optional id for this cart. Included as part of the
   * Cart returned back to the integrator at confirmation time.
   */
  id?: string
  /**
   * The good(s) or service(s) the user is ordering. There must be at least
   * one line item.
   */
  lineItems?: GoogleActionsV2OrdersLineItem[]
  /**
   * Merchant for the cart, if different from the caller.
   */
  merchant?: GoogleActionsV2OrdersMerchant
  /**
   * Notes about this cart.
   */
  notes?: string
  /**
   * Adjustments entered by the user, e.g. gratuity.
   */
  otherItems?: GoogleActionsV2OrdersLineItem[]
  /**
   * Optional. Promotional coupons added to the cart. Eligible promotions will
   * be sent back as discount line items in proposed order.
   */
  promotions?: GoogleActionsV2OrdersPromotion[]
}

export interface GoogleActionsV2OrdersCustomerInfo {
  /**
   * Customer email will be included and returned to the app if
   * CustomerInfoProperty.EMAIL specified in CustomerInfoOptions.
   */
  email?: string
}

export interface GoogleActionsV2OrdersCustomerInfoOptions {
  /**
   * List of customer info properties.
   */
  customerInfoProperties?: GoogleActionsV2OrdersCustomerInfoOptionsCustomerInfoProperties[]
}

export interface GoogleActionsV2OrdersFulfillmentInfo {
  /**
   * When the order will be fulfilled.
   */
  deliveryTime?: string
}

export interface GoogleActionsV2OrdersGenericExtension {
  /**
   * Locations associated with the order. Up to 2 locations.
   */
  locations?: GoogleActionsV2OrdersOrderLocation[]
  /**
   * Time indicator associated with the proposed order.
   */
  time?: GoogleActionsV2OrdersTime
}

export interface GoogleActionsV2OrdersGoogleProvidedPaymentOptions {
  /**
   * If true, billing address will be returned.
   */
  billingAddressRequired?: boolean
  /**
   * If true, disallow prepaid cards from being used in the transaction.
   */
  prepaidCardDisallowed?: boolean
  /**
   * The app allows cards from any card network listed here being used in
   * transaction.
   * By default, Amex, Visa, MC and Discover are supported.
   */
  supportedCardNetworks?: GoogleActionsV2OrdersGoogleProvidedPaymentOptionsSupportedCardNetworks[]
  /**
   * Required field for requesting Google provided payment instrument.
   * These tokenization parameters  will be used for generating payment token
   * for use in transaction. The app should get these parameters from their
   * payment gateway.
   */
  tokenizationParameters?: GoogleActionsV2OrdersPaymentMethodTokenizationParameters
}

export interface GoogleActionsV2OrdersInTransitInfo {
  /**
   * Last updated time for in transit.
   */
  updatedTime?: string
}

export interface GoogleActionsV2OrdersLineItem {
  /**
   * Description of the item.
   */
  description?: string
  /**
   * Extension to the line item based on its type.
   */
  extension?: ApiClientObjectMap<any>
  /**
   * Unique id of the line item within the Cart/Order. Required.
   */
  id?: string
  /**
   * Small image associated with this item.
   */
  image?: GoogleActionsV2UiElementsImage
  /**
   * Name of the line item as displayed in the receipt. Required.
   */
  name?: string
  /**
   * Optional product or offer id for this item.
   */
  offerId?: string
  /**
   * Each line item should have a price, even if the price is 0. Required.
   * This is the total price as displayed on the receipt for this line
   * (i.e. unit price * quantity).
   */
  price?: GoogleActionsV2OrdersPrice
  /**
   * Number of items included.
   */
  quantity?: number
  /**
   * Sub-line item(s). Only valid if type is `REGULAR`.
   */
  subLines?: GoogleActionsV2OrdersLineItemSubLine[]
  /**
   * Type of line item.
   */
  type?: GoogleActionsV2OrdersLineItemType
}

export interface GoogleActionsV2OrdersLineItemSubLine {
  /**
   * A generic line item (e.g. add-on).
   */
  lineItem?: GoogleActionsV2OrdersLineItem
  /**
   * A note associated with the line item.
   */
  note?: string
}

export interface GoogleActionsV2OrdersLineItemUpdate {
  /**
   * Update to the line item extension. Type must match the item's
   * existing extension type.
   */
  extension?: ApiClientObjectMap<any>
  /**
   * New line item-level state.
   */
  orderState?: GoogleActionsV2OrdersOrderState
  /**
   * New price for the line item.
   */
  price?: GoogleActionsV2OrdersPrice
  /**
   * Reason for the change. Required for price changes.
   */
  reason?: string
}

export interface GoogleActionsV2OrdersMerchant {
  /**
   * Id of the merchant.
   */
  id?: string
  /**
   * User-visible name of the merchant. Required.
   */
  name?: string
}

export interface GoogleActionsV2OrdersOrder {
  /**
   * User-visible order id. Must be set on the initial synchronous
   * OrderUpdate/confirmation.
   */
  actionOrderId?: string
  /**
   * If requested, customer info e.g. email will be passed back to the app.
   */
  customerInfo?: GoogleActionsV2OrdersCustomerInfo
  /**
   * Reflect back the proposed order that caused the order.
   */
  finalOrder?: GoogleActionsV2OrdersProposedOrder
  /**
   * Order id assigned by Google.
   */
  googleOrderId?: string
  /**
   * Date and time the order was created.
   */
  orderDate?: string
  /**
   * Payment related info for the order.
   */
  paymentInfo?: GoogleActionsV2OrdersPaymentInfo
}

export interface GoogleActionsV2OrdersOrderLocation {
  /**
   * Contains actual location info.
   */
  location?: GoogleActionsV2Location
  /**
   * Address type. Determines icon and placement. Required.
   */
  type?: GoogleActionsV2OrdersOrderLocationType
}

export interface GoogleActionsV2OrdersOrderOptions {
  /**
   * The app can request customer info by setting this field.
   * If set, the corresponding field will show up in ProposedOrderCard for
   * user's confirmation.
   */
  customerInfoOptions?: GoogleActionsV2OrdersCustomerInfoOptions
  /**
   * If true, delivery address is required for the associated Order.
   */
  requestDeliveryAddress?: boolean
}

export interface GoogleActionsV2OrdersOrderState {
  /**
   * The user-visible string for the state. Required.
   */
  label?: string
  /**
   * State can be one of the following values:
   *
   * `CREATED`: Order was created at integrator's system.
   * `REJECTED`: Order was rejected by integrator.
   * `CONFIRMED`: Order was confirmed by the integrator and is active.
   * `CANCELLED`: User cancelled the order.
   * `IN_TRANSIT`: Order is being delivered.
   * `RETURNED`: User did a return.
   * `FULFILLED`: User received what was ordered.
   * 'CHANGE_REQUESTED': User has requested a change to the order, and
   *           the integrator is processing this change. The
   *           order should be moved to another state after the
   *           request is handled.
   *
   * Required.
   */
  state?: string
}

export interface GoogleActionsV2OrdersOrderUpdate {
  /**
   * Required.
   * The canonical order id referencing this order.
   * If integrators don't generate the canonical order id in their system,
   * they can simply copy over google_order_id included in order.
   */
  actionOrderId?: string
  /**
   * Information about cancellation state.
   */
  cancellationInfo?: GoogleActionsV2OrdersCancellationInfo
  /**
   * Information about fulfillment state.
   */
  fulfillmentInfo?: GoogleActionsV2OrdersFulfillmentInfo
  /**
   * Id of the order is the Google-issued id.
   */
  googleOrderId?: string
  /**
   * Information about in transit state.
   */
  inTransitInfo?: GoogleActionsV2OrdersInTransitInfo
  /**
   * Extra data based on a custom order state or in addition to info of a
   * standard state.
   */
  infoExtension?: ApiClientObjectMap<any>
  /**
   * Map of line item-level changes, keyed by item id. Optional.
   */
  lineItemUpdates?: ApiClientObjectMap<GoogleActionsV2OrdersLineItemUpdate>
  /**
   * Updated applicable management actions for the order, e.g. manage, modify,
   * contact support.
   */
  orderManagementActions?: GoogleActionsV2OrdersOrderUpdateAction[]
  /**
   * The new state of the order.
   */
  orderState?: GoogleActionsV2OrdersOrderState
  /**
   * Receipt for order.
   */
  receipt?: GoogleActionsV2OrdersReceipt
  /**
   * Information about rejection state.
   */
  rejectionInfo?: GoogleActionsV2OrdersRejectionInfo
  /**
   * Information about returned state.
   */
  returnInfo?: GoogleActionsV2OrdersReturnInfo
  /**
   * New total price of the order
   */
  totalPrice?: GoogleActionsV2OrdersPrice
  /**
   * When the order was updated from the app's perspective.
   */
  updateTime?: string
  /**
   * If specified, displays a notification to the user with the specified
   * title and text. Specifying a notification is a suggestion to
   * notify and is not guaranteed to result in a notification.
   */
  userNotification?: GoogleActionsV2OrdersOrderUpdateUserNotification
}

export interface GoogleActionsV2OrdersOrderUpdateAction {
  /**
   * Button label and link.
   */
  button?: GoogleActionsV2UiElementsButton
  /**
   * Type of action.
   */
  type?: GoogleActionsV2OrdersOrderUpdateActionType
}

export interface GoogleActionsV2OrdersOrderUpdateUserNotification {
  /**
   * The contents of the notification.
   */
  text?: string
  /**
   * The title for the user notification.
   */
  title?: string
}

export interface GoogleActionsV2OrdersPaymentInfo {
  /**
   * Name of the instrument displayed on the receipt.
   */
  displayName?: string
  /**
   * Google provided payment instrument.
   */
  googleProvidedPaymentInstrument?: GoogleActionsV2OrdersPaymentInfoGoogleProvidedPaymentInstrument
  /**
   * Type of payment.
   * Required.
   */
  paymentType?: GoogleActionsV2OrdersPaymentInfoPaymentType
}

export interface GoogleActionsV2OrdersPaymentInfoGoogleProvidedPaymentInstrument {
  /**
   * If requested by integrator, billing address for the instrument in use
   * will be included.
   */
  billingAddress?: GoogleTypePostalAddress
  /**
   * Google provided payment instrument.
   */
  instrumentToken?: string
}

export interface GoogleActionsV2OrdersPaymentMethodTokenizationParameters {
  /**
   * If tokenization_type is set to `PAYMENT_GATEWAY` then the list of
   * parameters should contain payment gateway specific parameters required to
   * tokenize payment method as well as parameter with the name \"gateway\" with
   * the value set to one of the gateways that we support e.g. \"stripe\" or
   * \"braintree\".
   * A sample tokenization configuration used for Stripe in JSON format.
   * `{
   *   \"gateway\" : \"stripe\",
   *   \"stripe:publishableKey\" : \"pk_1234\",
   *   \"stripe:version\" : \"1.5\"
   * }`
   * A sample tokenization configuration used for Braintree in JSON format.
   * `{
   *   \"gateway\" : \"braintree\",
   *   \"braintree:merchantId\" : \"abc\"
   *   \"braintree:sdkVersion\" : \"1.4.0\"
   *   \"braintree:apiVersion\" : \"v1\"
   *   \"braintree:clientKey\" : \"production_a12b34\"
   *   \"braintree:authorizationFingerprint\" : \"production_a12b34\"
   * }`
   * A sample configuration used for Adyen in JSON format.
   * `{
   *   \"gateway\" : \"adyen\",
   *   \"gatewayMerchantId\" : \"gateway-merchant-id\"
   * }`
   * If tokenization_type is set to DIRECT, integrators must specify a parameter
   * named \"publicKey\" which will contain an Elliptic Curve public key using
   * the uncompressed point format and base64 encoded. This publicKey will be
   * used by Google to encrypt the payment information.
   * Example of the parameter in JSON format:
   * {
   *   \"publicKey\": \"base64encoded...\"
   * }
   */
  parameters?: ApiClientObjectMap<string>
  /**
   * Required.
   */
  tokenizationType?: GoogleActionsV2OrdersPaymentMethodTokenizationParametersTokenizationType
}

export interface GoogleActionsV2OrdersPaymentOptions {
  /**
   * Info for an Action-provided payment instrument for display on receipt.
   */
  actionProvidedOptions?: GoogleActionsV2OrdersActionProvidedPaymentOptions
  /**
   * Requirements for Google provided payment instrument.
   */
  googleProvidedOptions?: GoogleActionsV2OrdersGoogleProvidedPaymentOptions
}

export interface GoogleActionsV2OrdersPresentationOptions {
  /**
   * call_to_action can be one of the following values:
   *
   * `PLACE_ORDER`: Used for placing an order.
   * `PAY`: Used for a payment.
   * `BUY`: Used for a purchase.
   * `SEND`: Used for a money transfer.
   * `BOOK`: Used for a booking.
   * `RESERVE`: Used for reservation.
   * `SCHEDULE`: Used for scheduling an appointment.
   * `SUBSCRIBE`: Used for subscription.
   *
   * call_to_action refers to the action verb which best describes this order.
   * This will be used in various places like prompt, suggestion chip etc while
   * proposing the order to the user.
   */
  callToAction?: string
}

export interface GoogleActionsV2OrdersPrice {
  /**
   * Monetary amount. Required.
   */
  amount?: GoogleTypeMoney
  /**
   * Type of price. Required.
   */
  type?: GoogleActionsV2OrdersPriceType
}

export interface GoogleActionsV2OrdersPromotion {
  /**
   * Required. Coupon code understood by 3P. For ex: GOOGLE10.
   */
  coupon?: string
}

export interface GoogleActionsV2OrdersProposedOrder {
  /**
   * User's items.
   */
  cart?: GoogleActionsV2OrdersCart
  /**
   * Extension to the proposed order based on the kind of order.
   * For example, if the order includes a location then this extension will
   * contain a OrderLocation value.
   */
  extension?: ApiClientObjectMap<any>
  /**
   * Optional id for this ProposedOrder. Included as part of the
   * ProposedOrder returned back to the integrator at confirmation time.
   */
  id?: string
  /**
   * Image associated with the proposed order.
   */
  image?: GoogleActionsV2UiElementsImage
  /**
   * Fees, adjustments, subtotals, etc.
   */
  otherItems?: GoogleActionsV2OrdersLineItem[]
  /**
   * A link to the terms of service that apply to this proposed order.
   */
  termsOfServiceUrl?: string
  /**
   * Total price of the proposed order. If of type `ACTUAL`, this is the amount
   * the caller will charge when the user confirms the proposed order.
   */
  totalPrice?: GoogleActionsV2OrdersPrice
}

export interface GoogleActionsV2OrdersReceipt {
  /**
   * Confirmed order id when order has been received by the integrator. This is
   * the canonical order id used in integrator's system referencing the order
   * and may subsequently be used to identify the order as `action_order_id`.
   */
  confirmedActionOrderId?: string
  /**
   * Optional.
   * The user facing id referencing to current order, which will show up in the
   * receipt card if present. This should be the id that usually appears on
   * a printed receipt or receipt sent to user's email.
   * User should be able to use this id referencing her order for customer
   * service provided by integrators.
   * Note that this field must be populated if integrator does generate
   * user facing id for an order with a printed receipt / email receipt.
   */
  userVisibleOrderId?: string
}

export interface GoogleActionsV2OrdersRejectionInfo {
  /**
   * Reason for the error.
   */
  reason?: string
  /**
   * Rejection type.
   */
  type?: GoogleActionsV2OrdersRejectionInfoType
}

export interface GoogleActionsV2OrdersReturnInfo {
  /**
   * Reason for return.
   */
  reason?: string
}

export interface GoogleActionsV2OrdersTime {
  /**
   * ISO 8601 representation of time indicator: could be a duration, date or
   * exact datetime.
   */
  timeIso8601?: string
  /**
   * Type of time indicator.
   */
  type?: GoogleActionsV2OrdersTimeType
}

export interface GoogleActionsV2PackageEntitlement {
  /**
   * List of entitlements for a given app
   */
  entitlements?: GoogleActionsV2Entitlement[]
  /**
   * Should match the package name in action package
   */
  packageName?: string
}

export interface GoogleActionsV2PermissionValueSpec {
  /**
   * The context why agent needs to request permission.
   */
  optContext?: string
  /**
   * List of permissions requested by the agent.
   */
  permissions?: GoogleActionsV2PermissionValueSpecPermissions[]
  /**
   * Additional information needed to fulfill update permission request.
   */
  updatePermissionValueSpec?: GoogleActionsV2UpdatePermissionValueSpec
}

export interface GoogleActionsV2PlaceValueSpec {
  /**
   * Speech configuration for askForPlace dialog. The extension should be used
   * to define the PlaceDialogSpec configuration.
   */
  dialogSpec?: GoogleActionsV2DialogSpec
}

export interface GoogleActionsV2PlaceValueSpecPlaceDialogSpec {
  /**
   * This is the context for seeking permission to access various user related
   * data if the user prompts for personal location during the sub-dialog like
   * \"Home\", \"Work\" or \"Dad's house\". For example \"*To help you find
   * juice stores*, I just need to check your location. Can I get that from
   * Google?\". The first part of this permission prompt is configurable.
   */
  permissionContext?: string
  /**
   * This is the initial prompt by AskForPlace sub-dialog. For example \"What
   * place do you want?\"
   */
  requestPrompt?: string
}

export interface GoogleActionsV2RawInput {
  /**
   * Indicates how the user provided this input: a typed response, a voice
   * response, unspecified, etc.
   */
  inputType?: GoogleActionsV2RawInputInputType
  /**
   * Typed or spoken input from the end user.
   */
  query?: string
}

export interface GoogleActionsV2RegisterUpdateValue {
  /**
   * The status of the registering the update requested by the app.
   */
  status?: GoogleActionsV2RegisterUpdateValueStatus
}

export interface GoogleActionsV2RegisterUpdateValueSpec {
  /**
   * The list of arguments to necessary to fulfill an update.
   */
  arguments?: GoogleActionsV2Argument[]
  /**
   * The intent that the user wants to get updates from.
   */
  intent?: string
  /**
   * The trigger context that defines how the update will be triggered.
   * This may modify the dialog in order to narrow down the user's preferences
   * for getting his or her updates.
   */
  triggerContext?: GoogleActionsV2TriggerContext
}

export interface GoogleActionsV2RichResponse {
  /**
   * A list of UI elements which compose the response
   * The items must meet the following requirements:
   * 1. The first item must be a SimpleResponse
   * 2. At most two SimpleResponse
   * 3. At most one card (e.g. BasicCard or
   *  StructuredResponse or
   *  MediaResponse
   * 4. Cards may not be used if an actions.intent.OPTION intent is used
   *  ie ListSelect or
   *     CarouselSelect
   */
  items?: GoogleActionsV2RichResponseItem[]
  /**
   * An additional suggestion chip that can link out to the associated app
   * or site.
   */
  linkOutSuggestion?: GoogleActionsV2UiElementsLinkOutSuggestion
  /**
   * A list of suggested replies. These will always appear at the end of the
   * response. If used in a FinalResponse,
   * they will be ignored.
   */
  suggestions?: GoogleActionsV2UiElementsSuggestion[]
}

export interface GoogleActionsV2RichResponseItem {
  /**
   * A basic card.
   */
  basicCard?: GoogleActionsV2UiElementsBasicCard
  /**
   * Carousel browse card.
   */
  carouselBrowse?: GoogleActionsV2UiElementsCarouselBrowse
  /**
   * Response indicating a set of media to be played.
   */
  mediaResponse?: GoogleActionsV2MediaResponse
  /**
   * Voice and text-only response.
   */
  simpleResponse?: GoogleActionsV2SimpleResponse
  /**
   * Structured payload to be processed by Google.
   */
  structuredResponse?: GoogleActionsV2StructuredResponse
  /**
   * Table card.
   */
  tableCard?: GoogleActionsV2UiElementsTableCard
}

export interface GoogleActionsV2SignInValue {
  /**
   * The status of the sign in requested by the app.
   */
  status?: GoogleActionsV2SignInValueStatus
}

export interface GoogleActionsV2SignInValueSpec {
  /**
   * The optional context why the app needs to ask the user to sign in, as a
   * prefix of a prompt for user consent, e.g. \"To track your exercise\", or
   * \"To check your account balance\".
   */
  optContext?: string
}

export interface GoogleActionsV2SignedData {
  /**
   * Matches IN_APP_DATA_SIGNATURE from getPurchases() method in Play InApp
   * Billing API.
   */
  inAppDataSignature?: string
  /**
   * Match INAPP_PURCHASE_DATA
   * from getPurchases() method. Contains all inapp purchase data in JSON format
   * See details in table 6 of
   * https://developer.android.com/google/play/billing/billing_reference.html.
   */
  inAppPurchaseData?: ApiClientObjectMap<any>
}

export interface GoogleActionsV2SimpleResponse {
  /**
   * Optional text to display in the chat bubble. If not given, a display
   * rendering of the text_to_speech or ssml above will be used. Limited to 640
   * chars.
   */
  displayText?: string
  /**
   * Structured spoken response to the user in the SSML format, e.g.
   * `<speak> Say animal name after the sound.  <audio src =
   * 'https://www.pullstring.com/moo.mps' />, what’s the animal?  </speak>`.
   * Mutually exclusive with text_to_speech.
   */
  ssml?: string
  /**
   * Plain text of the speech output, e.g., \"where do you want to go?\"
   * Mutually exclusive with ssml.
   */
  textToSpeech?: string
}

export interface GoogleActionsV2SimpleSelect {
  /**
   * List of items users should select from.
   */
  items?: GoogleActionsV2SimpleSelectItem[]
}

export interface GoogleActionsV2SimpleSelectItem {
  /**
   * Item key and synonyms.
   */
  optionInfo?: GoogleActionsV2OptionInfo
  /**
   * Title of the item. It will act as synonym if it's provided.
   * Optional
   */
  title?: string
}

export interface GoogleActionsV2SpeechResponse {
  /**
   * Structured spoken response to the user in the SSML format, e.g.
   * \"<speak> Say animal name after the sound.  <audio src =
   * 'https://www.pullstring.com/moo.mps' />, what’s the animal?  </speak>\".
   * Mutually exclusive with text_to_speech.
   */
  ssml?: string
  /**
   * Plain text of the speech output, e.g., \"where do you want to go?\"/
   */
  textToSpeech?: string
}

export interface GoogleActionsV2StructuredResponse {
  /**
   * App provides an order update (e.g.
   * Receipt) after receiving the order.
   */
  orderUpdate?: GoogleActionsV2OrdersOrderUpdate
}

export interface GoogleActionsV2Surface {
  /**
   * A list of capabilities the surface supports at the time of the request
   * e.g. `actions.capability.AUDIO_OUTPUT`
   */
  capabilities?: GoogleActionsV2Capability[]
}

export interface GoogleActionsV2TransactionDecisionValue {
  /**
   * If `check_result` is NOT `ResultType.OK`, the rest of the fields in
   * this message should be ignored.
   */
  checkResult?: GoogleActionsV2TransactionRequirementsCheckResult
  /**
   * If user requests for delivery address update, this field includes the
   * new delivery address. This field will be present only when `user_decision`
   * is `DELIVERY_ADDRESS_UPDATED`.
   */
  deliveryAddress?: GoogleActionsV2Location
  /**
   * The order that user has approved. This field will be present only when
   * `user_decision` is `ORDER_ACCEPTED`.
   */
  order?: GoogleActionsV2OrdersOrder
  /**
   * User decision regarding the proposed order.
   */
  userDecision?: GoogleActionsV2TransactionDecisionValueUserDecision
}

export interface GoogleActionsV2TransactionDecisionValueSpec {
  /**
   * Options associated with the order.
   */
  orderOptions?: GoogleActionsV2OrdersOrderOptions
  /**
   * Payment options for this order, or empty if no payment
   * is associated with the order.
   */
  paymentOptions?: GoogleActionsV2OrdersPaymentOptions
  /**
   * Options used to customize order presentation to the user.
   */
  presentationOptions?: GoogleActionsV2OrdersPresentationOptions
  /**
   * The proposed order that's ready for user to approve.
   */
  proposedOrder?: GoogleActionsV2OrdersProposedOrder
}

export interface GoogleActionsV2TransactionRequirementsCheckResult {
  /**
   * Result of the operation.
   */
  resultType?: GoogleActionsV2TransactionRequirementsCheckResultResultType
}

export interface GoogleActionsV2TransactionRequirementsCheckSpec {
  /**
   * Options associated with the order.
   */
  orderOptions?: GoogleActionsV2OrdersOrderOptions
  /**
   * Payment options for this Order, or empty if no payment
   * is associated with the Order.
   */
  paymentOptions?: GoogleActionsV2OrdersPaymentOptions
}

export interface GoogleActionsV2TriggerContext {
  /**
   * The time context for which the update can be triggered.
   */
  timeContext?: GoogleActionsV2TriggerContextTimeContext
}

export interface GoogleActionsV2TriggerContextTimeContext {
  /**
   * The high-level frequency of the recurring update.
   */
  frequency?: GoogleActionsV2TriggerContextTimeContextFrequency
}

export interface GoogleActionsV2UiElementsBasicCard {
  /**
   * Buttons.
   * Currently at most 1 button is supported.
   * Optional.
   */
  buttons?: GoogleActionsV2UiElementsButton[]
  /**
   * Body text of the card.
   * Supports a limited set of markdown syntax for formatting.
   * Required, unless image is present.
   */
  formattedText?: string
  /**
   * A hero image for the card. The height is fixed to 192dp.
   * Optional.
   */
  image?: GoogleActionsV2UiElementsImage
  /**
   * Type of image display option. Optional.
   */
  imageDisplayOptions?: GoogleActionsV2UiElementsBasicCardImageDisplayOptions
  /**
   * Optional.
   */
  subtitle?: string
  /**
   * Overall title of the card.
   * Optional.
   */
  title?: string
}

export interface GoogleActionsV2UiElementsButton {
  /**
   * Action to take when a user taps on the button.
   * Required.
   */
  openUrlAction?: GoogleActionsV2UiElementsOpenUrlAction
  /**
   * Title of the button.
   * Required.
   */
  title?: string
}

export interface GoogleActionsV2UiElementsCarouselBrowse {
  /**
   * Type of image display option.
   * Optional.
   */
  imageDisplayOptions?: GoogleActionsV2UiElementsCarouselBrowseImageDisplayOptions
  /**
   * Min: 2. Max: 10.
   */
  items?: GoogleActionsV2UiElementsCarouselBrowseItem[]
}

export interface GoogleActionsV2UiElementsCarouselBrowseItem {
  /**
   * Description of the carousel item.
   * Optional.
   */
  description?: string
  /**
   * Footer text for the carousel item, displayed below the description.
   * Single line of text, truncated with an ellipsis.
   * Optional.
   */
  footer?: string
  /**
   * Hero image for the carousel item.
   * Optional.
   */
  image?: GoogleActionsV2UiElementsImage
  /**
   * URL of the document associated with the carousel item.
   * The document can contain HTML content or, if \"url_type_hint\" is set to
   * AMP_CONTENT, AMP content.
   * Required.
   */
  openUrlAction?: GoogleActionsV2UiElementsOpenUrlAction
  /**
   * Title of the carousel item.
   * Required.
   */
  title?: string
}

export interface GoogleActionsV2UiElementsCarouselSelect {
  /**
   * Type of image display option. Optional.
   */
  imageDisplayOptions?: GoogleActionsV2UiElementsCarouselSelectImageDisplayOptions
  /**
   * min: 2 max: 10
   */
  items?: GoogleActionsV2UiElementsCarouselSelectCarouselItem[]
}

export interface GoogleActionsV2UiElementsCarouselSelectCarouselItem {
  /**
   * Body text of the card.
   */
  description?: string
  /**
   * Optional.
   */
  image?: GoogleActionsV2UiElementsImage
  /**
   * See google.actions.v2.OptionInfo
   * for details.
   * Required.
   */
  optionInfo?: GoogleActionsV2OptionInfo
  /**
   * Title of the carousel item. When tapped, this text will be
   * posted back to the conversation verbatim as if the user had typed it.
   * Each title must be unique among the set of carousel items.
   * Required.
   */
  title?: string
}

export interface GoogleActionsV2UiElementsImage {
  /**
   * A text description of the image to be used for accessibility, e.g. screen
   * readers.
   * Required.
   */
  accessibilityText?: string
  /**
   * The height of the image in pixels.
   * Optional.
   */
  height?: number
  /**
   * The source url of the image. Images can be JPG, PNG and GIF (animated and
   * non-animated). For example,`https://www.agentx.com/logo.png`. Required.
   */
  url?: string
  /**
   * The width of the image in pixels.
   * Optional.
   */
  width?: number
}

export interface GoogleActionsV2UiElementsLinkOutSuggestion {
  /**
   * The name of the app or site this chip is linking to. The chip will be
   * rendered with the title \"Open <destination_name>\". Max 20 chars.
   * Required.
   */
  destinationName?: string
  /**
   * The URL of the App or Site to open when the user taps the suggestion chip.
   * Ownership of this App/URL must be validated in the Actions on Google
   * developer  console, or the suggestion will not be shown to the user.
   * Open URL Action supports http, https and intent URLs.
   * For Intent URLs refer to:
   * https://developer.chrome.com/multidevice/android/intents
   */
  openUrlAction?: GoogleActionsV2UiElementsOpenUrlAction
  /**
   * Deprecated. Use OpenUrlAction instead.
   */
  url?: string
}

export interface GoogleActionsV2UiElementsListSelect {
  /**
   * min: 2 max: 30
   */
  items?: GoogleActionsV2UiElementsListSelectListItem[]
  /**
   * Overall title of the list.
   * Optional.
   */
  title?: string
}

export interface GoogleActionsV2UiElementsListSelectListItem {
  /**
   * Main text describing the item.
   * Optional.
   */
  description?: string
  /**
   * Square image.
   * Optional.
   */
  image?: GoogleActionsV2UiElementsImage
  /**
   * Information about this option. See google.actions.v2.OptionInfo
   * for details.
   * Required.
   */
  optionInfo?: GoogleActionsV2OptionInfo
  /**
   * Title of the list item. When tapped, this text will be
   * posted back to the conversation verbatim as if the user had typed it.
   * Each title must be unique among the set of list items.
   * Required.
   */
  title?: string
}

export interface GoogleActionsV2UiElementsOpenUrlAction {
  /**
   * Information about the Android App if the URL is expected to be
   * fulfilled by an Android App.
   */
  androidApp?: GoogleActionsV2DevicesAndroidApp
  /**
   * The url field which could be any of:
   * - http/https urls for opening an App-linked App or a webpage
   */
  url?: string
  /**
   * Indicates a hint for the url type.
   */
  urlTypeHint?: GoogleActionsV2UiElementsOpenUrlActionUrlTypeHint
}

export interface GoogleActionsV2UiElementsSuggestion {
  /**
   * The text shown the in the suggestion chip. When tapped, this text will be
   * posted back to the conversation verbatim as if the user had typed it.
   * Each title must be unique among the set of suggestion chips.
   * Max 25 chars
   * Required
   */
  title?: string
}

export interface GoogleActionsV2UiElementsTableCard {
  /**
   * Buttons.
   * Currently at most 1 button is supported.
   * Optional.
   */
  buttons?: GoogleActionsV2UiElementsButton[]
  /**
   * Headers and alignment of columns.
   */
  columnProperties?: GoogleActionsV2UiElementsTableCardColumnProperties[]
  /**
   * Image associated with the table. Optional.
   */
  image?: GoogleActionsV2UiElementsImage
  /**
   * Row data of the table. The first 3 rows are guaranteed to be shown but
   * others might be cut on certain surfaces. Please test with the simulator to
   * see which rows will be shown for a given surface. On surfaces that support
   * the WEB_BROWSER capability, you can point the user to
   * a web page with more data.
   */
  rows?: GoogleActionsV2UiElementsTableCardRow[]
  /**
   * Subtitle for the table. Optional.
   */
  subtitle?: string
  /**
   * Overall title of the table. Optional but must be set if subtitle is set.
   */
  title?: string
}

export interface GoogleActionsV2UiElementsTableCardCell {
  /**
   * Text content of the cell.
   */
  text?: string
}

export interface GoogleActionsV2UiElementsTableCardColumnProperties {
  /**
   * Header text for the column.
   */
  header?: string
  /**
   * Horizontal alignment of content w.r.t column. If unspecified, content
   * will be aligned to the leading edge.
   */
  horizontalAlignment?: GoogleActionsV2UiElementsTableCardColumnPropertiesHorizontalAlignment
}

export interface GoogleActionsV2UiElementsTableCardRow {
  /**
   * Cells in this row. The first 3 cells are guaranteed to be shown but
   * others might be cut on certain surfaces. Please test with the simulator
   * to see which cells will be shown for a given surface.
   */
  cells?: GoogleActionsV2UiElementsTableCardCell[]
  /**
   * Indicates whether there should be a divider after each row.
   */
  dividerAfter?: boolean
}

export interface GoogleActionsV2UpdatePermissionValueSpec {
  /**
   * The list of arguments necessary to fulfill an update.
   */
  arguments?: GoogleActionsV2Argument[]
  /**
   * The intent that the user wants to get updates from.
   */
  intent?: string
}

export interface GoogleActionsV2User {
  /**
   * An OAuth2 token that identifies the user in your system. Only
   * available if Account Linking
   * configuration is defined in the action package and the user links their
   * account.
   */
  accessToken?: string
  /**
   * Token representing the user's identity.
   * This is a Json web token including encoded profile. The definition is at
   * https://developers.google.com/identity/protocols/OpenIDConnect#obtainuserinfo.
   */
  idToken?: string
  /**
   * The timestamp of the last interaction with this user.
   * This field will be omitted if the user has not interacted with the agent
   * before.
   */
  lastSeen?: string
  /**
   * Primary locale setting of the user making the request.
   * Follows IETF BCP-47 language code
   * http://www.rfc-editor.org/rfc/bcp/bcp47.txt
   * However, the script subtag is not included.
   */
  locale?: string
  /**
   * List of user entitlements for every package name listed in action package,
   * if any.
   */
  packageEntitlements?: GoogleActionsV2PackageEntitlement[]
  /**
   * Contains permissions granted by user to this app.
   */
  permissions?: GoogleActionsV2UserPermissions[]
  /**
   * Information about the end user. Some fields are only available if the user
   * has given permission to provide this information to the app.
   */
  profile?: GoogleActionsV2UserProfile
  /**
   * Unique ID for the end user.
   */
  userId?: string
  /**
   * An opaque token supplied by the application that is persisted across
   * conversations for a particular user.
   * The maximum size of the string is 10k characters.
   */
  userStorage?: string
}

export interface GoogleActionsV2UserNotification {
  /**
   * The content of the notification.
   */
  text?: string
  /**
   * The title for the notification.
   */
  title?: string
}

export interface GoogleActionsV2UserProfile {
  /**
   * The user's full name as specified in their Google account.
   * Requires the NAME permission.
   */
  displayName?: string
  /**
   * The user's last name as specified in their Google account.
   * Note that this field could be empty.
   * Requires the NAME permission.
   */
  familyName?: string
  /**
   * The user's first name as specified in their Google account.
   * Requires the NAME permission.
   */
  givenName?: string
}

export interface GoogleRpcStatus {
  /**
   * The status code, which should be an enum value of google.rpc.Code.
   */
  code?: number
  /**
   * A list of messages that carry the error details.  There is a common set of
   * message types for APIs to use.
   */
  details?: ApiClientObjectMap<any>[]
  /**
   * A developer-facing error message, which should be in English. Any
   * user-facing error message should be localized and sent in the
   * google.rpc.Status.details field, or localized by the client.
   */
  message?: string
}

export interface GoogleTypeDate {
  /**
   * Day of month. Must be from 1 to 31 and valid for the year and month, or 0
   * if specifying a year/month where the day is not significant.
   */
  day?: number
  /**
   * Month of year. Must be from 1 to 12, or 0 if specifying a date without a
   * month.
   */
  month?: number
  /**
   * Year of date. Must be from 1 to 9999, or 0 if specifying a date without
   * a year.
   */
  year?: number
}

export interface GoogleTypeLatLng {
  /**
   * The latitude in degrees. It must be in the range [-90.0, +90.0].
   */
  latitude?: number
  /**
   * The longitude in degrees. It must be in the range [-180.0, +180.0].
   */
  longitude?: number
}

export interface GoogleTypeMoney {
  /**
   * The 3-letter currency code defined in ISO 4217.
   */
  currencyCode?: string
  /**
   * Number of nano (10^-9) units of the amount.
   * The value must be between -999,999,999 and +999,999,999 inclusive.
   * If `units` is positive, `nanos` must be positive or zero.
   * If `units` is zero, `nanos` can be positive, zero, or negative.
   * If `units` is negative, `nanos` must be negative or zero.
   * For example $-1.75 is represented as `units`=-1 and `nanos`=-750,000,000.
   */
  nanos?: number
  /**
   * The whole units of the amount.
   * For example if `currencyCode` is `\"USD\"`, then 1 unit is one US dollar.
   */
  units?: string
}

export interface GoogleTypePostalAddress {
  /**
   * Unstructured address lines describing the lower levels of an address.
   *
   * Because values in address_lines do not have type information and may
   * sometimes contain multiple values in a single field (e.g.
   * \"Austin, TX\"), it is important that the line order is clear. The order of
   * address lines should be \"envelope order\" for the country/region of the
   * address. In places where this can vary (e.g. Japan), address_language is
   * used to make it explicit (e.g. \"ja\" for large-to-small ordering and
   * \"ja-Latn\" or \"en\" for small-to-large). This way, the most specific line
   * of an address can be selected based on the language.
   *
   * The minimum permitted structural representation of an address consists
   * of a region_code with all remaining information placed in the
   * address_lines. It would be possible to format such an address very
   * approximately without geocoding, but no semantic reasoning could be
   * made about any of the address components until it was at least
   * partially resolved.
   *
   * Creating an address only containing a region_code and address_lines, and
   * then geocoding is the recommended way to handle completely unstructured
   * addresses (as opposed to guessing which parts of the address should be
   * localities or administrative areas).
   */
  addressLines?: string[]
  /**
   * Optional. Highest administrative subdivision which is used for postal
   * addresses of a country or region.
   * For example, this can be a state, a province, an oblast, or a prefecture.
   * Specifically, for Spain this is the province and not the autonomous
   * community (e.g. \"Barcelona\" and not \"Catalonia\").
   * Many countries don't use an administrative area in postal addresses. E.g.
   * in Switzerland this should be left unpopulated.
   */
  administrativeArea?: string
  /**
   * Optional. BCP-47 language code of the contents of this address (if
   * known). This is often the UI language of the input form or is expected
   * to match one of the languages used in the address' country/region, or their
   * transliterated equivalents.
   * This can affect formatting in certain countries, but is not critical
   * to the correctness of the data and will never affect any validation or
   * other non-formatting related operations.
   *
   * If this value is not known, it should be omitted (rather than specifying a
   * possibly incorrect default).
   *
   * Examples: \"zh-Hant\", \"ja\", \"ja-Latn\", \"en\".
   */
  languageCode?: string
  /**
   * Optional. Generally refers to the city/town portion of the address.
   * Examples: US city, IT comune, UK post town.
   * In regions of the world where localities are not well defined or do not fit
   * into this structure well, leave locality empty and use address_lines.
   */
  locality?: string
  /**
   * Optional. The name of the organization at the address.
   */
  organization?: string
  /**
   * Optional. Postal code of the address. Not all countries use or require
   * postal codes to be present, but where they are used, they may trigger
   * additional validation with other parts of the address (e.g. state/zip
   * validation in the U.S.A.).
   */
  postalCode?: string
  /**
   * Optional. The recipient at the address.
   * This field may, under certain circumstances, contain multiline information.
   * For example, it might contain \"care of\" information.
   */
  recipients?: string[]
  /**
   * Required. CLDR region code of the country/region of the address. This
   * is never inferred and it is up to the user to ensure the value is
   * correct. See http://cldr.unicode.org/ and
   * http://www.unicode.org/cldr/charts/30/supplemental/territory_information.html
   * for details. Example: \"CH\" for Switzerland.
   */
  regionCode?: string
  /**
   * The schema revision of the `PostalAddress`. This must be set to 0, which is
   * the latest revision.
   *
   * All new revisions **must** be backward compatible with old revisions.
   */
  revision?: number
  /**
   * Optional. Additional, country-specific, sorting code. This is not used
   * in most regions. Where it is used, the value is either a string like
   * \"CEDEX\", optionally followed by a number (e.g. \"CEDEX 7\"), or just a
   * number alone, representing the \"sector code\" (Jamaica), \"delivery area
   * indicator\" (Malawi) or \"post office indicator\" (e.g. Côte d'Ivoire).
   */
  sortingCode?: string
  /**
   * Optional. Sublocality of the address.
   * For example, this can be neighborhoods, boroughs, districts.
   */
  sublocality?: string
}

export interface GoogleTypeTimeOfDay {
  /**
   * Hours of day in 24 hour format. Should be from 0 to 23. An API may choose
   * to allow the value \"24:00:00\" for scenarios like business closing time.
   */
  hours?: number
  /**
   * Minutes of hour of day. Must be from 0 to 59.
   */
  minutes?: number
  /**
   * Fractions of seconds in nanoseconds. Must be from 0 to 999,999,999.
   */
  nanos?: number
  /**
   * Seconds of minutes of the time. Must normally be from 0 to 59. An API may
   * allow the value 60 if it allows leap-seconds.
   */
  seconds?: number
}
