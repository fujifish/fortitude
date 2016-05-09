var path = require('path');
var url = require('url');
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

  var log = config.logger || bunyan.createLogger({name: "fortitude"});
  var logger = log.child({module: 'main'});

  store.init(config.db, log);
  api.init(log);
  agent.init(log);

  var app = config.app || express();

  if(process.env['NODE_ENV']==='DEV'){
    var webpack = require('webpack');
    var webpackConfig = require('../webpack.config');
    var compiler = webpack(webpackConfig);

    app.use(require("webpack-dev-middleware")(compiler, {
      noInfo: true, publicPath: webpackConfig.output.publicPath
    }));
  }

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
  app.use(express.static(path.resolve(__dirname, '../public')));
  app.use('/', function(req, res, next) {
    // var rpath = url.parse(req.url).path;
    if (req.headers['accept'] && req.headers['accept'].indexOf('text/html') !== -1) {
      var salt = randomHex();
      res.setHeader('Set-Cookie', '_csrf=' + salt+';HttpOnly');
      ejs.renderFile(path.resolve(__dirname, '../index.ejs'), {csrfToken: csrfToken(salt, config.csrfSecret)}, function(err, html) {
        res.end(html);
      });
      // no next continuation
    } else {
      next();
    }
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
    function _done(err) {
      if (err) {
        err = new Error(err);
        err.status = 403;
      }
      next(err);
    }

    var cookie = req.cookies['_csrf'];
    var token = req.headers['x-csrf-token'];
    if (!token || token.length === 0) {
      return _done('invalid csrf token');
    }
    var parts = token.split(':');
    if (parts.length !== 2) {
      return _done('invalid csrf token');
    }
    var salt = parts[0];
    var hash = parts[1];
    if (salt === cookie && hash === csrfHash(salt, secret)) {
      _done();
    } else {
      return _done('invalid csrf token');
    }
  }
}

function sanitize(value){
  return common.escapeHtml(value);
}

module.exports = fortitude;
