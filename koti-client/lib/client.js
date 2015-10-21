'use strict';

var config = require('../config.json');
var controller = require('./arduino-serialport');
var mqtt = require('mqtt');

var mqttClient = mqtt.connect(config.mqttCredentials.broker, {
  username: config.mqttCredentials.username,
  password: config.mqttCredentials.password
});

var publishNewDataInterval;

// Get data from Arduino’s sensors, check if it’s different than the last
// if so, send it to MQTT server
var oldData = controller.getData();
function publishNewData() {
  var newData = controller.getData();
  // console.log(newData);
  if (oldData !== newData) {
    oldData = newData;
    mqttClient.publish('/koti/data', newData);
  }
}

mqttClient.on('error', function(err) {
  console.log(err);
});

mqttClient.on('connect', function() {
  console.log('Connected to mqtt server');
  mqttClient.subscribe('/koti/commands');
  publishNewDataInterval = setInterval(publishNewData, 1000);
});

mqttClient.on('close', function() {
  clearInterval(publishNewDataInterval);
});

mqttClient.on('message', function(topic, message) {
  // message is Buffer
  if (topic === '/koti/commands') {
    controller.sendCommand(message);
  }
  // console.log(message.toString());
  // client.end();
});
