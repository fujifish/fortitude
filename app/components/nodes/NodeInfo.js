import Box from 'components/Box';
import template from 'views/nodes/nodeInfo';
import nodesStore from 'store/NodesStore';
import routerStore from 'store/relax/RouterStore';

export default class NodeInfo extends Box {
  constructor() {
    super("NodeInfo");

    routerStore.on('path', () => {
      if (routerStore.isNodePage()) {
        this.render();
      }
    });

    nodesStore.on('nodeUpdate', () => {
      this.render();
    });
  }


  view() {
    let node = nodesStore.getSelectedNode() || {info:{}};
    const data = {
      node: node
    };
    return this.viewWithContent(template(data));
  }

}