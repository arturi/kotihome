import config from '../config.json';
import fs from 'fs';
import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import RedisStore from 'connect-redis';
import telegram from './telegram';
import mqttServ from './mqtt-broker';

let redisStore = RedisStore(session);

export default function(controller, robot) {

  // Setup Express
  var sessionMiddleware = session({
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
    rolling: true,
    saveUninitialized: false,
    resave: true,
    store: new redisStore({
      host: 'localhost',
      port: 6379,
      db: 2
    }),
    secret: config.adminCredentials.sessionSecret
  });

  var app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.static(__dirname + '/../views/public'));
  app.use(sessionMiddleware);

  var indexPage = fs.readFileSync(__dirname + '/../views/index.html');
  var loginPage = fs.readFileSync(__dirname + '/../views/login.html');

  function checkAuth(req, res, next) {
    if (req.session.auth) {
      next();
    } else {
      res.redirect('/login');
    }
  }

  app.route('/login')
    .get(function(req, res) {
      res.end(loginPage);
    })
    .post(function(req, res) {
    config.adminCredentials.users.forEach(function(user) {
      if (req.body.username === user.username &&
          req.body.password === user.password) {
        req.session.auth = true;
        res.redirect('/');
      }
      res.writeHead(403);
      res.end('Wrong username or password');
    });
  });

  app.get('/logout', function(req, res) {
    delete req.session.auth;
    res.redirect('/login');
  });

  app.get('/', checkAuth, function(req, res) {
    res.end(indexPage);
  });

  app.get('/data/:option?', checkAuth, function(req, res) {
    var option = req.params.option;
    // console.log(controller.parsedData);
    if (option === 'raw') {
      res.send(controller.rawData);
    } else {
      res.json(controller.parsedData);
    }
  });

  app.get('/command/:item', checkAuth, function(req, res) {
    var command = req.params.item;
      controller.sendCommand(command);
      if (command === 'light') {
        setTimeout(function() {
          var controllerData = controller.getData();
          var light = (controllerData.light === 1 ? 'on' : 'off');
          res.end('ok, light is ' + light);
        }, 1000);
      } else {
        res.end('unknown command: ' + command);
      }
  });

  app.post('/api/:token/telegramBotUpdate', function(req, res) {
    var token = req.params.token;

    if (token === config.telegramUpdateToken) {
      telegram.lastUpdate = req.body.message;

      console.log(telegram.lastUpdate.from.username + ': ' + telegram.lastUpdate.text);
      robot.hear(telegram.lastUpdate);

      res.end('ok');
    }

    res.end('bad token');
  });

  var server = app.listen(3500, '127.0.0.1', function() {
    console.log('Koti server is listening at http://%s:%s',
      server.address().address,
      server.address().port
    );
  });

  mqttServ.attachHttpServer(server);

  return app;
};
