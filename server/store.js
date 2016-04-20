var util = require('util');
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;

module.exports.ObjectID = ObjectID;

var db;

module.exports.db = function() {
  return db;
};

var MongoLoggerAdapter = function(config, logger) {
  function logWrapper(msg, obj) {
    var parsedObj = '';
    if (obj instanceof Object && (!obj.binary)) { //this is a hack to solve the problem with bson objects throwing exception when JSON.stringify() is called
      parsedObj = '. Message Object: ' + JSON.stringify(obj);
    }
    return msg + parsedObj;
  }

  this.debug = function(msg, obj) {
    if (msg.indexOf('writing command to mongodb') < 0) { //filter out this specific message to reduce log clutter.
      logger.debug(logWrapper(msg, obj));
    }
  };
  this.error = function(msg, obj) {
    logger.error(logWrapper(msg, obj));
  };
  this.log = function(msg, obj) {
    logger.info(logWrapper(msg, obj));
  };

  if (config.logLevel === 'debug') {
    this.doDebug = true;
  }
  this.doError = true;
};


module.exports.init = function(config, log) {

  config = config || {};

  var logger = log.child({module: 'db'});

  var optionsString = config.options || '';
  var serverList = config.serverList || 'localhost:27017';
  var connectionString = util.format('mongodb://%s/%s?%s', serverList , 'fortitude', optionsString);
  var readPref = config.readPref !== undefined ? config.readPref : mongo.ReadPreference.PRIMARY_PREFERRED;
  var options = {
    db: {
      native_parser: true,
      retryMiliSeconds: 2000,
      numberOfRetries: 1e9,
      logger: new MongoLoggerAdapter(config, logger),
      read_preference: readPref
    },
    server: {
      auto_reconnect: true
    }
  };

  function openConnectionWithRetry(retriesCounter) {
    mongo.MongoClient.connect(connectionString, options, function(err, _db) {
      if (!err) {
        logger.info("MongoDB connection established ");
        db = _db;
        db.collection('nodes', {strict: true}, function(err, collection) {
          if (err) {
            logger.info("The nodes collection doesn't exist. Creating it.");
            db.createCollection('nodes', function(err, result) {
              if (err) {
                logger.error(err, "failed to create collection nodes");
              }
            });
          }
        });
        db.collection('nodesArchive', {strict: true}, function(err, collection) {
          if (err) {
            logger.info("The nodesArchive collection doesn't exist. Creating it.");
            db.createCollection('nodesArchive', function(err, result) {
              if (err) {
                logger.error(err, "failed to create collection nodesArchive");
              }
            });
          }
        });
      } else {
        logger.error(err, 'Unable to establish MongoDB connection. Retrying (#' + retriesCounter + ')');
        setTimeout(function() {
          openConnectionWithRetry(++retriesCounter);
        }, 2000);
      }
    });
  }

  openConnectionWithRetry(0);

};
