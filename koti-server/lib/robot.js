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

  // hearText (lastUpdate) {
  //   this.lastUpdate = lastUpdate;
  //   let messageText = lastUpdate.text;

  //   let matchFound = false;
  //   this.knowledge.commands.some((item) => {
  //     var regex = new RegExp(item.pattern, item.flag);
  //     var match = messageText.match(regex);
  //     console.log(match);

  //     // if nothing matched, go to the next knowledge item
  //     if (!match) {
  //       return false;
  //     } else {
  //       matchFound = true;
  //     }

  //     // check if there is an argument to pass to the callback function
  //     if (match[1]) {
  //       var arg = match[1];
  //       this[item.action](lastUpdate, arg);
  //     } else {
  //       this[item.action](lastUpdate);
  //     }

  //     return true;
  //   });

  //   if (!matchFound) {
  //     this.actions.wat();
  //   }
  // }

  // light(lastUpdate) {
  //   // let answer;
  //   // Check if user has the right for this command
  //   if ( telegram.tremblingCreatureOrHaveITheRight(lastUpdate.from.username) ) {
  //     this.controller.sendCommand('lightSwitch');
  //     this.answer('confirmation', lastUpdate)
  //     // answer = _.sample(this.knowledge.answers.confirmations);
  //     // this.say(this.lastUpdate, answer, 'telegram');
  //   } else {
  //     // answer = _.sample(this.knowledge.answers.howDearYou);
  //     this.answer('howDearYou', lastUpdate);
  //   }
  // }

  // hello(lastUpdate) {
  //   var answer = robot.memory.answers.greetings.pick();
  //   robot.say(robot.memory.lastUpdate, answer, 'telegram');
  // }

  // callNames(lastUpdate) {
  //   var answer = robot.memory.answers.callNames.pick();
  //   robot.say(robot.memory.lastUpdate, answer, 'telegram');
  // }

  // sex(lastUpdate) {
  //   var answer = robot.memory.answers.sex.pick();
  //   robot.say(robot.memory.lastUpdate, answer, 'telegram');
  // }

  // wat(lastUpdate) {
  //   var answer = robot.memory.answers.wat.pick();
  //   robot.say(robot.memory.lastUpdate, answer, 'telegram');
  // }

  // info(lastUpdate, aboutThis) {
  //   var answer;
  //   console.log(aboutThis);

  //   if (aboutThis === 'time') {
  //     answer = 'It is ' + Date.now() + ' o’clock, robot time';
  //     robot.say(robot.memory.lastUpdate, answer, 'telegram');
  //   } else if (aboutThis === 'weather') {
  //     request.get(config.weatherAPI, function (error, response, body) {
  //       if (!error && response.statusCode == 200) {
  //         var info;
  //         try {
  //           info = JSON.parse(body);
  //         } catch (err){
  //           console.log('error parsing weather JSON');
  //         }
  //         answer = info.weather[0].description + ', current temperature is ' + Math.round(info.main.temp) + '°';
  //         robot.say(robot.memory.lastUpdate, answer, 'telegram');
  //       }
  //     });
  //   } else {
  //     answer = robot.memory.answers.ok.pick() + ': ';
  //     robot.say(robot.memory.lastUpdate, answer, 'telegram');
  //   }
  // }

