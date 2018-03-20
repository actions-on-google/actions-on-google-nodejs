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

/* tslint:disable:no-any auto generated types from protobufs */

import { ApiClientObjectMap } from '../../../common'


export type GoogleActionsV2ConversationType = 'TYPE_UNSPECIFIED'|'NEW'|'ACTIVE'


export type GoogleActionsV2DeliveryAddressValueUserDecision =
  'UNKNOWN_USER_DECISION'|'ACCEPTED'|'REJECTED'


export type GoogleActionsV2EntitlementSkuType =
  'TYPE_UNSPECIFIED'|'IN_APP'|'SUBSCRIPTION'|'APP'


export type GoogleActionsV2MediaResponseMediaType =
  'MEDIA_TYPE_UNSPECIFIED'|'AUDIO'


export type GoogleActionsV2NewSurfaceValueStatus =
  'NEW_SURFACE_STATUS_UNSPECIFIED'|'CANCELLED'|'OK'


export type GoogleActionsV2OrdersActionProvidedPaymentOptionsPaymentType =
  'PAYMENT_TYPE_UNSPECIFIED'|'PAYMENT_CARD'|'BANK'|'LOYALTY_PROGRAM'|
  'ON_FULFILLMENT'|'GIFT_CARD'


export type GoogleActionsV2OrdersCustomerInfoOptionsCustomerInfoProperties =
  'CUSTOMER_INFO_PROPERTY_UNSPECIFIED'|'EMAIL'


export type GoogleActionsV2OrdersGoogleProvidedPaymentOptionsSupportedCardNetworks =
  'UNSPECIFIED_CARD_NETWORK'|'AMEX'|'DISCOVER'|'MASTERCARD'|'VISA'|'JCB'


export type GoogleActionsV2OrdersLineItemType = 'UNSPECIFIED'|'REGULAR'|'TAX'|
  'DISCOUNT'|'GRATUITY'|'DELIVERY'|'SUBTOTAL'|'FEE'


export type GoogleActionsV2OrdersOrderLocationType =
  'UNKNOWN'|'DELIVERY'|'BUSINESS'|'ORIGIN'|'DESTINATION'|'PICK_UP'


export type GoogleActionsV2OrdersOrderUpdateActionType =
  'UNKNOWN'|'VIEW_DETAILS'|'MODIFY'|'CANCEL'|'RETURN'|'EXCHANGE'|'EMAIL'|
  'CALL'|'REORDER'|'REVIEW'|'CUSTOMER_SERVICE'


export type GoogleActionsV2OrdersPaymentInfoPaymentType =
  'PAYMENT_TYPE_UNSPECIFIED'|'PAYMENT_CARD'|'BANK'|'LOYALTY_PROGRAM'|
  'ON_FULFILLMENT'|'GIFT_CARD'


export type GoogleActionsV2OrdersPaymentMethodTokenizationParametersTokenizationType =
  'UNSPECIFIED_TOKENIZATION_TYPE'|'PAYMENT_GATEWAY'|'DIRECT'


export type GoogleActionsV2OrdersPriceType = 'UNKNOWN'|'ESTIMATE'|'ACTUAL'


export type GoogleActionsV2OrdersRejectionInfoType = 'UNKNOWN'|
  'PAYMENT_DECLINED'|'INELIGIBLE'|'PROMO_NOT_APPLICABLE'|'UNAVAILABLE_SLOT'


export type GoogleActionsV2OrdersTimeType =
  'UNKNOWN'|'DELIVERY_DATE'|'ETA'|'RESERVATION_SLOT'


export type GoogleActionsV2PermissionValueSpecPermissions =
  'UNSPECIFIED_PERMISSION'|'NAME'|'DEVICE_PRECISE_LOCATION'|
  'DEVICE_COARSE_LOCATION'|'UPDATE'


