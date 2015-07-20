var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;

module.exports.ObjectID = ObjectID;

var db;

module.exports.db = function() {
  return db;
};

module.exports.init = function(host, port) {

  var server = new mongo.Server(host, port, {auto_reconnect: true});
  db = new mongo.Db('fortitude', server);

  db.open(function(err, db) {
    if (err) {
      console.error("Error connecting to fortitude database: " + err);
      return;
    }

    db.collection('nodes', {strict: true}, function(err, collection) {
      if (err) {
        console.log("The nodes collection doesn't exist. Creating it.");
        db.createCollection('nodes', function(err, result) {
          if (err) {
            console.log("failed to create collection nodes: " + err);
          }
        });
      }
    });
  });


};

