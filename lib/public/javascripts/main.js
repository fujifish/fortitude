(function() {

  var HB = window.HB;
  $(function() {

    function updateCommandsTable(element, commands) {
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


    function updateModulesTable(element, modules, editable) {
      modules = modules || [];
      element.bootstrapTable('destroy');
      element.bootstrapTable({
        classes: 'table table-hover table-no-bordered cursor-hand',
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
            field: 'configuration',
            title: 'Configuration'
          },
          {
            field: 'started',
            title: 'Started'
          }
        ],
        data: modules.map(function(obj) {
          return {
            name: obj.name,
            version: obj.version,
            installed: obj.state.install.time,
            configuration: obj.state.configure ? JSON.stringify(obj.state.configure.data) : '',
            started: obj.state.start ? obj.state.start.data.started : false,
            obj: obj};
        }),
        //rowStyle: function(row, index) {
        //  return {
        //    classes: "relative"
        //  }
        //},
        //rowAttributes: function(row, index) {
        //  return {
        //    onmouseenter: "$('#plannedStateActions-" + index + "').fadeIn(100)",
        //    onmouseleave: "$('#plannedStateActions-" + index + "').fadeOut(100)",
        //  };
        //},
        //onPostBody: function() {
        //  $('#plannedState-table').find("tbody > tr").each(function(index, row) {
        //    var actions =
        //      '<div id="plannedStateActions-' + index + '" class="btn-group btn-group-sm" role="group" aria-label="Actions" style="position:absolute;top:0;right:0;display:none">' +
        //        '<a id="moduleActionEdit-' + index + '" class="btn" aria-label="Edit"><i class="glyphicon glyphicon-edit"></i></button>' +
        //        '<a id="moduleActionDelete-' + index + '" class="btn" aria-label="Delete"><i class="glyphicon glyphicon-remove"></i></button>' +
        //      '</div>';
        //    $(row).append(actions);
        //  });
        //},
        cardView: true,
        onClickRow: function(row, $element) {
          $("#node-details").data("moduleRow", row);
          if (editable) {
            $('#edit-module-title').html('Edit ' + row.name + '@' + row.version);

            //$('#edit-module-configuration').val(JSON.stringify(row.obj.state.configure.data, null, 2));
            var schema = row.obj.meta && row.obj.meta.data.schema && row.obj.meta.data.schema.configure;
            $("#node-details").data("schema", schema);
            var form = ['*'];
            var values = row.obj.state && row.obj.state.configure && row.obj.state.configure.data;
            if (!schema) {
              schema = {config: {type: "string", title: "Raw JSON Configuration"}, default: "{}"};
              form = [{ key: 'config', type: 'textarea' }];
              values = {config: values && JSON.stringify(values, null, 2)};
            }
            $('#edit-module-configuration').empty();
            $('#edit-module-configuration').jsonForm({
              schema: schema,
              form: form,
              value: values
            });

            if (row.obj.state && row.obj.state.start && row.obj.state.start.data) {
              if (row.obj.state.start.data.started) {
                $('#edit-module-started').prop("checked", row.obj.state.start.data.started);
              } else {
                $('#edit-module-started').removeProp("checked");
              }
            }

            //$('#edit-module-configuration').change(function() {
            //  $('#edit-module-configuration').data("changed", true);
            //});
            //$('#edit-module-started').change(function() {
            //  $('#edit-module-started').data("changed", true);
            //});
            $('#editModal').modal('show');
          }
        }
      });

    }

    $('#edit-module-save').click(function() {
      $('#editModal').modal('hide');
      var nodeRow = $("#node-details").data("row");
      var moduleRow = $("#node-details").data("moduleRow");
      var schema = $("#node-details").data("schema");
      var module = moduleRow.obj;
      //if ($('#edit-module-configuration').data("changed")) {
      var config = $('#edit-module-configuration').jsonFormValue();
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
      //if ($('#edit-module-started').data("changed")) {
      module.state.start = {
        data: {started: $('#edit-module-started').prop('checked')},
        time: new Date().toISOString()
      };
      //}

      HB.API.updateNodeModuleState(nodeRow.id, module, function(err, node) {
        if (!err) {
          refreshNodeRow(node);
        }
      });
    });

    console.log("starting");
    $('#load_spinner').show();

    HB.API.getNodes(function(err, data) {
      console.log(data);
      $('#load_spinner').hide();
      $('#nodes-table').bootstrapTable({
        classes: 'table table-hover table-no-bordered cursor-hand',
        columns: [
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
        data: data.map(function(obj) {
          console.log(obj);
          return buildNodeRow(obj);
        }),
        onClickRow: function(row, $element) {
          $("#node-details").data("row-index", $element.attr('data-index'));
          displayNodeDetails(row);
        }
      });
    });
    updateModulesTable($('#currentState-table'), []);
    updateModulesTable($('#plannedState-table'), []);
    updateCommandsTable($('#commands-table'), []);

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
      updateModulesTable($('#currentState-table'), row.obj.state.current);
      updateModulesTable($('#plannedState-table'), row.obj.state.planned, true);
      HB.NODES.getCommands(row.id, function(err, commands){
        updateCommandsTable($('#commands-table'), commands);
      });
    }

    function refreshNodeRow(node) {
      var newRow = buildNodeRow(node);
      $('#nodes-table').bootstrapTable('updateRow', parseInt($("#node-details").data("row-index")), newRow);
      displayNodeDetails(newRow);
    }

    $('#applyState').click(function(){
      var row = $("#node-details").data("row");
      HB.API.applyNodeState(row.id, function(err, commands) {
        if (!err) {
          updateCommandsTable($('#commands-table'), commands);
        }
      });
    });

    $('#copyState').click(function() {
      var row = $("#node-details").data("row");
      HB.API.updateNodeState(row.id, row.obj.state.current, function(err, node) {
        if (!err) {
          refreshNodeRow(node);
        }
      });
    });

    $('#editModal').on('shown.bs.modal', function() {
      $('#editModal').focus()
    });


    var sidebarChildren = $('#sidebar').children();
    function hideAllPages() {
      sidebarChildren.each(function(i,e2) {
        $(e2).removeClass('active');
        $('#'+ e2.children[0].text.toLowerCase()+'-page').hide();
      });
    }
    sidebarChildren.each(function(i,e) {
      $(e).click(function() {
        hideAllPages();
        $(e).addClass('active');
        var name = e.children[0].text.toLowerCase();
        $('#'+ name +'-page').show();
      });
    });
    $(sidebarChildren[0]).trigger('click');

  });


})();
