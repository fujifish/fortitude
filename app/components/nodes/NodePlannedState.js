import NodeState from 'components/nodes/NodeState';
import nodesStore from 'store/NodesStore';
import routerStore from 'store/relax/RouterStore';

export default class NodePlannedState extends NodeState {
  constructor(configureDialog) {
    super(configureDialog, {title: "Planned", editable: true});
    nodesStore.on('nodeDetails.plannedStateLoading', loading => {
      this.renderLoading(loading.rhs);
    });
    
    nodesStore.on('nodesList.nodes.*.planned*', () => {
      this.render();
    });

    routerStore.on('path', diff => {
      if (diff.lhs && diff.lhs.indexOf('/nodes#') != -1) {
        nodesStore.resetApplyStatePending();
      }
    });
  }
}