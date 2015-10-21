import config from '../config.json';
import fs from 'fs';
import path from 'path';
import express from 'express';
import helmet from 'helmet';
import webpack from 'webpack';
import bodyParser from 'body-parser';
import session from 'express-session';
import RedisStore from 'connect-redis';
import telegram from './telegram';
import mqttServ from './mqtt-broker';

let isProduction = process.env.NODE_ENV === 'production';
let webpackConfig = isProduction ? require('../webpack.config.prod') : require('../webpack.config.dev');

// if (isProduction) {
//   webpackConfig = require('../webpack.config.prod');
// } else {
//   webpackConfig = require('../webpack.config.prod');
// }

export default function(controller, robot) {

  let compiler = webpack(webpackConfig);

  let app = express();
  app.use(helmet());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use('/static', express.static(path.join(__dirname, '../dist')));

  console.log(path.join(__dirname, '../dist'));

  // use session store in production only
  if (isProduction) {
    let redisStore = RedisStore(session);

    // Setup session middleware, Redis in this case
    let sessionMiddleware = session({
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
    app.use(sessionMiddleware);
  }

  // use react hot realoading in development only
  if (!isProduction) {
    app.use(require('webpack-hot-middleware')(compiler));
    app.use(require('webpack-dev-middleware')(compiler, {
      noInfo: true,
      publicPath: webpackConfig.output.publicPath
    }));
  }

  function checkAuth(req, res, next) {
    if (!isProduction) return next();

    if (req.session.auth) {
      next();
    } else {
      res.redirect('/login');
    }
  }

  app.route('/login')
    .get(function(req, res) {
      res.sendFile(path.join(__dirname + '/../views/login.html'));
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
    res.sendFile(path.join(__dirname + '/../views/index.html'));
  });

  app.get('/data/:option?', checkAuth, function(req, res) {
    let option = req.params.option;
    if (option === 'raw') {
      res.send(controller.rawData);
    } else {
      res.json(controller.parsedData);
    }
  });

  app.get('/command/:item', checkAuth, function(req, res) {
    let command = req.params.item;
      controller.sendCommand(command);
      res.end('ok');
      // if (command === 'light') {
      //   setTimeout(function() {
      //     let controllerData = controller.getData();
      //     let light = (controllerData.light === 1 ? 'on' : 'off');
      //     res.end('ok, light is ' + light);
      //   }, 1000);
      // } else {
      //   res.end('unknown command: ' + command);
      // }
  });

  app.post('/api/:token/telegramBotUpdate', function(req, res) {
    let token = req.params.token;

    if (token === config.telegramUpdateToken) {
      telegram.lastUpdate = req.body.message;
      telegram.lastUpdate.method = 'telegram';

      console.log(telegram.lastUpdate.from.username + ': ' + telegram.lastUpdate.text);
      robot.hear(telegram.lastUpdate);

      res.end('ok');
    }

    res.end('bad token');
  });

  app.post('/api/talkToRobot', checkAuth, function(req, res) {
    console.log(req.body.text);
    let lastUpdate = {
      text: req.body.text,
      method: 'microphone'
    }
    robot.hear(lastUpdate).then(function(reply) {
      res.json(reply);
    });
  });

  let server = app.listen(3500, '127.0.0.1', function() {
    console.log('Koti server is listening at http://%s:%s',
      server.address().address,
      server.address().port
    );
  });

  // if (isProduction) {
  //   mqttServ.attachHttpServer(server);
  // }

  let io = require('socket.io')(server);

  function emitNewData(socket) {
    socket.emit('status', controller.parsedData);
  }

  io.on('connection', function (socket) {
    console.log('Socket client connected!');
    emitNewData(socket);
    let interval = setInterval(() => emitNewData(socket), 1000);

    socket.on('disconnect', function() {
      console.log('Socket client disconnected!');
      clearInterval(interval);
    });
  });

  return app;
};
