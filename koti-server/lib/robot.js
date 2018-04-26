import config from '../config.json';
import telegram from './telegram';
import Got from 'got';
import _ from 'lodash';

const dictionary = {
  greetings: ['hello', 'hi', 'hey', 'morning', 'day', 'afternoon', 'whatsup']
};

const answers = {
  'greetings': [
    'Hello!', 'Good day to you, sir.', 'Oh, hi!', 'Nice to meet you', 'Hi there!'
  ],
  'wat': [
    'What?', 'I did’t get that', 'Try again.', 'Sorry, I don’t understand.'
  ],
  'answerAboutSelf': [
    'A robot.', 'I am a robot', 'I’m your friend.'
  ],
  'weather': [
    'Are you Artur’s grandmother?'
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
    'Ok', 'All right', 'Sure'
  ],
  'howDareYou': [
    'Go away.', 'This is unbelivable', 'How dare you!'
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
    return this.match(lastUpdate.text).then(function(result) {
      return result;
    })

  }

  match (str) {
    let words = this.getWords(this.normalize(str));
    let isQuestion = (str.indexOf('?') > -1) ? true : false;
    let matchFound = false;

    console.log(words);

    if (isQuestion) {
      console.log('it’s a question!');
    }

    if ( containsAny(words, this.dictionary.greetings) ) {
      matchFound = true;
      return this.react('hello', this.lastUpdate);
    }

    if ( containsAny(words, ['status', 'home']) ) {
      matchFound = true;
      return this.react('homeStatus', this.lastUpdate);
    }

    if ( containsAny(words, ['weather']) ) {
      matchFound = true;
      return this.react('weather', this.lastUpdate);
    }

    if ( containsAny(words, ['time']) ) {
      matchFound = true;
      return this.react('time', this.lastUpdate);
    }

    // if human is talking about light
    if ( containsAny(words, ['light', 'lights']) ) {
      matchFound = true;
      return this.react('light', this.lastUpdate);
    }

    // nothing matched, return wat
    if (!matchFound) {
      return this.react('wat', this.lastUpdate);
    }

    this.lastInteraction = {
      str,
      words,
      isQuestion
    };
  }

  react (action, lastUpdate) {
    console.log(action);
    let answer;
    let self = this;

    switch (action) {
      case 'hello':
        answer = _.sample(this.answers.greetings);
        return this.say(this.lastUpdate, answer, this.lastUpdate.method);
        // break;
      case 'confirmation':
        answer = _.sample(this.answers.confirmations);
        return this.say(this.lastUpdate, answer, this.lastUpdate.method);
        break;
      case 'howDareYou':
        answer = _.sample(this.answers.howDareYou);
        return this.say(this.lastUpdate, answer, this.lastUpdate.method);
        break;
      case 'callNames':
        answer = _.sample(this.answers.callNames);
        return this.say(this.lastUpdate, answer, this.lastUpdate.method);
        break;
      case 'sex':
        answer = _.sample(this.answers.sex);
        return this.say(this.lastUpdate, answer, this.lastUpdate.method);
        break;
      case 'homeStatus':
        function homeStatusAnswer() {
          let status = self.controller.getData();
          let lightIs = status.lightIsOn ? 'on' : 'off';
          answer = `${_.sample(self.answers.ok)}, the temperature is ${status.temp}°, light is ${lightIs}, last movement occured ${status.lastMotion.human}`;
          return self.say(self.lastUpdate, answer, self.lastUpdate.method);
        }

        if (this.lastUpdate.method === 'telegram') {
          if ( telegram.tremblingCreatureOrHaveITheRight(lastUpdate.from.username) ) {
            return homeStatusAnswer();
          } else {
            return this.react('howDareYou', lastUpdate);
          }
        } else {
          return homeStatusAnswer();
        }
        break;
      case 'light':
        function lightSwitch() {
          // console.log('here');
          self.controller.sendCommand('lightSwitch');
          return self.react('confirmation', lastUpdate);
        }

        if (this.lastUpdate.method === 'telegram') {
          if ( telegram.tremblingCreatureOrHaveITheRight(lastUpdate.from.username) ) {
            return lightSwitch();
          } else {
            return this.react('howDareYou', lastUpdate);
          }
        } else {
          return lightSwitch();
        }
        break;
      case 'time':
        answer = `It is ${Date.now()} o’clock, robot time`;
        return this.say(this.lastUpdate, answer, this.lastUpdate.method);
        break;
      case 'weather':
        return new Promise((resolve, reject) => {
          Got(config.weatherAPI).then(res => {
            let info;
            try {
              info = JSON.parse(res.body);
            } catch (err) {
              console.log('error parsing weather JSON');
            }
            let weatherDescription = info.weather[0].description;
            let temp = Math.round(info.main.temp);
            answer = `${weatherDescription}, current temperature is ${temp}°`;
            resolve(this.say(this.lastUpdate, answer, this.lastUpdate.method));
          })
          .catch(err => {
            console.error(err);
            console.error(err.response && err.response.body);
            reject(Error('Couldn’t lookup the weather data, probably something with the cloud.'));
          });
        });
        break;
      case 'wat':
        answer = _.sample(this.answers.wat);
        return this.say(this.lastUpdate, answer, this.lastUpdate.method);
      default:
        answer = _.sample(this.answers.wat);
        return this.say(this.lastUpdate, answer, this.lastUpdate.method);
    }
  }

  say (lastUpdate, answer, method) {
    if (method === 'telegram') {
      telegram.sendMessage(lastUpdate, answer);
    }

    if (method === 'microphone') {
      console.log(answer);
    }

    return Promise.resolve(answer);
  }

}

export default Robot;
