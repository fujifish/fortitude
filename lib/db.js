var mongo = require('mongodb');
var Server = mongo.Server;
var Db = mongo.Db;
var BSON = mongo.BSONPure;
var ObjectID = mongo.ObjectID;

var server = new Server('localhost', 27017, {auto_reconnect: true});
var db = new Db('fortitude', server);

db.open(function(err, db) {
  if (!err) {
    console.log("Connected to fortitude database");
    db.collection('nodes', {strict: true}, function(err, collection) {
      if (err) {
        console.log("The nodes collection doesn't exist. Creating it.");
        db.createCollection('nodes', function(err, result) {
          if (err) {
            console.log("failed to create collection nodes, err = " + err);
          }
        });
      }
    });
  }
});

module.exports = {db: db, ObjectID: ObjectID};