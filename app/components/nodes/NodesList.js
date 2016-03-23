import Box from 'components/Box';
import template from 'views/nodes/nodesList';
import nodesStore from 'store/NodesStore';

export default class NodesList extends Box {
  constructor(){
    super("NodesList", {style: 'primary'});
    nodesStore.on('nodes', nodes => {
      this.render();
    });
    nodesStore.on('nodesLoading', loading => {
      this.renderLoading(loading);
    });
  }

  viewMounted(){
    super.viewMounted();
    nodesStore.fetchNodes();
  }


  view(){
    return this.viewWithContent(template({nodes: nodesStore.state.nodes, selectedIndex: nodesStore.state.selectedIndex}));
  }
}