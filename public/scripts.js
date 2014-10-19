function getData(callback) {
  $.ajax({
    url: '/data',
    success: function(resp) {
      data = $.parseJSON(resp);
      callback(data);
    }
  });
}

$('.login-form').submit(function (e) {
  e.preventDefault();
  var password = $('.login-form-password').val();
  var loginData = JSON.stringify({ password: password });
  console.log(loginData);
  $.ajax({
    type: 'post',
    url: '/login',
    data: loginData,
    headers: { "Content-Type": "application/json;charset=utf-8" },
    success: function(resp) {
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
  getData(function(data) {
    var temp = data.temp.slice(0, -1);
    $('.temp-status').html(temp);
    $('.light-status').html(data.light);
    $('.movement-status').html(data.lastMovementTime);

    if (data.light === '1') {
      $('.btn-light-switch').addClass('is-on');
    } else {
      $('.btn-light-switch').removeClass('is-on');
    }
  });
}

$('.btn-light-switch').click(function () {
  getData(function(data) {
    var action;
    if (data.light === '1') {
      action = 'lightOFF';
    } else {
      action = 'lightON';
    }
    $.get('/' + action, function () {
      updateData();
    });
  });
});

$('.btn-mic-switch').click(function () {
  $(this).toggleClass('is-on');
  if ( $(this).hasClass('is-on') ) {
    annyang.start();
  } else {
    annyang.abort();
  }
});

function announceData() {
  getData(function(data) {
    var temp = data.temp.slice(0, -1);
    var light;
    if (data.light === '1') {
      light = 'on';
    } else {
      light = 'off';
    }
    var msg = new SpeechSynthesisUtterance(
      'Current temperature at your home is ' +
      temp +
      'degrees celsius. The light is ' +
      light + '.' +
      'Last movement has been detected on' + data.lastMovementTime
    );
    window.speechSynthesis.speak(msg);
  });
}

function voiceCommands(action) {
  if (annyang) {
    var commands = {
      'turn the light on': function() {
        $.get('/' + 'lightON', function () {
          updateData();
        });
      },
      'turn the light off': function() {
        $.get('/' + 'lightOFF', function () {
          updateData();
        });
      },
      'whats up': function() {
        announceData();
      }
    };

    // Add our commands to annyang and start listening
    annyang.addCommands(commands);

  }
}

if ( $('.control-panel').length > 0 ) {
  updateData();
  setInterval(updateData, 5000);
  voiceCommands();
}
