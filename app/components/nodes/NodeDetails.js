import Component from 'components/relax/Component';
import template from 'views/nodes/nodeDetails';
import NodeCommands from 'components/nodes/NodeCommands';
import NodeState from 'components/nodes/NodeState';
import NodeSummary from 'components/nodes/NodeSummary';
import nodesStore from 'store/NodesStore';

export default class NodeDetails extends Component {
  constructor() {
    super("NodeDetails");
  }

  view() {
    const data = {
      summary: new NodeSummary().initialView(),
      commands: new NodeCommands().initialView(),
      currentState: new NodeState({title: "Current", style: "info"}).initialView(),
      plannedState: new NodeState({title: "Planned", style: "primary"}).initialView()
    };
    return template(data);
  }

}