export type GoogleActionsV2RawInputInputType =
  'UNSPECIFIED_INPUT_TYPE'|'TOUCH'|'VOICE'|'KEYBOARD'


export type GoogleActionsV2RegisterUpdateValueStatus =
  'REGISTER_UPDATE_STATUS_UNSPECIFIED'|'OK'|'CANCELLED'


export type GoogleActionsV2SignInValueStatus =
  'SIGN_IN_STATUS_UNSPECIFIED'|'OK'|'CANCELLED'|'ERROR'


export type GoogleActionsV2TransactionDecisionValueUserDecision =
  'UNKNOWN_USER_DECISION'|'ORDER_ACCEPTED'|'ORDER_REJECTED'|
  'DELIVERY_ADDRESS_UPDATED'|'CART_CHANGE_REQUESTED'


export type GoogleActionsV2TransactionRequirementsCheckResultResultType =
  'RESULT_TYPE_UNSPECIFIED'|'OK'|'USER_ACTION_REQUIRED'|
  'ASSISTANT_SURFACE_NOT_SUPPORTED'|'REGION_NOT_SUPPORTED'


export type GoogleActionsV2TriggerContextTimeContextFrequency =
  'FREQUENCY_UNSPECIFIED'|'DAILY'


export type GoogleActionsV2UiElementsBasicCardImageDisplayOptions =
  'DEFAULT'|'WHITE'|'CROPPED'


export type GoogleActionsV2UiElementsCarouselBrowseImageDisplayOptions =
  'DEFAULT'|'WHITE'|'CROPPED'


export type GoogleActionsV2UiElementsCarouselSelectImageDisplayOptions =
  'DEFAULT'|'WHITE'|'CROPPED'


export type GoogleActionsV2UiElementsOpenUrlActionUrlTypeHint =
  'URL_TYPE_HINT_UNSPECIFIED'|'AMP_CONTENT'


export type GoogleActionsV2UserPermissions = 'UNSPECIFIED_PERMISSION'|'NAME'|
  'DEVICE_PRECISE_LOCATION'|'DEVICE_COARSE_LOCATION'|'UPDATE'


export interface GoogleActionsV2AppRequest {
  user?: GoogleActionsV2User
  device?: GoogleActionsV2Device
  surface?: GoogleActionsV2Surface
  conversation?: GoogleActionsV2Conversation
  inputs?: GoogleActionsV2Input[]
  isInSandbox?: boolean
  availableSurfaces?: GoogleActionsV2Surface[]
}

export interface GoogleActionsV2AppResponse {
  conversationToken?: string
  userStorage?: string
  resetUserStorage?: boolean
  expectUserResponse?: boolean
  expectedInputs?: GoogleActionsV2ExpectedInput[]
  finalResponse?: GoogleActionsV2FinalResponse
  customPushMessage?: GoogleActionsV2CustomPushMessage
  isInSandbox?: boolean
}

export interface GoogleActionsV2Argument {
  name?: string
  rawText?: string
  textValue?: string
  status?: GoogleRpcStatus
  intValue?: string
  floatValue?: number
  boolValue?: boolean
  datetimeValue?: GoogleActionsV2DateTime
  placeValue?: GoogleActionsV2Location
  extension?: ApiClientObjectMap<any>
  structuredValue?: ApiClientObjectMap<any>
}

export interface GoogleActionsV2Capability {
  name?: string
}

export interface GoogleActionsV2ConfirmationValueSpec {
  dialogSpec?: GoogleActionsV2ConfirmationValueSpecConfirmationDialogSpec
}

export interface GoogleActionsV2ConfirmationValueSpecConfirmationDialogSpec {
  requestConfirmationText?: string
}

export interface GoogleActionsV2Conversation {
  conversationId?: string
  type?: GoogleActionsV2ConversationType
  conversationToken?: string
}

export interface GoogleActionsV2CustomPushMessage {
  orderUpdate?: GoogleActionsV2OrdersOrderUpdate
  userNotification?: GoogleActionsV2UserNotification
  target?: GoogleActionsV2CustomPushMessageTarget
}

