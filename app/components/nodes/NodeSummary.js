import Component from 'components/relax/Component';
import template from 'views/nodes/nodeSummary';
import nodesStore from 'store/NodesStore';

export default class NodeSummary extends Component {
  constructor() {
    super("NodeSummary");
    nodesStore.on('selectedIndex', index => {
      this.render();
    });
  }

  view() {
    return template({
      node: nodesStore.getSelectedNode()
    });
  }

}