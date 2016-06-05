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
        if (routerStore.state.path.indexOf('/nodes#') != -1) {
          routerStore.changeRoute('/nodes');
        }
        _this.nodeDetails.hide();
        _this.nodesList.show();
      }
    });

    // initialize nodesStore's 'selectedIndex' in case the user reloads the page
    nodesStore.on('nodes', () => {
      var path = routerStore.state.path;
      if (path.indexOf('/nodes#') != -1) {
        var nodeId = path.substr(path.indexOf('#') + 1);
        var index = nodesStore.state.nodes.findIndex(n => n.id == nodeId);
        nodesStore.setSelectedIndex(index);
      } else {
        nodesStore.resetSelectedIndex();
      }
      _this.nodesList.render();
    });

    routerStore.on('path', selected => {
      if (selected.lhs.indexOf('/nodes#') != -1) {
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
