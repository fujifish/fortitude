(function() {

  var HB = window.HB;
  $(function() {

    function asCodeSnippet(text) {
      return '<pre class="code-snippet">' + text + '</pre>';
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
          }
        ],
        data: data.map(function(obj, index) {
          console.log(obj);
          obj.rowIndex = index;
          return buildNodeRow(obj);
        }),
        onCheck: function(row) {
          $("#node-details").data("row-index", row.rowIndex);
          displayNodeDetails(row);
        },
        onPostBody: function() {
          setTimeout(function() {
            table.bootstrapTable('check', 0);
          }, 100);
        }
      });

    }

    function modulesTableActions(index) {
      return '<div>' +
        '<a href="#" data-module-remove id="module-remove-' + index + '"><i class="glyphicon glyphicon-remove"></i></a>' +
        '</div>';
    }

    function updateModulesTable(data) {
      updateModuleDetailsTable([]);
      var table = $('#modules-table');
      table.data('modules-data', data);
      table.bootstrapTable('destroy');
      table.bootstrapTable({
        classes: 'table table-hover table-no-bordered cursor-hand max-50',
        clickToSelect: true,
        singleSelect: true,
        selectItemName: 'btSelectItemModules',
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
            field: 'version',
            title: 'Version'
          },
          {
            field: 'actions',
            title: 'Actions'
          }
        ],
        data: (function() {
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
        })(),
        onCheck: function(data) {
          updateModuleDetailsTable(data);
        },
        onPostBody: function() {
          setTimeout(function() {
            table.bootstrapTable('check', 0);
          }, 100);
        }
      });

      table.find('[data-module-remove]').each(function(i, e) {
        $(e).click(function() {
          var name = data[i].name;
          var version = data[i].version;
          HB.API.removeModule(name, version, function(err, modules) {
            updateModulesTable(modules);
          });
        });
      });

    }

    function updateModuleDetailsTable(data) {
      var table = $('#module-details-table');
      table.bootstrapTable('destroy');
      table.bootstrapTable({
        classes: 'table table-no-bordered cursor-hand',
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
            field: 'data',
            title: ''
          }
        ],
        data: [{name: data.name, version: data.version, data: asCodeSnippet(JSON.stringify(data.obj, null, 2))}],
        cardView: true,
        sortName: 'name',
        sortOrder: 'desc',
        onClickRow: function(data, $element) {
        }
      });

    }

    function updateNodeCommandsTable(element, commands) {
      commands = commands || [];
      element.bootstrapTable('destroy');
      element.bootstrapTable({
        classes: 'table table-hover table-no-bordered cursor-hand',
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
            field: 'created',
            title: 'Created'
          }
        ],
        data: commands.map(function(obj) {
          return {type: obj.type, status: obj.status, created: obj.created, obj: obj};
        }),
        cardView: false,
        sortName: 'created',
        sortOrder: 'desc',
        onClickRow: function(row, $element) {
        }
      });

    }


    function nodeModuleActions(index) {
      var result =
        ($('<a>', {href: '#', 'data-node-module-edit': '', id: 'node-module-edit-'+index}).append($('<i>', {class: 'glyphicon glyphicon-edit'}))).prop('outerHTML') + ' ' +
        ($('<a>', {href: '#', 'data-node-module-remove': '', id: 'node-module-remove-'+index}).append($('<i>', {class: 'glyphicon glyphicon-remove'}))).prop('outerHTML');

      return result;
      //'<a href="#" data-node-module-edit id="node-module-edit-' + index + '"><i class="glyphicon glyphicon-edit"></i></a> ' +
      //  '<a href="#" data-node-module-remove id="node-module-remove-' + index + '"><i class="glyphicon glyphicon-remove"></i></a>';
    }

    function updateNodeModulesTable(table, modules, editable) {
      modules = modules || [];
      table.bootstrapTable('destroy');
      table.bootstrapTable({
        classes: 'table table-no-bordered cursor-hand',
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
            installed: obj.state.install.time,
            started: obj.state.start ? obj.state.start.data.started : false,
            actions: editable ? nodeModuleActions(index) : '',
            obj: obj
          };
        }),
        cardView: true,
        onPostBody: function() {
          table.find('[data-node-module-edit]').each(function(i, e) {
            $(e).click(function() {
              var module = modules[i];
              $("#node-details").data("module", module);
              if (editable) {
                $('#edit-node-module-title').html('Edit ' + module.name + '@' + module.version);

                var schema = module.meta && module.meta.data.schema && module.meta.data.schema.configure;
                $("#node-details").data("schema", schema);
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
        }
      });

    }

    function buildNodeRow(obj) {
      return {
        id: obj.id,
        name: obj.name,
        platform: obj.info.platform,
        lastSync: obj.lastSync,
        agentVersion: obj.info.agentVersion,
        obj: obj
      };
    }

    function displayNodeDetails(row) {
      $("#node-details").data("row", row);
      updateNodeModulesTable($('#currentState-table'), row.obj.state.current);
      updateNodeModulesTable($('#plannedState-table'), row.obj.state.planned, true);
      HB.API.getCommands(row.id, function(err, commands) {
        updateNodeCommandsTable($('#commands-table'), commands);
      });
    }

    function refreshNodeRow(node) {
      var newRow = buildNodeRow(node);
      $('#nodes-table').bootstrapTable('updateRow', parseInt($("#node-details").data("row-index")), newRow);
      displayNodeDetails(newRow);
    }

    ////////////////////////////////////////////////////////

    $('#edit-node-module-save').click(function() {
      var nodeDetails = $("#node-details");
      var nodeRow = nodeDetails.data("row");
      var module = nodeDetails.data("module");
      var schema = nodeDetails.data("schema");
      //if ($('#edit-node-module-configuration').data("changed")) {
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
      //if ($('#edit-node-module-started').data("changed")) {
      module.state.start = {
        data: {started: $('#edit-node-module-started').prop('checked')},
        time: new Date().toISOString()
      };
      //}

      HB.API.updateNodeModuleState(nodeRow.id, module, function(err, node) {
        if (!err) {
          refreshNodeRow(node);
        }
      });
    });

    $('#apply-state-button').click(function() {
      var row = $("#node-details").data("row");
      HB.API.applyNodeState(row.id, function(err, commands) {
        if (!err) {
          updateNodeCommandsTable($('#commands-table'), commands);
        }
      });
    });

    $('#copt-current-to-planned-button').click(function() {
      var row = $("#node-details").data("row");
      HB.API.updateNodeState(row.id, row.obj.state.current, function(err, node) {
        if (!err) {
          refreshNodeRow(node);
        }
      });
    });

    $('#edit-node-module-dialog').on('shown.bs.modal', function() {
      $('#edit-node-module-dialog').focus()
    });

    $('#node-module-add-button').click(function() {
      var modules = $('#modules-table').data('modules-data');
      var selectName = $('#node-module-add-name');
      selectName.empty();
      var selectVersion = $('#node-module-add-version');
      selectVersion.empty();

      // populate available modules
      modules.forEach(function(m) {
        selectName.append($('<option>', {text: m._id, data: m}));
      });

      // populate version for the selected module
      selectName.change(function() {
        var module = selectName.find(':selected').data();
        selectVersion.empty();
        // populate available versions
        module.versions.forEach(function(v) {
          selectVersion.append($('<option>', {text: v.version, data: v}));
        });
      });

      selectName.trigger('change');

      $('#node-module-add-dialog').modal('show');
    });

    $('#node-module-add-save').click(function() {

    });


    ////////////////////////////////////////////////////////

    $('#new-module-dialog').on('shown.bs.modal', function() {
      $('#new-module-dialog').focus()
    });

    $('#new-module-button').click(function() {
      $('#new-module-dialog').modal('show');
    });

    $('#new-module-save').click(function() {
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
      $(e).click(function() {
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
