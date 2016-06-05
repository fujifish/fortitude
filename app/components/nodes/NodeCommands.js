import Box from 'components/Box';
import template from 'views/nodes/nodeCommands';
import nodesStore from 'store/NodesStore';

export default class NodeCommands extends Box {
  constructor(commandDetailsDialog) {
    super("NodeCommands");
    nodesStore.on('selectedIndex', diff => {
      if (diff.rhs != -1) {
        nodesStore.fetchCommands();
      } else {
        nodesStore.stopRefreshFor('fetchCommands');
        nodesStore.resetCommands();
      }
    });
    nodesStore.on('nodeDetails.commands.0.status', () => {
      nodesStore.stopRefreshFor('fetchCommands');
      this.render();
    });
    nodesStore.on('nodeDetails.commands', () => {
      var latestCmd = nodesStore.state.nodeDetails.commands[0];
      if (latestCmd && latestCmd.status == 'pending') {
        nodesStore.startRefreshFor('fetchCommands', false);
      }
      this.render();
    });
    nodesStore.on('nodeDetails.commandsLoading', diff => {
      if (!nodesStore.isRefreshing('fetchCommands')) {
        this.renderLoading(diff.rhs);
      }
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