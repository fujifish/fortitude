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

    nodesStore.on('nodeUpdate', () => {
      this.render();
    });

    nodesStore.on('nodes.*.timeSinceSync', (diff) => {
      var nodeIndex = diff.path[1];
      var nodeId = nodesStore.state.nodes[nodeIndex] && nodesStore.state.nodes[nodeIndex].id;
      if (nodeId) {
        $(`#${this.componentId} dl[data-id='${nodeId}']`).find('.time-since').html(diff.rhs);
      }
    });
  }


  view() {
    let node = nodesStore.getSelectedNode() || {info: {}};
    var installedDiskSpace = new Progress('Installed DiskSpace', node.info.diskspace && node.info.diskspace.installed.used, node.info.diskspace && node.info.diskspace.installed.total);
    var rootDiskSpace = new Progress('Root DiskSpace', node.info.diskspace && node.info.diskspace.root.used, node.info.diskspace && node.info.diskspace.root.total);
    var totalMem = Math.floor(node.info.totalmem/1024/1024), freeMem = Math.floor(node.info.freemem/1024/1024);
    var memory = new Progress('Memory', totalMem - freeMem, totalMem);
    var data = {
      node: node,
      memory: memory.setType('MB').initialView(),
      installedDiskSpace: installedDiskSpace.initialView(),
      rootDiskSpace: rootDiskSpace.initialView()
    };
    return this.viewWithContent(template(data));
  }

}