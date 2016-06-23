import template from "views/nodes/nodes";
import Component from 'components/relax/Component';
import NodesList from 'components/nodes/NodesList';
import NodeDetails from 'components/nodes/NodeDetails';
import nodesStore from 'store/NodesStore';
import routerStore from 'store/relax/RouterStore';

export default class Nodes extends Component {
  constructor() {
    super('nodes');
    this.nodesList = new NodesList();
    this.nodeDetails = new NodeDetails();

    routerStore.on('path', diff => {
      var oldPath = diff.lhs;
      if (oldPath.indexOf('/nodes#') != -1) {
        nodesStore.resetSelectedIndex();
        this.nodeDetails.hide();
        this.nodesList.show();
      }
      else if (routerStore.isNodePage()) {
        var nodeId = routerStore.nodeId();
        var index = nodesStore.state.nodes.findIndex(n => n.id == nodeId);
        this._waitingForNode = index == -1;
        if (!this._waitingForNode) {
          nodesStore.setSelectedIndex(index);
        } else {
          this.nodeDetails.renderLoading(true);
          nodesStore.resetSelectedIndex();
        }
        this.nodesList.hide();
        this.nodeDetails.show();
      }
    });

    nodesStore.on('nodes', () => {
      if (this._waitingForNode) {
        this._waitingForNode = false;
        nodesStore.setSelectedIndex(0);
        this.nodeDetails.render();
      }
    });
  }

  initialView() {
    const data = {
      nodesList: this.nodesList.initialView(),
      nodeDetails: this.nodeDetails.initialView()
    };
    return template(data);
  }

  viewMounted() {
    this.nodesList.render();
  }
}
