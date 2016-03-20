import template from "views/modules/modulesList";
import modulesStore from 'store/ModulesStore';
import Box from 'components/Box';
import ConfirmDialog from 'components/ConfirmDialog';

export default class ModulesList extends Box {
  constructor(deleteModuleConfirmDialog){
    super('ModulesList', modulesStore);
    modulesStore.on('modules', modules => {
      this.render();
    });
    modulesStore.on('modulesLoading', loading => {
      this.renderLoading(loading);
    });
    this.deleteModuleConfirmDialog = new ConfirmDialog('deleteModule');
  }

  _handlers(){
    $("#moduleListAddButton").click(()=>{
      modulesStore.openAddModuleDialog();
    });
    $(`#${this.componentId} input:radio[name='btSelectItemModules']`).on('change', ()=> {
      let radioButtons = $(`#${this.componentId} input:radio[name='btSelectItemModules']`);
      var selectedIndex = radioButtons.index(radioButtons.filter(':checked'));
      modulesStore.setSelectedIndex(selectedIndex);
    });
    let _this = this;
    $(`#${this.componentId} a[name='RemoveModule']`).click(function() {
      let index = parseInt($(this).data('index'));
      let module = modulesStore.state.modules[index];
      _this.deleteModuleConfirmDialog.show({ok: ()=>{
        modulesStore.deleteModule(module.name, module.version);
      }, text: 'Remove module ' + module.name + '@' + module.version + '?'});
    });
  }

  viewMounted(){
    super.viewMounted();
    this._handlers();
    modulesStore.fetchModules();
  }

  beforeRender(){
    super.beforeRender();
    $("#moduleListAddButton").off();
    $(`#${this.componentId} input:radio[name='btSelectItemModules']`).off();
  }

  afterRender(){
    super.afterRender();
    this._handlers();
  }

  initialView(){
    return `${super.initialView()}${this.deleteModuleConfirmDialog.initialView()}`;
  }

  view() {
    return this.viewWithContent(template({modules: modulesStore.state.modules, selectedIndex: modulesStore.state.selectedIndex}));
  }
}
