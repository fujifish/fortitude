import template from "views/nodes/nodes";
import Component from 'components/relax/Component';
import NodesList from 'components/nodes/NodesList';
import NodeDetails from 'components/nodes/NodeDetails';
import SyncTimer from 'components/nodes/SyncTimer';
import nodesStore from 'store/NodesStore';
import routerStore from 'store/relax/RouterStore';

export default class Nodes extends Component {
  constructor() {
    super('nodes');
    this.nodesList = new NodesList();
    this.nodeDetails = new NodeDetails();
    this.syncTimer = new SyncTimer();

    routerStore.on('path', diff => {
      var oldPath = diff.lhs;
      // if came from a node page
      if (oldPath.indexOf('/nodes#') != -1) {
        nodesStore.resetSelectedNode();
        this.nodeDetails.hide();
        this.nodesList.show();
      }
      // if loading a node page
      else if (routerStore.isNodePage()) {
        var nodeId = routerStore.nodeId();
        if (nodesStore.nodes[nodeId]) {
          nodesStore.setSelectedNodeId(nodeId);
        } else {
          // user loaded a node page as first page
          this.nodeDetails.renderLoading(true);
          nodesStore.resetSelectedNode();
        }
        this.nodesList.hide();
        this.nodeDetails.show();
      }
    });

    // if user loaded a node page as first page
    nodesStore.on('nodesList.nodes.*', () => {
      if (routerStore.nodeId() && !nodesStore.selectedNodeId) {
        nodesStore.setSelectedNodeId(routerStore.nodeId());
        this.nodeDetails.renderLoading(false);
      }
    });
  }

  initialView() {
    const data = {
      nodesList: this.nodesList.initialView(),
      nodeDetails: this.nodeDetails.initialView(),
      syncTimer: this.syncTimer.initialView()
    };
    return template(data);
  }

  viewMounted() {
    this.nodesList.render();
  }
}
