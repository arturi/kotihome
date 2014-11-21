function getData(done) {
  $.ajax({
    url: '/data',
    success: function (resp) {
      data = $.parseJSON(resp);
      done(data);
    }
  });
}

$('.login-form').submit(function (e) {
  e.preventDefault();
  var password = $('.login-form-password').val();
  var loginData = JSON.stringify({ password: password });
  $.ajax({
    type: 'post',
    url: '/login',
    data: loginData,
    headers: { "Content-Type": "application/json;charset=utf-8" },
    success: function (resp) {
      if (resp === 'Welcome') {
        $('.login-form').addClass('animated fadeOut')
            .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend',
              function () {
                window.location.replace('/');
              }
            );
      } else {
        $('.login-form').addClass('animated shake')
        .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend',
          function (e) {
            $(this).removeClass('animated shake');
          }
        );
      }
    }
  });
});

function updateData() {
  getData(function (data) {
    var temp = data.temp.slice(0, -1);
    $('.temp-status').html(temp);
    $('.light-status').html(data.relay);
    $('.movement-status').html('Last movement: ' +
        moment(data.lastMovementTime).fromNow() +
        '<br><br><small>(' + moment(data.lastMovementTime).format('HH:mm:ss, D.MM.YYYY') + ')</small>');

    if (data.relay === '1') {
      $('.btn-light-switch').addClass('is-on');
    } else {
      $('.btn-light-switch').removeClass('is-on');
    }
  });
}

function say(msg) {
  var utterance = new SpeechSynthesisUtterance();
  utterance.onstart = function() {
    // annyang.abort();
  };
  utterance.onend = function() {
    // annyang.start();
  };
  // utterance.voice = 'Karen';
  // utterance.lang = lang;
  utterance.text = msg;
  window.speechSynthesis.speak(utterance);
}

function announceData(command) {
  switch (command) {
    case 'status update':
      getData(function (data) {
        var temp = data.temp.slice(0, -1);
        var light = (data.relay === '1') ? 'on' : 'off';
        var fullStatusUpdate =
            'Current temperature at your home is ' +
            temp +
            'degrees celsius. The light is ' +
            light + '.' +
            'Last movement has been detected ' + moment(data.lastMovementTime).fromNow();
        say(fullStatusUpdate);
      });
      break;

    case 'temperature outside':
      $.getJSON('http://api.openweathermap.org/data/2.5/weather?q=Moscow,ru', function(data) {
        var temp = Math.round(data.main.temp - 273.15);
        msg = 'The temperature in Moscow is: ' + temp + 'degrees Celsius';
        say(msg);
      });
      break;

    case 'coffee':
      var msg = 'Ok, I prefer V60 or Kalita, but whatever works for you. You are the boss.';
      say(msg);
      break;

    case 'температура':
      $.getJSON('http://api.openweathermap.org/data/2.5/weather?q=Moscow,ru', function(data) {
        var temp = Math.round(data.main.temp - 273.15);
        msg = 'Температура в Москве сейчас: ' + temp + 'градуса по Цельсию';
        say(msg);
      });
      break;
  }
}

function lightSwitch() {
  getData(function (data) {
    var action;
    if (data.light === '1') {
      action = 'lightOFF';
    } else {
      action = 'lightON';
    }
    $.get('/' + action, function() {
      updateData();
    });
  });
}

function relaySwitch() {
  getData(function (data) {
    var action;
    if (data.relay === '1') {
      action = 'relayOFF';
    } else {
      action = 'relayON';
    }
    $.get('/' + action, function() {
      updateData();
    });
  });
}

function voiceCommands(lang) {
  if (annyang) {
    var commands = {
      'en': {
        'hello computer': say.bind(null, 'hello friendly human!'),
        // 'hello': say.bind(null, 'hi!'),
        // 'hi': say.bind(null, 'hello!'),
        'turn (the) light(s) (on) (off) (please)': relaySwitch,
        '(tell me) (make me) (what is) (whats) (what’s) (the) *this': announceData
      },
      'ru': {
        '(выключи) (включи) свет': lightSwitch,
        '(какая) (сейчас) (сделай) (мне) *this': announceData
      }
    };
    annyang.addCommands(commands[lang]);
    annyang.setLanguage(lang);
    // annyang.start();
    annyang.debug([newState=true]);
  }
}

function init() {
  var lang = 'en';

  updateData();
  setInterval(updateData, 5000);
  voiceCommands(lang);

  $('.btn-mic-switch').click(function() {
    $(this).toggleClass('is-on');
    if ( $(this).hasClass('is-on') ) {
      annyang.start();
    } else {
      annyang.abort();
    }
  });

  $('.btn-light-switch').click(function() {
    relaySwitch();
  });
}

// Start
if ( $('.control-panel').length > 0 ) {
  init();
}
