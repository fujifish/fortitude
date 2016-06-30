import Store from 'store/relax/Store'
import common from '../common';

const maxLastSeen = 1000*60*60*24;

class NodesStore extends Store {
  constructor() {
    super({
      nodesList: {
        nodes: {},
        search: '',
        start: 0,
        length: 25,
        order: 'lastSync',
        orderDir: 'desc',
        metaData: {
          draw: 0,
          recordsTotal: -1,
          recordsFiltered: -1
        }
      },
      nodesLoading : false,
      nodesSyncedAt: null,
      selectedNodeId: null,
      checkedNodeIds: [],
      nodeActionLoading: false,
      nodeDetails: {
        commandsLoading: false,
        commands: [],
        commandsSyncedAt: null,
        configureModuleDialog: false,
        plannedStateLoading: false,
        applyStatePending: false
      }
    });
  }

  get selectedNode() {
    var node = this.state.selectedNodeId ? this.nodes[this.state.selectedNodeId] : null;
    return node || null;
  }

  get checkedNodes() {
    var nodes = [];
    if (this.nodes && (this.state.checkedNodeIds.length > 0)) {
      this.state.checkedNodeIds.forEach(nodeId => {
        if (this.nodes[nodeId]) {
          nodes.push(this.nodes[nodeId])
        }
      });
    }
    return nodes;
  }

  get nodes() {
    return this.state.nodesList.nodes;
  }

  get selectedNodeId() {
    return this.state.selectedNodeId;
  }

  setCheckedNodeIds(checkedNodeIds) {
    this.state.checkedNodeIds = checkedNodeIds;
    this.commit();
  }

  setSelectedNodeId(selectedNodeId) {
    this.state.selectedNodeId = selectedNodeId;
    this.commit();
  }

  enrich(node) {
    if (!node) {
       return node;
    }
    var lastSynced = Date.parse(node.lastSync);
    var timeSinceSeen = Date.now() - lastSynced;
    node.timeSinceSync = common.timeSince(lastSynced);
    node.problems = [];
    if (timeSinceSeen > maxLastSeen) {
      node.problems.push(`Last seen ${node.timeSinceSync}`);
    }
    return node;
  }

  _handleNodesResult(promise) {
    promise
      .then(resp => {
        if (resp.draw < this.state.nodesList.metaData.draw) return;

        this.state.nodesList.metaData.draw = resp.draw;
        this.state.nodesList.metaData.recordsTotal = resp.recordsTotal;
        this.state.nodesList.metaData.recordsFiltered = resp.recordsFiltered;
        this.state.nodesList.nodes = {};
        resp.nodes.forEach(n => { this.nodes[n.id] = this.enrich(n) });
        this.state.nodesSyncedAt = new Date();
        this.state.selectedNodeId = null;
        this.state.checkedNodeIds = [];
        this.state.nodeActionLoading = false;
        this.state.nodesLoading = false;
        this.commit();
      }).catch(ex => {
      throw new Error("Oops! Something went wrong and we couldn't create your nodes. Ex: " + ex.message);
    });
  }

  fetchNodes(filters = {}) {
    this.state.nodesLoading = true;
    this.commit();

    this.state.nodesList = common.mergeObjects(this.state.nodesList, filters);
    this.state.nodesList.metaData.draw += 1;
    
    var urlParams = `search=${this.state.nodesList.search || ''}&` +
      `start=${this.state.nodesList.start}&` +
      `length=${this.state.nodesList.length}&` +
      `order=${this.state.nodesList.order}&` +
      `orderDir=${this.state.nodesList.orderDir}&` +
      `draw=${this.state.nodesList.metaData.draw}`;
    return this._handleNodesResult(this.makeRequest('get', `/nodes?${urlParams}`));
  }

