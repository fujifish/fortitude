import Box from 'components/Box';
import template from 'views/nodes/nodeCommands';
import commandStatusTemplate from 'views/nodes/commandStatus';
import nodesStore from 'store/NodesStore';
import routerStore from 'store/relax/RouterStore';

export default class NodeCommands extends Box {
  constructor(commandDetailsDialog) {
    super("NodeCommands");

    routerStore.on('path', diff => {
      var oldPath = diff.lhs;
      if (routerStore.isNodePage()) {
        nodesStore.fetchCommands();
      } else if (oldPath.indexOf('/nodes#') != - 1) {
        nodesStore.stopRefreshFor('fetchCommands');
        nodesStore.resetCommands();
      }
    });

    // fetch commands after user loads in a node page
    nodesStore.on('nodesList.nodes.*', (diff) => {
      if (!diff.lhs) {
        nodesStore.fetchCommands();
      }
    });

    nodesStore.on('nodeDetails.commands.0.status', (diff) => {
      if (['pending','delivered'].indexOf(diff.lhs) != -1 && diff.rhs == 'success') {
        nodesStore.stopRefreshFor('fetchCommands');
        nodesStore.fetchNodes();
      }
      this.render();
    });

    nodesStore.on('nodeDetails.commands', () => {
      var latestCmd = nodesStore.state.nodeDetails.commands[0];
      if (latestCmd && ['pending','delivered'].indexOf(latestCmd.status) != -1) {
        nodesStore.startRefreshFor('fetchCommands');
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
    var _this = this;
    $(`button[name='btnCancelPendingCommand']`).click(() => {
      nodesStore.cancelPendingCommand();
    });
    $("a[name='nodeCommandDetails']").click(function() {
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
      commands: nodesStore.state.nodeDetails.commands,
      commandStatus: nodesStore.state.nodeDetails.commands.map(c => commandStatusTemplate({status: c.status}))
    };
    return this.viewWithContent(template(data));
  }

}