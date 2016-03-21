import template from "views/nodes/nodes";
import Component from 'components/relax/Component';

export default class Nodes extends Component {
  constructor(){
    super('nodes');
  }

  initialView(){
    const data = {
    };
    return template(data);
  }
}