// module.exports = function(controller) {
//   var robot = {
//     memory: {
//       lastUpdate: {},
//       commands: [
//         { pattern: '(?:turn|turn the|switch|switch the) light (?:on|off)', flag: 'i', action: 'light' },
//         { pattern: '(?:I want to have|lets have|let’s have) sex', flag: 'i', action: 'sex' },
//         { pattern: 'hello|hi|hey|good morning|good day|good afternoon', flag: 'i', action: 'hello' },
//         { pattern: '(?:what is|whats|how is|hows) (?:the|a) (.*)', flag: 'i', action: 'info' }
//       ],
//       answers: {
//         'greetings': [
//           'Hello!', 'Good day to you, sir.', 'Oh, hi!', 'Nice to meet you', 'Hi there!'
//         ],
//         'wat': [
//           'What?', 'I did’t get that', 'Try again.', 'Come on!', 'Sorry, I don’t understand.'
//         ],
//         'answerAboutSelf': [
//           'A robot.', 'I am a robot', 'I’m your friend.'
//         ],
//         'weather': [
//           'Are you Artur’s grandmother?', 'How many college degrees have you got?'
//         ],
//         'callNames': [
//           'You are a pig!', 'What did you just call me?', 'Say that again, only louder!'
//         ],
//         'confirmations': [
//           'Done.', 'No problem!', 'You wish is my command.', 'Taken care of.', 'Here you go, enjoy!'
//         ],
//         'gratitudeReply': [
//           'You are welcome.', 'No problem!'
//         ],
//         'ok': [
//           'ok', 'all right', 'good', 'sure'
//         ],
//         'howDearYou': [
//           'Go away.', 'This is unbelivable', 'How dare you!'
//         ],
//         'sex': [
//           'Already naked', 'Take me right here', 'I am all yours', 'Please, don’t stop!'
//         ]
//       }
//     },
//     actions: {
//       light: function(lastUpdate) {
//         // Check if user has the right for this command
//         var answer;
//         if ( telegram.tremblingCreatureOrHaveITheRight(lastUpdate.from.username) ) {
//           controller.sendCommand('lightSwitch');
//           answer = robot.memory.answers.confirmations.pick();
//           robot.say(robot.memory.lastUpdate, answer, 'telegram');
//         } else {
//           answer = robot.memory.answers.howDearYou.pick();
//           robot.say(robot.memory.lastUpdate, answer, 'telegram');
//         }

//       },
//       hello: function(lastUpdate) {
//         var answer = robot.memory.answers.greetings.pick();
//         robot.say(robot.memory.lastUpdate, answer, 'telegram');
//       },
//       callNames: function(lastUpdate) {
//         var answer = robot.memory.answers.callNames.pick();
//         robot.say(robot.memory.lastUpdate, answer, 'telegram');
//       },
//       sex: function(lastUpdate) {
//         var answer = robot.memory.answers.sex.pick();
//         robot.say(robot.memory.lastUpdate, answer, 'telegram');
//       },
//       wat: function(lastUpdate) {
//         var answer = robot.memory.answers.wat.pick();
//         robot.say(robot.memory.lastUpdate, answer, 'telegram');
//       },
//       info: function(lastUpdate, aboutThis) {
//         var answer;
//         console.log(aboutThis);

//         if (aboutThis === 'time') {
//           answer = 'It is ' + Date.now() + ' o’clock, robot time';
//           robot.say(robot.memory.lastUpdate, answer, 'telegram');
//         } else if (aboutThis === 'weather') {
//           request.get(config.weatherAPI, function (error, response, body) {
//             if (!error && response.statusCode == 200) {
//               var info;
//               try {
//                 info = JSON.parse(body);
//               } catch (err){
//                 console.log('error parsing weather JSON');
//               }
//               answer = info.weather[0].description + ', current temperature is ' + Math.round(info.main.temp) + '°';
//               robot.say(robot.memory.lastUpdate, answer, 'telegram');
//             }
//           });
//         } else {
//           answer = robot.memory.answers.ok.pick() + ': ';
//           robot.say(robot.memory.lastUpdate, answer, 'telegram');
//         }
//       }
//     },
//     hearText: function(lastUpdate) {
//       robot.memory.lastUpdate = lastUpdate;
//       var messageText = lastUpdate.text;

//       var matchFound = false;
//       robot.memory.commands.some(function(item) {
//         var regex = new RegExp(item.pattern, item.flag);
//         var match = messageText.match(regex);
//         console.log(match);

//         // if nothing matched, go to the next knowledge item
//         if (!match) {
//           return false;
//         } else {
//           matchFound = true;
//         }

//         // check if there is an argument to pass to the callback function
//         if (match[1]) {
//           var arg = match[1];
//           robot.actions[item.action](lastUpdate, arg);
//         } else {
//           robot.actions[item.action](lastUpdate);
//         }

//         return true;
//       });

//       if (!matchFound) {
//         robot.actions.wat();
//       }
//     },
//     say: function(lastUpdate, message, method) {
//       if (method === 'telegram') {
//         telegram.sendMessage(lastUpdate, message);
//       }
//     }
//   };
//   return robot;
// };
