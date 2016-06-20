import Box from 'components/Box';
import nodesStore from 'store/NodesStore';
import ConfirmDialog from 'components/ConfirmDialog';
import UpdateNodesVersionDialog from 'components/nodes/UpdateNodesVersionDialog';
import routerStore from 'store/relax/RouterStore';

import actionsTemplate from 'views/nodes/actions';
import tableTemplate from 'views/nodes/nodeList/table';
import checkboxTemplate from 'views/nodes/nodeList/checkbox';
import removeButtonTemplate from 'views/nodes/nodeList/removeButton';
import warningTemplate from 'views/nodes/nodeList/warning';
import nodeName from 'views/nodes/nodeList/nodeName';
import tags from 'views/nodes/nodeList/tags';

//todo - warning of nodes
//todo - clear loading of node ??
//todo - delete node and then reload on node page
//todo - server side ..

export default class NodesList extends Box {
  constructor() {
    super("NodesList", {style: 'primary'});

    var _this = this;
    nodesStore.on('nodesLoading', diff => {
      this.renderLoading(diff.rhs);
    });
    nodesStore.on('nodeActionLoading', diff => {
      this.renderLoading(diff.rhs);
    });
    nodesStore.on('nodes', (diff) => {
      if (diff.item.kind == 'D') {
        //$(`#${_this.componentId} table`).DataTable().ajax.reload();
      }
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
      "oLanguage": { "sSearch": '' },
      "serverSide": true,
      "ajax": {
        "url": '/api/nodes',
        "dataSrc": (json) => {
          nodesStore.setNodes(json.nodes);
          return this._renderServerNodes(json);
        }
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
      ]
    }).on('draw.dt', () => {
      nodesStore.uncheckAllNodes();
      $(`#${this.componentId} input:checkbox`).iCheck('uncheck');
      _this._tableHandlers();
    }).on('preDrawCallback', _this._tableHandlersOff);

    // append 'actions' button to table
    $('.dataTables_filter > label').addClass('input-group').prepend(actionsTemplate);

    $(`#${this.componentId} a[name='aUpdateNode']`).click(() => {
      _this.updateNodesVersionDialog.show();
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
  }

  beforeRender() {
    super.beforeRender();
    $(`#${this.componentId} input:checkbox[name='checkAllNodes']`).off();
    $(`#${this.componentId} a[name='aUpdateNode']`).off();
    $(`#${this.componentId} table`).off('draw.dt');
    this._tableHandlersOff();
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

  _tableHandlers() {
    var _this = this;

    $(`#${this.componentId} a[name='btSelectItemNodes']`).click(event => {
      //let radioButtons = $(`#${this.componentId} input:radio[name='btSelectItemNodes']`);
      //var selectedIndex = radioButtons.index(radioButtons.filter(':checked'));
      nodesStore.setSelectedIndex(parseInt($(event.target).data('index')));
    });

    $(`#${this.componentId} input:checkbox[name='checkNode']`).on('change', event => {
      nodesStore.toggleNode(parseInt($(event.target).data('index')));
    });

    $(`#${this.componentId} button[name='btRemoveNode']`).off().click(event => {
      let index = parseInt($(event.target).data('index'));
      let node = nodesStore.state.nodes[index];
      _this.confirmDialog.show({
        ok: ()=> { nodesStore.deleteNode(node.id) },
        text: `Remove node "${node.name}"?`
      });
    });
  }

  _tableHandlersOff() {
    $(`#${this.componentId} a[name='btSelectItemNodes']`).off();
    $(`#${this.componentId} input:checkbox[name='checkNode']`).off();
    $(`#${this.componentId} button[name='btRemoveNode']`).off();
  }

  // this function receives the returned json from the nodes api and returns render-able data for the DataTable
  _renderServerNodes(json) {
    function _timeSince(date) {
      var seconds = Math.floor((new Date() - date) / 1000);
      var interval = Math.floor(seconds / 31536000);

      if (interval > 1) {
        return interval + " years";
      }
      interval = Math.floor(seconds / 2592000);
      if (interval > 1) {
        return interval + " months";
      }
      interval = Math.floor(seconds / 86400);
      if (interval > 1) {
        return interval + " days";
      }
      interval = Math.floor(seconds / 3600);
      if (interval > 1) {
        return interval + " hours";
      }
      interval = Math.floor(seconds / 60);
      if (interval > 1) {
        return interval + " minutes";
      }
      return Math.floor(seconds) + " seconds";
    }

    var renderedItems = json.nodes.map(function(node, i) {
      var node = nodesStore.enrich(node);
      return {
        checkbox: checkboxTemplate({index: i}),
        warning: warningTemplate({node: node}),
        name: nodeName({node: node, index: i}) || '',
        tags: tags({node: node}) || '',
        id: node.id || '',
        platform: node.info.platform || '',
        agentVersion: node.info.agentVersion || '',
        lastSeen: _timeSince(new Date(node.lastSync)) || '',
        deleteButton: removeButtonTemplate({index: i})
      };
    });

    return renderedItems;
  }

}