import Box from 'components/Box';
import template from 'views/nodes/nodeInfo';
import Progress from 'components/nodes/Progress';
import nodesStore from 'store/NodesStore';
import routerStore from 'store/relax/RouterStore';

export default class NodeInfo extends Box {
  constructor() {
    super("NodeInfo");

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

  view() {
    let node = nodesStore.selectedNode || {info: {}};

    var usedAgent = node.info.diskspace && Math.floor(node.info.diskspace.installed.used/1024), totalAgent = node.info.diskspace && Math.floor(node.info.diskspace.installed.total/1024);
    var agentDiskSpace = new Progress('Agent DiskSpace', usedAgent, totalAgent);
    var usedModule = node.info.diskspace && Math.floor(node.info.diskspace.root.used/1024), totalModule = node.info.diskspace && Math.floor(node.info.diskspace.root.total/1024);
    var moduleDiskSpace = new Progress('Module DiskSpace', usedModule, totalModule);
    var totalMem = Math.floor(node.info.totalmem/1024/1024), freeMem = Math.floor(node.info.freemem/1024/1024);
    var memory = new Progress('Memory', totalMem - freeMem, totalMem);

    var agentPopOverTitle = node.info.diskspace && node.info.diskspace.installed.path;
    var mosulePopOverTitle = node.info.diskspace && node.info.diskspace.root.path;
    var data = {
      node: node,
      memory: memory.initialView(),
      agentDiskSpace: agentDiskSpace.setPopoverTitle(agentPopOverTitle).initialView(),
      moduleDiskSpace: moduleDiskSpace.setPopoverTitle(mosulePopOverTitle).initialView()
    };
    return this.viewWithContent(template(data));
  }

}