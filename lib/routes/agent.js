var express = require('express');
var router = express.Router();
var store = require('../store');
var ObjectID = store.ObjectID;

router.route('/commands/:command_id')
  .put(function(req, res) {
    var command_id = req.params.command_id;
    var command = req.body.payload;
    console.log('Updating command: ' + command_id);
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
        console.log('' + result + ' document(s) updated');
        collection.findOne({'_id': new ObjectID(command_id)}, function(err, item) {
          if (err) {
            return res.status(500).json({error: err});
          }
          delete item._id;
          res.json(item);
        });
      });
    });
  })

router.route('/nodes/sync')

  // sync a node (accessed at POST http://localhost:8080/api/public/nodes/sync)
  .post(function(req, res, next) {
    var input = req.body;
    console.log('Sync input: ' + JSON.stringify(input));
    //TODO: validate key
    var nodeCollection, commandsCollection;
    async.waterfall([
      function(callback) {
        store.db().collection('nodes', callback);
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
        store.db().collection('commands', callback);
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
          {'_id': {'$in': commands}},
          {$set: {status: 'delivered'}},
          {safe: true, multi: true}, function(err, result) {
            console.log('' + result + ' document(s) updated');
            callback(err, commands);
          });
      }
    ], function(err, commands) {
      if (err) {
        return res.status(500).json({error: err});
      }
      res.json({commands: commands});
    });
  })

module.exports = router;