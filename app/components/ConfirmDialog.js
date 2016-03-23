import Dialog from 'components/Dialog';
import body from 'views/confirmDialog/body';

export default class ConfirmDialog extends Dialog {
  constructor(name) {
    super(`${name}ConfirmDialog`);
    this.options = {};
  }

  show(options){
    this.options = options || {};
    this.render();
    super.show();
  }

  ok(){
    this.hide();
    this.options.ok && this.options.ok();
  }

  cancel(){
    this.hide();
  }

  view(){
    return this.viewWithContent({title: "Confirm Action", body: body({text: this.options.text || "", subtext: this.options.subtext || ""})});
  }

}