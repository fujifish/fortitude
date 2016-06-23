import Box from 'components/Box';
import template from 'views/nodes/nodeState';
import nodesStore from 'store/NodesStore';
import routerStore from 'store/relax/RouterStore';
import ConfirmDialog from 'components/ConfirmDialog';

export default class NodeState extends Box {
  constructor(configureDialog, options) {
    super("NodeState-"+options.title, options);
    this.options = options;
    
    routerStore.on('path', () => {
      if (routerStore.isNodePage()) {
        this.render();
      }
    });
    
    nodesStore.on('nodeDetails.applyStatePending', () => {
      this.render();
    });
    
    nodesStore.on('nodeUpdate', () => {
      this.render();
    });
    
    this.confirmDialog = new ConfirmDialog('removeNodeModule'+options.title);
    this.configureDialog = configureDialog;
  }

  _handlers() {
    let _this = this;
    if(this.options.editable){
      $("#btnAddModuleToState").click(()=> {
        this.configureDialog.setConfiguredModule(null);
        nodesStore.openConfigureModuleDialog();
      });
      var applyStateButton = $("#btnApplyState");
      applyStateButton.click(()=> {
        _this.confirmDialog.show({
          ok: ()=> {
            nodesStore.applyNodePlannedState();
          },
          text: 'Apply the current planned state to the agent?',
          subtext: 'These changes will be applied next time the agent performs a sync.'
        });
      });
      if (nodesStore.state.nodeDetails.applyStatePending) {
        applyStateButton.removeClass('btn-outline');
        applyStateButton.addClass('btn-warning');
      } else {
        applyStateButton.removeClass('btn-warning');
        applyStateButton.addClass('btn-outline');
      }
      $("button[name='btnEditModuleInState']").click(function(){
        let index = parseInt($(this).data('index'));
        let module = nodesStore.getSelectedNode().state.planned[index];
        _this.configureDialog.setConfiguredModule({module: module, index: index});
        nodesStore.openConfigureModuleDialog();
      });
      $("button[name='btnRemoveModuleFromState']").click(function(){
        let index = parseInt($(this).data('index'));
        let module = nodesStore.getSelectedNode().state.planned[index];
        _this.confirmDialog.show({
          ok: ()=> {
            nodesStore.removeSelectedNodeModule(index);
          },
          text: `Remove module ${module.name}@${module.version}?`
        });
      });
    }else{
      $("#btnCopyCurrentToPlannedState").click(()=> {
        _this.confirmDialog.show({
          ok: ()=> {
            nodesStore.copySelectedNodeCurrentStateToPlanned();
          },
          text: 'Set current state as planned state?',
          subtext: 'Clicking "Yes" will override the entire planned state with the current state.'
        });
      });
      $("button[name='btnViewModuleInState']").click(function(){
        let index = parseInt($(this).data('index'));
        let module = nodesStore.getSelectedNode().state.current[index];
        _this.configureDialog.setConfiguredModule({module: module, index: index, readOnly: true});
        nodesStore.openConfigureModuleDialog();
      });
    }
    $(`#${this.componentId} div[name="StateOfModuleInfoBox"]`).hover(
      function() {
        $(`#${_this.componentId} div.btn-group[data-index="${$(this).data('index')}"]`).show();
      },
      function() {
        $(`#${_this.componentId} div.btn-group`).hide();
      }
    );
    $(`#${_this.componentId} div.btn-group`).hide();
  }

  beforeRender() {
    super.beforeRender();
    if(this.options.editable) {
      $("#btnAddModuleToState").off();
      $("#btnApplyState").off();
      $("button[name='btnEditModuleInState']").off();
      $("button[name='btnRemoveModuleFromState']").off();
    }else{
      $("#btnCopyCurrentToPlannedState").off();
      $("button[name='btnViewModuleInState']").off();
    }
    $(`#${this.componentId} div[name="StateOfModuleInfoBox"]`).off();
  }

  afterRender() {
    super.afterRender();
    this._handlers();
  }

  initialView() {
    return `${super.initialView()}${this.confirmDialog.initialView()}`;
  }

  view() {
    let node = nodesStore.getSelectedNode();
    const data = {
      title: this.options.title || "",
      editable: this.options.editable,
      states: node ? node.state[this.options.title.toLowerCase()] || [] : []
    };
    return this.viewWithContent(template(data));
  }

}