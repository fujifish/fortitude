import Store from 'store/relax/Store'
import common from '../common';

const maxLastSeen = 1000*60*60*24;

class NodesStore extends Store {
  constructor() {
    super({
      nodesList: {
        nodes: {},
        search: '',
        tags: [],
        start: 0,
        length: parseInt(localStorage.getItem('nodesList/length') || '25'),
        order: localStorage.getItem('nodesList/order') || 'lastSync',
        orderDir: localStorage.getItem('nodesList/orderDir') || 'desc',
        metaData: {
          draw: 0,
          recordsTotal: -1,
          recordsFiltered: -1
        }
      },
      nodesRefreshRate: localStorage.getItem('nodesList/nodesRefreshRate') ? parseInt(localStorage.getItem('nodesList/nodesRefreshRate')) : null,
      nodeSyncEnabled: localStorage.getItem('nodesList/nodeSyncEnabled') != 'false',
      nodesLoading : false,
      nodesSyncedAt: null,
      selectedNodeId: null,
      checkedNodeIds: [],
      nodeActionLoading: false,
      commandsRefreshRate: localStorage.getItem('nodeDetails/commandsRefreshRate') ? parseInt(localStorage.getItem('nodesList/commandsRefreshRate')) : null,
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

  enrich(node, order) {
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
    if (order) {
      node.orderIndex = order;
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
        resp.nodes.forEach((n, i) => { this.nodes[n.id] = this.enrich(n, i) });
        this.state.nodesSyncedAt = new Date();
        this.state.selectedNodeId = null;
        this.state.checkedNodeIds = this.state.checkedNodeIds.filter(id => !!this.nodes[id]);
        this.state.nodeActionLoading = false;
        this.state.nodesLoading = false;
        return Object.keys(this.state.nodesList.nodes);
      }).then(nodeIds => {
        return this.makeRequest('POST', '/nodes/commands/peek', JSON.stringify({ ids: nodeIds }));
      }).then(resp => {
        resp.commands.forEach(c => { if(this.nodes[c._id]) this.nodes[c._id].lastCommand = c.status });
        this.commit();
      }).catch(ex => {
        this.commit();
        throw new Error("Oops! Something went wrong and we couldn't create your nodes. Ex: " + ex.message);
      });
  }

  fetchNodes(filters = {}) {
    this.state.nodesLoading = true;
    this.commit();

    this.state.nodesList = common.mergeObjects(this.state.nodesList, filters);
    this.state.nodesList.metaData.draw += 1;
    if (filters.length) localStorage.setItem('nodesList/length', filters.length);
    if (filters.order) localStorage.setItem('nodesList/order', filters.order);
    if (filters.orderDir) localStorage.setItem('nodesList/orderDir', filters.orderDir);
    
    var urlParams = `search=${this.state.nodesList.search || ''}&` +
      `start=${this.state.nodesList.start}&` +
      `length=${this.state.nodesList.length}&` +
      `order=${this.state.nodesList.order}&` +
      `orderDir=${this.state.nodesList.orderDir}&` +
      `draw=${this.state.nodesList.metaData.draw}`;
    this.state.nodesList.tags.forEach(t => { urlParams += `&tag=${t}` });
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

  deleteNodes(ids) {
    return this.makeRequest('delete', '/nodes', JSON.stringify({ids: ids})).then(() => {
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
        this.nodes[node.id] = this.enrich(node, this.nodes[node.id] && this.nodes[node.id].orderIndex);
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

  // selected node version update
  updateNodeAgentVersion(version) {
    this._addNodeCommand({type: 'update', version: version});
  };

  // checked nodes version update
  updateNodesAgentVersion(version) {
    this._addNodesCommand({type: 'update', version: version});
  };

  // checked nodes metadata update
  updateNodesAgentMetadata(metadata) {
    var nodeIds = this.state.checkedNodeIds;
    if (!nodeIds || 0 == nodeIds.length) return;

    this.state.nodeActionLoading = true;
    this.commit();
    this.makeRequest('POST', `/nodes/metadata`, JSON.stringify({ metadata: metadata, ids: nodeIds }))
      .then(() => {
        this.state.nodeActionLoading = false;
        this.commit();
        this.fetchNodes();
      }).catch(ex => {
        throw new Error("Oops! Something went wrong and we couldn't update your nodes. Ex: " + ex.message);
    });
  };
  
  removeNodeMetadata(id, tag) {
    return this.makeRequest('delete', `/nodes/${encodeURIComponent(id)}/metadata`, JSON.stringify(tag)).then(() => {
      this.fetchNodes();
    }).catch(ex => {
      throw new Error("Oops! Something went wrong. Ex: " + ex.message);
    });
  }

  applyNodePlannedState() {
    this.state.nodeDetails.applyStatePending = false;
    this._addNodeCommand({type: 'state', action: 'apply'});
  };

  resetNodeContents() {
    this._addNodeCommand({type: 'reset', action: 'all'});
  }

  refreshRate(methodName) {
    var rate = {
      fetchNodes: localStorage.getItem('nodesList/nodesRefreshRate'),
      fetchCommands: localStorage.getItem('nodeDetails/commandsRefreshRate')
    }[methodName];
    return rate || super.refreshRate(methodName);
  }

  setNodesRefreshRate(rate) {
    this.state.nodesRefreshRate = rate > 5000 ? rate : 5000;
    localStorage.setItem('nodesList/nodesRefreshRate', this.state.nodesRefreshRate);
  }

  setCommandsRefreshRate(rate) {
    this.state.nodesRefreshRate = rate > 5000 ? rate : 5000;
    localStorage.setItem('nodeDetails/commandsRefreshRate', this.state.commandsRefreshRate);
  }

  nodeSyncEnabled() {
    return this.state.nodeSyncEnabled;
  }

  setNodeSyncEnabled(enabled) {
    this.state.nodeSyncEnabled = !!enabled;
    localStorage.setItem('nodesList/nodeSyncEnabled', this.state.nodeSyncEnabled);
  }
  
}

export default new NodesStore();