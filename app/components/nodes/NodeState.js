import Box from 'components/Box';
import template from 'views/nodes/nodeState';
import nodesStore from 'store/NodesStore';
import ConfirmDialog from 'components/ConfirmDialog';

export default class NodeState extends Box {
  constructor(options) {
    super("NodeState-"+options.title, options);
    this.options = options;
    nodesStore.on('selectedIndex', index => {
      this.render();
    });
    this.removeNodeModuleConfirmDialog = new ConfirmDialog('removeNodeModule'+options.title);
  }


  _handlers() {
    let _this = this;
    if(this.options.editable){
      $("#btnAddModuleToState").click(()=> {
        nodesStore.openConfigureModuleDialog();
      });
      $("button[name='btnRemoveModuleFromState']").click(function(){
        let index = parseInt($(this).data('index'));
        let module = nodesStore.getSelectedNode().state.planned[index];
        _this.removeNodeModuleConfirmDialog.show({
          ok: ()=> {
            nodesStore.removeSelectedNodeModule(index);
          },
          text: `Remove module ${module.name}@${module.version}?`
        });
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

  viewMounted() {
    super.viewMounted();
    this._handlers();
  }

  beforeRender() {
    super.beforeRender();
    if(this.options.editable) {
      $("#btnAddModuleToState").off();
    }
    $(`#${this.componentId} div[name="StateOfModuleInfoBox"]`).off();
  }

  afterRender() {
    super.afterRender();
    this._handlers();
  }

  initialView() {
    return `${super.initialView()}${this.removeNodeModuleConfirmDialog.initialView()}`;
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