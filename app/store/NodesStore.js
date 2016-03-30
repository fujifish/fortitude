import Store from 'store/relax/Store'

class NodesStore extends Store {
  constructor() {
    super({nodes: [], selectedIndex: -1, nodesLoading: false, nodeDetails: {commandsLoading: false, commands: [], configureModuleDialog: false, plannedStateLoading: false}});
  }

  _handleNodesResult(promise) {
    promise
        .then(nodes => {
          this.state.nodes = nodes;
          //        this.state.selectedIndex = 0;
          this.state.nodesLoading = false;
          this.commit();
        }).catch(ex => {
      throw new Error("Oops! Something went wrong and we couldn't create your nodes. Ex: " + ex.message);
    });
  }

  getSelectedNode() {
    return (this.state.nodes && this.state.selectedIndex > -1) ? this.state.nodes[this.state.selectedIndex] : null;
  }

  fetchCommands() {
    let selected = this.getSelectedNode();
    if (!selected) {
      return;
    }
    this.state.nodeDetails.commandsLoading = true;
    this.state.nodeDetails.commands = [];
    this.commit();
    this.makeRequest('get', `/nodes/${encodeURIComponent(this.getSelectedNode().id)}/commands`)
        .then(commands => {
          this.state.nodeDetails.commands = commands;
          this.state.nodeDetails.commandsLoading = false;
          this.commit();
        }).catch(ex => {
      throw new Error("Oops! Something went wrong and we couldn't create your nodes. Ex: " + ex.message);
    });
  }

  fetchNodes() {
    this.state.nodesLoading = true;
    this.commit();
    return this._handleNodesResult(this.makeRequest('get', '/nodes'));
  }

  resetSelectedIndex() {
    this.setSelectedIndex(-1);
  }

  setSelectedIndex(selectedIndex) {
    this.state.selectedIndex = selectedIndex;
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

  addNodeModule(module){
    var node = this.getSelectedNode();
    let planned = JSON.parse(JSON.stringify(node.state.planned || []));
    planned.push(module);
    this.updateNodePlannedState(node.id, planned);
  }

  updateNodePlannedState(nodeId, state) {
    this.state.nodeDetails.plannedStateLoading = true;
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
};



}

export default new NodesStore();