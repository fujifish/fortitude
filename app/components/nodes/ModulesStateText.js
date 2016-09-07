import Component from 'components/relax/Component';
import template from 'views/nodes/setModulesDialog/text';
import nodesStore from 'store/NodesStore';

export default class ModulesStateText extends Component{
  constructor() {
    super('ModulesStateText');
    nodesStore.on('nodeDetails.modulesState', this.render.bind(this));
    nodesStore.on('nodeDetails.modulesState.*', this.render.bind(this));
  }

  getState() {
    var val = $(`#TextArea-dialog-data`).val();
    try {
      val = JSON.parse(val);
    } catch (e) {
      val = null;
    }
    return Array.isArray(val) ? val : null;
  }

  view() {
    var data = nodesStore.state.nodeDetails.modulesState;
    return template({ data: data, hasError: data == null });
  }
}