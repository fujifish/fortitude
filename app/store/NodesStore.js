import Store from 'store/relax/Store'

const maxLastSeen = 1000*60*60*24;

class NodesStore extends Store {
  constructor() {
    super({
      nodes: [],
      selectedIndex: -1,
      checkedIndexes: [],
      nodeActionLoading: false,
      nodesLoading: false,
      nodeDetails: {
        commandsLoading: false,
        commands: [],
        configureModuleDialog: false,
        plannedStateLoading: false,
        applyStatePending: false
      }
    });
  }

  _handleNodesResult(promise) {
    promise
        .then(nodes => {
          var selectedNode = this.getSelectedNode();
          var checkedNodes = this.getCheckedNodes();
          this.state.nodes = nodes;
          this.state.nodesLoading = false;
          this.state.checkedIndexes = [];
          this.state.selectedIndex = -1;
          this.state.nodeActionLoading = false;

          // updated selected / checked nodes according to previous nodes state
          this.state.selectedIndex = this.nodeIndex(selectedNode);
          this.state.checkedIndexes = checkedNodes.map(n => this.nodeIndex(n)).filter(i => i != -1);
          this.commit();
        }).catch(ex => {
      throw new Error("Oops! Something went wrong and we couldn't create your nodes. Ex: " + ex.message);
    });
  }

  enrich(node) {
    if (!node) {
       return node;
    }
    node.problems = [];
    var lastSynced = Date.parse(node.lastSync);
    var timeSinceSeen = Date.now() - lastSynced;
    if (timeSinceSeen > maxLastSeen) {
      node.problems.push(`Last seen ${Math.round((timeSinceSeen / maxLastSeen))} days ago`);
    }
    return node;
  }

  getSelectedNode() {
    let node = (this.state.nodes && this.state.selectedIndex > -1) ? this.state.nodes[this.state.selectedIndex] : null;
    return this.enrich(node);
  }

  getCheckedNodes() {
    if (this.state.nodes && (this.state.checkedIndexes.length > 0)) {
      let nodes = [];
      this.state.checkedIndexes.forEach(i => nodes.push(this.state.nodes[i]));
      return nodes.map(this.enrich);
    }
    return [];
  }

  fetchCommands() {
    let selected = this.getSelectedNode();
    if (!selected) {
      return;
    }
    this.state.nodeDetails.commandsLoading = true;
    this.commit();
    this.makeRequest('get', `/nodes/${encodeURIComponent(this.getSelectedNode().id)}/commands`)
        .then(commands => {
          this.state.nodeDetails.commands = commands;
          this.state.nodeDetails.commandsLoading = false;
          this.commit();
        }).catch(ex => {
      throw new Error("Oops! Something went wrong and we couldn't create your nodes. Ex: " + ex.message + '\n'+ex.stack);
    });
  }

  resetCommands() {
    this.state.nodeDetails.commandsLoading = false;
    this.state.nodeDetails.commands = null;
  }

  cancelPendingCommand() {
    let selected = this.getSelectedNode();
    if (!selected) {
      return;
    }
    let commands = this.state.nodeDetails.commands;
    let command = commands && commands.length > 0 && commands[0];
    if (!command) {
      return;
    }

    this.state.nodeDetails.commandsLoading = true;
    this.commit();
    this.makeRequest('delete', `/nodes/${encodeURIComponent(this.getSelectedNode().id)}/commands/${encodeURIComponent(command.created)}`)
        .then(commands => {
          this.state.nodeDetails.commands = commands;
          this.state.nodeDetails.commandsLoading = false;
          this.commit();
        }).catch(ex => {
      this.state.nodeDetails.commandsLoading = false;
      this.commit();
      throw new Error("Oops! Something went wrong and we couldn't create your nodes. Ex: " + ex.message + '\n'+ex.stack);
    });
  }

  resetSelectedIndex() {
    this.setSelectedIndex(-1);
  }

  setSelectedIndex(selectedIndex) {
    this.state.selectedIndex = selectedIndex;
    this.commit();
  }

  toggleNode(checkedIndexe) {
    if (this.state.checkedIndexes.indexOf(checkedIndexe) != -1) {
      this.state.checkedIndexes.splice(this.state.checkedIndexes.indexOf(checkedIndexe), 1);
    } else {
      this.state.checkedIndexes.push(checkedIndexe);
    }
    this.commit();
  }

