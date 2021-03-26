'use strict';

const debug = require('debug')('y2m.token')
const tokens = {};
const loki = require('lokijs');
const config = require('../config');
debug("Opening a Loki DB for " + config.db_path);
global.dbl = new loki(config.db_path, {
  autoload: true,
  autosave: true,
  autosaveInterval: 5000,
  autoloadCallback() {
    global.authl = global.dbl.getCollection('tokens');
    if (global.authl === null) {
      global.authl = global.dbl.addCollection('tokens');
    }
  }
});

module.exports.find = (key, done) => {
  loadToken(key);
  if (tokens[key]) return done(null, tokens[key]);
  return done(new Error('Token Not Found'));
};

module.exports.findByUserIdAndClientId = (userId, clientId, done) => {
  loadTokenByUserId(userId);
  for (const token in tokens) {
    if (tokens[token].userId === userId && tokens[token].clientId === clientId) return done(null, token);
  }
  return done(new Error('Token Not Found'));
};

module.exports.save = (token, userId, clientId, done) => {
  debug('Start saving token');
  tokens[token] = { userId, clientId };
  var ltoken1 = global.authl.findOne( {'userId': userId} );
  if(ltoken1){
    debug('User %s updated', ltoken1.userId);
    ltoken1.token = token;
    ltoken1.userId = userId;
    ltoken1.clientId = clientId;
    global.authl.update(ltoken1);
  }else{
    debug('User not found. Create new...');
    global.authl.insert({
        'type': 'token',
        'token': token,
        'userId': userId,
        'clientId': clientId
      });
  }
  done();
};

function loadTokenByUserId(userId, done) {
  var ltoken = global.authl.findOne( {'userId': userId} );
  if(ltoken){
    debug('User found, loading token by userId: %s', userId);
    var token = ltoken.token;
    var userId = ltoken.userId;
    var clientId = ltoken.clientId;
    tokens[token] = { userId, clientId };
  }else{
    debug('User not found for userId: %s', userId);
    return;
  }  
};

function loadToken(token, done) {
  var ltoken2 = global.authl.findOne( {'token': token} );
  if(ltoken2){
    debug('Token found');
    var token1 = ltoken2.token;
    var userId = ltoken2.userId;
    var clientId = ltoken2.clientId;
    tokens[token1] = { userId, clientId };
  }else{
    debug('Token not found');
    return;
  }  
};