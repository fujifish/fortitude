var express = require('express');
var semver = require('semver');
var common = require('../common');
var store = require('../store');
var async = require('async');
var safeExecute = common.safeExecute;

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
      if (err) {
        return respondWithError(res, err);
      }

      collection.insert(node, {safe: true}, safeExecute(function(err, result) {
        if (err) {
          return respondWithError(res, err);
        }
        logger.info(result[0], 'Success');
        res.json(result[0]);
      }));
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
      var orFilters = [], andFilters = [], filters = {}, filter = {};
      if (searchTerm) {
        // search nodes without 'searchTerm'
        if (searchTerm[0] == '-') {
          searchableFields.forEach(function(field) {
            filter = {};
            filter[field] = { $not: new RegExp('^' + searchTerm.substring(1) + '.*', 'i') };
            andFilters.push(filter);
          });
          if(!filters['$and']) filters['$and'] = [];
          filters['$and'] = filters['$and'].concat(andFilters);
        }
        // search nodes with 'searchTerm'
        else {
          searchableFields.forEach(function(field) {
            filter = {};
            filter[field] = new RegExp('^' + searchTerm + '.*', 'i');
            orFilters.push(filter);
          });
          if(!filters['$and']) filters['$and'] = [];
          filters['$and'].push({ $or: orFilters });
        }
      }

      // also filter by 'tag' parameter (includes tags, metadata and current state).
      // tag is a string of Name[:<val|"val val"|'val val'>] Or an array of these elements
      if (req.query.tag && !Array.isArray(req.query.tag)) {
        req.query.tag = [req.query.tag];
      }
      req.query.tag && req.query.tag.forEach(function(tag) {
        tag = common.mongoSanitize(tag);
        var m = tag.match(/^(.+):(.+)$/), tagValue;
        orFilters = [], andFilters = [], filter = {};
        if (m) {
          tagValue = m[2] && m[2].replace(/"/g, '');
          // search nodes without tag:value
          if(m[1][0] == '-') {
            filter['info.tags.' + m[1].substring(1)] = { $not: new RegExp('^' + tagValue, 'i') };
            andFilters.push(filter);
            filter = {};
            filter['metadata.' + m[1].substring(1)] = { $not: new RegExp('^' + tagValue, 'i') };
            andFilters.push(filter);
            filter = {'state.current': { $not: { $elemMatch: {'name': new RegExp('^' + m[1].substring(1), 'i'), version: new RegExp('^' + tagValue, 'i')}}}};
            andFilters.push(filter);
            if(!filters['$and']) filters['$and'] = [];
            filters['$and'] = filters['$and'].concat(andFilters);
          }
          // search nodes with tag:value
          else {
            filter['info.tags.' + m[1]] = new RegExp('^' + tagValue, 'i');
            orFilters.push(filter);
            filter = {};
            filter['metadata.' + m[1]] = new RegExp('^' + tagValue, 'i');
            orFilters.push(filter);
            filter = {'state.current': {$elemMatch: {'name': new RegExp('^' + m[1], 'i'), version: new RegExp('^' + tagValue, 'i')}}};
            orFilters.push(filter);
            if(!filters['$and']) filters['$and'] = [];
            filters['$and'].push({ $or: orFilters });
          }
        }
        else {
          // search nodes without a tag (any value)
          if(tag[0] == '-') {
            filter['info.tags.' + tag.substring(1)] = { $exists: false };
            andFilters.push(filter);
            filter = {};
            filter['metadata.' + tag.substring(1)] = { $exists: false };
            andFilters.push(filter);
            filter = { 'state.current.name': { $not: new RegExp('^' + tag.substring(1), 'i')}};
            andFilters.push(filter);
            if(!filters['$and']) filters['$and'] = [];
            filters['$and'] = filters['$and'].concat(andFilters);
          }
          // search nodes with tag (any value)
          else {
            filter['info.tags.' + tag] = { $exists: true };
            orFilters.push(filter);
            filter = {};
            filter['metadata.' + tag] = { $exists: true };
            orFilters.push(filter);
            filter = {'state.current': {$elemMatch: { 'name': new RegExp('^' + tag, 'i') }}};
            orFilters.push(filter);
            if(!filters['$and']) filters['$and'] = [];
            filters['$and'].push({ $or: orFilters });
          }
        }
      });

      if (req.query.lastSeenBefore) {
        if(!filters['$and']) filters['$and'] = [];
        filters['$and'].push({ lastSync: {$lt: new Date(req.query.lastSeenBefore)}});
      }

      var perPage = parseInt(req.query.length) || 1000;
      var offset = parseInt(req.query.start) || 0;

      const allowedOrderFields = { 'name': true, 'lastSync': true, 'info.agentVersion': true, 'info.platform': true }, defaultOrderField = '_id';
      var orderFiled = req.query.order && common.mongoSanitize(req.query.order);
      orderFiled = orderFiled && allowedOrderFields[orderFiled] ? orderFiled : defaultOrderField;
      var order = {};
      order[orderFiled] = (req.query.orderDir && req.query.orderDir == 'desc') ? -1 : 1;


      function done(err, results) {
        if (err) {
          return respondWithError(res, err);
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
      }

      async.parallel([
        function(cb) {
          collection.find(filters).skip(offset).limit(perPage).sort(order).toArray(safeExecute(cb, done));
        },
        function(cb) {
          collection.find(filters).count(safeExecute(cb, done));
        },
        function(cb) {
          collection.find({}).count(safeExecute(cb, done));
        }
      ], done);
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
      collection.remove({$or: orIds}, {safe: true}, safeExecute(function(err, result) {
        if (err) {
          return respondWithError(res, err);
        }
        logger.info(result, 'document(s) deleted');
        res.json({ success: true, deleted: result.result.n });
      }));
    });
  });

