import template from "views/nodes/nodes";
import Component from 'components/relax/Component';
import NodesList from 'components/nodes/NodesList';
import NodeDetails from 'components/nodes/NodeDetails';

export default class Nodes extends Component {
  constructor(){
    super('nodes');
  }

  initialView(){
    const data = {
      nodesList: new NodesList().initialView(),
      nodeDetails: new NodeDetails().initialView()
    };
    return template(data);
  }
}