  fetchCommands() {
    let selected = this.selectedNode;
    if (!selected) {
      return;
    }
    this.state.nodeDetails.commandsLoading = true;
    this.commit();
    this.makeRequest('get', `/nodes/${encodeURIComponent(this.selectedNodeId)}/commands`)
        .then(commands => {
          this.state.nodeDetails.commands = commands || [];
          this.state.nodeDetails.commandsSyncedAt = new Date();
          this.state.nodeDetails.commandsLoading = false;
          this.commit();
        }).catch(ex => {
      throw new Error("Oops! Something went wrong and we couldn't create your nodes. Ex: " + ex.message + '\n'+ex.stack);
    });
  }

  resetCommands() {
    this.state.nodeDetails.commandsLoading = false;
    this.state.nodeDetails.commands = [];
    this.state.nodeDetails.commandsSyncedAt = null;
  }

  cancelPendingCommand() {
    let selected = this.selectedNode;
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
    this.makeRequest('delete', `/nodes/${encodeURIComponent(this.selectedNodeId)}/commands/${encodeURIComponent(command.created)}`)
        .then(commands => {
          this.state.nodeDetails.commands = commands || [];
          this.state.nodeDetails.commandsSyncedAt = new Date();
          this.state.nodeDetails.commandsLoading = false;
          this.commit();
        }).catch(ex => {
      this.state.nodeDetails.commandsLoading = false;
      this.commit();
      throw new Error("Oops! Something went wrong and we couldn't create your nodes. Ex: " + ex.message + '\n'+ex.stack);
    });
  }

  resetSelectedNode() {
    this.state.selectedNodeId = null;
    this.commit();
  }

  toggleNode(checkedNode) {
    if (this.state.checkedNodeIds.indexOf(checkedNode) != -1) {
      this.state.checkedNodeIds.splice(this.state.checkedNodeIds.indexOf(checkedNode), 1);
    } else {
      this.state.checkedNodeIds.push(checkedNode);
    }
    this.commit();
  }

  uncheckAllNodes() {
    this.state.checkedNodeIds = [];
    this.commit();
  }

  deleteNode(id) {
    return this.makeRequest('delete', '/nodes/' + encodeURIComponent(id)).then(() => {
      this.fetchNodes();
    }).catch(ex => {
      throw new Error("Oops! Something went wrong. Ex: " + ex.message);
    });
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
    var node = this.selectedNode;
    let planned = JSON.parse(JSON.stringify(node.state.planned || []));
    planned.splice(index, 1);
    this.updateNodePlannedState(node.id, planned);
  }

  addSelectedNodeModule(module){
    var node = this.selectedNode;
    let planned = JSON.parse(JSON.stringify(node.state.planned || []));
    planned.push(module);
    this.updateNodePlannedState(node.id, planned);
  }

  updateSelectedNodeModule(index, module){
    var node = this.selectedNode;
    let planned = JSON.parse(JSON.stringify(node.state.planned || []));
    planned[index] = module;
    this.updateNodePlannedState(node.id, planned);
  }

  copySelectedNodeCurrentStateToPlanned(){
    var node = this.selectedNode;
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
        this.nodes[node.id] = this.enrich(node);
        this.commit();
      }).catch(ex => {
        throw new Error("Oops! Something went wrong and we couldn't create your nodes. Ex: " + ex.message);
    });
  }

  _addNodeCommand(command, nodeId){
    this.state.nodeDetails.commandsLoading = true;
    this.commit();
    var nodeId = nodeId || this.selectedNodeId;
    this.makeRequest('POST', `/nodes/${encodeURIComponent(nodeId)}/commands`, JSON.stringify(command))
      .then(commands => {
        this.state.nodeDetails.commands = commands || [];
        this.state.nodeDetails.commandsSyncedAt = new Date();
        this.state.nodeDetails.commandsLoading = false;
        this.commit();
      }).catch(ex => {
        throw new Error("Oops! Something went wrong and we couldn't create your nodes. Ex: " + ex.message);
    });
  }

  _addNodesCommand(command, nodeIds){
    var nodeIds = nodeIds || this.state.checkedNodeIds;
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
  }
  
}

export default new NodesStore();