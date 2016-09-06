import Box from 'components/Box'
import template from 'views/modules/moduleDetails';
import modulesStore from 'store/ModulesStore';
import ConfirmDialog from 'components/ConfirmDialog';
import ClipBoard from 'components/ClipBoard';

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
    this.clipboard = new ClipBoard('module-details-cpy');
  }

  beforeRender() {
    super.beforeRender();
    $("#moduleRemButton").off();
    this.clipboard.destroy();
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
    this.clipboard.init(() => {
      var moduleVersion = modulesStore.getSelectedVersion();
      return moduleVersion && JSON.stringify(moduleVersion);
    });
  }

  initialView() {
    return `${super.initialView()}${this.deleteModuleConfirmDialog.initialView()}`;
  }

  view() {
    return this.viewWithContent(template({ content: modulesStore.getSelectedVersion(), clipboard: this.clipboard.view() }));
  }
}