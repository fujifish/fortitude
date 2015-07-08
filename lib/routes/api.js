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
          return res.status(500).json({ error: err });
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
        return res.status(500).json({ error: err });
      }
      collection.find().toArray(function(err, items) {
        if (err) {
          return res.status(500).json({ error: err });
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
        return res.status(500).json({ error: err });
      }
      collection.findOne({'id': id}, function(err, item) {
        if (err) {
          return res.status(500).json({ error: err });
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
        return res.status(500).json({ error: err });
      }
      collection.update({'id': id}, {$set: node}, {safe: true}, function(err, result) {
        if (err) {
          return res.status(500).json({ error: err });
        }
        console.log('' + result + ' document(s) updated');
        collection.findOne({'id': id}, function(err, item) {
          if (err) {
            return res.status(500).json({ error: err });
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
        return res.status(500).json({ error: err });
      }
      collection.remove({'id': id}, {safe: true}, function(err, result) {
        if (err) {
          return res.status(500).json({ error: err });
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
        return res.status(500).json({ error: err });
      }
      collection.find({'node_id': node_id}).toArray(function(err, items) {
        if (err) {
          return res.status(500).json({ error: err });
        }
        res.json(items);
      });
    });

  })
  .post(function(req, res) {
    function saveCommand() {
      db.collection('commands', function(err, collection) {
        if (err) {
          return res.status(500).json({ error: err });
        }

        collection.update(
          {'node_id': command.node_id, 'type': command.type, 'status': command.status},
          command,
          {safe: true, upsert: true}, function(err, result) {
            if (err) {
              return res.status(500).json({ error: err });
            }
            console.log('command update: ' + result);
            collection.find({'node_id': command.node_id}).toArray(function(err, items) {
              if (err) {
                return res.status(500).json({ error: err });
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
        return res.status(500).json({ error: err });
      }
      switch (command.type) {
        case 'state.apply':
          collection.findOne({'id': req.params.node_id}, function(err, node) {
            if (err) {
              return res.status(500).json({ error: err });
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


router.route('/public/commands/:command_id')
  .put(function(req, res){
    var command_id = req.params.command_id;
    var command = req.body.payload;
    console.log('Updating command: ' + command_id);
    db.collection('commands', function(err, collection) {
      if (err) {
        return res.status(500).json({ error: err });
      }
      collection.update({'_id': new ObjectID(command_id)}, {$set: {'status': command.status, 'details': command.details}}, {safe: true}, function(err, result) {
        if (err) {
          return res.status(500).json({ error: err });
        }
        console.log('' + result + ' document(s) updated');
        collection.findOne({'_id': new ObjectID(command_id)}, function(err, item) {
          if (err) {
            return res.status(500).json({ error: err });
          }
          res.json(item);
        });
      });
    });
  })


router.route('/nodes/:node_id/modules/:name/:version')

  // update the node with this id (accessed at PUT http://localhost:8080/api/nodes/:name/:version)
  .put(function(req, res) {
    var moduleName = req.params.name;
    var moduleVersion = req.params.version;
    var module = req.body;

    db.collection('nodes', function(err, collection) {
      if (err) {
        return res.status(500).json({ error: err });
      }
      collection.update(
        {'id': req.params.node_id, 'state.planned.name': moduleName, 'state.planned.version': moduleVersion},
        {$set: {"state.planned.$": module}},
        {safe: true}, function(err, result) {
          if (err) {
            return res.status(500).json({ error: err });
          }
          console.log('' + result + ' document(s) updated');
          collection.findOne({'id': req.params.node_id}, function(err, item) {
            if (err) {
              return res.status(500).json({ error: err });
            }
            res.json(item);
          });
        });
    });
  })


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
        return res.status(500).json({ error: err });
      }
      res.json({commands: result});
    });
  });

router.route('/modules')

  // create a module (accessed at POST http://localhost:8080/api/modules)
  .post(function(req, res) {
    var module = req.body;
    if (!module || !module.name || !module.version) {
      return res.status(400).json({ error: 'must provide module name and version' });
    }
    console.log('Adding module: ' + JSON.stringify(module));
    db.collection('modules', function(err, collection) {
      collection.findOne({name: module.name, version: module.version}, function(err, item) {
        if (err) {
          return res.status(500).json({ error: err });
        }
        if (item) {
          return res.status(400).json({ error: 'module already exists'});
        }
        collection.insertOne(module, {safe: true}, function(err, result) {
          if (err) {
            return res.status(500).json({ error: err })
          }
          console.log('Success: ' + JSON.stringify(result.result));
          collection.aggregate([{$group: {_id: "$name", versions: {$push: "$$ROOT"} }}, {$sort: {"versions.version": 1}}]).toArray(function(err, items) {
            if (err) {
              return res.status(500).json({ error: err });
            }
            res.json(items);
          });
        });
      });
    });
  })

  // get all the modules (accessed at GET http://localhost:8080/api/modules)
  .get(function(req, res) {
    db.collection('modules', function(err, collection) {
      if (err) {
        return res.status(500).json({ error: err });
      }
      collection.aggregate([{$group: {_id: "$name", versions: {$push: "$$ROOT"} }}, {$sort: {"versions.version": 1}}]).toArray(function(err, items) {
        if (err) {
          return res.status(500).json({ error: err });
        }
        res.json(items);
      });
    });
  })

router.route('/modules/:name/:version')

  // get a single module (accessed at GET http://localhost:8080/api/modules/:name/:version)
  .get(function(req, res) {
    db.collection('modules', function(err, collection) {
      if (err) {
        return res.status(500).json({ error: err });
      }
      collection.findOne({name: req.params.name, version: req.params.version}, function(err, item) {
        if (err) {
          return res.status(500).json({ error: err });
        }
        console.log('Success: ' + JSON.stringify(item));
        res.json(item);
      });
    });
  })

  // delete a single module (accessed at DELETE http://localhost:8080/api/modules/:name/:version)
  .delete(function(req, res) {
    var name = req.params.name
    var version = req.params.version;
    console.log('Removing module ' + name + '@' + version);
    db.collection('modules', function(err, collection) {
      collection.deleteOne({name: name, version: version}, function(err, result) {
        if (err) {
          return res.status(500).json({ error: err });
        }
        console.log('Success: ' + JSON.stringify(result));
        collection.aggregate([{$group: {_id: "$name", versions: {$push: "$$ROOT"} }}, {$sort: {"versions.version": 1}}]).toArray(function(err, items) {
          if (err) {
            return res.status(500).json({ error: err });
          }
          res.json(items);
        });
      });
    });
  })


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
