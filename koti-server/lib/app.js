'use strict';

import Robot from './robot';
import ExpressApp from './express-app.js';
import Controller from './controller';

// let mqttClient = MqttClient();
let controller = new Controller();
let robot = new Robot(controller);
let expressApp = ExpressApp(controller, robot);
