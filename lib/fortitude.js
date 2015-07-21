var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var store = require('./store');
var api = require('./routes/api');
var agent = require('./routes/agent');

/**
 * Initialize and configure fortitude. Returns a configured express app.
 * - app - the express object or null to create a new express object
 */
function fortitude(config) {
  config = config || {};

  store.init(config.db);

  var app = config.app;

  if (!config.app) {
    app = express();
    app.use(logger('dev'));
    app.use(cookieParser());

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
  }

  // hookup user provided auth method
  var auth = config.authConfig;
  if (auth) {
    auth(app);
  }

  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/bower', express.static(path.resolve(__dirname, '../bower_components')));
  app.use('/api', api);
  app.use('/agent', agent);

  // error handler
  app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(err.status || 500).send({
      error: err.message
    });
  });

  return app;
}

module.exports = fortitude;
