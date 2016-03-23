import Box from 'components/Box';
import template from 'views/nodes/nodesList';
import nodesStore from 'store/NodesStore';

export default class NodesList extends Box {
  constructor(){
    super("NodesList", {style: 'primary'});
    nodesStore.on('nodes', nodes => {
      this.render();
    });
    nodesStore.on('nodesLoading', loading => {
      this.renderLoading(loading);
    });
  }


  _handlers(){
    $(`#${this.componentId} input:radio[name='btSelectItemNodes']`).on('change', ()=> {
      let radioButtons = $(`#${this.componentId} input:radio[name='btSelectItemNodes']`);
      var selectedIndex = radioButtons.index(radioButtons.filter(':checked'));
      nodesStore.setSelectedIndex(selectedIndex);
    });
/*    let _this = this;
    $(`#${this.componentId} a[name='RemoveModule']`).click(function() {
      let index = parseInt($(this).data('index'));
      let module = modulesStore.state.modules[index];
      _this.deleteModuleConfirmDialog.show({ok: ()=>{
        modulesStore.deleteModule(module.name, module.version);
      }, text: 'Remove module ' + module.name + '@' + module.version + '?'});
    });*/
  }

  beforeRender(){
    super.beforeRender();
    $(`#${this.componentId} input:radio[name='btSelectItemNodes']`).off();
  }

  afterRender(){
    super.afterRender();
    this._handlers();
  }

  viewMounted(){
    super.viewMounted();
    this._handlers();
    nodesStore.fetchNodes();
  }


  view(){
    return this.viewWithContent(template({nodes: nodesStore.state.nodes, selectedIndex: nodesStore.state.selectedIndex}));
  }
}