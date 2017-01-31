import Box from 'components/Box';
import template from 'views/nodes/nodeInfo';
import Progress from 'components/nodes/Progress';
import nodesStore from 'store/NodesStore';
import routerStore from 'store/relax/RouterStore';
import UpdateAgentVersionDialog from 'components/nodes/UpdateAgentVersionDialog';
import ConfirmDialog from 'components/ConfirmDialog';

export default class NodeInfo extends Box {
  constructor() {
    super("NodeInfo");
    this.updateAgentVersionDialog = new UpdateAgentVersionDialog();
    this.confirmDialog = new ConfirmDialog('NodeDetailsConfirm');
    this.memoryProgress = new Progress('Machine Memory');
    this.moduleDiskSpaceProgress = new Progress('Module Diskspace');
    this.agentDiskSpaceProgress = new Progress('Agent Diskspace');

    routerStore.on('path', () => {
      if (routerStore.isNodePage()) {
        this.render();
      }
    });

    nodesStore.on('nodesList.nodes.*', () => {
      this.render();
    });

    nodesStore.on('nodesList.nodes.*.timeSinceSync', (diff) => {
      var nodeIndex = diff.path[1];
      var nodeId = nodesStore.nodes[nodeIndex] && nodesStore.nodes[nodeIndex].id;
      if (nodeId) {
        $(`#${this.componentId} dl[data-id='${nodeId}']`).find('.time-since').html(diff.rhs);
      }
    });
  }

  _handlers() {
    $(`#${this.componentId} button[name='btUpdateNode']`).click(() => {
      let node = nodesStore.selectedNode;
      this.updateAgentVersionDialog.show(node.info.agentVersion);
    });
    $(`#${this.componentId} button[name='btResetNode']`).click(() => {
      let node = nodesStore.selectedNode;
      this.confirmDialog.show({
        ok: ()=> {
          nodesStore.resetNodeContents();
        },
        text: `Are you sure you want to reset node "${node.name}"?`,
        subtext: 'This action will remove all currently installed modules and clear the agent cache.'
      });
    });
  }

  beforeRender() {
    super.beforeRender();
    $(`#${this.componentId} button[name='btUpdateNode']`).off();
    $(`#${this.componentId} button[name='btResetNode']`).off();
  }

  afterRender() {
    super.afterRender();
    this._handlers();
  }

  getMemoryProgress(node) {
    var totalMem = Math.floor(node.info.totalmem/1024/1024), freeMem = Math.floor(node.info.freemem/1024/1024);
    this.memoryProgress.setProgress(totalMem - freeMem, totalMem);
    return this.memoryProgress;
  }

  getModuleDiskSpaceProgress(node) {
    var usedModule = node.info.diskspace && Math.floor(node.info.diskspace.root.used/1024), totalModule = node.info.diskspace && Math.floor(node.info.diskspace.root.total/1024);
    this.moduleDiskSpaceProgress.setProgress(usedModule, totalModule);
    this.moduleDiskSpaceProgress.setPopoverTitle(node.info.diskspace && node.info.diskspace.root.path);
    return this.moduleDiskSpaceProgress;
  }

  getAgentDiskSpaceProgress(node) {
    var usedAgent = node.info.diskspace && Math.floor(node.info.diskspace.installed.used/1024), totalAgent = node.info.diskspace && Math.floor(node.info.diskspace.installed.total/1024);
    this.agentDiskSpaceProgress.setProgress(usedAgent, totalAgent);

    this.agentDiskSpaceProgress.setPopoverTitle(node.info.diskspace && node.info.diskspace.installed.path);
    return this.agentDiskSpaceProgress;
  }

  initialView() {
    return `${super.initialView()}` +
        `${this.updateAgentVersionDialog.initialView()}` +
        `${this.confirmDialog.initialView()}`;
  }

  view() {
    var node = nodesStore.selectedNode || {info: {}};
    var data = {
      node: node,
      memory: this.getMemoryProgress(node).initialView(),
      agentDiskSpace: this.getAgentDiskSpaceProgress(node).initialView(),
      moduleDiskSpace: this.getModuleDiskSpaceProgress(node).initialView(),
    };
    return this.viewWithContent(template(data));
  }

}