router.route('/nodes/commands')
  .post(function(req, res) {
    store.db().collection('nodes', function(err, collection) {
      if (err) {
        return respondWithError(res, err);
      }
      if (req.body.ids.length > 100) {
        return respondWithError(res, 'maximum 100 nodes limit reached');
      }

      var command = req.body.command;
      command.user = req.user;
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

router.route('/nodes/commands/peek')
  // get last command for the given node ids
  .post(function(req, res) {
    var nodeIds = req.body.ids && req.body.ids.map(function(id) { return common.mongoSanitize(id) }) || [];
    if (!nodeIds.length) {
      return res.json({ success: true, commands: [] });
    }

    logger.info('Retrieving last commands for nodes: ' + nodeIds);
    store.db().collection('commands', function(err, collection) {
      if (err) {
        return respondWithError(res, err);
      }
      var groupBy = {$group: { _id: "$node_id", status: { "$first": "$status" }}};
      collection.aggregate([{$match: commandsNodeQuery(nodeIds)}, {$sort: {_id: -1}}, groupBy]).toArray(safeExecute(function(err, items) {
        if (err) {
          return respondWithError(res, err);
        }
        res.json({ success:true, commands: items });
      }));
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
      collection.findOne({'id': id}, safeExecute(function(err, item) {
        if (err) {
          return respondWithError(res, err);
        }
        delete item._id;
        res.json(item);
      }));
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
      collection.update({'id': id}, {$set: node}, {safe: true}, safeExecute(function(err, result) {
        if (err) {
          return respondWithError(res, err);
        }
        logger.info(result, 'document(s) updated');
        collection.findOne({'id': id}, safeExecute(function(err, item) {
          if (err) {
            return respondWithError(res, err);
          }
          delete item._id;
          res.json(item);
        }));
      }));
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
      collection.remove({'id': id}, {safe: true}, safeExecute(function(err, result) {
        if (err) {
          return respondWithError(res, err);
        }
        logger.info(result, 'document(s) deleted');
        collection.find().toArray(safeExecute(function(err, items) {
          if (err) {
            return respondWithError(res, err);
          }
          items.forEach(function(i) {
            delete i._id
          });
          res.json(items);
        }));
      }));
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
      collection.find({'node_id': node_id}).limit(limit).sort({_id: -1}).toArray(safeExecute(function(err, items) {
        if (err) {
          return respondWithError(res, err);
        }
        res.json(items);
      }));
    });
  })
  .post(function(req, res) {

    function respondWithCmds(nodeId) {
      store.db().collection('commands', function(err, collection) {
        if (err) {
          return respondWithError(res, err);
        }

        var limit = parseInt(req.query.limit || 10);
        collection.find({ node_id: nodeId }).limit(limit).sort({ _id: -1 }).toArray(safeExecute(function(err, items) {
          if (err) {
            return respondWithError(res, err);
          }
          items.forEach(function(i) {
            delete i._id
          });
          res.json(items);
        }));
      });
    }

    store.db().collection('nodes', function(err, collection) {
      if (err) {
        return respondWithError(res, err);
      }

      var command = req.body;
      command.user = req.user;
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
      collection.findOne({'id': id}, safeExecute(function(err, node) {
        if (err || !node) {
          return respondWithError(res, err || 'cannot find node with id:' + id);
        }
        var deletedKeys = 0;
        Object.keys(metadata).forEach(function(k) {
          if (node.metadata[k] == metadata[k]) {
            delete node.metadata[k];
            deletedKeys += 1;
          }
        });
        collection.update({ _id: node._id }, node, { safe: true, upsert: true }, safeExecute(function(err) {
          if (err) {
            return respondWithError(res, err);
          } else {
            res.json({ success: true, keysDeleted: deletedKeys });
          }
        }));
      }));
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
        return respondWithError(res, 'maximum 100 nodes limit reached');
      }

      var nodeIds = req.body.ids.map(function(id) { return common.mongoSanitize(id) });
      collection.find(nodesQuery(nodeIds)).toArray(safeExecute(function(err, nodes) {
        if (err) {
          return respondWithError(res, err);
        }
        var metadata = req.body.metadata;
        var updaters = nodes.map(function(node) {
          node.metadata = common.mergeObjects(node.metadata, metadata);
          return function(cb) {
            collection.update({ _id: node._id }, node, { safe: true, upsert: true }, safeExecute(function(err) {
              if (err) {
                done(err); // since cb might throw an exception, we 'err' with done to not call cb twice
              } else {
                cb(null, { id: node.id, metadta: node.metadata });
              }
            }));
          }
        });

        function done(err, results) {
          if (err) {
            return respondWithError(res, err);
          }
          res.json(results);
        }

        async.parallel(updaters, done);
      }));
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
      collection.remove({'created': created, 'status': 'pending', 'node_id': node_id}, {safe: true}, safeExecute(function(err, result) {
        if (err) {
          return respondWithError(res, err);
        }
        logger.info(result, 'document(s) deleted');
        var limit = parseInt(req.query.limit || 10);
        collection.find({node_id: node_id}).limit(limit).sort({_id: -1}).toArray(safeExecute(function(err, items) {
          if (err) {
            return respondWithError(res, err);
          }
          items.forEach(function(i) {
            delete i._id
          });
          res.json(items);
        }));
      }));
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
        {safe: true}, safeExecute(function(err, result) {
          if (err) {
            return respondWithError(res, err);
          }
          logger.info(result, 'document(s) updated');
          collection.findOne({'id': req.params.node_id}, safeExecute(function(err, item) {
            if (err) {
              return respondWithError(res, err);
            }
            delete item._id;
            res.json(item);
          }));
        }));
    });
  });


router.route('/modules')

// create a module (accessed at POST http://localhost:8080/api/modules)
  .post(function(req, res) {
    var module = req.body;
    if (!module || !module.name || !module.version) {
      return respondWithError(res, 'must provide module name and version', 400);
    }
    if (module.outpost) {
      module.outpost = common.unescapeHtml(module.outpost);
      if (!semver.validRange(module.outpost)) {
        return respondWithError(res, 'outpost semver requirement is not a valid range', 400);
      }
    }
    logger.info(module, 'Adding module');
    store.db().collection('modules', function(err, collection) {
      collection.findOne({name: module.name, version: module.version}, safeExecute(function(err, item) {
        if (err) {
          return respondWithError(res, err);
        }
        if (item) {
          return respondWithError(res, 'module already exists', 400);
        }
        collection.insertOne(module, {safe: true}, safeExecute(function(err, result) {
          if (err) {
            return respondWithError(res, err);
          }
          logger.info(result.result, 'Success');
          collection.aggregate([{
            $group: {
              _id: "$name",
              versions: {$push: "$$ROOT"}
            }
          }, {$sort: {"versions.version": 1}}]).toArray(safeExecute(function(err, items) {
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
          }));
        }));
      }));
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
      }, {$sort: {"versions.version": 1}}]).toArray(safeExecute(function(err, items) {
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
      }));
    });
  });

