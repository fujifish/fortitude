import Component from 'components/relax/Component';
import template from 'views/nodes/nodeSummary';
import nodesStore from 'store/NodesStore';
import routerStore from 'store/relax/RouterStore';

export default class NodeSummary extends Component {
  constructor() {
    super("NodeSummary");
    routerStore.on('path', diff => {
      if (routerStore.isNodePage()) {
        this.render();
      }
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