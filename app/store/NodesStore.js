import Store from 'store/relax/Store'

class NodesStore extends Store {
  constructor() {
    super({nodes: [], selectedIndex: -1, nodesLoading: false});
  }


  _handleNodesResult(promise){
    promise
      .then(nodes => {
        this.state.nodes = nodes;
//        this.state.selectedIndex = 0;
        this.state.nodesLoading = false;
        this.commit();
      }).catch(ex => {
      throw new Error("Oops! Something went wrong and we couldn't create your nodes. Ex: " + ex.message);
    })
  }


  fetchNodes() {
    this.state.nodesLoading = true;
    this.commit();
    return this._handleNodesResult(this.makeRequest('get','/nodes'));
  }

  setSelectedIndex(selectedIndex){
    this.state.selectedIndex = selectedIndex;
    this.commit();
  }

  deleteNode(id){
    this.state.nodesLoading = true;
    this.commit();
    return this._handleNodesResult(this.makeRequest('delete','/nodes/'+ encodeURIComponent(id)));
  }

}

export default new NodesStore();