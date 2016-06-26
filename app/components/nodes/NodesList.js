import Box from 'components/Box';
import nodesStore from 'store/NodesStore';
import routerStore from 'store/relax/RouterStore';
import ConfirmDialog from 'components/ConfirmDialog';
import UpdateNodesVersionDialog from 'components/nodes/UpdateNodesVersionDialog';

import actionsTemplate from 'views/nodes/actions';
import tableTemplate from 'views/nodes/nodeList/table';
import checkboxTemplate from 'views/nodes/nodeList/checkbox';
import removeButtonTemplate from 'views/nodes/nodeList/removeButton';
import warningTemplate from 'views/nodes/nodeList/warning';
import nodeName from 'views/nodes/nodeList/nodeName';
import tags from 'views/nodes/nodeList/tags';

export default class NodesList extends Box {
  constructor() {
    super("NodesList", {style: 'primary'});

    nodesStore.on('nodeActionLoading', diff => {
      this.renderLoading(diff.rhs);
    });
    
    nodesStore.on('nodes', () => {
      if (!this.tableChangedNodes) {
        $(`#${this.componentId} table`).DataTable().ajax.reload();
      }
    });

    nodesStore.on('nodes.*.timeSinceSync', (diff) => {
      var nodeIndex = diff.path[1];
      $(`#${this.componentId} tr input[data-index=${nodeIndex}]`)
        .parent().parent().find('td:nth-child(8n+8)') // last seen td
        .html(diff.rhs);
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
        "data" : (data) => {
          // if fetching data from a node page (loading a node page as first)
          data.search.value = data.search.value || routerStore.nodeId();
        },
        'beforeSend': function (request) {
          // customize request to server
          request.setRequestHeader("X-CSRF-Token", window.csrfToken);
        },
        "dataSrc": (json) => {
          // customize the server response and render the nodes
          this.tableChangedNodes = true;
          nodesStore.setNodes(json.nodes);
          this.tableChangedNodes = false;
          return this._renderServerNodes(json);
        }
      },
      "order": [[ 7, "desc" ]],
      "columnDefs": [{ "targets": [0,1,3,4,8], "sortable": false }],
      "columns"    : [
        { data: 'checkbox' },
        { data: 'warning' },
        { data: 'name', name: 'name' },
        { data: 'tags', name: 'tags' },
        { data: 'id', name: 'id' },
        { data: 'platform', name: 'info.platform' },
        { data: 'agentVersion', name: 'info.agentVersion' },
        { data: 'lastSeen', name: 'lastSync' },
        { data: 'deleteButton'}
      ]
    }).on('preXhr', () => { this.renderLoading(true) })
      .on('preDrawCallback', _this._tableHandlersOff.bind(_this))
      .on('draw.dt', () => {
        nodesStore.uncheckAllNodes();
        $(`#${this.componentId} input:checkbox`).iCheck('uncheck');
        this._tableHandlers();
        this.renderLoading(false);
      });

    // send table ajax search only on enter key and not on every key
    $(`#${this.componentId} .dataTables_filter input`).off().keyup(e => {
      var val = $(e.target).val();
      if (e.keyCode == 13 || (e.keyCode == 8 && !val)) {
        this._tableSearch($(e.target).val());
      }
    });

    // append 'actions' button to table
    $('.dataTables_filter > label').addClass('input-group').prepend(actionsTemplate);

    $(`#${this.componentId} a[name='aUpdateNode']`).click(() => {
      this.updateNodesVersionDialog.show();
    });

    $(`#${this.componentId} input:checkbox[name='checkAllNodes']`).on('change', elem => {
      var checkedIndexes = [];
      if (elem.target.checked) {
        $(`#${this.componentId} input:checkbox[name='checkNode']`).iCheck('check').each((i, elem) =>  {
          checkedIndexes.push(parseInt($(elem).data('index')));
        });
        nodesStore.setCheckedIndexes(checkedIndexes);
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
    $(`#${this.componentId} table`).off('preDrawCallback');
    $(`#${this.componentId} table`).off('preXhr');
    $(`#${this.componentId} .dataTables_filter input`).off();
    this._tableHandlersOff();
  }

  afterRender() {
    super.afterRender();
    this._handlers();

    var query = routerStore.urlValueOf('q');
    if (query) {
      this._tableSearch(routerStore.urlValueOf('q'));
    } else {
      this._focusTableSearch();
    }

    // the table turns this off on draw event
    this.renderLoading(true);
  }

  initialView() {
    return `${super.initialView()}${this.confirmDialog.initialView()}${this.updateNodesVersionDialog.initialView()}`;
  }

  view() {
    return this.viewWithContent(tableTemplate({}));
  }

  show() {
    super.show();
    this._focusTableSearch();
  }

  _focusTableSearch() {
    $(`#${this.componentId} .dataTables_filter .input-group input`).focus();
  }

  _tableSearch(value) {
    $(`#${this.componentId} table`).DataTable().search(value).draw();
  }

  _tableHandlers() {
    $(`#${this.componentId} a[name='btSelectItemNodes']`).click(event => {
      var index = parseInt($(event.target).data('index'));
      var node = nodesStore.state.nodes[index];
      routerStore.changeRoute('/nodes#' + node.id);
    });

    $(`#${this.componentId} input:checkbox[name='checkNode']`).on('change', event => {
      nodesStore.toggleNode(parseInt($(event.target).data('index')));
    });

    var _this = this;
    $(`#${this.componentId} button[name='btRemoveNode']`).click(function(event) {
      let index = parseInt($(this).data('index'));
      let node = nodesStore.state.nodes[index];
      _this.confirmDialog.show({
        ok: ()=> { nodesStore.deleteNode(node.id) },
        text: `Remove node "${node.name}"?`
      });
    });

    $(`[data-toggle="popover"]`).popover();
  }

  _tableHandlersOff() {
    $(`[data-toggle="popover"]`).off();
    $(`#${this.componentId} a[name='btSelectItemNodes']`).off();
    $(`#${this.componentId} input:checkbox[name='checkNode']`).off();
    $(`#${this.componentId} button[name='btRemoveNode']`).off();
  }

  // this function receives the returned json from the nodes api and returns render-able data for the DataTable
  _renderServerNodes(json) {
    var renderedItems = json.nodes.map((node, i) => {
      var node = nodesStore.enrich(node);
      return {
        checkbox: checkboxTemplate({index: i}),
        warning: warningTemplate({node: node}),
        name: nodeName({node: node, index: i}) || '',
        tags: tags({node: node}) || '',
        id: node.id || '',
        platform: node.info.platform || '',
        agentVersion: node.info.agentVersion || '',
        lastSeen: node.timeSinceSync || '',
        deleteButton: removeButtonTemplate({index: i})
      };
    });

    return renderedItems;
  }
}