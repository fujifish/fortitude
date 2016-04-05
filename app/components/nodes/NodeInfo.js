import Box from 'components/Box';
import template from 'views/nodes/nodeInfo';
import nodesStore from 'store/NodesStore';

export default class NodeInfo extends Box {
  constructor() {
    super("NodeInfo");
    nodesStore.on('selectedIndex', diff => {
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