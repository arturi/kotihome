import config from '../config.json';
import got from 'got';
import request from 'request';
import _ from 'lodash';

const telegram = {
  lastUpdate: {},

  tremblingCreatureOrHaveITheRight (user) {
    return _.includes(config.telegramAllowedUsers, user);
  },

  sendMessage (lastUpdate, text) {
    got.post({
      url: 'https://api.telegram.org/bot' + config.telegramBotToken + '/sendMessage', 
      body: {chat_id: lastUpdate.from.id, text: text}
    })
    .catch(err => {
      console.error(err);
      console.error(err.response && err.response.body);
      return console.error('failed to send telegram message:', err);
    });

  //   request.post({
  //       url: 'https://api.telegram.org/bot' + config.telegramBotToken + '/sendMessage', 
  //       form: {chat_id: lastUpdate.from.id, text: text}
  //     }, 
  //     function(err, httpResponse, body) {
  //       if (err) {
  //         return console.error('failed to send telegram message:', err);
  //       }
  //       // console.log('Upload successful!  Server responded with:', body);
  //     }
  //   );
  }
};

export default telegram;