router.route('/modules/:name/:version')

// get a single module (accessed at GET http://localhost:8080/api/modules/:name/:version)
  .get(function(req, res) {
    store.db().collection('modules', function(err, collection) {
      if (err) {
        return respondWithError(res, err);
      }
      collection.findOne({name: req.params.name, version: req.params.version}, safeExecute(function(err, item) {
        if (err) {
          return respondWithError(res, err);
        }
        logger.info(item, 'Success');
        delete item._id;
        res.json(item);
      }));
    });
  })

  // delete a single module (accessed at DELETE http://localhost:8080/api/modules/:name/:version)
  .delete(function(req, res) {
    var name = req.params.name;
    var version = req.params.version;
    logger.info('Removing module ' + name + '@' + version);
    store.db().collection('modules', function(err, collection) {
      collection.deleteOne({name: name, version: version}, safeExecute(function(err, result) {
        if (err) {
          return respondWithError(res, err);
        }
        logger.info(result, 'Success');
        collection.aggregate([{
          $group: {
            _id: "$name",
            versions: {$push: "$$ROOT"}
          }
        }, {$sort: {"versions.version": 1}}]).toArray(safeExecute(function(err, items) {
          if (err) {
            return respondWithError(res, err);
          }
          res.json(items.map(function(i) {
            i.name = i._id;
            delete i._id;
            i.versions.forEach(function(v) {
              delete v._id
            });
            return i;
          }));
        }));
      }));
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
        { safe: true, upsert: true }, safeExecute(function(err, result) {
          if (err) {
            return cb(err);
          }
          results.push(result);
          if (idx == last) {
            cb(null, results);
          }
        }));
    });
  });
}

function nodesQuery(nodeIds) {
  return { $or: nodeIds.map(function(id){ return { id: id }}) };
}

function commandsNodeQuery(nodeIds) {
  return { $or: nodeIds.map(function(id){ return { node_id: id }}) };
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
    collection.find(nodesQuery(nodeIds), {state: 1, id: 1, _id: 0}).toArray(safeExecute(function(err, nodes) {
      if (err) cb(err);

      var date = command.created || new Date().toISOString();
      cmds = nodes.map(function(node) {
        var c = common.mergeObjects({}, command);
        return common.mergeObjects(c, { created: date, node_id: node.id, status: 'pending', state: nodeState(node) });
      });

      cb(null, cmds);
    }));

  } else {
    var date = command.created || new Date().toISOString();
    cmds = nodeIds.map(function (id) {
      var c = common.mergeObjects({}, command);
      return common.mergeObjects(c, { created: date, node_id: id, status: 'pending' });
    });
    cb(null, cmds);
  }
}

// since some mongodb callback exceptions are returned to the mongodb callbacks with 'message' field.
function respondWithError(res, err, status) {
  logger.error(err.message || err);
  res.status(status || 500).json({ error: err.message || err })
}