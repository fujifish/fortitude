import Component from 'components/relax/Component';
import template from 'views/dialog'

export default class Dialog extends Component {
  constructor(name) {
    super(name);
    this.dialogId = `${this.componentId}-dialog`;
  }

  _viewHandlers() {
    $(`#${this.dialogId}-cancel`).click(()=> {
      this.cancelClicked = true;
      this.cancel();
    });

    $(`#${this.dialogId}-ok`).click(()=> {
      this.okClicked = true;
      this.ok();
    });

    // register on background clicks
    $(`#${this.dialogId}`).on('hidden.bs.modal', () => {
      // ok / cancel clicks (that close the dialog) send a click to the hidden.bs.model, ignore those.
      if (this.okClicked && this.hidden) {
        this.okClicked = false;
      } else if (this.cancelClicked && this.hidden) {
        this.cancelClicked = false;
      } else {
        this.okClicked = false;
        this.cancelClicked = false;
        this.cancel();
      }
    });
  }

  enableOk(enable) {
    if (enable) {
      $(`#${this.dialogId}-ok`).removeAttr('disabled');
    } else {
      $(`#${this.dialogId}-ok`).attr('disabled','disabled');
    }
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
    content.subTitle = content.subTitle || '';
    content.okLabel = content.okLabel || "OK";
    content.dialogId = this.dialogId;
    content.header = content.header || "";
    content.body = content.body || "";
    content.style = content.style || "";
    return template(content);
  }

  show() {
    $(`#${this.dialogId}`).modal('show');
    this.hidden = false;
  }

  hide() {
    $(`#${this.dialogId}`).modal('hide');
    this.hidden = true;
  }

  cancel() {

  }

  ok() {

  }

}