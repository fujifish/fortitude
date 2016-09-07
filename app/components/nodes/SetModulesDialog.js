import Dialog from 'components/Dialog';
import ModulesStateText from 'components/nodes/ModulesStateText';
import ClipBoard from 'components/ClipBoard';
import Downloader from 'components/Downloader';
import ConfirmDialog from 'components/ConfirmDialog';
import nodesStore from 'store/NodesStore';
import body from 'views/nodes/setModulesDialog/body'

export default class SetModulesDialog extends Dialog {
  constructor() {
    super('SetModulesDialog');
    nodesStore.on('nodeDetails.setModulesStateDialog', diff => {
      diff.rhs ? this.show() : this.hide();
    });
    nodesStore.on('selectedNodeId', diff => {
      diff.rhs && this.downloader.setFileName(`${diff.rhs}-modules.json`);
    });

    this.modulesStateText = new ModulesStateText();
    this.confirmDialog = new ConfirmDialog('ModuleStateConfirm');
    this.clipboard = new ClipBoard('PlannedStateCpy', 'Copy json', '#TextArea-dialog-data');
    this.downloader = new Downloader('PlannedStateDownload', 'Download json', () => {
      var state = this.modulesStateText.getState();
      if (state == null) {
        alert('Note: current state is an invalid json array');
      }
      return state || [];
    });
  }

  _handlers() {
    $('#modulesStateFile').on('change', function (e){
      var reader = new FileReader();
      reader.onload = function(e) {
        try {
          var state = JSON.parse(e.target.result);
          nodesStore.setModulesState(state);
        } catch (e) {
          nodesStore.setModulesState(null);
        }
      };
      reader.readAsText(e.target.files[0]);
    });

    this.clipboard.init();
    this.downloader.init();
  }

  _clearHandlers() {
    $('#modulesStateFile').off();
    this.clipboard.destroy();
    this.downloader.destroy();
  }

  initialView() {
    return `${super.initialView()}${this.confirmDialog.initialView()}`
  }

  show() {
    super.show();
    this._handlers();
    var node = nodesStore.selectedNode;
    nodesStore.setModulesState(node && node.state.planned || []);
    $('#modulesStateFile').val('');
  }

  ok() {
    var state = this.modulesStateText.getState();
    nodesStore.setModulesState(state);
    if (state == null) {
      return;
    }

    var node = nodesStore.selectedNode;
    this._clearHandlers();
    nodesStore.closeSetModulesDialog();

    this.confirmDialog.show({
      ok: ()=> {
        nodesStore.updateNodePlannedState(node.id, state);
      },
      cancel: () => {
        nodesStore.openSetModulesDialog();
        nodesStore.setModulesState(state);
      },
      text: `Are you sure you want to ${state.length == 0 ? 'delete' : 'override'} the planned state for "${node.name}"?`,
      subtext: state.length == 0 ? 'The planned state would be cleared' : 'The current state would be overridden'
    });
  }

  cancel() {
    nodesStore.setModulesState([]);
    nodesStore.closeSetModulesDialog();
    this._clearHandlers();
  }

  view() {
    return this.viewWithContent({
      title: "Set Modules State",
      body: body({
        modulesStateText: this.modulesStateText.initialView(),
        clipboard: this.clipboard.view(),
        download: this.downloader.view()
      })
    });
  }
}