export interface GoogleActionsV2CustomPushMessageTarget {
  userId?: string
  intent?: string
  argument?: GoogleActionsV2Argument
  locale?: string
}

export interface GoogleActionsV2DateTime {
  date?: GoogleTypeDate
  time?: GoogleTypeTimeOfDay
}

export interface GoogleActionsV2DateTimeValueSpec {
  dialogSpec?: GoogleActionsV2DateTimeValueSpecDateTimeDialogSpec
}

export interface GoogleActionsV2DateTimeValueSpecDateTimeDialogSpec {
  requestDatetimeText?: string
  requestDateText?: string
  requestTimeText?: string
}

export interface GoogleActionsV2DeliveryAddressValue {
  userDecision?: GoogleActionsV2DeliveryAddressValueUserDecision
  location?: GoogleActionsV2Location
}

export interface GoogleActionsV2DeliveryAddressValueSpec {
  addressOptions?: GoogleActionsV2DeliveryAddressValueSpecAddressOptions
}

export interface GoogleActionsV2DeliveryAddressValueSpecAddressOptions {
  reason?: string
}

export interface GoogleActionsV2Device {
  location?: GoogleActionsV2Location
}

export interface GoogleActionsV2DevicesAndroidApp {
  packageName?: string
  versions?: GoogleActionsV2DevicesAndroidAppVersionFilter[]
}

export interface GoogleActionsV2DevicesAndroidAppVersionFilter {
  minVersion?: number
  maxVersion?: number
}

export interface GoogleActionsV2DialogSpec {
  extension?: ApiClientObjectMap<any>
}

export interface GoogleActionsV2Entitlement {
  sku?: string
  skuType?: GoogleActionsV2EntitlementSkuType
  inAppDetails?: GoogleActionsV2SignedData
}

export interface GoogleActionsV2ExpectedInput {
  inputPrompt?: GoogleActionsV2InputPrompt
  possibleIntents?: GoogleActionsV2ExpectedIntent[]
  speechBiasingHints?: string[]
}

export interface GoogleActionsV2ExpectedIntent {
  intent?: string
  inputValueData?: ApiClientObjectMap<any>
  parameterName?: string
}

export interface GoogleActionsV2FinalResponse {
  richResponse?: GoogleActionsV2RichResponse
}

export interface GoogleActionsV2Input {
  rawInputs?: GoogleActionsV2RawInput[]
  intent?: string
  arguments?: GoogleActionsV2Argument[]
}

export interface GoogleActionsV2InputPrompt {
  richInitialPrompt?: GoogleActionsV2RichResponse
  noInputPrompts?: GoogleActionsV2SimpleResponse[]
}

export interface GoogleActionsV2LinkValueSpec {
  openUrlAction?: GoogleActionsV2UiElementsOpenUrlAction
  dialogSpec?: GoogleActionsV2DialogSpec
}

export interface GoogleActionsV2LinkValueSpecLinkDialogSpec {
  destinationName?: string
  requestLinkReason?: string
}

export interface GoogleActionsV2Location {
  coordinates?: GoogleTypeLatLng
  formattedAddress?: string
  zipCode?: string
  city?: string
  postalAddress?: GoogleTypePostalAddress
  name?: string
  phoneNumber?: string
  notes?: string
}

export interface GoogleActionsV2MediaObject {
  name?: string
  description?: string
  largeImage?: GoogleActionsV2UiElementsImage
  icon?: GoogleActionsV2UiElementsImage
  contentUrl?: string
}

export interface GoogleActionsV2MediaResponse {
  mediaType?: GoogleActionsV2MediaResponseMediaType
  mediaObjects?: GoogleActionsV2MediaObject[]
}

export interface GoogleActionsV2NewSurfaceValue {
  status?: GoogleActionsV2NewSurfaceValueStatus
}

