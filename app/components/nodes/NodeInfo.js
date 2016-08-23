import Box from 'components/Box';
import template from 'views/nodes/nodeInfo';
import Progress from 'components/nodes/Progress';
import nodesStore from 'store/NodesStore';
import routerStore from 'store/relax/RouterStore';

export default class NodeInfo extends Box {
  constructor() {
    super("NodeInfo");
    this.memoryProgress = new Progress('Memory');
    this.moduleDiskSpaceProgress = new Progress('Module DiskSpace');
    this.agentDiskSpaceProgress = new Progress('Agent DiskSpace');

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