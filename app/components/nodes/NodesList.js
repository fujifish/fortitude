import Box from 'components/Box';
import tableTemplate from 'views/nodes/nodeList/table';
import checkboxTemplate from 'views/nodes/nodeList/checkbox';
import removeButtonTemplate from 'views/nodes/nodeList/removeButton';
import warningTemplate from 'views/nodes/nodeList/warning';
import nodesStore from 'store/NodesStore';
import ConfirmDialog from 'components/ConfirmDialog'
import UpdateNodesVersionDialog from 'components/nodes/UpdateNodesVersionDialog'
import actionsTemplate from 'views/nodes/actions'
import routerStore from 'store/relax/RouterStore';

export default class NodesList extends Box {
  constructor() {
    super("NodesList", {style: 'primary'});

    nodesStore.on('nodesLoading', diff => {
      this.renderLoading(diff.rhs);
    });
    nodesStore.on('nodeActionLoading', diff => {
      this.renderLoading(diff.rhs);
    });

    this.confirmDialog = new ConfirmDialog('nodeListConfirmDialog');
    this.updateNodesVersionDialog = new UpdateNodesVersionDialog();
  }

  _handlers() {
    let _this = this;

    $(`#${this.componentId} table`).DataTable({
      "pagingType": "full_numbers",
      "dom": "<'row'<'col-sm-9'<'pull-left'f>><'col-sm-3'<'pull-right'l>>>" +
      "<'row'<'col-sm-12'tr>>" +
      "<'row'<'col-sm-5'i><'col-sm-7'p>>",
      "serverSide": true,
      "ajax": {
        "url": '/api/nodes',
        "dataSrc": this._renderServerNodes
      },
      "order": [[ 7, "desc" ]],
      "columnDefs": [{ "targets": [0], "sortable": false }],
      "columns"    : [
        { data: 'checkbox' },
        { data: 'warning' },
        { data: 'name', name: 'name' },
        { data: 'tags', name: 'tags' },
        { data: 'id', name: 'id' },
        { data: 'platform', name: 'platform' },
        { data: 'agentVersion', name: 'agnetVersion' },
        { data: 'lastSeen', name: 'lastSynced' },
        { data: 'deleteButton'}
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

    // todo take data form serevr to ui - maniplkutaing tafgs / name / last sync etc..
    // todo - need to check handler..
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

    var query = routerStore.urlValueOf('q');
    if (query) {
      $(`#${this.componentId} table`).DataTable().search(routerStore.urlValueOf('q')).draw();
      $(`#${this.componentId} .dataTables_filter .input-group input`).val(query);
    } else {
      this._focusTableSearch();
    }
  }

  initialView() {
    return `${super.initialView()}${this.confirmDialog.initialView()}${this.updateNodesVersionDialog.initialView()}`;
  }

  view() {
    return this.viewWithContent(tableTemplate({
      selectedIndex: nodesStore.state.selectedIndex,
      checkedIndexes: nodesStore.state.checkedIndexes
    }));
  }

  show() {
    super.show();
    this._focusTableSearch();
  }

  _focusTableSearch() {
    $(`#${this.componentId} .dataTables_filter .input-group input`).focus();
  }

  _renderServerNodes(json) {
    var renderedItems = json.data.map(function(node, i) {
      return {
        checkbox: checkboxTemplate({index: i}),
        warning: warningTemplate({node: nodesStore.enrich(node)}),
        name: node.name || '',
        tags: node.info.tags || '',
        id: node.id || '',
        platform: node.info.platform || '',
        agentVersion: node.info.agentVersion || '',
        lastSeen: node.lastSync || '',
        deleteButton: removeButtonTemplate({index: i})
      };
    });
    return renderedItems;
  }

}