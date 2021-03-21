const express = require('express');
const debug = require('debug')('y2m.app');
const ejs = require('ejs');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const errorHandler = require('errorhandler');
const session = require('express-session');
const passport = require('passport');
const routes = require('./routes');
const config = require('./config');
const mqtt = require('mqtt');
const device = require('./device');
const fs = require('fs');

const app = express();
const https = require('https');

const privateKey = fs.readFileSync(config.https.privateKey, 'utf8');
const certificate = fs.readFileSync(config.https.certificate, 'utf8');
const credentials = {
  key: privateKey,
  cert: certificate,
};
const httpsServer = https.createServer(credentials, app);
global.devices = [];

if (config.devices_path) {
  try {
    const devices = require(config.devices_path)
    devices.forEach(opts => new device(opts));
  } catch (err) {
    console.error(`Cannot read devices info: ${err}`)
  }
}

if (config.mappings_path) {
  global.valueMappings = require(config.mappings_path)
} else {
  global.valueMappings = {
    default: {
      true: 'ON',
      false: 'OFF',
      ON: 'true',
      OFF: 'false'
    }
  };
}

const client = mqtt.connect(`mqtt://${config.mqtt.host}`, {
  port: config.mqtt.port,
  username: config.mqtt.user,
  password: config.mqtt.password,
});

app.engine('ejs', ejs.__express);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));
app.use(express.static('views'));
app.use(cookieParser());
app.use(bodyParser.json({
  extended: false,
}));
app.use(bodyParser.urlencoded({
  extended: true,
}));
app.use(errorHandler());
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
require('./auth');

app.get('/', routes.site.index);
app.get('/login', routes.site.loginForm);
app.post('/login', routes.site.login);
app.get('/logout', routes.site.logout);
app.get('/account', routes.site.account);
app.get('/dialog/authorize', routes.oauth2.authorization);
app.post('/dialog/authorize/decision', routes.oauth2.decision);
app.post('/oauth/token', routes.oauth2.token);
app.get('/api/userinfo', routes.user.info);
app.get('/api/clientinfo', routes.client.info);
app.get('/provider/v1.0', routes.user.ping);
app.get('/provider', routes.user.ping);
app.get('/provider/v1.0/user/devices', routes.user.devices);
app.post('/provider/v1.0/user/devices/query', routes.user.query);
app.post('/provider/v1.0/user/devices/action', routes.user.action);
app.post('/provider/v1.0/user/unlink', routes.user.unlink);

httpsServer.listen(config.https.port);
debug('HTTPS server started on port %s', config.https.port);

const subscriptions = [];
global.devices.forEach((device) => {
  device.client = client;
  const complexStateQueryTopic = device.data.complexState.query;
  if (complexStateQueryTopic) {
    subscriptions.push({
      deviceId: device.data.id,
      topic: complexStateQueryTopic,
    });
  }
  device.data.capabilities.forEach((capability) => {
    const queryTopic = capability.state.query || false;
    if (queryTopic) {
      subscriptions.push({
        deviceId: device.data.id,
        topic: queryTopic,
        capabilityType: capability.type,
      });
    }
  });
});

client.on('connect', () => {
  debug(`Creating MQTT subscriptions:\n${subscriptions.map(pair => pair.topic)}`);
  client.subscribe(subscriptions.map(pair => pair.topic), { rh: true });
  debug('MQTT client connected');
});
client.on('offline', () => {
  debug('MQTT client disconnected');
});
client.on('message', (topic, message) => {
  debug(`MQTT message received on topic '${topic}': ${message}`);
  const subscription = subscriptions.find(sub => topic.toLowerCase() === sub.topic.toLowerCase());
  if (!subscription) return;
  const device = global.devices.find(device => device.data.id == subscription.deviceId);
  if (subscription.capabilityType) {
    device.updateState(
      subscription.capabilityType,
      message.toString().toUpperCase(),
    );
  } else {
    device.updateComplexState(message);
  }
});

module.exports = app;
