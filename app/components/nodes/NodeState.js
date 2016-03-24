import Box from 'components/Box';
import template from 'views/nodes/nodeState';

export default class NodeState extends Box {
  constructor(options) {
    super("NodeState", options);
    this.options = options;
  }

  view() {
    const data = {
      title: this.options.title || ""
    };
    return this.viewWithContent(template(data));
  }


}