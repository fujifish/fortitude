import Box from 'components/Box'
import template from 'views/modules/moduleDetails';
import modulesStore from 'store/ModulesStore';
import ConfirmDialog from 'components/ConfirmDialog';

export default class ModuleDetails extends Box {
  constructor() {
    super('ModuleDetails', {style: 'primary'});
    modulesStore.on('selectedVersion', diff => {
      this.render();
    });
    modulesStore.on('selectedModule', diff => {
      this.render();
    });
    this.deleteModuleConfirmDialog = new ConfirmDialog('deleteModule');
  }

  beforeRender() {
    super.beforeRender();
    $("#moduleRemButton").off();
  }

  afterRender() {
    super.afterRender();
    $("#moduleRemButton").click(() => {
      var module = modulesStore.getSelectedVersion();
      this.deleteModuleConfirmDialog.show({
        ok: ()=> {
          modulesStore.deleteModule(module.name, module.version);
        },
        text: `Remove module ${module.name}@${module.version}?`
      });
    });
  }

  initialView() {
    return `${super.initialView()}${this.deleteModuleConfirmDialog.initialView()}`;
  }

  view() {
    return this.viewWithContent(template({ content: modulesStore.getSelectedVersion() }));
  }
}