export interface GoogleActionsV2NewSurfaceValueSpec {
  capabilities?: string[]
  context?: string
  notificationTitle?: string
}

export interface GoogleActionsV2OptionInfo {
  key?: string
  synonyms?: string[]
}

export interface GoogleActionsV2OptionValueSpec {
  simpleSelect?: GoogleActionsV2SimpleSelect
  listSelect?: GoogleActionsV2UiElementsListSelect
  carouselSelect?: GoogleActionsV2UiElementsCarouselSelect
}

export interface GoogleActionsV2OrdersActionProvidedPaymentOptions {
  paymentType?: GoogleActionsV2OrdersActionProvidedPaymentOptionsPaymentType
  displayName?: string
}

export interface GoogleActionsV2OrdersCancellationInfo {
  reason?: string
}

export interface GoogleActionsV2OrdersCart {
  id?: string
  merchant?: GoogleActionsV2OrdersMerchant
  lineItems?: GoogleActionsV2OrdersLineItem[]
  otherItems?: GoogleActionsV2OrdersLineItem[]
  notes?: string
  promotions?: GoogleActionsV2OrdersPromotion[]
  extension?: ApiClientObjectMap<any>
}

export interface GoogleActionsV2OrdersCustomerInfo {
  email?: string
}

export interface GoogleActionsV2OrdersCustomerInfoOptions {
  customerInfoProperties?:
    GoogleActionsV2OrdersCustomerInfoOptionsCustomerInfoProperties[]
}

export interface GoogleActionsV2OrdersFulfillmentInfo {
  deliveryTime?: string
}

export interface GoogleActionsV2OrdersGenericExtension {
  locations?: GoogleActionsV2OrdersOrderLocation[]
  time?: GoogleActionsV2OrdersTime
}

export interface GoogleActionsV2OrdersGoogleProvidedPaymentOptions {
  tokenizationParameters?:
    GoogleActionsV2OrdersPaymentMethodTokenizationParameters
  supportedCardNetworks?: GoogleActionsV2OrdersGoogleProvidedPaymentOptionsSupportedCardNetworks[]
  prepaidCardDisallowed?: boolean
}

export interface GoogleActionsV2OrdersInTransitInfo {
  updatedTime?: string
}

export interface GoogleActionsV2OrdersLineItem {
  id?: string
  name?: string
  type?: GoogleActionsV2OrdersLineItemType
  quantity?: number
  description?: string
  image?: GoogleActionsV2UiElementsImage
  price?: GoogleActionsV2OrdersPrice
  subLines?: GoogleActionsV2OrdersLineItemSubLine[]
  offerId?: string
  extension?: ApiClientObjectMap<any>
}

export interface GoogleActionsV2OrdersLineItemSubLine {
  lineItem?: GoogleActionsV2OrdersLineItem
  note?: string
}

export interface GoogleActionsV2OrdersLineItemUpdate {
  orderState?: GoogleActionsV2OrdersOrderState
  price?: GoogleActionsV2OrdersPrice
  reason?: string
  extension?: ApiClientObjectMap<any>
}

export interface GoogleActionsV2OrdersMerchant {
  id?: string
  name?: string
}

export interface GoogleActionsV2OrdersOrder {
  finalOrder?: GoogleActionsV2OrdersProposedOrder
  googleOrderId?: string
  orderDate?: string
  paymentInfo?: GoogleActionsV2OrdersPaymentInfo
  actionOrderId?: string
  customerInfo?: GoogleActionsV2OrdersCustomerInfo
}

export interface GoogleActionsV2OrdersOrderLocation {
  type?: GoogleActionsV2OrdersOrderLocationType
  location?: GoogleActionsV2Location
}

export interface GoogleActionsV2OrdersOrderOptions {
  requestDeliveryAddress?: boolean
  customerInfoOptions?: GoogleActionsV2OrdersCustomerInfoOptions
}

