var express = require('express');
var store = require('../store');

var router = express.Router();
router.route('/nodes')

  // create a node (accessed at POST http://localhost:8080/api/nodes)
  .post(function(req, res) {
    var node = req.body;
    console.log('Adding node: ' + JSON.stringify(node));
    store.db().collection('nodes', function(err, collection) {
      collection.insert(node, {safe: true}, function(err, result) {
        if (err) {
          return res.status(500).json({error: err});
        }
        console.log('Success: ' + JSON.stringify(result[0]));
        res.json(result[0]);
      });
    });
  })

  // get all the nodes (accessed at GET http://localhost:8080/api/nodes)
  .get(function(req, res) {
    store.db().collection('nodes', function(err, collection) {
      if (err) {
        return res.status(500).json({error: err});
      }
      collection.find().toArray(function(err, items) {
        if (err) {
          return res.status(500).json({error: err});
        }
        items.forEach(function(i) {
          delete i._id
        });
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
    store.db().collection('nodes', function(err, collection) {
      if (err) {
        return res.status(500).json({error: err});
      }
      collection.findOne({'id': id}, function(err, item) {
        if (err) {
          return res.status(500).json({error: err});
        }
        delete item._id;
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
    store.db().collection('nodes', function(err, collection) {
      if (err) {
        return res.status(500).json({error: err});
      }
      collection.update({'id': id}, {$set: node}, {safe: true}, function(err, result) {
        if (err) {
          return res.status(500).json({error: err});
        }
        console.log('' + result + ' document(s) updated');
        collection.findOne({'id': id}, function(err, item) {
          if (err) {
            return res.status(500).json({error: err});
          }
          delete item._id;
          res.json(item);
        });
      });
    });
  })
  // delete the node with this id (accessed at DELETE http://localhost:8080/api/nodes/:id)
  .delete(function(req, res) {
    var id = req.params.id;
    console.log('Deleting node: ' + id);
    store.db().collection('nodes', function(err, collection) {
      if (err) {
        return res.status(500).json({error: err});
      }
      collection.remove({'id': id}, {safe: true}, function(err, result) {
        if (err) {
          return res.status(500).json({error: err});
        }
        console.log('' + result + ' document(s) deleted');
        res.send(req.body);
      });
    });
  });


router.route('/nodes/:node_id/commands')
  .get(function(req, res) {
    var limit = parseInt(req.query.limit || 10);
    var node_id = req.params.node_id;
    console.log('Retrieving commands for node: ' + node_id);
    store.db().collection('commands', function(err, collection) {
      if (err) {
        return res.status(500).json({error: err});
      }
      collection.find({'node_id': node_id}).limit(limit).sort({_id: -1}).toArray(function(err, items) {
        if (err) {
          return res.status(500).json({error: err});
        }
        res.json(items);
      });
    });
  })
  .post(function(req, res) {
    function saveCommand() {
      store.db().collection('commands', function(err, collection) {
        if (err) {
          return res.status(500).json({error: err});
        }

        collection.update(
          {'node_id': command.node_id, 'type': command.type, 'status': command.status},
          command,
          {safe: true, upsert: true}, function(err, result) {
            if (err) {
              return res.status(500).json({error: err});
            }
            console.log('command update: ' + result);
            var limit = parseInt(req.query.limit || 10);
            collection.find({'node_id': command.node_id}).limit(limit).sort({_id: -1}).toArray(function(err, items) {
              if (err) {
                return res.status(500).json({error: err});
              }
              items.forEach(function(i) {
                delete i._id
              });
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
    store.db().collection('nodes', function(err, collection) {
      if (err) {
        return res.status(500).json({error: err});
      }
      switch (command.type) {
        case 'state.apply':
          collection.findOne({'id': req.params.node_id}, function(err, node) {
            if (err) {
              return res.status(500).json({error: err});
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


router.route('/nodes/:node_id/modules/:name/:version')

  // update the node with this id (accessed at PUT http://localhost:8080/api/nodes/:name/:version)
  .put(function(req, res) {
    var moduleName = req.params.name;
    var moduleVersion = req.params.version;
    var module = req.body;

    store.db().collection('nodes', function(err, collection) {
      if (err) {
        return res.status(500).json({error: err});
      }
      collection.updateOne(
        {'id': req.params.node_id, 'state.planned': {$elemMatch: {name: moduleName, version: moduleVersion}}},
        {$set: {"state.planned.$": module}},
        {safe: true}, function(err, result) {
          if (err) {
            return res.status(500).json({error: err});
          }
          console.log('' + result + ' document(s) updated');
          collection.findOne({'id': req.params.node_id}, function(err, item) {
            if (err) {
              return res.status(500).json({error: err});
            }
            delete item._id;
            res.json(item);
          });
        });
    });
  })


router.route('/modules')

  // create a module (accessed at POST http://localhost:8080/api/modules)
  .post(function(req, res) {
    var module = req.body;
    if (!module || !module.name || !module.version) {
      return res.status(400).json({error: 'must provide module name and version'});
    }
    console.log('Adding module: ' + JSON.stringify(module));
    store.db().collection('modules', function(err, collection) {
      collection.findOne({name: module.name, version: module.version}, function(err, item) {
        if (err) {
          return res.status(500).json({error: err});
        }
        if (item) {
          return res.status(400).json({error: 'module already exists'});
        }
        collection.insertOne(module, {safe: true}, function(err, result) {
          if (err) {
            return res.status(500).json({error: err})
          }
          console.log('Success: ' + JSON.stringify(result.result));
          collection.aggregate([{
            $group: {
              _id: "$name",
              versions: {$push: "$$ROOT"}
            }
          }, {$sort: {"versions.version": 1}}]).toArray(function(err, items) {
            if (err) {
              return res.status(500).json({error: err});
            }
            items.forEach(function(i) {
              delete i._id;
              i.versions.forEach(function(v) {
                delete v._id
              });
            });
            res.json(items);
          });
        });
      });
    });
  })

  // get all the modules (accessed at GET http://localhost:8080/api/modules)
  .get(function(req, res) {
    store.db().collection('modules', function(err, collection) {
      if (err) {
        return res.status(500).json({error: err});
      }
      collection.aggregate([{
        $group: {
          _id: "$name",
          versions: {$push: "$$ROOT"}
        }
      }, {$sort: {"versions.version": 1}}]).toArray(function(err, items) {
        if (err) {
          return res.status(500).json({error: err});
        }
        items.forEach(function(i) {
          delete i._id;
          i.versions.forEach(function(v) {
            delete v._id
          });
        });
        res.json(items);
      });
    });
  })

router.route('/modules/:name/:version')

  // get a single module (accessed at GET http://localhost:8080/api/modules/:name/:version)
  .get(function(req, res) {
    store.db().collection('modules', function(err, collection) {
      if (err) {
        return res.status(500).json({error: err});
      }
      collection.findOne({name: req.params.name, version: req.params.version}, function(err, item) {
        if (err) {
          return res.status(500).json({error: err});
        }
        console.log('Success: ' + JSON.stringify(item));
        delete item._id;
        res.json(item);
      });
    });
  })

  // delete a single module (accessed at DELETE http://localhost:8080/api/modules/:name/:version)
  .delete(function(req, res) {
    var name = req.params.name
    var version = req.params.version;
    console.log('Removing module ' + name + '@' + version);
    store.db().collection('modules', function(err, collection) {
      collection.deleteOne({name: name, version: version}, function(err, result) {
        if (err) {
          return res.status(500).json({error: err});
        }
        console.log('Success: ' + JSON.stringify(result));
        collection.aggregate([{
          $group: {
            _id: "$name",
            versions: {$push: "$$ROOT"}
          }
        }, {$sort: {"versions.version": 1}}]).toArray(function(err, items) {
          if (err) {
            return res.status(500).json({error: err});
          }
          res.json(items);
        });
      });
    });
  })

module.exports = router;
