import Component from 'components/relax/Component';
import template from 'views/nodes/nodeDetails';

export default class NodeDetails extends Component {
  constructor(){
    super("NodeDetails");
  }

  initialView(){
    const data = {
    };
    return template(data);
  }

}