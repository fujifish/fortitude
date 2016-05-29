import Dialog from 'components/Dialog';
import body from 'views/nodes/updateAgentVersionDialog/body';
import modulesStore from 'store/ModulesStore';
import nodesStore from 'store/NodesStore';

export default class UpdateNodesVersionDialog extends Dialog {
  constructor() {
    super('UpdateNodesVersionDialog');
  }

  viewMounted() {
    super.viewMounted();
  }

  show() {
    if (!nodesStore.getCheckedNodes().length) return;

    super.show();
    let selectVersion = $(`#${this.dialogId} form select`);
    selectVersion.empty();
    modulesStore.state.modules.forEach(function(m) {
      if (m.name == 'outpost') {
        m.versions.sort(function(a,b){return a.version < b.version;}).forEach(function(v) {
          selectVersion.append($('<option>', {text: v.version, data: v}));
        });
      }
    });

    $(`#${this.dialogId} .modal-title`).text(this._title());
  }

  ok() {
    this.hide();
    let selectVersion = $(`#${this.dialogId} form select`);
    nodesStore.updateNodesAgentVersion(selectVersion.val());
  }

  cancel() {
    this.hide();
  }

  view() {
    return this.viewWithContent({title: this._title(), body: body({dialogId: this.dialogId}), okLabel: "Update"});
  }

  _title() {
    var nodesCount = nodesStore.getCheckedNodes().length;
    return 'Update version for ' + nodesCount + ' agent' + (nodesCount > 1 ? 's' : '');
  }
}