(function(){

	$(function() {

		function updateModulesTable(modules){
			$('#modules-table').bootstrapTable('destroy');
			$('#modules-table').bootstrapTable({
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
					return { name: obj.name, version: obj.version, installedDate: obj.state.install.time};
				}),
				cardView: true
			});

		}

		console.log("starting");
		$('#load_spinner').show();

		$.get( "api/nodes", function( data ) {
			console.log(data);
			$('#load_spinner').hide();
			$('#nodes-table').bootstrapTable({
				columns: [
					{
						field: 'id',
						title: 'ID'
					},
					{
						field: 'name',
						title: 'Name'
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
					return { id: obj.id, name: obj.name, platform: obj.info.platform, lastSync: obj.lastSync, agentVersion: obj.info.agentVersion, obj: obj};
				}),
				onClickRow: function(row, $element){
					updateModulesTable(row.obj.currentState);
				}
			});
		});
		updateModulesTable([]);

	});


})();
