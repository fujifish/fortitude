import Component from 'components/relax/Component';
import template from 'views/nodes/nodeSummary';
import nodesStore from 'store/NodesStore';

export default class NodeSummary extends Component {
  constructor() {
    super("NodeSummary");
    nodesStore.on('selectedIndex', diff => {
      this.render();
    });
  }

  view() {
    let node = nodesStore.getSelectedNode() || {info:{}};
    return template({
      name: node.name || 'N/A',
      version: node.info.agentVersion || '0.0.0',
      tags: node.info.tags || {}
    });
  }

}