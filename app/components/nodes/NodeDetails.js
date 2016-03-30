import Component from 'components/relax/Component';
import template from 'views/nodes/nodeDetails';
import NodeCommands from 'components/nodes/NodeCommands';
import NodeState from 'components/nodes/NodeState';
import NodePlannedState from 'components/nodes/NodePlannedState';
import NodeSummary from 'components/nodes/NodeSummary';
import nodesStore from 'store/NodesStore';
import ConfigureModuleDialog from 'components/nodes/ConfigureModuleDialog'

export default class NodeDetails extends Component {
  constructor() {
    super("NodeDetails");
    nodesStore.on('selectedIndex', diff => {
      if (diff.rhs === -1) {
        this.hide();
      } else {
        this.show(/*{effect: 'slide', duration: 400, easing: 'easeOutQuad', direction: 'right'}*/);
      }
    });
  }

  _handlers() {
    $(`#${this.componentId} button[name="btBackToNodesList"]`).click(() => {
      nodesStore.resetSelectedIndex();
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

  view() {
    const data = {
      summary: new NodeSummary().initialView(),
      commands: new NodeCommands().initialView(),
      currentState: new NodeState({title: "Current", editable: false}).initialView(),
      plannedState: new NodePlannedState().initialView(),
      configureModuleDialog: new ConfigureModuleDialog().initialView()
    };
    return template(data);
  }

}