export interface GoogleActionsV2OrdersOrderState {
  state?: string
  label?: string
}

export interface GoogleActionsV2OrdersOrderUpdate {
  googleOrderId?: string
  actionOrderId?: string
  orderState?: GoogleActionsV2OrdersOrderState
  orderManagementActions?: GoogleActionsV2OrdersOrderUpdateAction[]
  receipt?: GoogleActionsV2OrdersReceipt
  rejectionInfo?: GoogleActionsV2OrdersRejectionInfo
  cancellationInfo?: GoogleActionsV2OrdersCancellationInfo
  inTransitInfo?: GoogleActionsV2OrdersInTransitInfo
  fulfillmentInfo?: GoogleActionsV2OrdersFulfillmentInfo
  returnInfo?: GoogleActionsV2OrdersReturnInfo
  updateTime?: string
  totalPrice?: GoogleActionsV2OrdersPrice
  lineItemUpdates?: ApiClientObjectMap<GoogleActionsV2OrdersLineItemUpdate>
  userNotification?: GoogleActionsV2OrdersOrderUpdateUserNotification
  infoExtension?: ApiClientObjectMap<any>
}

export interface GoogleActionsV2OrdersOrderUpdateAction {
  type?: GoogleActionsV2OrdersOrderUpdateActionType
  button?: GoogleActionsV2UiElementsButton
}

export interface GoogleActionsV2OrdersOrderUpdateUserNotification {
  title?: string
  text?: string
}

export interface GoogleActionsV2OrdersPaymentInfo {
  paymentType?: GoogleActionsV2OrdersPaymentInfoPaymentType
  displayName?: string
  googleProvidedPaymentInstrument?:
    GoogleActionsV2OrdersPaymentInfoGoogleProvidedPaymentInstrument
}

export interface GoogleActionsV2OrdersPaymentInfoGoogleProvidedPaymentInstrument {
  instrumentToken?: string
}

export interface GoogleActionsV2OrdersPaymentMethodTokenizationParameters {
  tokenizationType?:
    GoogleActionsV2OrdersPaymentMethodTokenizationParametersTokenizationType
  parameters?: ApiClientObjectMap<string>
}

export interface GoogleActionsV2OrdersPaymentOptions {
  googleProvidedOptions?: GoogleActionsV2OrdersGoogleProvidedPaymentOptions
  actionProvidedOptions?: GoogleActionsV2OrdersActionProvidedPaymentOptions
}

export interface GoogleActionsV2OrdersPrice {
  type?: GoogleActionsV2OrdersPriceType
  amount?: GoogleTypeMoney
}

export interface GoogleActionsV2OrdersPromotion {
  coupon?: string
}

export interface GoogleActionsV2OrdersProposedOrder {
  id?: string
  cart?: GoogleActionsV2OrdersCart
  otherItems?: GoogleActionsV2OrdersLineItem[]
  image?: GoogleActionsV2UiElementsImage
  termsOfServiceUrl?: string
  totalPrice?: GoogleActionsV2OrdersPrice
  extension?: ApiClientObjectMap<any>
}

export interface GoogleActionsV2OrdersReceipt {
  confirmedActionOrderId?: string
  userVisibleOrderId?: string
}

export interface GoogleActionsV2OrdersRejectionInfo {
  type?: GoogleActionsV2OrdersRejectionInfoType
  reason?: string
}

export interface GoogleActionsV2OrdersReturnInfo {
  reason?: string
}

export interface GoogleActionsV2OrdersTime {
  type?: GoogleActionsV2OrdersTimeType
  timeIso8601?: string
}

export interface GoogleActionsV2PackageEntitlement {
  packageName?: string
  entitlements?: GoogleActionsV2Entitlement[]
}

export interface GoogleActionsV2PermissionValueSpec {
  optContext?: string
  permissions?: GoogleActionsV2PermissionValueSpecPermissions[]
  updatePermissionValueSpec?: GoogleActionsV2UpdatePermissionValueSpec
}

