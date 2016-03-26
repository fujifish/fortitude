import template from "views/nodes/nodes";
import Component from 'components/relax/Component';
import NodesList from 'components/nodes/NodesList';
import NodeDetails from 'components/nodes/NodeDetails';
import nodesStore from 'store/NodesStore';

export default class Nodes extends Component {
  constructor() {
    super('nodes');
    this.nodesList = new NodesList();
    this.nodeDetails = new NodeDetails();
  }

  initialView() {
    const data = {
      nodesList: this.nodesList.initialView(),
      nodeDetails: this.nodeDetails.initialView()
    };
    return template(data);
  }
}
