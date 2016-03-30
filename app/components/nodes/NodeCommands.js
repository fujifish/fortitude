import Box from 'components/Box';
import template from 'views/nodes/nodeCommands';
import nodesStore from 'store/NodesStore';

export default class NodeCommands extends Box {
  constructor() {
    super("NodeCommands");
    nodesStore.on('selectedIndex', diff => {
      nodesStore.fetchCommands();
    });
    nodesStore.on('nodeDetails.commands', diff => {
      this.render();
    });
    nodesStore.on('nodeDetails.commandsLoading', diff => {
      this.renderLoading(diff.rhs);
    });
  }

  _handlers() {
    $(`button[name='btnCancelPendingCommand']`).click(() => {
      nodesStore.cancelPendingCommand();
    });
  }

  beforeRender() {
    super.beforeRender();
    $(`button[name='btnCancelPendingCommand']`).off();
  }

  afterRender() {
    super.afterRender();
    this._handlers();
  }

  view() {
    const data = {
      commands: nodesStore.state.nodeDetails.commands
    };
    return this.viewWithContent(template(data));
  }

}