export interface GoogleActionsV2PlaceValueSpec {
  dialogSpec?: GoogleActionsV2DialogSpec
}

export interface GoogleActionsV2PlaceValueSpecPlaceDialogSpec {
  requestPrompt?: string
  permissionContext?: string
}

export interface GoogleActionsV2RawInput {
  inputType?: GoogleActionsV2RawInputInputType
  query?: string
}

export interface GoogleActionsV2RegisterUpdateValue {
  status?: GoogleActionsV2RegisterUpdateValueStatus
}

export interface GoogleActionsV2RegisterUpdateValueSpec {
  intent?: string
  arguments?: GoogleActionsV2Argument[]
  triggerContext?: GoogleActionsV2TriggerContext
}

export interface GoogleActionsV2RichResponse {
  items?: GoogleActionsV2RichResponseItem[]
  suggestions?: GoogleActionsV2UiElementsSuggestion[]
  linkOutSuggestion?: GoogleActionsV2UiElementsLinkOutSuggestion
}

export interface GoogleActionsV2RichResponseItem {
  simpleResponse?: GoogleActionsV2SimpleResponse
  basicCard?: GoogleActionsV2UiElementsBasicCard
  structuredResponse?: GoogleActionsV2StructuredResponse
  mediaResponse?: GoogleActionsV2MediaResponse
  carouselBrowse?: GoogleActionsV2UiElementsCarouselBrowse
}

export interface GoogleActionsV2SignInValue {
  status?: GoogleActionsV2SignInValueStatus
}

export interface GoogleActionsV2SignInValueSpec {}

export interface GoogleActionsV2SignedData {
  inAppPurchaseData?: ApiClientObjectMap<any>
  inAppDataSignature?: string
}

export interface GoogleActionsV2SimpleResponse {
  textToSpeech?: string
  ssml?: string
  displayText?: string
}

export interface GoogleActionsV2SimpleSelect {
  items?: GoogleActionsV2SimpleSelectItem[]
}

export interface GoogleActionsV2SimpleSelectItem {
  optionInfo?: GoogleActionsV2OptionInfo
  title?: string
}

export interface GoogleActionsV2StructuredResponse {
  orderUpdate?: GoogleActionsV2OrdersOrderUpdate
}

export interface GoogleActionsV2Surface {
  capabilities?: GoogleActionsV2Capability[]
}

export interface GoogleActionsV2TransactionDecisionValue {
  checkResult?: GoogleActionsV2TransactionRequirementsCheckResult
  userDecision?: GoogleActionsV2TransactionDecisionValueUserDecision
  order?: GoogleActionsV2OrdersOrder
  deliveryAddress?: GoogleActionsV2Location
}

export interface GoogleActionsV2TransactionDecisionValueSpec {
  proposedOrder?: GoogleActionsV2OrdersProposedOrder
  orderOptions?: GoogleActionsV2OrdersOrderOptions
  paymentOptions?: GoogleActionsV2OrdersPaymentOptions
}

export interface GoogleActionsV2TransactionRequirementsCheckResult {
  resultType?: GoogleActionsV2TransactionRequirementsCheckResultResultType
}

export interface GoogleActionsV2TransactionRequirementsCheckSpec {
  orderOptions?: GoogleActionsV2OrdersOrderOptions
  paymentOptions?: GoogleActionsV2OrdersPaymentOptions
}

export interface GoogleActionsV2TriggerContext {
  timeContext?: GoogleActionsV2TriggerContextTimeContext
}

export interface GoogleActionsV2TriggerContextTimeContext {
  frequency?: GoogleActionsV2TriggerContextTimeContextFrequency
}

