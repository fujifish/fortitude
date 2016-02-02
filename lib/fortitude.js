var express = require('express');
var path = require('path');
var bunyan = require('bunyan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var common = require('./common');
var store = require('./store');
var api = require('./routes/api');
var agent = require('./routes/agent');

/**
 * Initialize and configure fortitude. Returns a configured express app.
 */
function fortitude(config) {
  config = config || {};

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

  app.use(function(req, res, next) {
    res.header('X-Frame-Options', 'SAMEORIGIN');
    next();
  });

  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/bower', express.static(path.resolve(__dirname, '../bower_components')));
  app.use('/api', api.router);
  app.use('/agent', agent.router);

  // error handler
  app.use(function(err, req, res, next) {
    logger.error(err.stack);
    res.status(err.status || 500).send({
      error: err.message
    });
  });

  return app;
}

function sanitize(value){
  return common.escapeHtml(value);
}

module.exports = fortitude;
