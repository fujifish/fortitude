var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;

module.exports.ObjectID = ObjectID;

var db;

module.exports.db = function() {
  return db;
};

module.exports.init = function(config, log) {

  config = config || {};

  var logger = log.child({module: 'db'});

  var server = new mongo.Server(config.host || 'localhost', config.port || 27017, {auto_reconnect: true});
  db = new mongo.Db('fortitude', server);

  db.open(function(err, db) {
    if (err) {
      logger.error(err, "Error connecting to fortitude database");
      return;
    }

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
  });


};

