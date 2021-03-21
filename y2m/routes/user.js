const passport = require('passport');
const debug = require('debug')('y2m.user');

module.exports.info = [
  passport.authenticate('bearer', { session: true }),
  (request, response) => {
    response.json({ user_id: request.user.id, name: request.user.name, scope: request.authInfo.scope });
  },
];


module.exports.ping = [
  passport.authenticate('bearer', { session: true }),
  (request, response) => {
    debug('Ping received');
    response.status(200);
    response.send('OK');
  },
];

module.exports.devices = [
  passport.authenticate('bearer', { session: true }),
  (request, response) => {
    const reqId = request.get('X-Request-Id');
    debug(`Devices request received with ID: ${reqId}`);
    const r = {
      request_id: reqId,
      payload: {
        user_id: '1',
        devices: [],
      },
    };
    global.devices.forEach((device) => {
      r.payload.devices.push(device.getDefinition());
    });

    debug(`Devices response: ${JSON.stringify(r)}`);

    response.status(200);
    response.send(r);
  },
];

module.exports.query = [
  passport.authenticate('bearer', { session: true }),
  (request, response) => {
    const reqId = request.get('X-Request-Id');
    debug(`Query request received with ID: ${reqId}`);
    const r = {
      request_id: reqId,
      payload: {
        devices: [],
      },
    };
    for (const i in request.body.devices) {
      debug(`- Querying device ${request.body.devices[i].id}`);
      r.payload.devices.push(global.devices[request.body.devices[i].id].getState());
    }
    debug(`Query response: ${JSON.stringify(r)}`);
    response.send(r);
  },
];

module.exports.action = [
  passport.authenticate('bearer', { session: true }),
  (request, response) => {
    const reqId = request.get('X-Request-Id');
    debug(`Action request received with ID: ${reqId}\n${JSON.stringify(request.body.payload)}`);
    const r = {
      request_id: reqId,
      payload: {
        devices: [],
      },
    };
    request.body.payload.devices.forEach((payloadDevice) => {
      const device = global.devices[payloadDevice.id];
      const capResponses = [];
      payloadDevice.capabilities.forEach((payloadCapability) => {
        capResponses.push(
                    device.setState(
                        payloadCapability.type,
                        payloadCapability.state.value,
                        payloadCapability.state.relative || false,
                    ),
                );
      });
      device.propagateComplexState();
      r.payload.devices.push({ id: device.data.id, capabilities: capResponses });
    });
    debug(`Action response: ${JSON.stringify(r)}`);
    response.send(r);
  },
];

module.exports.unlink = [
  passport.authenticate('bearer', { session: true }),
  (request, response) => {
    const reqId = request.get('X-Request-Id');
    debug(`Unlink request received with ID: ${reqId}`);
    const r = {
      request_id: reqId,
    };
    response.status(200);
    response.send(r);
  },
];
