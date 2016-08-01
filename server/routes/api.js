var express = require('express');
var semver = require('semver');
var common = require('../common');
var store = require('../store');
var async = require('async');

var logger;
function init(log){
  logger = log.child({module: 'api'});
}

var router = express.Router();
router.route('/nodes')

  // create a node (accessed at POST http://localhost:8080/api/nodes)
  .post(function(req, res) {
    var node = req.body;
    logger.info(node, 'Adding node');
    store.db().collection('nodes', function(err, collection) {
      collection.insert(node, {safe: true}, function(err, result) {
        if (err) {
          return respondWithError(res, err);
        }
        logger.info(result[0], 'Success');
        res.json(result[0]);
      });
    });
  })

  // get all the nodes (accessed at GET http://localhost:8080/api/nodes)
  .get(function(req, res) {
    store.db().collection('nodes', function(err, collection) {
      if (err) {
        return respondWithError(res, err);
      }

      // filter these fields for 'search' parameter.
      const searchableFields = ['id', 'name', 'info.agentVersion'];
      var searchTerm = common.mongoSanitize(req.query.search);
      var orFilters = [], filters = {};
      if (searchTerm) {
        searchableFields.forEach(function(field) {
          var filter = {};
          filter[field] = new RegExp('^' + searchTerm + '.*', 'i');
          orFilters.push(filter);
        });
        if(!filters['$and']) filters['$and'] = [];
        filters['$and'].push({ $or: orFilters });
      }

      // also filter by 'tag' parameter (includes tags, metadata and current state).
      if (req.query.tag && !Array.isArray(req.query.tag)) {
        req.query.tag = [req.query.tag];
      }
      req.query.tag && req.query.tag.forEach(function(tag) {
        tag = common.mongoSanitize(tag);
        var filter = {}, m = tag.match(/^(.+):(.+)$/);
        orFilters = [];
        if (m) {
          filter['info.tags.' + m[1]] = new RegExp('^' + m[2], 'i');
          orFilters.push(filter);
          filter = {};
          filter['metadata.' + m[1]] = new RegExp('^' + m[2], 'i');
          orFilters.push(filter);
          filter = {'state.current': {$elemMatch: {'name': new RegExp('^' + m[1], 'i'), version: new RegExp('^' + m[2], 'i')}}};
          orFilters.push(filter);
        } else {
          filter['info.tags.' + tag] = new RegExp('^.*$');
          orFilters.push(filter);
          filter = {};
          filter['metadata.' + tag] = new RegExp('^.*$');
          orFilters.push(filter);
          filter = {'state.current': {$elemMatch: {'name': new RegExp('^' + tag, 'i'), version: new RegExp('^.*$')}}};
          orFilters.push(filter);
        }
        if(!filters['$and']) filters['$and'] = [];
        filters['$and'].push({ $or: orFilters });
      });

      var perPage = parseInt(req.query.length) || 1000;
      var offset = parseInt(req.query.start) || 0;

      const allowedOrderFields = { 'name': true, 'lastSync': true, 'info.agentVersion': true, 'info.platform': true }, defaultOrderField = '_id';
      var orderFiled = req.query.order && common.mongoSanitize(req.query.order);
      orderFiled = orderFiled && allowedOrderFields[orderFiled] ? orderFiled : defaultOrderField;
      var order = {};
      order[orderFiled] = (req.query.orderDir && req.query.orderDir == 'desc') ? -1 : 1;


      async.parallel([
        function(cb) {
          collection.find(filters).skip(offset).limit(perPage).sort(order).toArray(cb);
        },
        function(cb) {
          collection.find(filters).count(cb);
        },
        function(cb) {
          collection.find({}).count(cb);
        }
      ], function (err, results) {
        if (err) {
          return res.status(500).json({error: err});
        }
        var nodes = results[0];
        var recordsFiltered = results[1];
        var recordsTotal = results[2];

        nodes.forEach(function(i) { delete i._id });
        var nodesResult = {
          draw: parseInt(req.query.draw),
          recordsTotal: recordsTotal,
          recordsFiltered: recordsFiltered,
          nodes: nodes
        };
        res.json(nodesResult);
      });
    });
  })

  // delete nodes by id
  .delete(function(req, res) {
    var ids = req.body.ids;
    logger.info('Deleting nodes: ' + ids);
    store.db().collection('nodes', function(err, collection) {
      if (err) {
        return respondWithError(res, err);
      }
      var orIds = ids.map(function(id) { return { 'id': common.mongoSanitize(id) }});
      collection.remove({$or: orIds}, {safe: true}, function(err, result) {
        if (err) {
          return respondWithError(res, err);
        }
        logger.info(result, 'document(s) deleted');
        res.json({ success: true, deleted: result.result.n });
      });
    });
  });

