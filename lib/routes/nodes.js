var async = require('async');
var express = require('express');
var router = express.Router();


router.route('/nodes')

  // create a node (accessed at POST http://localhost:8080/api/nodes)
  .post(function(req, res) {
    var node = req.body;
    console.log('Adding node: ' + JSON.stringify(node));
    db.collection('nodes', function(err, collection) {
      collection.insert(node, {safe: true}, function(err, result) {
        if (err) {
          return next(err);
        }
        console.log('Success: ' + JSON.stringify(result[0]));
        res.json(result[0]);
      });
    });
  })

  // get all the nodes (accessed at GET http://localhost:8080/api/nodes)
  .get(function(req, res) {
    db.collection('nodes', function(err, collection) {
      if (err) {
        return next(err);
      }
      collection.find().toArray(function(err, items) {
        if (err) {
          return next(err);
        }
        res.json(items);
      });
    });
  });

// on routes that end in /nodes/:id
// ----------------------------------------------------
router.route('/nodes/:id')

  // get the node with that id (accessed at GET http://localhost:8080/api/nodes/:id)
  .get(function(req, res) {

    var id = req.params.id;
    console.log('Retrieving node: ' + id);
    db.collection('nodes', function(err, collection) {
      if (err) {
        return next(err);
      }
      collection.findOne({'id': id}, function(err, item) {
        if (err) {
          return next(err);
        }
        res.json(item);
      });
    });
  })
  // update the node with this id (accessed at PUT http://localhost:8080/api/nodes/:id)
  .put(function(req, res) {
    var id = req.params.id;
    var node = req.body;
    console.log('Updating node: ' + id);
    console.log(JSON.stringify(node));
    db.collection('nodes', function(err, collection) {
      if (err) {
        return next(err);
      }
      collection.update({'id': id}, {$set: node}, {safe: true}, function(err, result) {
        if (err) {
          return next(err);
        }
        console.log('' + result + ' document(s) updated');
        collection.findOne({'id': id}, function(err, item) {
          if (err) {
            return next(err);
          }
          res.json(item);
        });
      });
    });
  })
  // delete the node with this id (accessed at DELETE http://localhost:8080/api/nodes/:id)
  .delete(function(req, res) {
    var id = req.params.id;
    console.log('Deleting node: ' + id);
    db.collection('nodes', function(err, collection) {
      if (err) {
        return next(err);
      }
      collection.remove({'id': id}, {safe: true}, function(err, result) {
        if (err) {
          return next(err);
        }
        console.log('' + result + ' document(s) deleted');
        res.send(req.body);
      });
    });
  });


router.route('/nodes/:node_id/commands')
  .get(function(req, res){
    var node_id = req.params.node_id;
    console.log('Retrieving commands for node: ' + node_id);
    db.collection('commands', function(err, collection) {
      if (err) {
        return next(err);
      }
      collection.find({'node_id': node_id}).toArray(function(err, items) {
        if (err) {
          return next(err);
        }
        res.json(items);
      });
    });

  })
  .post(function(req, res) {
    function saveCommand() {
      db.collection('commands', function(err, collection) {
        if (err) {
          return next(err);
        }

        collection.update(
          {'node_id': command.node_id, 'type': command.type, 'status': command.status},
          command,
          {safe: true, upsert: true}, function(err, result) {
            if (err) {
              return next(err);
            }
            console.log('command update: ' + result);
            collection.find({'node_id': command.node_id}).toArray(function(err, items) {
              if (err) {
                return next(err);
              }
              res.json(items);
            });
          }
        );
      });

    }

    var command = req.body;

    command.created = command.created || new Date().toISOString();
    command.node_id = req.params.node_id;
    command.status = 'pending';
    db.collection('nodes', function(err, collection) {
      if (err) {
        return next(err);
      }
      switch (command.type) {
        case 'state.apply':
          collection.findOne({'id': req.params.node_id}, function(err, node) {
            if (err) {
              return next(err);
            }
            command.type = 'state';
            command.action = 'apply';
            command.state = node.state.planned && node.state.planned.map(function(s) {
                var state = s.state;
                state.name = s.name;
                state.version = s.version;
                return state;
              });
            saveCommand();
          });
          break;
        default:
          saveCommand();
      }
    });

  });


