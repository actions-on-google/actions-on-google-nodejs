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

const functions = require('firebase-functions')
const maps = require('@google/maps')
const url = require('url')
const {
  dialogflow,
  Contexts,
  DialogflowConversation,
  Image,
  SurfaceCapability,
  GoogleActionsV2UserPermissions,
  Permission,
  PermissionArgument,
  NewSurface,
} = require('actions-on-google')

const { ssml } = require('./util')

const config = functions.config()

const client = maps.createClient({ key: config.maps.key })

const STATIC_MAPS_ADDRESS = 'https://maps.googleapis.com/maps/api/staticmap'
const STATIC_MAPS_SIZE = '640x640'

const locationResponse = (city, speech) => {
  const staticMapsURL = url.parse(STATIC_MAPS_ADDRESS, true)
  staticMapsURL.query = {
    key: config.maps.key,
    size: STATIC_MAPS_SIZE,
  }
  staticMapsURL.query.center = city
  const mapViewURL = url.format(staticMapsURL)
  return [
    speech,
    new Image({
      url: mapViewURL,
      alt: 'City Map',
    }),
  ]
}

const responses = {
  sayName: name => ssml`
    <speak>
      I am reading your mind now.
      <break time="2s"/>
      This is easy, you are ${name}
      <break time="500ms"/>
      I hope I pronounced that right.
      <break time="500ms"/>
      Okay! I am off to read more minds.
    </speak>
  `,
  sayLocation: city => locationResponse(city, ssml`
    <speak>
      I am reading your mind now.
      <break time="2s"/>
      This is easy, you are in ${city}
      <break time="500ms"/>
      That is a beautiful town.
      <break time="500ms"/>
      Okay! I am off to read more minds.
    </speak>
  `),
  greetUser: ssml`
    <speak>
      Welcome to your Psychic!
      <break time="500ms"/>
      My mind is more powerful than you know.
      I wonder which of your secrets I shall unlock.
      Would you prefer I guess your name, or your location?
    </speak>
  `,
  unhandledDeepLinks: input => ssml`
    <speak>
      Welcome to your Psychic! I can guess many things about you,
      but I cannot make guesses about ${input}.
      Instead, I shall guess your name or location. Which do you prefer?
    </speak>
  `,
  readMindError: ssml`
    <speak>
      Wow!
      <break time="1s"/>
      This has never happened before. I cannot read your mind. I need more practice.
      Ask me again later.
    </speak>
  `,
  permissionReason: 'To read your mind',
  newSurfaceContext: 'To show you your location',
  notificationText: 'See you where you are...',
}

const coordinatesToCity = (latitude, longitude) => {
  const latlng = [latitude, longitude]
  return new Promise((resolve, reject) => client.reverseGeocode({ latlng },
    (e, response) => {
      if (e) {
        return reject(e)
      }
      const { results } = response.json
      const components = results[0].address_components
      for (const component of components) {
        for (const type of component.types) {
          if (type === 'locality') {
            return resolve(component.long_name)
          }
        }
      }
      reject(new Error('Could not parse city name from Google Maps results'))
    })
  )
}

const showLocationOnScreen = conv => {
  const capability = 'actions.capability.SCREEN_OUTPUT'
  if (conv.surface.capabilities.has(capability) ||
    !conv.available.surfaces.capabilities.has(capability)) {
    return conv.close(...responses.sayLocation(conv.user.storage.location))
  }
  conv.ask(new NewSurface({
    context: responses.newSurfaceContext,
    notification: responses.notificationText,
    capabilities: capability,
  }))
}

const app = dialogflow({ debug: true })

app.intent('Default Welcome Intent', conv => {
  // conv.user.storage = {}
  // Uncomment above to delete the cached permissions on each request
  // to force the app to request new permissions from the user
  conv.ask(responses.greetUser)
})

app.intent('Unrecognized Deep Link Fallback', conv => {
  conv.ask(responses.unhandledDeepLinks(conv.query))
})

app.intent('request_name_permission', conv => {
  conv.data.requestedPermission = 'NAME'
  if (!conv.user.storage.name) {
    return conv.ask(new Permission({
      context: responses.permissionReason,
      permissions: conv.data.requestedPermission,
    }))
  }
  conv.close(responses.sayName(conv.user.storage.name))
})

app.intent('request_location_permission', conv => {
  // If the request comes from a phone, we can't use coarse location.
  conv.data.requestedPermission = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
    ? 'DEVICE_PRECISE_LOCATION'
    : 'DEVICE_COARSE_LOCATION'
  if (!conv.user.storage.location) {
    return conv.ask(new Permission({
      context: responses.permissionReason,
      permissions: conv.data.requestedPermission,
    }))
  }
  showLocationOnScreen(conv)
})

app.intent('handle_permission', (conv, params, permissionGranted) => {
  if (!permissionGranted) {
    throw new Error('Permission not granted')
  }
  const { requestedPermission } = conv.data
  if (requestedPermission === 'NAME') {
    conv.user.storage.name = conv.user.name.display
    return conv.close(responses.sayName(conv.user.storage.name))
  }
  if (requestedPermission === 'DEVICE_COARSE_LOCATION') {
    // If we requested coarse location, it means that we're on a speaker device.
    conv.user.storage.location = conv.device.location.city
    return showLocationOnScreen(conv)
  }
  if (requestedPermission === 'DEVICE_PRECISE_LOCATION') {
    // If we requested precise location, it means that we're on a phone.
    // Because we will get only latitude and longitude, we need to reverse geocode
    // to get the city.
    const { coordinates } = conv.device.location
    return coordinatesToCity(coordinates.latitude, coordinates.longitude)
      .then(city => {
        conv.user.storage.location = city
        showLocationOnScreen(conv)
      })
  }
  throw new Error('Unrecognized permission')
})

app.intent('new_surface', conv => conv.close(...responses.sayLocation(conv.user.storage.location)))

app.catch((conv, e) => {
  console.error(e)
  conv.close(responses.readMindError)
})

exports.namePsychic = functions.https.onRequest(app)
