import config from '../config.json';
import mosca from 'mosca';

const ascoltatore = {
  type: 'redis',
  redis: require('redis'),
  db: 12,
  port: 6379,
  return_buffers: true,
  host: 'localhost'
};

const moscaSettings = {
  host: '127.0.0.1',
  backend: ascoltatore,
  persistence: {
    factory: mosca.persistence.Redis
  }
};

let authenticate = function(client, username, password, callback) {
  if (username && password) {
    var authorized = (username === config.mqttCredentials.username &&
                      password.toString() === config.mqttCredentials.password);
    if (authorized) {
      client.user = username;
    }

    callback(null, authorized);
  }
};

let moscaServer;
if (config.env === 'production') { 
  moscaServer = new mosca.Server(moscaSettings);

  moscaServer.on('ready', function() {
    moscaServer.authenticate = authenticate;
    console.log('Mosca server is up and running');
  });

  moscaServer.on('error', function(err) {
    console.log(err);
  });

  // moscaServer.on('published', function(packet, client) {
  //   console.log('Published', packet.payload.toString());
  // });

  moscaServer.on('clientConnected', function(client) {
    console.log('Client connected', client.id);
  });
}

export default moscaServer;