export interface GoogleActionsV2UiElementsBasicCard {
  title?: string
  subtitle?: string
  formattedText?: string
  image?: GoogleActionsV2UiElementsImage
  buttons?: GoogleActionsV2UiElementsButton[]
  imageDisplayOptions?: GoogleActionsV2UiElementsBasicCardImageDisplayOptions
}

export interface GoogleActionsV2UiElementsButton {
  title?: string
  openUrlAction?: GoogleActionsV2UiElementsOpenUrlAction
}

export interface GoogleActionsV2UiElementsCarouselBrowse {
  items?: GoogleActionsV2UiElementsCarouselBrowseItem[]
  imageDisplayOptions?:
    GoogleActionsV2UiElementsCarouselBrowseImageDisplayOptions
}

export interface GoogleActionsV2UiElementsCarouselBrowseItem {
  title?: string
  description?: string
  footer?: string
  image?: GoogleActionsV2UiElementsImage
  openUrlAction?: GoogleActionsV2UiElementsOpenUrlAction
}

export interface GoogleActionsV2UiElementsCarouselSelect {
  items?: GoogleActionsV2UiElementsCarouselSelectCarouselItem[]
  imageDisplayOptions?:
    GoogleActionsV2UiElementsCarouselSelectImageDisplayOptions
}

export interface GoogleActionsV2UiElementsCarouselSelectCarouselItem {
  optionInfo?: GoogleActionsV2OptionInfo
  title?: string
  description?: string
  image?: GoogleActionsV2UiElementsImage
}

export interface GoogleActionsV2UiElementsImage {
  url?: string
  accessibilityText?: string
  height?: number
  width?: number
}

export interface GoogleActionsV2UiElementsLinkOutSuggestion {
  destinationName?: string
  url?: string
  openUrlAction?: GoogleActionsV2UiElementsOpenUrlAction
}

export interface GoogleActionsV2UiElementsListSelect {
  title?: string
  items?: GoogleActionsV2UiElementsListSelectListItem[]
}

export interface GoogleActionsV2UiElementsListSelectListItem {
  optionInfo?: GoogleActionsV2OptionInfo
  title?: string
  description?: string
  image?: GoogleActionsV2UiElementsImage
}

export interface GoogleActionsV2UiElementsOpenUrlAction {
  url?: string
  androidApp?: GoogleActionsV2DevicesAndroidApp
  urlTypeHint?: GoogleActionsV2UiElementsOpenUrlActionUrlTypeHint
}

export interface GoogleActionsV2UiElementsSuggestion {
  title?: string
}

export interface GoogleActionsV2UpdatePermissionValueSpec {
  intent?: string
  arguments?: GoogleActionsV2Argument[]
}

export interface GoogleActionsV2User {
  userId?: string
  profile?: GoogleActionsV2UserProfile
  accessToken?: string
  permissions?: GoogleActionsV2UserPermissions[]
  locale?: string
  lastSeen?: string
  userStorage?: string
  packageEntitlements?: GoogleActionsV2PackageEntitlement[]
}

export interface GoogleActionsV2UserNotification {
  title?: string
  text?: string
}

export interface GoogleActionsV2UserProfile {
  displayName?: string
  givenName?: string
  familyName?: string
}

export interface GoogleRpcStatus {
  code?: number
  message?: string
  details?: ApiClientObjectMap<any>[]
}

export interface GoogleTypeDate {
  year?: number
  month?: number
  day?: number
}

export interface GoogleTypeLatLng {
  latitude?: number
  longitude?: number
}

export interface GoogleTypeMoney {
  currencyCode?: string
  units?: string
  nanos?: number
}

export interface GoogleTypePostalAddress {
  revision?: number
  regionCode?: string
  languageCode?: string
  postalCode?: string
  sortingCode?: string
  administrativeArea?: string
  locality?: string
  sublocality?: string
  addressLines?: string[]
  recipients?: string[]
  organization?: string
}

export interface GoogleTypeTimeOfDay {
  hours?: number
  minutes?: number
  seconds?: number
  nanos?: number
}
