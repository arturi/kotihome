import config from '../config.json';
import moment from 'moment';
import Mqtt from 'mqtt';

export default class Controller {

  constructor () {
    this.parsedData = {};
    this.rawData = '';

    this.setMqttClient();
  }

  setMqttClient () {
    let mqttClient = Mqtt.connect(config.mqttCredentials.broker, {
      username: config.mqttCredentials.username,
      password: config.mqttCredentials.password
    });

    mqttClient.on('connect', () => {
      this.mqttClient.subscribe('/koti/data');
    });

    mqttClient.on('message', (topic, message) => {
      if (topic === '/koti/commands') {
        this.sendCommand(message);
      }

      if (topic === '/koti/data') {
        this.updateData(message);
      }
    });

    this.mqttClient = mqttClient;
  }

  updateData(msg) {
    this.rawData = msg.toString();

    // Sometimes controller will send bullshit instead of proper data
    // let’s ignore it
    try {
      this.rawData = JSON.parse(this.rawData);
    } catch(err) {
      // console.log('Could not parse data from the controller: ' + err);
      return;
    }

    if (this.rawData.motion == 1 || this.parsedData.lastMotion === undefined) {
      this.parsedData.lastMotion = {
        unix: Date.now()
      };
    }

    this.parsedData.temp = this.rawData.temp;
    this.parsedData.lux = this.rawData.lux;
    this.parsedData.lightIsOn = this.rawData.lightIsOn;
    this.parsedData.lastMotion.human = moment(this.parsedData.lastMotion.unix).fromNow();
  }

  getData() {
    return this.parsedData;
  }

  sendCommand(command) {
    this.mqttClient.publish('/koti/commands', command);
  }

}
