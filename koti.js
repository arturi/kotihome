var config = require('./config.json');
var http = require('http');
var moment = require('moment-timezone');
var nodemailer = require('nodemailer');
var express = require('express');
var session = require('express-session');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var app = express();

var lastMovementTime = 0;
var notifyIfMovement = config.notifyIfMovement;

var transporter = nodemailer.createTransport({
  host: config.emailCredentials.host,
  port: config.emailCredentials.port,
  secure: true,
  auth: {
    user: config.emailCredentials.user,
    pass: config.emailCredentials.pass
  }
});

function sendEmailAlert() {
  var mailOptions = {
    from: config.emailCredentials.from,
    to: config.emailCredentials.to,
    subject: '#movementalert',
    text: 'Movement detected at ' + lastMovementTime, // plaintext
    // html: '<b>Hello world ✔</b>' // html
  };

  transporter.sendMail(mailOptions, function (err, info) {
    if (err) {
      console.log(err);
    } else {
      console.log('Message sent: ' + info);
    }
  });
}

app.use(express.static(__dirname + '/public'));
app.use(session({
  secret: config.adminCredentials.sessionSecret,
  saveUninitialized: true,
  resave: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('trust proxy', true);
app.set('view engine', 'handlebars');

// Handle login
function checkAuth(req, res, next) {
  if (!req.session.user_id) {
    res.redirect('/login');
  } else {
    next();
  }
}

app.get('/', checkAuth, function (req, res) {
  console.log(req.ip);
  res.render('index');
});

app.get('/login', function (req, res) {
  res.render('login');
});

app.post('/login', function (req, res) {
  // var isAjaxRequest = req.xhr;
  var post = req.body;
  if (post.password === config.adminCredentials.password) {
    req.session.user_id = 'admin';
    res.send('Welcome');
  } else {
    res.send('Bad user/pass');
  }
});

app.get('/logout', function (req, res) {
  delete req.session.user_id;
  res.redirect('/login');
});

app.get('/time', checkAuth, function (req, res) {
  res.status(Date.now()).end();
});

app.post('/options', checkAuth, function (req, res) {
  var post = req.body;
  notifyIfMovement = post.options.notifyIfMovement;
});

app.get('/movement-alert', function (req, res) {
  // lastMovementTime = moment().tz('Europe/Moscow').format('HH:mm:ss, D.MM.YYYY');
  lastMovementTime = moment().tz('Europe/Moscow');
  console.log('movement detected on ' + lastMovementTime);
  console.log('from: ' + req.ip);
  if (config.notifyIfMovement) {
    sendEmailAlert();
  }
});

app.get('/data', checkAuth, function (req, res) {
  http.get(config.homeControllerUrl + 'data', function (resData) {
    var bodyChunks = [];
    resData
    .on('data', function (chunk) {
      bodyChunks.push(chunk);
    })
    .on('end', function() {
      var body = Buffer.concat(bodyChunks);
      var bodyJson;
      try {
        bodyJson = JSON.parse(body.toString('utf8'));
      } catch (err) {
        console.log(err);
      }
      bodyJson.lastMovementTime = lastMovementTime;
      bodyJson = JSON.stringify(bodyJson);
      res.send(bodyJson);
    });
  })
  .on('error', function(e) {
    console.log('Got error: ' + e.message);
  });
});

app.get('/lightON', checkAuth, function (req, res) {
  // light: 'ledON'
  http.get(config.homeControllerUrl + 'ledON', function (resData) {
    console.log('Light ON');
    res.end();
  })
  .on('error', function(e) {
    console.log('Got error: ' + e.message);
  });
});

// Control light
app.get('/lightOFF', checkAuth, function(req, res) {
  http.get(config.homeControllerUrl + 'ledOFF', function (resData) {
    console.log('Light OFF');
    res.end();
  })
  .on('error', function(e) {
    console.log('Got error: ' + e.message);
  });
});

app.get('/lightON', checkAuth, function (req, res) {
  http.get(config.homeControllerUrl + 'ledON', function (resData) {
    console.log('Light ON');
    res.end();
  })
  .on('error', function(e) {
    console.log('Got error: ' + e.message);
  });
});

// Control relay
app.get('/relayON', checkAuth, function (req, res) {
  http.get(config.homeControllerUrl + 'relayON', function (resData) {
    console.log('Relay ON');
    res.end();
  })
  .on('error', function(e) {
    console.log('Got error: ' + e.message);
  });
});

app.get('/relayOFF', checkAuth, function (req, res) {
  http.get(config.homeControllerUrl + 'relayOFF', function (resData) {
    console.log('Relay OFF');
    res.end();
  })
  .on('error', function(e) {
    console.log('Got error: ' + e.message);
  });
});


app.listen(3050);
