(function() {

  var API = HB.API = {};

  function ajaxFailed(jqXHR, textStatus, errorThrown) {
    showAlert(errorThrown + ': ' + (jqXHR.responseJSON ? jqXHR.responseJSON.error : textStatus));
  }

  function showAlert(text) {
    $('#main-alert-content').text(text);
    $('#main-alert').show();
  }

  API.updateNodePlannedState = function(nodeId, state, cb) {
    $.ajax({
      type: "PUT",
      url: "api/nodes/" + nodeId,
      contentType: "application/json",
      data: JSON.stringify({"state.planned": state})
    }).done(function(node) {
      cb(null, node);
    }).fail(ajaxFailed);
  };

  API.applyNodeState = function(nodeId, cb) {
    $.ajax({
      type: "POST",
      url: "api/nodes/" + nodeId + "/commands",
      contentType: "application/json",
      data: JSON.stringify({"type": "state.apply"})
    }).done(function(commands) {
      cb(null, commands);
    }).fail(ajaxFailed);
  };

  API.updateNodeModuleState = function(nodeId, state, cb) {
    $.ajax({
      type: "PUT",
      url: "api/nodes/" + nodeId + "/modules/" + state.name + '/' + state.version,
      contentType: "application/json",
      data: JSON.stringify(state)
    }).done(function(node) {
      cb(null, node);
    }).fail(ajaxFailed);
  };

  API.getNodes = function(cb) {
    $.get("api/nodes").done(function(nodes) {
      cb(null, nodes);
    }).fail(ajaxFailed);
  };

  API.removeNode = function(nodeId, cb) {
    $.ajax({
      type: "DELETE",
      url: "api/nodes/" + nodeId
    }).done(function(nodes) {
      cb(null, nodes);
    }).fail(ajaxFailed);
  };

  API.getCommands = function(id, cb) {
    $.get("api/nodes/" + id + "/commands").done(function(commands) {
      cb(null, commands);
    }).fail(ajaxFailed);
  };




  API.getModules = function(cb) {
    $.get("api/modules").done(function(modules) {
      cb(null, modules);
    }).fail(ajaxFailed);
  };

  API.newModule = function(data, cb) {
    $.ajax({
      type: "POST",
      url: "api/modules",
      contentType: "application/json",
      data: data
    }).done(function(modules) {
      cb(null, modules);
    }).fail(ajaxFailed);
  };

  API.removeModule = function(name, version, cb) {
    $.ajax({
      type: "DELETE",
      url: "api/modules/" + name + '/' + version,
      contentType: "application/json"
    }).done(function(modules) {
      cb(null, modules);
    }).fail(ajaxFailed);
  };

})();
