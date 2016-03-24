import Dialog from 'components/Dialog';
import modulesStore from 'store/ModulesStore';
import body from 'views/modules/addModuleDialog/body'

export default class AddModuleDialog extends Dialog {
  constructor() {
    super('AddModuleDialog');
    modulesStore.on('addingModule', addingModule => {
      addingModule ? this.show() : this.hide();
    });
  }

  viewMounted() {
    super.viewMounted();
  }

  ok() {
    modulesStore.addModule($(`#${this.dialogId}-data`).val());
    $(`#${this.dialogId}-data`).val("");
    modulesStore.closeAddModuleDialog();
  }

  cancel() {
    $(`#${this.dialogId}-data`).val("");
    modulesStore.closeAddModuleDialog();
  }

  view() {
    return this.viewWithContent({title: "Add Module", body: body({dialogId: this.dialogId})});
  }
}