import Box from 'components/Box';
import template from 'views/nodes/nodeCommands';
import nodesStore from 'store/NodesStore';

export default class NodeCommands extends Box {
  constructor() {
    super("NodeCommands");
    nodesStore.on('selectedIndex', index => {
      nodesStore.fetchCommands();
    });
    nodesStore.on('nodeDetails.commands', commands => {
      this.render();
    });
    nodesStore.on('nodeDetails.commandsLoading', loading => {
      this.renderLoading(loading.rhs);
    });
  }

  view() {
    const data = {
      commands: nodesStore.state.nodeDetails.commands
    };
    return this.viewWithContent(template(data));
  }

}