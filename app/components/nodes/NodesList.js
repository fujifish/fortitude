import Box from 'components/Box';
import nodesStore from 'store/NodesStore';
import routerStore from 'store/relax/RouterStore';
import ConfirmDialog from 'components/ConfirmDialog';
import UpdateNodesVersionDialog from 'components/nodes/UpdateNodesVersionDialog';
import AddNodesTagsDialog from 'components/nodes/AddNodesTagsDialog';

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
    
    nodesStore.on('nodesList.nodes.*', () => {
      this.tabelDraw({
        data: this._renderServerNodes(nodesStore.nodes),
        draw: nodesStore.state.nodesList.metaData.draw,
        recordsTotal: nodesStore.state.nodesList.metaData.recordsTotal,
        recordsFiltered: nodesStore.state.nodesList.metaData.recordsFiltered
      });
    });

    nodesStore.on('nodesList.nodes.*.timeSinceSync', (diff) => {
      var nodeIndex = diff.path[1];
      $(`#${this.componentId} tr input[data-index=${nodeIndex}]`)
        .parent().parent().find('td:nth-child(8n+8)') // last seen td
        .html(diff.rhs);
    });

    routerStore.on('path', diff => {
      var oldPath = diff.lhs;
      if (routerStore.isNodesPage()) {
        nodesStore.startRefreshFor('fetchNodes');
      } else if (oldPath.endsWith('/nodes')) {
        nodesStore.stopRefreshFor('fetchNodes');
      }
    });

    this.confirmDialog = new ConfirmDialog('nodeListConfirmDialog');
    this.updateNodesVersionDialog = new UpdateNodesVersionDialog();
    this.addNodesTagsDialog = new AddNodesTagsDialog();
  }

  _handlers() {
    var order = nodesStore.state.nodesList.order;
    var orderDir = nodesStore.state.nodesList.orderDir;
    var columns = [
      { data: 'checkbox' },
      { data: 'warning' },
      { data: 'name', name: 'name' },
      { data: 'tags', name: 'tags' },
      { data: 'id', name: 'id' },
      { data: 'platform', name: 'info.platform' },
      { data: 'agentVersion', name: 'info.agentVersion' },
      { data: 'lastSeen', name: 'lastSync' },
      { data: 'deleteButton'}
    ];

    $(`#${this.componentId} table`).DataTable({
      "pagingType": "full_numbers",
      "dom": "<'row'<'col-sm-9'<'pull-left'f>><'col-sm-3'<'pull-right'l>>>" +
      "<'row'<'col-sm-12'tr>>" +
      "<'row'<'col-sm-5'i><'col-sm-7'p>>",
      "oLanguage": { "sSearch": '' },
      "lengthMenu": [10, 25, 50, 100, 250, 500],
      "columns": columns,
      "order": [[ columns.findIndex(c => c.name == order), orderDir ]],
      "columnDefs": [{ "targets": [0,1,3,4,8], "sortable": false }],
      "pageLength": nodesStore.state.nodesList.length,
      "serverSide": true,
      "ajax" : this._fetchTableData.bind(this),
    }).on('length.dt', (e, settings, len) => { 
      localStorage.setItem('nodesList/length', len);
    }).on('order', () => {
      var order = $(`#${this.componentId} table`).DataTable().order();
      localStorage.setItem('nodesList/order', columns[order[0][0]].name);
      localStorage.setItem('nodesList/orderDir', order[0][1]);
    }).on('draw.dt', this._tableHandlers.bind(this))
      .on('preDrawCallback', this._tableHandlersOff.bind(this));


    // search table handler
    $(`#${this.componentId} .dataTables_filter input`).off().keyup(e => {
      var val = $(e.target).val();
      if (e.keyCode == 13 || (e.keyCode == 8 && !val)) {
        this._queryNodes(val);
      }
    });

    // append 'actions' button to table and add menu listeners
    $('.dataTables_filter > label').addClass('input-group').prepend(actionsTemplate);
    $(`#${this.componentId} a[name='aUpdateNode']`).click(() => {
      this.updateNodesVersionDialog.show();
    });
    $(`#${this.componentId} a[name='aAddTags']`).click(() => {
      this.addNodesTagsDialog.show();
    });
    $(`#${this.componentId} a[name='aRemoveNode']`).click(() => {
      this.confirmDialog.show({
        ok: ()=> { nodesStore.deleteNodes(nodesStore.state.checkedNodeIds) },
        text: `Delete nodes: ${nodesStore.checkedNodes.map(n => ` "${n.name}" `)} ?`
      });
    });

    // check / uncheck all handler
    $(`#${this.componentId} input:checkbox[name='checkAllNodes']`).on('change', elem => {
      var checkedNodes = [];
      if (elem.target.checked) {
        $(`#${this.componentId} input:checkbox[name='checkNode']`).iCheck('check').each((i, elem) =>  {
          checkedNodes.push($(elem).data('id'));
        });
        nodesStore.setCheckedNodeIds(checkedNodes);
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
    $(`#${this.componentId} a[name='aAddTags']`).off();
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
      $(`#${this.componentId} .dataTables_filter input`).val(query);
      this._queryNodes(query);
    } else {
      this._focusTableSearch();
    }
  }

  initialView() {
    return super.initialView() + 
      this.confirmDialog.initialView() + 
      this.updateNodesVersionDialog.initialView() + 
      this.addNodesTagsDialog.initialView();
  }

  view() {
    return this.viewWithContent(tableTemplate({}));
  }

  show() {
    super.show();
    this._focusTableSearch();
  }

  _nodeById(id) {
    var node = nodesStore.nodes[id];
    if (node) {
      return node;
    } else {
      window.console.log(`sorry cannot find node id = ${id}`);
      return null;
    }
  }

  _queryNodes(val) {
    var tags = val.match(/([^\s]+:[^\s]+)/g) || [];          // get tags
    var search = val.replace(/([^\s]+:[^\s]+)/g, '').trim(); // remove tag:val words
    tags = tags.map(t => { return t.replace(/\:\*$/g, '') });
    nodesStore.fetchNodes({ search: search, tags: tags });
  }

  _focusTableSearch() {
    $(`#${this.componentId} .dataTables_filter .input-group input`).focus();
  }

  _tableHandlers() {
    var _this = this;
    $(`#${this.componentId} a[name='btSelectItemNodes']`).click(function(event) {
      var node = _this._nodeById($(this).data('id'));
      if (node) {
        routerStore.changeRoute('/nodes#' + node.id, node.name);
      }
    });

    $(`#${this.componentId} input:checkbox[name='checkNode']`).on('change', function(event) {
      var node = _this._nodeById($(this).data('id'));
      if (node) {
        nodesStore.toggleNode(node.id);
      }
    });

    $(`#${this.componentId} button[name='btRemoveNode']`).click(function(event) {
      var node = _this._nodeById($(this).data('id'));
      if (node) {
        _this.confirmDialog.show({
          ok: ()=> { nodesStore.deleteNode(node.id) },
          text: `Remove node "${node.name}"?`
        });
      }
    });

    $(`#${this.componentId} .badge.remove`).click(function(event) {
      var match = $(this).parent().text().match(/([^\s]+):([^\s]+)/);
      var metadataJson = {};
      metadataJson[match[1]] = match[2];
      var node = _this._nodeById($(this).data('id'));
      if (node) {
        _this.confirmDialog.show({
          ok: ()=> { nodesStore.removeNodeMetadata(node.id, metadataJson) },
          text: `Remove tag "${match[1]}:${match[2]}" for "${node.name}"?`
        });
      }
    });

    $(`#${this.componentId} table [data-toggle="popover"]`).popover();
  }

  _tableHandlersOff() {
    $(`#${this.componentId} table [data-toggle="popover"]`).off();
    $(`#${this.componentId} a[name='btSelectItemNodes']`).off();
    $(`#${this.componentId} input:checkbox[name='checkNode']`).off();
    $(`#${this.componentId} button[name='btRemoveNode']`).off();
    $(`#${this.componentId} .badge.remove`).off();
  }
  
  _fetchTableData(data, cb, settings) {
    var nodesMetaData = {
      start: data.start,
      length: data.length,
      order: data.columns[data.order[0].column].name,
      orderDir: data.order[0].dir,
      search: data.search.value || routerStore.nodeId()
    };
    nodesStore.fetchNodes(nodesMetaData);
    this.tabelDraw = cb;
  }

  // this function receives nodes and returns render-able data for the DataTable
  _renderServerNodes(nodes) {
    var node;
    var data = Object.keys(nodes).map(nodeId => {
      node = nodes[nodeId];
      return {
        checkbox: checkboxTemplate({id: nodeId, checked: (nodesStore.state.checkedNodeIds.indexOf(nodeId) != -1)}),
        warning: warningTemplate({node: node}),
        name: nodeName({node: node}) || '',
        tags: tags({node: node}) || '',
        id: nodeId,
        platform: node.info.platform || '',
        agentVersion: node.info.agentVersion || '',
        lastSeen: node.timeSinceSync || '',
        deleteButton: removeButtonTemplate({id: nodeId})
      };
    });

    return data;
  }
}