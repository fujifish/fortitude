import Component from 'components/relax/Component';
import template from 'views/dialog'

export default class Dialog extends Component {
  constructor(name) {
    super(name);
    this.dialogId = `${this.componentId}-dialog`;
  }

  _viewHandlers() {
    $(`#${this.dialogId}-cancel`).click(()=> {
      this.cancel();
    });
    $(`#${this.dialogId}-ok`).click(()=> {
      this.ok();
    });
    // register on background clicks
    $(`#${this.dialogId}`).on('hidden.bs.modal', () => {
      console.log(11111);
      this.cancel();
    });
  }

  viewMounted() {
    super.viewMounted();
    $(`#${this.dialogId}`).modal('hide');
    this._viewHandlers();
  }

  beforeRender() {
    $(`#${this.dialogId}-cancel`).off();
    $(`#${this.dialogId}-ok`).off();
    $(`#${this.dialogId}`).off();
  }

  afterRender() {
    super.afterRender();
    this._viewHandlers();
  }


  viewWithContent(content) {
    content.title = content.title || "New Dialog";
    content.okLabel = content.okLabel || "OK";
    content.dialogId = this.dialogId;
    content.header = content.header || "";
    content.body = content.body || "";
    content.style = content.style || "";
    return template(content);
  }

  show() {
    $(`#${this.dialogId}`).modal('show');
  }

  hide() {
    $(`#${this.dialogId}`).modal('hide');
  }

  cancel() {

  }

  ok() {

  }

}