(function(){

	var HB = window.HB;
	$(function() {

		function updateModulesTable(element, modules, editable){
			modules = modules || [];
			element.bootstrapTable('destroy');
			element.bootstrapTable({
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
						field: 'installedDate',
						title: 'Installed Date'
					}
				],
				data: modules.map(function(obj){
					return { name: obj.name, version: obj.version, installedDate: obj.state.install.time, obj: obj};
				}),
				cardView: true,
				onClickRow: function(row, $element){
					$( "#node-details" ).data( "moduleRow", row);
					if(editable){
						$('#edit-module-name').val(row.name);
						$('#edit-module-name').prop('disabled', true);
						$('#edit-module-version').val(row.version);
						$('#edit-module-version').prop('disabled', true);
						if(row.obj.state && row.obj.state.configure && row.obj.state.configure.data){
							$('#edit-module-configuration').val(JSON.stringify(row.obj.state.configure.data, null, 2));
							$('#edit-module-configuration').change(function(){
								$('#edit-module-configuration').data("changed", true);
							});
						}
						if(row.obj.state && row.obj.state.start && row.obj.state.start.data){
							if(row.obj.state.start.data.started) {
								$('#edit-module-started').prop("checked", row.obj.state.start.data.started);
							}else {
								$('#edit-module-started').removeProp("checked");
							}
							$('#edit-module-started').change(function(){
								$('#edit-module-started').data("changed", true);
							});
						}
						$('#editModal').modal('show');
					}
				}
			});

		}

		$('#edit-module-save').click(function(){
			$('#editModal').modal('hide');
			var nodeRow = $( "#node-details" ).data( "row");
			var moduleRow = $( "#node-details" ).data( "moduleRow");
			var module = moduleRow.obj;
			if($('#edit-module-configuration').data("changed")){
				var config = $('#edit-module-configuration').val().trim();
				if(config == "") config = "{}"
				module.state.configure = { data: JSON.parse(config) , time: new Date().toISOString()};
			}
			if($('#edit-module-started').data("changed")) {
				module.state.start = { data: { started: $('#edit-module-started').prop('checked')}, time: new Date().toISOString()}
			}

			HB.NODES.updateModuleState(nodeRow.id, module, function(err, node){
				if(!err) refreshNodeRow(node);
			});
		});

		console.log("starting");
		$('#load_spinner').show();

		HB.NODES.getNodes( function( data ) {
			console.log(data);
			$('#load_spinner').hide();
			$('#nodes-table').bootstrapTable({
        classes: 'table table-hover table-no-bordered',
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
				data: data.map(function(obj){
					 console.log(obj);
					return buildNodeRow(obj);
				}),
				onClickRow: function(row, $element){
					$( "#node-details" ).data( "row-index", $element.attr('data-index'));
					displayNodeDetails(row);
				}
			});
		});
		updateModulesTable($('#currentState-table'), []);
		updateModulesTable($('#plannedState-table'), []);

		function buildNodeRow(obj){
			return { id: obj.id, name: obj.name, platform: obj.info.platform, lastSync: obj.lastSync, agentVersion: obj.info.agentVersion, obj: obj};
		}

		function displayNodeDetails(row){
			$( "#node-details" ).data( "row", row);
			updateModulesTable($('#currentState-table'), row.obj.state.current);
			updateModulesTable($('#plannedState-table'), row.obj.state.planned, true);
		}

		function refreshNodeRow(node){
			var newRow = buildNodeRow(node);
			$('#nodes-table').bootstrapTable('updateRow', parseInt($("#node-details").data("row-index")), newRow);
			displayNodeDetails(newRow);
		}

		$('#copyState').click(function(){
			var row = $("#node-details").data("row");
			HB.NODES.updateState(row.id, row.obj.state.current, function(err, node){
				if(!err) refreshNodeRow(node);
			});
		});

		$('#editModal').on('shown.bs.modal', function () {
			$('#editModal').focus()
		})

	});


})();
