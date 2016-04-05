import Dialog from 'components/Dialog';
import body from 'views/nodes/commandDetailsDialog/body'

export default class CommandDetailsDialog extends Dialog {
  constructor() {
    super('CommandDetailsDialog');
  }

  viewMounted() {
    super.viewMounted();
  }

  show(content) {
    super.show();
    $(`#${this.dialogId} pre`).text(content);
  }


  ok() {
    this.hide();
  }

  cancel() {
    this.hide();
  }

  view() {
    return this.viewWithContent({title: "Command Details", body: body({dialogId: this.dialogId}), style: "width: 80%; max-height: 80%"});
  }
}