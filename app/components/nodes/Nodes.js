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

    var _this = this;
    nodesStore.on('selectedIndex', diff => {
      if (diff.rhs !== -1) {
        var node = nodesStore.state.nodes[diff.rhs];
        routerStore.changeRoute('/nodes#' + node.id);
        _this.nodesList.hide();
        _this.nodeDetails.show();
      } else {
        routerStore.changeRoute('/nodes');
        _this.nodeDetails.hide();
        _this.nodesList.show();
      }
    });

    routerStore.on('path', selected => {
      if (selected.lhs && selected.rhs == '/nodes') {
        nodesStore.resetSelectedIndex();
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
}
