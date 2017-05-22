import Dialog from 'components/Dialog';
import bodyTemplate from 'views/nodes/addNodesTagsDialog/body';
import tag from 'views/nodes/addNodesTagsDialog/tag';
import nodesStore from 'store/NodesStore';

export default class AddNodesTagsDialog extends Dialog {
  constructor() {
    super('AddNodesTagsDialog');
  }

  viewMounted() {
    super.viewMounted();
    var _this = this;
    $(`#${this.dialogId} .btn.add`).click(function() {
      if ($(`#${_this.dialogId} .row`).length >= 10) return;
      $(this).parent().parent().parent().append(tag({ removable: true }));
      $(`#${_this.dialogId} .btn.rmv`).off().click(function () {
        $(this).parent().parent().remove();
      });
    });
  }

  show() {
    if (!nodesStore.checkedNodes.length) return;
    super.show();
    $(`#${this.dialogId} .modal-title`).text(this._title());
    // init tag rows
    $(`#${this.dialogId} .row.removable`).remove();
    $(`#${this.dialogId} .row input`).val('');
  }

  ok() {
    var tags = {}, invalid = false;
    $(`#${this.dialogId} form .row`).each(function() {
      var key = $(this).find('.key').val();
      var value = $(this).find('.val').val();
      if (key && value) {
        tags[key.trim()] = value.trim();
      } else  {
        invalid = true;
        var errTag = $(this).addClass('has-error');
        setTimeout(() => { errTag.removeClass('has-error') }, 1000);
        return;
      }
    });

    if (!invalid)  {
      this.hide();
      nodesStore.updateNodesAgentMetadata(tags);
    }
  }

  cancel() {
    this.hide();
  }

  view() {
    var body = bodyTemplate({dialogId: this.dialogId, tag: tag({ removable: false }) });
    return this.viewWithContent({ title: this._title(), body: body, okLabel: "Update"});
  }

  _title() {
    var nodesCount = nodesStore.checkedNodes.length;
    return 'Update Tags for ' + nodesCount + ' agent' + (nodesCount > 1 ? 's' : '');
  }
}