(function() {

  $(function() {

    function confirmAction(text, subtext, yes) {
      if (typeof subtext === 'function') {
        yes = subtext;
        subtext = null;
      }
      $('#confirm-text').html(text);
      $('#confirm-subtext').html(subtext);
      $('#confirm-yes').off('click').on('click', function() {
        yes && yes();
      });
      $('#confirm-dialog').modal('show');
    }

    function asCodeSnippet(text) {
      return $('<pre>', {class: 'code-snippet', text: text}).prop('outerHTML');
    }

    function findModuleVersion(name, version) {
      for (var i = 0; i < HB.STATE.modules.data.length; ++i) {
        var module = HB.STATE.modules.data[i];
        for (var j = 0; j < module.versions.length; ++j) {
          var moduleVer = module.versions[j];
          if (moduleVer.name === name && moduleVer.version === version) {
            return moduleVer;
          }
        }
      }
      return null;
    }

    function updateNodesTable(data) {
      updateNodeModulesTable($('#currentState-table'), []);
      updateNodeModulesTable($('#plannedState-table'), []);
      updateNodeCommandsTable($('#commands-table'), []);

      $('#load_spinner').hide();
      var table = $('#nodes-table');
      table.bootstrapTable('destroy');
      table.bootstrapTable({
        classes: 'table table-no-bordered cursor-hand',
        clickToSelect: true,
        singleSelect: true,
        selectItemName: 'btSelectItemNodes',
        columns: [
          {
            radio: true,
            clickToSelect: true
          },
          {
            field: 'name',
            title: 'Name'
          },
          {
            field: 'metdata',
            title: 'Metadata'
          },
          {
            field: 'id',
            title: 'ID'
          },
          {
            field: 'platform',
            title: 'Platform'
          },
          {
            field: 'lastSync',
            title: 'Last Sync'
          },
          {
            field: 'agentVersion',
            title: 'Agent Version'
          },
          {
            field: 'actions',
            title: 'Actions'
          }
        ],
        data: data.map(function(obj, index) {
          console.log(obj);
          obj.rowIndex = index;
          return buildNodeRow(obj);
        }),
        onCheck: function(row) {
          HB.STATE.nodes.selectedIndex = row.obj.rowIndex;
          displayNodeDetails(row.obj);
        },
        onPostBody: function() {
          table.find('[data-node-action-remove]').each(function(i, e) {
            $(e).off('click').on('click', function() {
              var nodeId = $(e).data('node-id');
              var nodeName = $(e).data('node-name');
              confirmAction('Are you sure you want to remove node ' + nodeId + ' (' + nodeName + ')?', function() {
                HB.API.removeNode(nodeId, function(err, modules) {
                  updateNodesTable(modules);
                });
              });
            });
          });
          setTimeout(function() {
            if (data.length > 0) {
              table.bootstrapTable('check', 0);
            }
          }, 100);
        }
      });

    }

    function modulesTableActions(index) {
      var a = $('<a>', {'data-module-remove': index, id: 'module-remove-' + index, href: '#',
        'data-toggle': "tooltip", 'data-placement': "top", title: "Remove"});
      return a.append($('<i>', {class: 'glyphicon glyphicon-remove'})).prop('outerHTML');
    }

    function flattenModulesData(data) {
      var result = [];
      data.forEach(function(mod) {
        mod.versions.forEach(function(ver) {
          result.push({
            name: ver.name,
            version: ver.version,
            actions: modulesTableActions(result.length),
            obj: ver
          });
        });
      });
      return result;
    }

    function updateModulesTable(data) {
      updateModuleDetailsView([]);
      HB.STATE.modules.data = data;
      HB.STATE.modules.flatData = flattenModulesData(data);
      var table = $('#modules-table');
      table.bootstrapTable('destroy');
      table.bootstrapTable({
        classes: 'table table-no-bordered cursor-hand',
        clickToSelect: true,
        singleSelect: true,
        selectItemName: 'btSelectItemModules',
        showHeader: false,
        columns: [
          {
            radio: true,
            clickToSelect: true
          },
          {
            field: 'name'
          },
          {
            field: 'version'
          },
          {
            field: 'actions'
          }
        ],
        data: HB.STATE.modules.flatData,
        onCheck: function(data) {
          updateModuleDetailsView(data);
        },
        onPostBody: function() {
          setTimeout(function() {
            if (data.length > 0) {
              table.bootstrapTable('check', 0);
            }
          }, 100);
        }
      });

      table.find('[data-module-remove]').each(function(i, e) {
        $(e).tooltip();
        $(e).off('click').on('click', function() {
          var name = HB.STATE.modules.flatData[i].name;
          var version = HB.STATE.modules.flatData[i].version;
          confirmAction('Remove module ' + name + '@' + version + '?', function() {
            HB.API.removeModule(name, version, function(err, modules) {
              updateModulesTable(modules);
            });
          });
        });
      });

    }

    function updateModuleDetailsView(data) {
      $('#module-details-view').text(JSON.stringify(data.obj, null, 2));
    }

    function commandDetails(command) {
      return $('<a>', {href: '#', text: 'Details', 'data-command-details': '', id: 'command-details' + command._id}).prop('outerHTML');
    }

    function updateNodeCommandsTable(table, commands) {
      commands = commands || [];
      table.bootstrapTable('destroy');
      table.bootstrapTable({
        classes: 'table table-hover table-no-bordered cursor-hand',
        showHeader: false,
        columns: [
          {
            field: 'type',
            title: 'Type'
          },
          {
            field: 'status',
            title: 'Status'
          },
          {
            field: 'details',
            title: 'Details'
          },
          {
            field: 'created',
            title: 'Created'
          }
        ],
        data: commands.map(function(obj) {
          return {type: obj.type, status: obj.status, details: commandDetails(obj), created: obj.created, obj: obj};
        }),
        cardView: false,
        sortName: 'created',
        sortOrder: 'desc',
        onPostBody: function() {
          table.find('[data-command-details]').each(function(i, e) {
            $(e).off('click').on('click', function() {
              $('#command-details-log').text(commands[i].log || '');
              $('#command-details-dialog').modal('show');
            });
          });
        }
      });

    }


    function nodeModuleActions(index) {
      var div = $('<span>');
      var edit = $('<a>', {
        href: '#',
        'data-node-module-edit': '',
        id: 'node-module-edit-' + index,
        class: 'item-action',
        'data-toggle': "tooltip", 'data-placement': "top", title: "Edit"
      }).append($('<i>', {class: 'glyphicon glyphicon-edit'}));
      var remove = $('<a>', {
        href: '#',
        'data-node-module-remove': '',
        id: 'node-module-remove-' + index,
        class: 'item-action',
        'data-toggle': "tooltip", 'data-placement': "top", title: "Remove"
      }).append($('<i>', {class: 'glyphicon glyphicon-remove'}));
      return div.append(edit).append(remove).prop('outerHTML');
    }

    function updateNodeModulesTable(table, modules, editable) {
      modules = modules || [];
      table.bootstrapTable('destroy');
      table.bootstrapTable({
        classes: 'table table-no-bordered cursor-hand',
        cardView: true,
        columns: [
          {
            field: 'name',
            title: 'Name'
          },
          {
            field: 'version',
            title: 'Version'
          },
          {
            field: 'installed',
            title: 'Installed'
          },
          {
            field: 'started',
            title: 'Started'
          },
          {
            field: 'actions',
            title: 'Actions'
          }
        ],
        data: modules.map(function(obj, index) {
          return {
            name: obj.name,
            version: obj.version,
            installed: obj.state.install && obj.state.install.time || '',
            started: obj.state.start && obj.state.start.data && obj.state.start.data.started,
            actions: editable ? nodeModuleActions(index) : '',
            obj: obj
          };
        }),
        onPostBody: function() {
          table.find('[data-node-module-edit]').each(function(i, e) {
            $(e).tooltip();
            $(e).off('click').on('click', function() {
              var module = modules[i];
              HB.STATE.nodes.module = module;
              if (editable) {
                $('#edit-node-module-title').html('Edit ' + module.name + '@' + module.version);
                var moduleData = findModuleVersion(module.name, module.version);
                var schema = moduleData && moduleData.schema && moduleData.schema.configure;
                HB.STATE.nodes.moduleSchema = schema;
                var form = ['*'];
                var values = module.state && module.state.configure && module.state.configure.data;
                if (!schema) {
                  schema = {config: {type: "string", title: "Raw JSON Configuration"}, default: "{}"};
                  form = [{key: 'config', type: 'textarea'}];
                  values = {config: values && JSON.stringify(values, null, 2)};
                }
                $('#edit-node-module-configuration').empty();
                $('#edit-node-module-configuration').jsonForm({
                  schema: schema,
                  form: form,
                  value: values
                });

                if (module.state && module.state.start && module.state.start.data) {
                  if (module.state.start.data.started) {
                    $('#edit-node-module-started').prop("checked", module.state.start.data.started);
                  } else {
                    $('#edit-node-module-started').removeProp("checked");
                  }
                }

                $('#edit-node-module-dialog').modal('show');
              }
            })
          });

          table.find('[data-node-module-remove]').each(function(i, e) {
            $(e).tooltip();
            $(e).off('click').on('click', function() {
              var module = modules[i];
              HB.STATE.nodes.module = module;
              confirmAction('Remove module ' +module.name + '@' + module.version +' from planned state?', function() {
                var node = HB.STATE.nodes.node;
                for (var j = 0; j < node.state.planned.length; ++j) {
                  if (node.state.planned[j].name === module.name &&
                    node.state.planned[j].version === module.version
                  ) {
                    node.state.planned.splice(j, 1);
                  }
                }
                HB.API.updateNodePlannedState(node.id, node.state.planned, function(err, node) {
                  if (!err) {
                    refreshNodeRow(node);
                  }
                });
              });
            })
          });
        }
      });

    }

    function buildNodeActions(obj) {
      var div = $('<span>');
      var remove = $('<a>', {
        href: '#',
        id: 'node-action-remove-' + obj.rowIndex,
        class: 'item-action',
        title: "Remove",
        'data-node-action-remove': '',
        'data-node-id': obj.id,
        'data-node-name': obj.name,
        'data-toggle': "tooltip",
        'data-placement': "top"
      }).append($('<i>', {class: 'glyphicon glyphicon-remove'}));
      return div.append(remove).prop('outerHTML');
    }

    function formatNodeMetadata(meta) {
      if (!meta) {
        return null;
      }

      var data = [];
      Object.keys(meta).forEach(function(key) {
        data.push(key + ': ' + meta[key]);
      });
      return data.join(', ');
    }

    function buildNodeRow(obj) {
      return {
        id: obj.id,
        name: obj.name,
        metadata: formatNodeMetadata(obj.metadata),
        platform: obj.info.platform,
        lastSync: obj.lastSync,
        agentVersion: obj.info.agentVersion,
        actions: buildNodeActions(obj),
        obj: obj
      };
    }

    function displayNodeDetails(node) {
      HB.STATE.nodes.node = node;
      updateNodeModulesTable($('#currentState-table'), node.state.current);
      updateNodeModulesTable($('#plannedState-table'), node.state.planned, true);
      HB.API.getCommands(node.id, function(err, commands) {
        updateNodeCommandsTable($('#commands-table'), commands);
      });
    }

    function refreshNodeRow(node) {
      var newRow = buildNodeRow(node);
      $('#nodes-table').bootstrapTable('updateRow', HB.STATE.nodes.selectedIndex, newRow);
      displayNodeDetails(node);
    }

    ////////////////////////////////////////////////////////

    $('#edit-node-module-save').on('click', function() {
      var node = HB.STATE.nodes.node;
      var module = HB.STATE.nodes.module;
      var schema = HB.STATE.nodes.moduleSchema;
      var config = $('#edit-node-module-configuration').jsonFormValue();
      if (!schema) {
        config = config.config;
      }
      if (typeof config === 'string') {
        config = config.trim();
        if (config.length === 0) {
          config = '{}';
        }
        config = JSON.parse(config);
      }
      module.state.configure = {data: config, time: new Date().toISOString()};
      //}
      module.state.start = {
        data: {started: $('#edit-node-module-started').prop('checked')},
        time: new Date().toISOString()
      };
      //}

      HB.API.updateNodeModuleState(node.id, module, function(err, node) {
        if (!err) {
          refreshNodeRow(node);
        }
      });
    });

    $('#apply-state-button').on('click', function() {
      confirmAction('Apply the current planned state to the agent?', 'These changes will be applied next time the agent performs a sync.', function() {
        var node = HB.STATE.nodes.node;
        HB.API.applyNodeState(node.id, function (err, commands) {
          if (!err) {
            updateNodeCommandsTable($('#commands-table'), commands);
          }
        });
      });
    });

    $('#copy-current-to-planned-button').on('click', function() {
      confirmAction('Set current state as planned state?',
        'Clicking "Yes" will override the entire planned state with the current state.',
        function() {
          var node = HB.STATE.nodes.node;
          HB.API.updateNodePlannedState(node.id, node.state.current, function(err, node) {
            if (!err) {
              refreshNodeRow(node);
            }
          });
        });
    });

    $('#edit-node-module-dialog').on('shown.bs.modal', function() {
      $('#edit-node-module-dialog').focus()
    });


    ////////// ADD NODE MODULE DIALOG ////////////////

    // populate versions for the selected module
    var selectName = $('#add-node-module-name');
    selectName.change(function() {
      var module = selectName.find(':selected').data();
      selectVersion.empty();
      // populate available versions
      module.versions.forEach(function(v) {
        selectVersion.append($('<option>', {text: v.version, data: v}));
      });
      selectVersion.trigger('change');
    });

    // populate configuration of the selected version
    var selectVersion = $('#add-node-module-version');
    selectVersion.change(function() {
      var version = selectVersion.find(':selected').data();
      var schema = version.schema && version.schema.configure;
      var form = ['*'];
      if (!schema) {
        schema = {config: {type: "string", title: "Raw JSON Configuration"}, default: "{}"};
        form = [{key: 'config', type: 'textarea'}];
      }

      var configElement = $('#add-node-module-configuration');
      configElement.empty();
      configElement.jsonForm({
        schema: schema,
        form: form
      });
    });

    $('#add-node-module-button').on('click', function() {
      var modules = HB.STATE.modules.data;

      selectName.empty();
      // populate available modules
      modules.forEach(function(m) {
        selectName.append($('<option>', {text: m.name, data: m}));
      });

      selectName.trigger('change');

      $('#add-node-module-dialog').modal('show');
    });

    $('#add-node-module-save').on('click', function() {
      var node = HB.STATE.nodes.node;
      var module = selectVersion.find(':selected').data();
      var schema = module.schema;
      var config = $('#add-node-module-configuration').jsonFormValue();
      if (!schema) {
        config = config.config;
      }
      if (typeof config === 'string') {
        config = config.trim();
        if (config.length === 0) {
          config = '{}';
        }
        config = JSON.parse(config);
      }

      module.state = {};
      module.state.configure = {data: config, time: new Date().toISOString()};
      module.state.start = {
        data: {started: $('#add-node-module-started').prop('checked')},
        time: new Date().toISOString()
      };

      node.state = node.state || {};
      node.state.planned = node.state.planned || [];
      node.state.planned.push(module);
      HB.API.updateNodePlannedState(node.id, node.state.planned, function(err, node) {
        if (!err) {
          refreshNodeRow(node);
        }
      });
    });

    ////////////////////////////////////////////////////////

    $('#new-module-dialog').on('shown.bs.modal', function() {
      $('#new-module-dialog').focus()
    });

    $('#new-module-button').on('click', function() {
      $('#new-module-dialog').modal('show');
    });

    $('#new-module-save').on('click', function() {
      HB.API.newModule($('#new-module-json-textarea').val(), function(err, modules) {
        updateModulesTable(modules);
      });
    });


    ////////////////////////////////////////////////////////

    var sidebarItems = $('#sidebar').find('[data-nav]');

    function hideAllPages() {
      sidebarItems.each(function(i, e2) {
        $(e2).removeClass('active');
        $('#' + e2.getAttribute('data-nav')).hide();
      });
    }

    sidebarItems.each(function(i, e) {
      $(e).on('click', function() {
        hideAllPages();
        $(e).addClass('active');
        $('#' + e.getAttribute('data-nav')).show();
      });
    });
    $(sidebarItems[0]).trigger('click');

    ////////////////////////////////////////////////////////

    console.log("starting");
    $('#load_spinner').show();

    HB.API.getModules(function(err, data) {
      updateModulesTable(data);
    });

    HB.API.getNodes(function(err, data) {
      updateNodesTable(data);
    });


  });


})();