router.route('/nodes/commands')
    .post(function(req, res) {
      store.db().collection('nodes', function(err, collection) {
        if (err) {
          return respondWithError(res, err);
        }
        if (req.body.ids.length > 100) {
          return res.status(500).json({error: 'maximum 100 nodes limit reached'});
        }

        var command = req.body.command;
        var nodeIds = req.body.ids.map(function(id) { return common.mongoSanitize(id) });

        buildCmds(command, nodeIds, collection, function(err, cmds) {
          if (err) {
            return respondWithError(res, err);
          }
          saveCommands(cmds, function(err, results) {
            if (err) {
              respondWithError(res, err);
            } else {
              logger.info(JSON.stringify(results), 'commands update');
              res.json({success: true, nodesUpdated: results.length});
            }
          });
        })
      });
    });

// on routes that end in /nodes/:id
// ----------------------------------------------------
router.route('/nodes/:id')

  // get the node with that id (accessed at GET http://localhost:8080/api/nodes/:id)
  .get(function(req, res) {

    var id = req.params.id;
    logger.info('Retrieving node: %s' + id);
    store.db().collection('nodes', function(err, collection) {
      if (err) {
        return respondWithError(res, err);
      }
      collection.findOne({'id': id}, function(err, item) {
        if (err) {
          return respondWithError(res, err);
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
    logger.info(node, 'Updating node: ' + id);
    store.db().collection('nodes', function(err, collection) {
      if (err) {
        return respondWithError(res, err);
      }
      collection.update({'id': id}, {$set: node}, {safe: true}, function(err, result) {
        if (err) {
          return respondWithError(res, err);
        }
        logger.info(result, 'document(s) updated');
        collection.findOne({'id': id}, function(err, item) {
          if (err) {
            return respondWithError(res, err);
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
    logger.info('Deleting node: ' + id);
    store.db().collection('nodes', function(err, collection) {
      if (err) {
        return respondWithError(res, err);
      }
      collection.remove({'id': id}, {safe: true}, function(err, result) {
        if (err) {
          return respondWithError(res, err);
        }
        logger.info(result, 'document(s) deleted');
        collection.find().toArray(function(err, items) {
          if (err) {
            return respondWithError(res, err);
          }
          items.forEach(function(i) {
            delete i._id
          });
          res.json(items);
        });
      });
    });
  });


router.route('/nodes/:node_id/commands')
  .get(function(req, res) {
    var limit = parseInt(req.query.limit || 10);
    var node_id = req.params.node_id;
    logger.info('Retrieving commands for node: ' + node_id);
    store.db().collection('commands', function(err, collection) {
      if (err) {
        return respondWithError(res, err);
      }
      collection.find({'node_id': node_id}).limit(limit).sort({_id: -1}).toArray(function(err, items) {
        if (err) {
          return respondWithError(res, err);
        }
        res.json(items);
      });
    });
  })
  .post(function(req, res) {

    function respondWithCmds(nodeId) {
      store.db().collection('commands', function(err, collection) {
        if (err) {
          return respondWithError(res, err);
        }

        var limit = parseInt(req.query.limit || 10);
        collection.find({ node_id: nodeId }).limit(limit).sort({ _id: -1 }).toArray(function(err, items) {
          if (err) {
            return respondWithError(res, err);
          }
          items.forEach(function(i) {
            delete i._id
          });
          res.json(items);
        });
      });
    }

    store.db().collection('nodes', function(err, collection) {
      if (err) {
        return res.status(500).json({ error: err });
      }

      var command = req.body;
      var nodeId = [common.mongoSanitize(req.params.node_id)];

      buildCmds(command, nodeId, collection, function(err, cmd) {
        if (err) {
          return respondWithError(res, err);
        }
        saveCommands(cmd, function(err, results) {
          if (err) {
            respondWithError(res, err);
          } else {
            logger.info(results[0], 'command update');
            respondWithCmds(cmd[0].node_id);
          }
        });
      })
    });

  });

// delete a node metadata tag
router.route('/nodes/:id/metadata')
  .delete(function(req, res) {
    var id = req.params.id;
    var metadata = req.body;
    logger.info('Deleting node:' + id + ' metadata:' + metadata);
    store.db().collection('nodes', function(err, collection) {
      if (err) {
        return respondWithError(res, err);
      }
      collection.findOne({'id': id}, function(err, node) {
        if (err || !node) {
          return res.status(500).json({ error: err || 'cannot find node with id:' + id });
        }
        var deletedKeys = 0;
        Object.keys(metadata).forEach(function(k) {
          if (node.metadata[k] == metadata[k]) {
            delete node.metadata[k];
            deletedKeys += 1;
          }
        });
        collection.update({ _id: node._id }, node, { safe: true, upsert: true }, function(err) {
          if (err) {
            return respondWithError(res, err);
          } else {
            res.json({ success: true, keysDeleted: deletedKeys });
          }
        });
      });
    });
  });

// update nodes metadata (overrides existing tags and creates new ones, does not delete old tags).
router.route('/nodes/metadata')
  .post(function(req, res) {
    store.db().collection('nodes', function(err, collection) {
      if (err) {
        return respondWithError(res, err);
      }
      if (req.body.ids.length > 100) {
        return res.status(500).json({ error: 'maximum 100 nodes limit reached' });
      }

      var nodeIds = req.body.ids.map(function(id) { return common.mongoSanitize(id) });
      collection.find(nodesQuery(nodeIds)).toArray(function(err, nodes) {
        if (err) {
          return respondWithError(res, err);
        }
        var metadata = req.body.metadata;
        var updaters = nodes.map(function(node) {
          node.metadata = common.mergeObjects(node.metadata, metadata);
          return function(cb) {
            collection.update({ _id: node._id }, node, { safe: true, upsert: true }, function(err) {
                if (err) {
                  cb(err);
                } else {
                  cb(null, { id: node.id, metadta: node.metadata });
                }
              }
            );
          }
        });

        async.parallel(updaters, function (err, results) {
          if (err) {
            return respondWithError(res, err);
          }
          res.json(results);
        });
      });
    });
  });

router.route('/nodes/:node_id/commands/:created')
  .delete(function(req, res) {
    var node_id = req.params.node_id;
    var created = req.params.created;
    logger.info('Deleting command: ' + created);
    store.db().collection('commands', function(err, collection) {
      if (err) {
        return respondWithError(res, err);
      }
      collection.remove({'created': created, 'status': 'pending', 'node_id': node_id}, {safe: true}, function(err, result) {
        if (err) {
          return respondWithError(res, err);
        }
        logger.info(result, 'document(s) deleted');
        var limit = parseInt(req.query.limit || 10);
        collection.find({node_id: node_id}).limit(limit).sort({_id: -1}).toArray(function(err, items) {
          if (err) {
            return respondWithError(res, err);
          }
          items.forEach(function(i) {
            delete i._id
          });
          res.json(items);
        });
      });
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
        return respondWithError(res, err);
      }
      collection.updateOne(
        {'id': req.params.node_id, 'state.planned': {$elemMatch: {name: moduleName, version: moduleVersion}}},
        {$set: {"state.planned.$": module}},
        {safe: true}, function(err, result) {
          if (err) {
            return respondWithError(res, err);
          }
          logger.info(result, 'document(s) updated');
          collection.findOne({'id': req.params.node_id}, function(err, item) {
            if (err) {
              return respondWithError(res, err);
            }
            delete item._id;
            res.json(item);
          });
        });
    });
  });


router.route('/modules')

  // create a module (accessed at POST http://localhost:8080/api/modules)
  .post(function(req, res) {
    var module = req.body;
    if (!module || !module.name || !module.version) {
      return res.status(400).json({error: 'must provide module name and version'});
    }
    if (module.outpost) {
      module.outpost = common.unescapeHtml(module.outpost);
      if (!semver.validRange(module.outpost)) {
        return res.status(400).json({error: 'outpost semver requirement is not a valid range'});
      }
    }
    logger.info(module, 'Adding module');
    store.db().collection('modules', function(err, collection) {
      collection.findOne({name: module.name, version: module.version}, function(err, item) {
        if (err) {
          return respondWithError(res, err);
        }
        if (item) {
          return res.status(400).json({error: 'module already exists'});
        }
        collection.insertOne(module, {safe: true}, function(err, result) {
          if (err) {
            return respondWithError(res, err);
          }
          logger.info(result.result, 'Success');
          collection.aggregate([{
            $group: {
              _id: "$name",
              versions: {$push: "$$ROOT"}
            }
          }, {$sort: {"versions.version": 1}}]).toArray(function(err, items) {
            if (err) {
              return respondWithError(res, err);
            }
            items.forEach(function(i) {
              i.name = i._id;
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
        return respondWithError(res, err);
      }
      collection.aggregate([{
        $group: {
          _id: "$name",
          versions: {$push: "$$ROOT"}
        }
      }, {$sort: {"versions.version": 1}}]).toArray(function(err, items) {
        if (err) {
          return respondWithError(res, err);
        }
        items.forEach(function(i) {
          i.name = i._id;
          delete i._id;
          i.versions.forEach(function(v) {
            delete v._id
          });
        });
        res.json(items);
      });
    });
  });

router.route('/modules/:name/:version')

  // get a single module (accessed at GET http://localhost:8080/api/modules/:name/:version)
  .get(function(req, res) {
    store.db().collection('modules', function(err, collection) {
      if (err) {
        return respondWithError(res, err);
      }
      collection.findOne({name: req.params.name, version: req.params.version}, function(err, item) {
        if (err) {
          return respondWithError(res, err);
        }
        logger.info(item, 'Success');
        delete item._id;
        res.json(item);
      });
    });
  })

  // delete a single module (accessed at DELETE http://localhost:8080/api/modules/:name/:version)
  .delete(function(req, res) {
    var name = req.params.name
    var version = req.params.version;
    logger.info('Removing module ' + name + '@' + version);
    store.db().collection('modules', function(err, collection) {
      collection.deleteOne({name: name, version: version}, function(err, result) {
        if (err) {
          return respondWithError(res, err);
        }
        logger.info(result, 'Success');
        collection.aggregate([{
          $group: {
            _id: "$name",
            versions: {$push: "$$ROOT"}
          }
        }, {$sort: {"versions.version": 1}}]).toArray(function(err, items) {
          if (err) {
            return respondWithError(res, err);
          }
          res.json(items);
        });
      });
    });
  });

module.exports = {
  router: router,
  init: init
};


// api utilities :
// ----------------------------------------------------

function saveCommands(commands, cb) {
  store.db().collection('commands', function(err, collection) {
    if (err) {
      return respondWithError(res, err);
    }

    var results = [], last = commands.length - 1;
    commands.forEach(function(cmd, idx) {
      collection.update(
        { node_id: cmd.node_id, type: cmd.type, action: cmd.action, status: cmd.status },
        cmd,
        { safe: true, upsert: true }, function(err, result) {
          if (err) {
            return cb(err);
          }
          results.push(result);
          if (idx == last) {
            cb(null, results);
          }
        }
      );
    });
  });
}

function nodesQuery(nodeIds) {
  return { $or: nodeIds.map(function(id){ return { id: id }}) };
}

function buildCmds(command, nodeIds, collection, cb) {
  function nodeState(n) {
    return n.state.planned && n.state.planned.map(function (s) {
      var state = s.state;
      state.name = s.name;
      state.version = s.version;
      return state;
    });
  }

  var cmds;
  if (command.type === 'state' && command.action === 'apply') {
    collection.find(nodesQuery(nodeIds), {state: 1, id: 1, _id: 0}).toArray(function(err, nodes) {
      if (err) cb(err);

      var date = command.created || new Date().toISOString();
      cmds = nodes.map(function(node) {
        var c = common.mergeObjects({}, command);
        return common.mergeObjects(c, { created: date, node_id: node.id, status: 'pending', state: nodeState(node) });
      });

      cb(null, cmds);
    });

  } else {
    var date = command.created || new Date().toISOString();
    cmds = nodeIds.map(function (id) {
      var c = common.mergeObjects({}, command);
      return common.mergeObjects(c, { created: date, node_id: id, status: 'pending' });
    });
    cb(null, cmds);
  }
}

function respondWithError(res, err) {
  res.status(500).json({error: err.message || err})
}