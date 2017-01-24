import Dialog from 'components/Dialog';
import body from 'views/nodes/commandDetailsDialog/body'

export default class CommandDetailsDialog extends Dialog {
  constructor() {
    super('CommandDetailsDialog');
  }

  viewMounted() {
    super.viewMounted();
  }

  unescapeHtml(input) {
    return input.replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&nbsp;/g, ' ')
        .replace(/&gt;/g, '>');
  }

  show(command) {
    super.show();
    $(`#${this.dialogId} .modal-title`).text(command.status.toUpperCase());
    let subtitle = '';
    if (command.details) {
      subtitle = `Message: ${command.details}`;
    }
    $(`#${this.dialogId} .modal-subTitle`).text(subtitle);
    $(`#${this.dialogId} .modal-header-content`).text(`Initiator: ${command.user || 'unknown'}`);
    $(`#${this.dialogId} pre`).text(this.unescapeHtml(command.log));
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