router.route('/nodes/:node_id/modules/:id')

  /*  // get the node with that id (accessed at GET http://localhost:8080/api/nodes/:id)
   .get(function(req, res) {

   var id = req.params.id;
   console.log('Retrieving node: ' + id);
   db.collection('nodes', function(err, collection) {
   if(err) return next(err);
   collection.findOne({'id': id}, function(err, item) {
   if(err) return next(err);
   res.json(item);
   });
   });
   })*/
  // update the node with this id (accessed at PUT http://localhost:8080/api/nodes/:id)
  .put(function(req, res) {
    var id = req.params.id;
    var moduleName = id.split("@")[0];
    var moduleVersion = id.split("@")[1];
    var module = req.body;

    db.collection('nodes', function(err, collection) {
      if (err) {
        return next(err);
      }
      collection.update(
        {'id': req.params.node_id, 'state.planned.name': moduleName, 'state.planned.version': moduleVersion},
        {$set: {"state.planned.$": module}},
        {safe: true}, function(err, result) {
          if (err) {
            return next(err);
          }
          console.log('' + result + ' document(s) updated');
          collection.findOne({'id': req.params.node_id}, function(err, item) {
            if (err) {
              return next(err);
            }
            res.json(item);
          });
        });
    });
  })
  /*  // delete the node with this id (accessed at DELETE http://localhost:8080/api/nodes/:id)
   .delete(function(req, res) {
   var id = req.params.id;
   console.log('Deleting node: ' + id);
   db.collection('nodes', function(err, collection) {
   if(err) return next(err);
   collection.remove({'id': id}, {safe:true}, function(err, result) {
   if(err) return next(err);
   console.log('' + result + ' document(s) deleted');
   res.send(req.body);
   });
   });
   })*/;


router.route('/public/nodes/sync')

  // sync a node (accessed at POST http://localhost:8080/api/public/nodes/sync)
  .post(function(req, res, next) {
    var input = req.body;
    console.log('Sync input: ' + JSON.stringify(input));
    //TODO: validate key
    var nodeCollection, commandsCollection;
    async.waterfall([
      function(callback) {
        db.collection('nodes', callback);
      },
      function(collection, callback) {
        nodeCollection = collection;
        nodeCollection.findOne({'id': input.id}, callback);
      },
      function(node, callback) {
        nodeCollection.updateOne({'id': input.id}, {
          $set: {
            id: input.id,
            name: input.name,
            "state.current": input.payload.modules,
            info: input.payload.info,
            lastSync: new Date()
          }
        }, {safe: true, upsert: true}, function(err) {
          callback(err, node);
        });
      },
      function(node, callback) {
        db.collection('commands', callback);
      },
      function(collection, callback) {
        commandsCollection = collection;
        commandsCollection.find({'node_id': input.id, 'status': 'pending'}).toArray(callback);
      },
      function(commands, callback) {
        commands.forEach(function(c) {
          c.status = 'delivered';
        });
        commandsCollection.update(
          {'_id': { '$in': commands.map(function(e){return new ObjectID(e._id);})}},
          {$set: {status: 'delivered'}},
          {safe: true, multi: true}, function(err, result){
            console.log('' + result + ' document(s) updated');
            callback(err, commands);
        });
      }
    ], function(err, result) {
      if (err) {
        return next(err);
      }
      res.json({success: true, commands: result});
    });
  });


var mongo = require('mongodb');

var Server = mongo.Server,
  Db = mongo.Db,
  BSON = mongo.BSONPure,
  ObjectID = mongo.ObjectID;

var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('homebase', server);

db.open(function(err, db) {
  if (!err) {
    console.log("Connected to 'homebase' database");
    db.collection('nodes', {strict: true}, function(err, collection) {
      if (err) {
        console.log("The 'nodes' collection doesn't exist. Creating it.");
        db.createCollection('nodes', function(err, result) {
          if (err) {
            console.log("failed to create collection nodes, err = " + err);
          }
        });
      }
    });
  }
});

module.exports = router;
