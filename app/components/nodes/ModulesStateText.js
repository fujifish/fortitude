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

  toggleEdit() {
    var readAttr = $('#TextArea-dialog-data').prop('readonly');
    if (readAttr) {
      console.log('was read, removing')
      $('#TextArea-dialog-data').removeAttr('readonly').css('cursor','text');
    } else {
      console.log('wasnt read, adding')
      $('#TextArea-dialog-data').attr('readonly', true).css('cursor','not-allowed');
    }
  }

  view() {
    var data = nodesStore.state.nodeDetails.modulesState;
    return template({ data: data, hasError: data == null });
  }
}