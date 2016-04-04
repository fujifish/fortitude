import Box from 'components/Box';
import template from 'views/nodes/nodeCommands';
import nodesStore from 'store/NodesStore';

export default class NodeCommands extends Box {
  constructor(commandDetailsDialog) {
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
    this.commandDetailsDialog = commandDetailsDialog;
  }

  _handlers() {
    let _this = this;
    $(`button[name='btnCancelPendingCommand']`).click(() => {
      nodesStore.cancelPendingCommand();
    });
    $("a[name='nodeCommandDetails']").click(function(){
      let index = parseInt($(this).data('index'));
      let command = nodesStore.state.nodeDetails.commands[index];
      _this.commandDetailsDialog.show(command.log);
    });

  }

  beforeRender() {
    super.beforeRender();
    $(`button[name='btnCancelPendingCommand']`).off();
    $("a[name='nodeCommandDetails']").off();
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