  setCheckedIndexes(checkedIndexes) {
    this.state.checkedIndexes = checkedIndexes;
    this.commit();
  }

  uncheckAllNodes() {
    this.state.checkedIndexes = [];
    this.commit();
  }

  deleteNode(id) {
    this.state.nodesLoading = true;
    this.commit();
    return this._handleNodesResult(this.makeRequest('delete', '/nodes/' + encodeURIComponent(id)));
  }

  openConfigureModuleDialog() {
    this.state.nodeDetails.configureModuleDialog = true;
    this.commit();
  }

  closeConfigureModuleDialog() {
    this.state.nodeDetails.configureModuleDialog = false;
    this.commit();
  }

  removeSelectedNodeModule(index){
    var node = this.getSelectedNode();
    let planned = JSON.parse(JSON.stringify(node.state.planned || []));
    planned.splice(index, 1);
    this.updateNodePlannedState(node.id, planned);
  }

  addSelectedNodeModule(module){
    var node = this.getSelectedNode();
    let planned = JSON.parse(JSON.stringify(node.state.planned || []));
    planned.push(module);
    this.updateNodePlannedState(node.id, planned);
  }

  updateSelectedNodeModule(index, module){
    var node = this.getSelectedNode();
    let planned = JSON.parse(JSON.stringify(node.state.planned || []));
    planned[index] = module;
    this.updateNodePlannedState(node.id, planned);
  }

  copySelectedNodeCurrentStateToPlanned(){
    var node = this.getSelectedNode();
    let planned = JSON.parse(JSON.stringify(node.state.current || []));
    this.updateNodePlannedState(node.id, planned);
  }

  updateNodePlannedState(nodeId, state) {
    this.state.nodeDetails.plannedStateLoading = true;
    this.state.nodeDetails.applyStatePending = true;
    this.commit();
    this.makeRequest('PUT', `/nodes/${encodeURIComponent(nodeId)}`, JSON.stringify({"state.planned": state}))
      .then(node => {
        this.state.nodeDetails.plannedStateLoading = false;
        let index = this.state.nodes.findIndex(function(n){ return n.id == node.id});
        if(index > -1){
          this.state.nodes[index] = node;
        }
        this.commit();
      }).catch(ex => {
      throw new Error("Oops! Something went wrong and we couldn't create your nodes. Ex: " + ex.message);
    });
  }

  _addNodeCommand(command, nodeId){
    this.state.nodeDetails.commandsLoading = true;
    this.commit();
    var nodeId = nodeId || this.getSelectedNode().id;
    this.makeRequest('POST', `/nodes/${encodeURIComponent(nodeId)}/commands`, JSON.stringify(command))
      .then(commands => {
        this.state.nodeDetails.commands = commands;
        this.state.nodeDetails.commandsLoading = false;
        this.commit();
      }).catch(ex => {
      throw new Error("Oops! Something went wrong and we couldn't create your nodes. Ex: " + ex.message);
    });
  }

  _addNodesCommand(command, nodeIds){
    var nodeIds = nodeIds || this.getCheckedNodes().map(n => n.id);
    if (!nodeIds || 0 == nodeIds.length) return;

    this.state.nodeActionLoading = true;
    this.commit();
    this.makeRequest('POST', `/nodes/commands`, JSON.stringify({ command: command, ids: nodeIds }))
      .then(() => {
        this.state.nodeActionLoading = false;
        this.commit();
      }).catch(ex => {
        throw new Error("Oops! Something went wrong and we couldn't update your nodes. Ex: " + ex.message);
      });
  }

  // selected node update
  updateNodeAgentVersion(version) {
    this._addNodeCommand({type: 'update', version: version});
  };

  // checked nodes update
  updateNodesAgentVersion(version) {
    this._addNodesCommand({type: 'update', version: version});
  };

  applyNodePlannedState() {
    this.state.nodeDetails.applyStatePending = false;
    this._addNodeCommand({type: 'state', action: 'apply'});
  };

  resetNodeContents() {
    this._addNodeCommand({type: 'reset', action: 'all'});
  };

  nodeIndex(node) {
    if (!node) {
      return -1;
    }
    return this.state.nodes.findIndex(n => n.id == node.id);
  }

}

export default new NodesStore();