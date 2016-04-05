import Component from 'components/relax/Component';
import template from 'views/nodes/nodeDetails';
import NodeCommands from 'components/nodes/NodeCommands';
import NodeState from 'components/nodes/NodeState';
import NodePlannedState from 'components/nodes/NodePlannedState';
import NodeSummary from 'components/nodes/NodeSummary';
import NodeInfo from 'components/nodes/NodeInfo';
import nodesStore from 'store/NodesStore';
import ConfigureModuleDialog from 'components/nodes/ConfigureModuleDialog'
import CommandDetailsDialog from 'components/nodes/CommandDetailsDialog'
import UpdateAgentVersionDialog from 'components/nodes/UpdateAgentVersionDialog'
import ConfirmDialog from 'components/ConfirmDialog';

export default class NodeDetails extends Component {
  constructor(configureDialog) {
    super(configureDialog, "NodeDetails");
    nodesStore.on('selectedIndex', diff => {
      if (diff.rhs === -1) {
        this.hide();
      } else {
        this.show(/*{effect: 'slide', duration: 400, easing: 'easeOutQuad', direction: 'right'}*/);
      }
    });
    this.updateAgentVersionDialog = new UpdateAgentVersionDialog();
    this.confirmDialog = new ConfirmDialog('NodeDetailsConfirm');

  }

  _handlers() {
    let _this = this;
    $(`#${this.componentId} button[name="btBackToNodesList"]`).click(() => {
      nodesStore.resetSelectedIndex();
    });
    $(`#${this.componentId} button[name='btUpdateNode']`).click(event => {
      let node = nodesStore.getSelectedNode();
      _this.updateAgentVersionDialog.show(node.info.agentVersion);
    });
    $(`#${this.componentId} button[name='btResetNode']`).click(event => {
      let node = nodesStore.getSelectedNode();
      _this.confirmDialog.show({
        ok: ()=> {
          nodesStore.resetNodeContents();
        },
        text: `Are you sure you want to reset node "${node.name}"?`,
        subtext: 'This action will remove all currently installed modules.'
      });
    });

  }

  beforeRender() {
    super.beforeRender();
    $(`#${this.componentId} button[name="btBackToNodesList"]`).off();
    $(`#${this.componentId} button[name='btUpdateNode']`).off();
    $(`#${this.componentId} button[name='btResetNode']`).off();

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

  view() {
    let configureModuleDialog = new ConfigureModuleDialog();
    let commandDetailsDialog = new CommandDetailsDialog();

    const data = {
      info: new NodeInfo().initialView(),
      summary: new NodeSummary().initialView(),
      commands: new NodeCommands(commandDetailsDialog).initialView(),
      currentState: new NodeState(configureModuleDialog, {title: "Current", editable: false}).initialView(),
      plannedState: new NodePlannedState(configureModuleDialog).initialView(),
      configureModuleDialog: configureModuleDialog.initialView(),
      commandDetailsDialog: commandDetailsDialog.initialView(),
      updateAgentVersionDialog: this.updateAgentVersionDialog.initialView(),
      confirmDialog: this.confirmDialog.initialView()
    };
    return template(data);
  }

}