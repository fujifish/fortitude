import NodeState from 'components/nodes/NodeState';
import nodesStore from 'store/NodesStore';

export default class NodePlannedState extends NodeState {
  constructor(configureDialog) {
    super(configureDialog, {title: "Planned", editable: true});
    nodesStore.on('nodeDetails.plannedStateLoading', loading => {
      this.renderLoading(loading.rhs);
    });
    nodesStore.on("nodes.*.planned*", planned => {
      this.render();
    });
  }
}