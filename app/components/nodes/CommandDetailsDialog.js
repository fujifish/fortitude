import Dialog from 'components/Dialog';
import body from 'views/nodes/commandDetailsDialog/body'

export default class CommandDetailsDialog extends Dialog {
  constructor() {
    super('CommandDetailsDialog');
  }

  viewMounted() {
    super.viewMounted();
  }

  show(command) {
    super.show();
    $(`#${this.dialogId} .modal-title`).text(command.status.toUpperCase());
    $(`#${this.dialogId} .modal-subTitle`).text(command.details);
    $(`#${this.dialogId} .modal-header-content`).text(`Initiator: ${command.user || 'unknown'}`);
    $(`#${this.dialogId} pre`).text(command.log);
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