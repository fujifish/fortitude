import Dialog from './dialog';
import modulesStore from '../store/modulesStore';
import body from '../views/addModuleDialog/body.ejs'

export default class AddModuleDialog extends Dialog {
  constructor() {
    super('addModuleDialog');
    modulesStore.on('addingModule', addingModule =>{
      addingModule ? this.show() : this.hide();
    });
  }

  viewMounted(){
    super.viewMounted();
  }

  ok(){
    modulesStore.addModule($(`#${this.dialogId}-data`).val());
    $(`#${this.dialogId}-data`).val("");
    modulesStore.closeAddModuleDialog();
  }

  cancel(){
    $(`#${this.dialogId}-data`).val("");
    modulesStore.closeAddModuleDialog();
  }

  view(){
    return this.viewWithContent({title: "Add Module", body: body({dialogId: this.dialogId})});
  }
}