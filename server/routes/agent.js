var crypto = require('crypto');
var express = require('express');
var router = express.Router();
var store = require('../store');
var ObjectID = store.ObjectID;
var async = require('async');
var common = require('../common');

var logger;
function init(log){
  logger = log.child({module: 'api'});
}

function agentAuthHash(req) {
  if (!req.body || !req.body.id || req.body.id.length === 0) {
    logger.info('invalid agent id: ' + JSON.stringify(req.body));
    return null;
  }
  if (req.query['auth']) {
    return authHash(req.body.id, req.query['auth']);
  }
  return req.body.id;
}

// calculate the hash of the agent id with the auth token so that they will be always tied together
function authHash(id, auth) {
  var hash = crypto.createHash('sha256');
  hash.update(id + ':' + auth);
  return hash.digest('hex');
}

router.route('/commands/:command_id')
  .put(function(req, res) {
    var command_id = req.params.command_id;
    var command = req.body.payload;
    logger.info('Updating command: ' + command_id);
    store.db().collection('commands', function(err, collection) {
      if (err) {
        return res.status(500).json({error: err});
      }
      collection.update({'_id': new ObjectID(command_id)}, {
        $set: {
          'status': command.status,
          'details': command.details,
          'log': command.log
        }
      }, {safe: true}, function(err, result) {
        if (err) {
          return res.status(500).json({error: err});
        }
        logger.info(result, 'document(s) updated');
        collection.findOne({'_id': new ObjectID(command_id)}, function(err, item) {
          if (err) {
            return res.status(500).json({error: err});
          }
          delete item._id;
          res.json(item);
        });
      });
    });
  });

router.route('/unregister')
  .post(function(req, res, next) {
    var input = req.body;
    logger.info(input, 'Unregister input');
    var authHash = agentAuthHash(req);
    if (!authHash) {
      return res.status(403).json({error: 'invalid agent auth'});
    }
    var nodeCollection, nodesArchiveCollection;
    async.waterfall([
      function(callback) {
        store.db().collection('nodes', callback);
      },
      function(collection, callback) {
        nodeCollection = collection;
        callback();
      },
      function(callback) {
        store.db().collection('nodesArchive', callback);
      },
      function(collection, callback) {
        nodesArchiveCollection = collection;
        callback();
      },
      function(callback) {
        nodeCollection.findOne({id: input.id}, callback);
      },
      function(node, callback) {
        if(!node){
          logger.info({input: input}, 'node not found');
          callback('node not found');
          return;
        }
        if (node && node.authHash && node.authHash !== authHash) {
          logger.info('invalid agent id and auth combination: ' + JSON.stringify(input));
          callback('invalid agent authentication');
          return;
        }
        logger.info({node_id: node.id}, 'adding node to archive');
        nodesArchiveCollection.insertOne(node, function(err, result){
          callback(err, node);
        });
      },
      function(node, callback) {
        logger.info({node_id: node.id}, 'deleting node');
        nodeCollection.deleteOne({_id: node._id}, callback);
      }
    ], function(err) {
      if (err) {
        return res.status(500).json({error: err});
      }
      res.json({});
    });
  });


router.route('/nodes/sync')

  // sync a node (accessed at POST http://localhost:8080/api/public/nodes/sync)
  .post(function(req, res, next) {
    var input = req.body;
    logger.info(input, 'Sync input');
    var authHash = agentAuthHash(req);
    if (!authHash) {
      return res.status(403).json({error: 'invalid agent auth'});
    }
    var nodeCollection, commandsCollection;
    async.waterfall([
      function(callback) {
        store.db().collection('nodes', callback);
      },
      function(collection, callback) {
        nodeCollection = collection;
        nodeCollection.findOne({id: input.id}, callback);
      },
      function(node, callback) {
        if (node && node.authHash && node.authHash !== authHash) {
          logger.info('invalid agent id and auth combination: ' + JSON.stringify(input));
          callback('invalid agent authentication');
          return;
        }
        nodeCollection.updateOne({id: input.id}, {
          $set: {
            id: input.id,
            name: input.name,
            authHash: authHash,
            'state.current': input.payload.modules,
            info: input.payload.info,
            lastSync: new Date(),
            // add arbitrary metadata about the agent that can be added by an embedding server
            metadata: node && common.mergeObjects(node.metadata, req.metadata) || req.metadata
          }
        }, {safe: true, upsert: true}, function(err) {
          callback(err, node);
        });
      },
      function(node, callback) {
        store.db().collection('commands', callback);
      },
      function(collection, callback) {
        commandsCollection = collection;
        commandsCollection.find({'node_id': input.id, 'status': 'pending'}).toArray(callback);
      },
      function(commands, callback) {
        var ids = [];
        commands.forEach(function(c) {
          c.status = 'delivered';
          ids.push(new ObjectID(c._id));
        });
        commandsCollection.update(
          {'_id': {'$in': ids}},
          {$set: {status: 'delivered'}},
          {safe: true, multi: true}, function(err, result) {
            logger.info(result, 'document(s) updated');
            callback(err, commands);
          });
      }
    ], function(err, commands) {
      if (err) {
        return res.status(500).json({error: err});
      }
      res.json({commands: commands});
    });
  });

module.exports = {
  router: router,
  init: init
};
