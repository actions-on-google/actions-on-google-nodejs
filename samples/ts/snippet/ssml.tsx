import * as functions from 'firebase-functions'
import { dialogflow, ssml } from '../../../src'

const app = dialogflow()

app.intent('Default Welcome Intent', conv => {
  conv.ask(
    <speak>
      Hello
      <break time="1s" strength="strong"/>
      <say-as interpret-as="characters">Hello</say-as>
      <audio src="https://actions.google.com/sounds/v1/animals/cat_purr_close.ogg">
        <desc>a cat purring</desc>
        PURR (sound didn't load)
      </audio>
      <p>
        <s>This is sentence one.</s>
        <s>This is sentence two.</s>
      </p>
      <sub alias="World Wide Web Consortium">W3C</sub>
      <prosody rate="slow" pitch="-2st">Can you hear me now?</prosody>
      <emphasis level="moderate">This is an important announcement</emphasis>
      <speak>
        <par>
          <media xmlId="question" begin="0.5s">
            <speak>Who invented the Internet?</speak>
          </media>
          <media xmlId="answer" begin="question.end+2.0s">
            <speak>The Internet was invented by cats.</speak>
          </media>
          <media begin="answer.end-0.2s" soundLevel="-6db">
            <audio src="https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg"/>
          </media>
          <media
            repeatCount={3}
            soundLevel="+2.28dB"
            fadeInDur="2s"
            fadeOutDur="0.2s">
            <audio src="https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg"/>
          </media>
        </par>
      </speak>
    </speak>,
  )
})

exports.dialog = functions.https.onRequest(app)
