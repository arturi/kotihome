import config from '../config.json';
import Mqtt from 'mqtt';

const mqttClient = Mqtt.connect(config.mqttCredentials.broker, {
  username: config.mqttCredentials.username,
  password: config.mqttCredentials.password
});

export default mqttClient;
