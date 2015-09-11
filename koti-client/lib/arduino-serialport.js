var com = require('serialport');
var sensorData;

var serialPort = new com.SerialPort('/dev/ttyACM0', {
  baudrate: 57600,
  parser: com.parsers.readline('\n')
});

function sendCommand(command) {
  serialPort.write(command + '\n');
}

serialPort.on('open', function() {
  console.log('Port open');
  // serialPort.write('OMG IT WORKS');
});

serialPort.on('data', function(data) {
  data = data.toString('utf8');
  // try {
  // 	data = JSON.parse(data);
  // } catch (err) {
  // 	console.log(err);
  // }
  // if (data.motion === 1) {
  // 	console.log('ебать кто-то двигается!');
  // }
  sensorData = data;
  // console.log(data);
});

function getData() {
  return sensorData;
}

module.exports.getData = getData;
module.exports.sendCommand = sendCommand;

// setTimeout(function() {
//   sendCommand('lightON');
// }, 3000);
//
// setTimeout(function() {
//   sendCommand('lightOFF');
// }, 12000);
