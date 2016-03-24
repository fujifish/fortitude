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
  }

  viewMounted() {
    super.viewMounted();
    $(`#${this.dialogId}`).modal('hide');
    this._viewHandlers();
  }

  beforeRender() {
    $(`#${this.dialogId}-cancel`).off();
    $(`#${this.dialogId}-ok`).off();
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