module.exports = {
  debug: '',
  db_path: './loki.json',
  devices_path: "./devices.json",

  mqtt: {
    host: 'localhost',
    port: 1883,
    user: '',
    password: '',
  },

  https: {
    privateKey: '/path/to/privkey.pem',
    certificate: '/path/to/fullchain.pem',
    port: 8443,
  },

  clients: [
    {
      id: '1',
      name: 'Yandex',
      clientId: 'yandex-client-id',
      clientSecret: 'client-secret',
      isTrusted: false,
    },
  ],

  users: [
    {
      id: '1',
      username: 'admin',
      password: 'admin',
      name: 'Administrator',
    },
  ],

  valueMappings: {
    default: {
      true: 'ON',
      false: 'OFF',
      ON: 'true',
      OFF: 'false',
    },
  },
};
