var path = require('path');
var crypto = require('crypto');
var express = require('express');
var bunyan = require('bunyan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ejs = require('ejs');
var common = require('./common');
var store = require('./store');
var api = require('./routes/api');
var agent = require('./routes/agent');

/**
 * Initialize and configure fortitude. Returns a configured express app.
 */
function fortitude(config) {
  config = config || {};
  config.csrfSecret = config.csrfSecret || randomHex();

  var log = config.logger || bunyan.createLogger();
  var logger = log.child({module: 'main'});

  store.init(config.db, log);
  api.init(log);
  agent.init(log);

  var app = config.app || express();

  app.use(cookieParser());
  app.use(bodyParser.json({reviver: function(k, v) { return (typeof v === "string")? sanitize(v) : v }}));
  app.use(bodyParser.urlencoded({ extended: false }));

  // hookup user provided auth method
  config.auth && config.auth(app);

  // add X-Frame-Options header
  app.use(function(req, res, next) {
    res.header('X-Frame-Options', 'SAMEORIGIN');
    next();
  });

  // agent routes
  app.use('/agent', agent.router);

  // api routes with csrf protection
  app.use('/api', csrfVerify(config.csrfSecret), api.router);

  // fortitude ui
  app.use('/bower', express.static(path.resolve(__dirname, '../bower_components')));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/', function(req, res) {
    ejs.renderFile(path.join(__dirname, 'public/index.ejs'), {csrfToken: csrfToken(randomHex(), config.csrfSecret)}, function(err, html) {
      res.end(html);
    });
    // no next continuation
  });

  // error handler
  app.use(function(err, req, res, next) {
    logger.error(err.stack);
    res.status(err.status || 500).send({
      error: err.message
    });
  });

  return app;
}

function randomHex() {
  return new Buffer(crypto.randomBytes(16)).toString('hex');
}

function csrfHash(salt, secret) {
  return crypto.createHash('sha256').update(salt + secret).digest('base64');
}

function csrfToken(salt, secret) {
  return salt + ':' + csrfHash(salt, secret);
}

function csrfVerify(secret) {
  return function(req, res, next) {
    var token = req.headers['x-csrf-token'];
    if (!token || token.length === 0) {
      return false;
    }
    var parts = token.split(':');
    if (parts.length !== 2) {
      return false;
    }
    var salt = parts[0];
    var hash = parts[1];
    if (hash === csrfHash(salt, secret)) {
      next();
    } else {
      var err = new Error('invalid csrf token');
      err.status = 403;
      next(err);
    }
  }
}

function sanitize(value){
  return common.escapeHtml(value);
}

module.exports = fortitude;
