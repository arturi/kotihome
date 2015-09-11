// 'use strict';

// var config = require('./config.json');
// var fs = require('fs');
// var request = require('request');
// var mqtt = require('mqtt');
// var mqttClient = mqtt.connect(config.mqttCredentials.broker, {
//   username: config.mqttCredentials.username,
//   password: config.mqttCredentials.password
// });
// var bodyParser = require('body-parser');
// var express = require('express');
// var session = require('express-session');
// var RedisStore = require('connect-redis')(session);

// import mqttClient from './mqtt-client';
import Robot from './robot';
import ExpressApp from './express-app.js';
import Controller from './controller';

// let mqttClient = MqttClient();
let controller = new Controller();
let robot = new Robot(controller);
let expressApp = ExpressApp(controller, robot);

// // Setup Express
// var sessionMiddleware = session({
//   cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
//   rolling: true,
//   saveUninitialized: false,
//   resave: true,
//   store: new RedisStore({
//     host: 'localhost',
//     port: 6379,
//     db: 2
//   }),
//   secret: config.adminCredentials.sessionSecret
// });
//
// var app = express();
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.static('views/public'));
// app.use(sessionMiddleware);

//
// MQTT
//
// mqttClient.on('connect', function() {
//   mqttClient.subscribe('/koti/data');
// });
//
// mqttClient.on('message', function(topic, message) {
//   if (topic === '/koti/commands') {
//     controller.sendCommand(message);
//   }
//
//   if (topic === '/koti/data') {
//     controller.updateData(message);
//   }
// });

//
// Express routes, auth and views
//
// var indexPage = fs.readFileSync('views/index.html');
// var loginPage = fs.readFileSync('views/login.html');
//
// function checkAuth(req, res, next) {
//   if (req.session.auth) {
//     next();
//   } else {
//     res.redirect('/login');
//   }
// }
//
// app.route('/login')
//   .get(function(req, res) {
//     res.end(loginPage);
//   })
//   .post(function(req, res) {
//   config.adminCredentials.users.forEach(function(user) {
//     if (req.body.username === user.username &&
//         req.body.password === user.password) {
//       req.session.auth = true;
//       res.redirect('/');
//     }
//     res.writeHead(403);
//     res.end('Wrong username or password');
//   });
// });
//
// app.get('/logout', function(req, res) {
//   delete req.session.auth;
//   res.redirect('/login');
// });
//
// app.get('/', checkAuth, function(req, res) {
//   res.end(indexPage);
// });
//
// app.get('/data/:option?', checkAuth, function(req, res) {
//   var option = req.params.option;
//   if (option === 'raw') {
//     res.send(controller.rawData);
//   } else {
//     res.json(controller.parsedData);
//   }
// });
//
// app.get('/command/:item', checkAuth, function(req, res) {
//   var command = req.params.item;
//     mqttClient.publish('/koti/commands', command);
//     if (command === 'light') {
//       setTimeout(function() {
//         var controllerData = controller.getData();
//         var light = (controllerData.light === 1 ? 'on' : 'off');
//         res.end('ok, light is ' + light);
//       }, 1000);
//     } else {
//       res.end('unknown command: ' + command);
//     }
// });
//
// app.post('/api/:token/telegramBotUpdate', function(req, res) {
//   var token = req.params.token;
//
//   if (token === config.telegramUpdateToken) {
//     telegram.lastUpdate = req.body.message;
//
//     console.log(telegram.lastUpdate.from.username + ': ' + telegram.lastUpdate.text);
//     robot.hearText(telegram.lastUpdate);
//
//     res.end('ok');
//   }
//
//   res.end('bad token');
// });
//
// var mqttServ = require('./mqtt-broker');
//
// var server = app.listen(3500, '127.0.0.1', function() {
//   console.log('Koti server is listening at http://%s:%s',
//     server.address().address,
//     server.address().port
//   );
// });
//
// mqttServ.attachHttpServer(server);
