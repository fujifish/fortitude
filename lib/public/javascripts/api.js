(function(){
	window.HB = window.HB || {};

	var API = window.HB.API = {};

  API.updateNodeState = function(nodeId, state, cb){
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

  API.applyNodeState = function(nodeId, cb){
    $.ajax({
      type: "POST",
      url: "api/nodes/"+nodeId+"/commands",
      contentType: "application/json",
      data: JSON.stringify({"type": "state.apply"})
    }).done(function(commands){
      cb(null, commands);
    }).fail(function(jqXHR, textStatus, errorThrown){
      cb("Request failed: " + jqXHR.statusCode + " " + textStatus)
    });
  }


  API.updateNodeModuleState = function(nodeId, state, cb){
		$.ajax({
			type: "PUT",
			url: "api/nodes/"+nodeId+"/modules/"+state.name+'/'+state.version,
			contentType: "application/json",
			data: JSON.stringify(state)
		}).done(function(node){
			cb(null, node);
		}).fail(function(jqXHR, textStatus, errorThrown){
			cb("Request failed: " + jqXHR.statusCode + " " + textStatus)
		});
	}


  API.getNodes = function(cb){
		$.get( "api/nodes").done(function(nodes){
      cb(null, nodes);
    }).fail(function(jqXHR, textStatus, errorThrown){
      cb("Request failed: " + jqXHR.statusCode + " " + textStatus)
    });
	}

  API.getCommands = function(id, cb){
    $.get( "api/nodes/"+id+"/commands").done(function(commands){
      cb(null, commands);
    }).fail(function(jqXHR, textStatus, errorThrown){
      cb("Request failed: " + jqXHR.statusCode + " " + textStatus)
    });
  }



})();
