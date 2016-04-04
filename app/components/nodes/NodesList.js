import Box from 'components/Box';
import template from 'views/nodes/nodesList';
import nodesStore from 'store/NodesStore';
import ConfirmDialog from 'components/ConfirmDialog'

export default class NodesList extends Box {
  constructor() {
    super("NodesList", {style: 'primary'});
    nodesStore.on('nodes', diff => {
      nodesStore.resetSelectedIndex();
      this.render();
    });
    nodesStore.on('nodesLoading', diff => {
      this.renderLoading(diff.rhs);
    });
    nodesStore.on('selectedIndex', diff => {
      if (diff.rhs !== -1) {
        this.hide();
      } else {
        this.show(/*{effect: 'slide', duration: 400, easing: 'easeOutQuad', direction: 'left'}*/);
      }
    });
    this.confirmDialog = new ConfirmDialog('nodeListConfirmDialog');
  }

  _handlers() {
    $(`#${this.componentId} a[name='btSelectItemNodes']`).click(event => {
      //let radioButtons = $(`#${this.componentId} input:radio[name='btSelectItemNodes']`);
      //var selectedIndex = radioButtons.index(radioButtons.filter(':checked'));
      nodesStore.setSelectedIndex(parseInt($(event.target).data('index')));
    });

    let _this = this;
    $(`#${this.componentId} button[name='btRemoveNode']`).click(event => {
      let index = parseInt($(event.target).data('index'));
      let node = nodesStore.state.nodes[index];
      _this.confirmDialog.show({
        ok: ()=> {
          nodesStore.deleteNode(node.id);
        },
        text: `Remove node "${node.name}"?`
      });
    });
  }

  beforeRender() {
    super.beforeRender();
    $(`#${this.componentId} a[name='btSelectItemNodes']`).off();
    $(`#${this.componentId} button[name='btRemoveNode']`).off();
  }

  afterRender() {
    super.afterRender();
    $(`[data-toggle="popover"]`).popover();
    this._handlers();
  }

  viewMounted() {
    super.viewMounted();
    nodesStore.fetchNodes();
  }

  initialView() {
    return `${super.initialView()}${this.confirmDialog.initialView()}`;
  }

  view() {
    return this.viewWithContent(template({
      nodes: nodesStore.state.nodes,
      selectedIndex: nodesStore.state.selectedIndex
    }));
  }

}