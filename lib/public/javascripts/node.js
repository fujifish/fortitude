(function(){
	window.HB = window.HB || {};

	var NODES = window.HB.NODES = {};

	NODES.updateState = function(nodeId, state, cb){
		$.ajax({
			type: "PUT",
			url: "api/nodes/"+nodeId,
			contentType: "application/json",
			data: JSON.stringify({"state.planned": state})
		}).done(function(node){
			cb(null, node);
		}).fail(function(jqXHR, textStatus, errorThrown){
			cb("Request failed: " + jqXHR.statusCode + " " + textStatus)
		});
	}

  NODES.applyState = function(nodeId, cb){
    $.ajax({
      type: "POST",
      url: "api/nodes/"+nodeId+"/commands",
      contentType: "application/json",
      data: JSON.stringify({"type": "state.apply"})
    }).done(function(node){
      cb(null, node);
    }).fail(function(jqXHR, textStatus, errorThrown){
      cb("Request failed: " + jqXHR.statusCode + " " + textStatus)
    });
  }


  NODES.updateModuleState = function(nodeId, state, cb){
		$.ajax({
			type: "PUT",
			url: "api/nodes/"+nodeId+"/modules/"+state.name+"@"+state.version,
			contentType: "application/json",
			data: JSON.stringify(state)
		}).done(function(node){
			cb(null, node);
		}).fail(function(jqXHR, textStatus, errorThrown){
			cb("Request failed: " + jqXHR.statusCode + " " + textStatus)
		});
	}


	NODES.getNodes = function(cb){
		$.get( "api/nodes", cb);
	}



})();
