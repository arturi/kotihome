import config from '../config.json';
import telegram from './telegram';
import request from 'request';
import _ from 'lodash';

const dictionary = {
  greetings: ['hello', 'hi', 'hey', 'morning', 'day', 'afternoon', 'whatsup']
};

const answers = {
  'greetings': [
    'Hello!', 'Good day to you, sir.', 'Oh, hi!', 'Nice to meet you', 'Hi there!'
  ],
  'wat': [
    'What?', 'I did’t get that', 'Try again.', 'Come on!', 'Sorry, I don’t understand.'
  ],
  'answerAboutSelf': [
    'A robot.', 'I am a robot', 'I’m your friend.'
  ],
  'weather': [
    'Are you Artur’s grandmother?', 'How many college degrees have you got?'
  ],
  'callNames': [
    'You are a pig!', 'What did you just call me?', 'Say that again, only louder!'
  ],
  'confirmations': [
    'Done.', 'No problem!', 'You wish is my command.', 'Taken care of.', 'Here you go, enjoy!'
  ],
  'gratitudeReply': [
    'You are welcome.', 'No problem!'
  ],
  'ok': [
    'Ok', 'All right', 'Good', 'Sure'
  ],
  'howDearYou': [
    'Go away.', 'This is unbelivable', 'How dare you!'
  ],
  'sex': [
    'Already naked', 'Take me right here', 'I am all yours', 'Please, don’t stop!'
  ]
};

function containsAll (haystack, needles) {
  for (var needle of needles) {
    if (haystack.indexOf(needle) === -1) {
      return false;
    }
  }
  return true;
}

function containsAny (haystack, needles) {
  if ( _.intersection(haystack, needles).length > 0 ) {
    return true;
  }
  return false;
}

class Robot {
  constructor (controller) {
    this.controller = controller;
    this.lastUpdate = {};
    this.dictionary = dictionary;
    this.answers = answers;
  }

  normalize (str) {
    str = str.toLowerCase();
    str = str.replace(/(\?|\!|\,|\n|\.|\/)/gi, '');
    str = str.replace(/\b\s?(the|a|an)\b\s?/gi, ' ');
    return str;
  }

  getWords (str) {
    return str.split(' ');
  }

  hear (lastUpdate) {
    this.lastUpdate = lastUpdate;
    this.match(lastUpdate.text);
  }

  match (str) {
    let words = this.getWords(this.normalize(str));
    let isQuestion = (str.indexOf('?') > -1) ? true : false;

    console.log(words);

    if (isQuestion) {
      console.log('it’s a question!');
    }

    if ( containsAny(words, this.dictionary.greetings) ) {
      this.react('hello', this.lastUpdate);
    }

    if ( containsAny(words, ['sex']) ) {
      this.react('sex', this.lastUpdate);
    }

    if ( containsAny(words, ['status', 'home']) ) {
      this.react('homeStatus', this.lastUpdate);
    }

    if ( containsAny(words, ['weather']) ) {
      this.react('weather', this.lastUpdate);
    }

    if ( containsAny(words, ['time']) ) {
      this.react('time', this.lastUpdate);
    }

    // if human is talking about light
    // && containsAny(words, ['on', 'off'])
    if ( containsAny(words, ['light', 'lights']) ) {
      this.react('light', this.lastUpdate);
    }

    this.lastInteraction = {
      str,
      words,
      isQuestion
    };
  }

  react (action, lastUpdate) {
    let answer;
    console.log(action);

    switch (action) {
      case 'hello':
        answer = _.sample(this.answers.greetings);
        this.say(this.lastUpdate, answer, 'telegram');
        break;
      case 'confirmation':
        answer = _.sample(this.answers.confirmations);
        this.say(this.lastUpdate, answer, 'telegram');
        break;
      case 'howDearYou':
        answer = _.sample(this.answers.howDearYou);
        this.say(this.lastUpdate, answer, 'telegram');
        break;
      case 'callNames':
        answer = _.sample(this.answers.callNames);
        this.say(this.lastUpdate, answer, 'telegram');
        break;
      case 'sex':
        answer = _.sample(this.answers.sex);
        this.say(this.lastUpdate, answer, 'telegram');
        break;
      case 'homeStatus':
        if ( telegram.tremblingCreatureOrHaveITheRight(lastUpdate.from.username) ) {
          let status = this.controller.getData();
          let lightIs = status.lightIsOn ? 'on' : 'off';
          answer = `${_.sample(this.answers.ok)}, the temperature is ${status.temp}°,
                    light is ${lightIs}, last movement occured ${status.lastMotion.human}`;
          this.say(this.lastUpdate, answer, 'telegram');
        } else {
          this.react('howDearYou', lastUpdate);
        }

        break;
      case 'light':
        if ( telegram.tremblingCreatureOrHaveITheRight(lastUpdate.from.username) ) {
          this.controller.sendCommand('lightSwitch');
          this.react('confirmation', lastUpdate)
        } else {
          this.react('howDearYou', lastUpdate);
        }
        break;
      case 'time':
        answer = `It is ${Date.now()} o’clock, robot time`;
        this.say(this.lastUpdate, answer, 'telegram');
        break;
      case 'weather':
        request.get(config.weatherAPI, (err, response, body) => {
          if (!err && response.statusCode == 200) {
            let info;
            try {
              info = JSON.parse(body);
            } catch (err) {
              console.log('error parsing weather JSON');
            }
            let weatherDescription = info.weather[0].description;
            let temp = Math.round(info.main.temp);
            answer = `${weatherDescription}, current temperature is ${temp}°`;
            this.say(this.lastUpdate, answer, 'telegram');
          }
        });
        break;
      default:
        answer = _.sample(this.answers.wat);
        this.say(this.lastUpdate, answer, 'telegram');
    }

  }

  say (lastUpdate, message, method) {
    if (method === 'telegram') {
      telegram.sendMessage(lastUpdate, message);
    }
  }

}

export default Robot;
