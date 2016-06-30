import Component from 'components/relax/Component';
import template from 'views/nodes/nodeSummary';
import nodesStore from 'store/NodesStore';
import routerStore from 'store/relax/RouterStore';

export default class NodeSummary extends Component {
  constructor() {
    super("NodeSummary");
    
    routerStore.on('path', () => {
      if (routerStore.isNodePage()) {
        this.render();
      }
    });
    
    nodesStore.on('nodesList.nodes.*', () => {
      this.render();
    });
  }

  view() {
    let node = nodesStore.selectedNode || {info:{}};
    return template({
      name: node.name || 'N/A',
      version: node.info.agentVersion || '0.0.0',
      tags: node.info.tags || {}
    });
  }

}