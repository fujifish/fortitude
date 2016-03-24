import Box from 'components/Box';
import template from 'views/nodes/nodeState';
import nodesStore from 'store/NodesStore';

export default class NodeState extends Box {
  constructor(options) {
    super("NodeState-"+options.title, options);
    this.options = options;
    nodesStore.on('selectedIndex', index => {
      this.render();
    });
  }

  afterRender() {
    let _this = this;
    $(`#${this.componentId} div[name="StateOfModuleInfoBox"]`).hover(
      function() {
        $(`#${_this.componentId} div.btn-group[data-index="${$(this).data('index')}"]`).show();
      },
      function() {
        $(`#${_this.componentId} div.btn-group`).hide();
      }
    );
  }

  view() {
    let node = nodesStore.getSelectedNode();
    const data = {
      title: this.options.title || "",
      states: node ? node.state[this.options.title.toLowerCase()] || [] : []
    };
    return this.viewWithContent(template(data));
  }

}