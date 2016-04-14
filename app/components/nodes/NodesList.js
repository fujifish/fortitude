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
    $(`#${this.componentId} table`).DataTable({
      "pagingType": "full_numbers",
      "dom": "<'row'<'col-sm-9'<'pull-left'f>><'col-sm-3'<'pull-right'l>>>" +
      "<'row'<'col-sm-12'tr>>" +
      "<'row'<'col-sm-5'i><'col-sm-7'p>>",
      "order": [[ 2, "desc" ]],
      "columnDefs": [
        {
          "targets": "hidden_last_seen", // index 0
          "visible": false,
          "searchable": false
        },
        {
          "targets": [1, -1],
          "sortable": false,
        },
        {
          // Sort column 1 (formatted date) by column 6 (hidden seconds)
          "orderData": [0] ,   "targets": "last_seen"
        }
      ]
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
      nodes: nodesStore.state.nodes.map(n => {return nodesStore.enrich(n)}),
      selectedIndex: nodesStore.state.selectedIndex
    }));
  }

}