import Box from 'components/Box';
import template from 'views/nodes/nodesList';
import nodesStore from 'store/NodesStore';
import ConfirmDialog from 'components/ConfirmDialog'
import UpdateNodesVersionDialog from 'components/nodes/UpdateNodesVersionDialog'
import actionsTemplate from 'views/nodes/actions'

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
    nodesStore.on('nodeActionLoading', diff => {
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
    this.updateNodesVersionDialog = new UpdateNodesVersionDialog();
  }

  _handlers() {
    let _this = this;

    $(`#${this.componentId} a[name='btSelectItemNodes']`).click(event => {
      //let radioButtons = $(`#${this.componentId} input:radio[name='btSelectItemNodes']`);
      //var selectedIndex = radioButtons.index(radioButtons.filter(':checked'));
      nodesStore.setSelectedIndex(parseInt($(event.target).data('index')));
    });

    $(`#${this.componentId} input:checkbox[name='checkAllNodes']`).on('change', elem => {
      var checkedIndexs = [];
      if (elem.target.checked) {
        $(`#${this.componentId} input:checkbox[name='checkNode']`).iCheck('check').each((i, elem) =>  {
          checkedIndexs.push(parseInt($(elem).data('index')));
        });
        nodesStore.setCheckedIndexes(checkedIndexs);
      } else {
        $(`#${this.componentId} input:checkbox[name='checkNode']`).iCheck('uncheck');
        nodesStore.uncheckAllNodes();
      }
    });

    $(`#${this.componentId} input:checkbox[name='checkNode']`).on('change', event => {
      nodesStore.toggleNode(parseInt($(event.target).data('index')));
    });

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
      ],
      "oLanguage": {
        "sSearch": ''
      }
    }).on('draw.dt', () => {
      nodesStore.uncheckAllNodes();
      $(`#${this.componentId} input:checkbox`).iCheck('uncheck');
    });

    // append 'actions' button to table
    $('.dataTables_filter > label').addClass('input-group').prepend(actionsTemplate);

    $(`#${this.componentId} a[name='aUpdateNode']`).click(() => {
      _this.updateNodesVersionDialog.show();
    });
  }

  beforeRender() {
    super.beforeRender();
    $(`#${this.componentId} a[name='btSelectItemNodes']`).off();
    $(`#${this.componentId} button[name='btRemoveNode']`).off();
    $(`#${this.componentId} input:checkbox[name='checkAllNodes']`).off();
    $(`#${this.componentId} input:checkbox[name='checkNode']`).off();
    $(`#${this.componentId} a[name='aUpdateNode']`).off();
    $(`#${this.componentId} table`).off('draw.dt');
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
    return `${super.initialView()}${this.confirmDialog.initialView()}${this.updateNodesVersionDialog.initialView()}`;
  }

  view() {
    return this.viewWithContent(template({
      nodes: nodesStore.state.nodes.map(n => {return nodesStore.enrich(n)}),
      selectedIndex: nodesStore.state.selectedIndex,
      checkedIndexes: nodesStore.state.checkedIndexes
    }));
  }

}