import Box from 'components/Box';
import template from 'views/nodes/nodeDetails';
import NodeCommands from 'components/nodes/NodeCommands';
import NodeState from 'components/nodes/NodeState';
import NodePlannedState from 'components/nodes/NodePlannedState';
import NodeSummary from 'components/nodes/NodeSummary';
import NodeInfo from 'components/nodes/NodeInfo';
import routerStore from 'store/relax/RouterStore';
import ConfigureModuleDialog from 'components/nodes/ConfigureModuleDialog';
import SetModulesDialog from 'components/nodes/SetModulesDialog';
import CommandDetailsDialog from 'components/nodes/CommandDetailsDialog';

export default class NodeDetails extends Box {
  constructor() {
    super("NodeDetails", { style: 'clear' });
    this.configureModuleDialog = new ConfigureModuleDialog();
    this.setStateDialog = new SetModulesDialog('setNodeModulesState');
    this.commandDetailsDialog = new CommandDetailsDialog();
  }

  _handlers() {
    $(`#${this.componentId} button[name="btBackToNodesList"]`).click(() => {
      routerStore.changeRoute('/nodes', 'nodes');
    });
  }

  beforeRender() {
    super.beforeRender();
    $(`#${this.componentId} button[name="btBackToNodesList"]`).off();
  }

  afterRender() {
    super.afterRender();
    this._handlers();
  }

  viewMounted() {
    super.viewMounted();
    this._handlers();
    this.hide();
  }

  initialView() {
    return `${super.initialView()}` +
      `${this.commandDetailsDialog.initialView()}` +
      `${this.configureModuleDialog.initialView()}` +
      `${this.setStateDialog.initialView()}`;
  }

  view() {
    const data = {
      info: new NodeInfo().initialView(),
      summary: new NodeSummary().initialView(),
      commands: new NodeCommands(this.commandDetailsDialog).initialView(),
      currentState: new NodeState(this.configureModuleDialog, {title: "Current", editable: false}).initialView(),
      plannedState: new NodePlannedState(this.configureModuleDialog).initialView()
    };
    return this.viewWithContent(template(data));
  }

}