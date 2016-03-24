import Box from 'components/Box';
import template from 'views/nodes/nodesList';
import nodesStore from 'store/NodesStore';
import ConfirmDialog from 'components/ConfirmDialog';

export default class NodesList extends Box {
  constructor() {
    super("NodesList", {style: 'primary'});
    nodesStore.on('nodes', nodes => {
      this.render();
    });
    nodesStore.on('nodesLoading', loading => {
      this.renderLoading(loading);
    });
    this.deleteNodeConfirmDialog = new ConfirmDialog('deleteNode');
  }

  _handlers() {
    $(`#${this.componentId} input:radio[name='btSelectItemNodes']`).on('change', ()=> {
      let radioButtons = $(`#${this.componentId} input:radio[name='btSelectItemNodes']`);
      var selectedIndex = radioButtons.index(radioButtons.filter(':checked'));
      nodesStore.setSelectedIndex(selectedIndex);
    });

    let _this = this;
    $(`#${this.componentId} button[name='btRemoveNode']`).click(function() {
      let index = parseInt($(this).data('index'));
      let node = nodesStore.state.nodes[index];
      _this.deleteNodeConfirmDialog.show({
        ok: ()=> {
          nodesStore.deleteNode(node.id);
        },
        text: `Remove node "${node.name}"?`
      });
    });
  }

  beforeRender() {
    super.beforeRender();
    $(`#${this.componentId} input:radio[name='btSelectItemNodes']`).off();
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
    return `${super.initialView()}${this.deleteNodeConfirmDialog.initialView()}`;
  }

  view() {
    return this.viewWithContent(template({
      nodes: nodesStore.state.nodes,
      selectedIndex: nodesStore.state.selectedIndex
    }));
  }
}