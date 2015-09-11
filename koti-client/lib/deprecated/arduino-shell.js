var config = require('./config.json');
var shell = require('shelljs');
var controllerPort = config.portArduino1;

var controller = {
	sensorData: '',
	listenForData: function() {
		shell.exec('cat ' + controllerPort, function(data) {
		  // console.log(sensorData);
		  controller.sensorData = data.toString('utf8');
		  console.log(controller.sensorData);
		});
	},
	getData: function() {
	  return controller.sensorData;
	},
	sendCommand: function(command) {
	  shell.exec('echo "' + command + '" > ' + controllerPort);
	},
	start: function() {
		console.log('start!');
		controller.listenForData();
	}
};

controller.start();
module.exports = controller;

// shell.exec('echo "lightSwitch" > /dev/ttyACM0');
// shell.exec('cat /dev/ttyACM0', function (output) {
//   console.log(output);
// });