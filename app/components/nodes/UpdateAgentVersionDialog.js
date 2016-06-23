import Dialog from 'components/Dialog';
import body from 'views/nodes/updateAgentVersionDialog/body';
import modulesStore from 'store/ModulesStore';
import nodesStore from 'store/NodesStore';

export default class UpdateAgentVersionDialog extends Dialog {
  constructor() {
    super('UpdateAgentVersionDialog');
  }

  viewMounted() {
    super.viewMounted();
  }

  show(existingVersion) {
    super.show();
    let selectVersion = $(`#${this.dialogId} form select`);
    selectVersion.empty();
    modulesStore.state.modules.forEach((m) => {
      if (m.name == 'outpost') {
        m.versions.sort(function(a,b){return a.version < b.version;}).forEach(function(v) {
          selectVersion.append($('<option>', {text: v.version, data: v}));
        });
        selectVersion.find('option').filter(() => {
          return $(this).text() == existingVersion;
        }).attr('selected', true);
      }
    });
  }


  ok() {
    this.hide();
    let selectVersion = $(`#${this.dialogId} form select`);
    nodesStore.updateNodeAgentVersion(selectVersion.val());
  }

  cancel() {
    this.hide();
  }

  view() {
    return this.viewWithContent({title: "Update Agent Version", body: body({dialogId: this.dialogId}), okLabel: "Update"});
  }
}