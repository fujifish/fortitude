import Dialog from 'components/Dialog';
import nodesStore from 'store/NodesStore';
import modulesStore from 'store/ModulesStore'
import body from 'views/nodes/configureModuleDialog/body'

export default class ConfigureModuleDialog extends Dialog {
  constructor() {
    super('ConfigureModuleDialog');
    nodesStore.on('nodeDetails.configureModuleDialog', diff => {
      diff.rhs ? this.show() : this.hide();
    });
  }


  _handlers(){
    let selectName = $('#addNodeModuleName');
    selectName.change(function() {
      selectVersion.empty();
      // populate available versions
      var module = selectName.find(':selected').data();

      module.versions.sort(function(a,b){return a.version < b.version;}).forEach(function(v) {
        selectVersion.append($('<option>', {text: v.version, data: v}));
      });
      selectVersion.trigger('change');
    });

    // populate configuration of the selected version
    let selectVersion = $('#addNodeModuleVersion');
    selectVersion.change(function() {
      let version = selectVersion.find(':selected').data();
      let schema = version.schema && version.schema.configure;
      let form = (version.form && version.form.configure) || ['*'];
      if (!schema) {
        schema = {config: {type: "string", title: "Raw JSON Configuration"}, default: "{}"};
        form = [{key: 'config', type: 'textarea'}];
      }

      var configElementCont = $('#addNodeModuleConfiguration');
      configElementCont.empty();
      configElementCont.jsonForm({
        schema: schema,
        form: form
      });
    });
    selectName.trigger('change');
  }

  _clearHandlers(){
    $('#addNodeModuleName').off();
    $('#addNodeModuleVersion').off();

  }

  show(){
    super.show();
    let selectName = $('#addNodeModuleName');
    selectName.empty();
    // populate available modules (filter out 'outpost' modules)
    modulesStore.state.modules.forEach(function(m) {
      if (m.name !== 'outpost') {
        selectName.append($('<option>', {text: m.name, data: m}));
      }
    });

    selectName.trigger('change');
    this._handlers();
  }

  viewMounted() {
    super.viewMounted();
  }

  _getModuleConfig(){
    let selectVersion = $('#addNodeModuleVersion');
    var module = JSON.parse(JSON.stringify(selectVersion.find(':selected').data()));
    var schema = module.schema;
    var config = $('#addNodeModuleConfiguration').jsonFormValue();
    if (!schema) {
      config = config.config;
    }
    if (typeof config === 'string') {
      config = config.trim();
      if (config.length === 0) {
        config = '{}';
      }
      config = JSON.parse(config);
    }

    module.state = {};
    module.state.configure = {data: config, time: new Date().toISOString()};
    module.state.start = {
      data: {started: $('#addNodeModuleStarted').prop('checked')},
      time: new Date().toISOString()
    };
    return module;
  }

  ok() {
//    modulesStore.addModule($(`#${this.dialogId}-data`).val());
//    $(`#${this.dialogId}-data`).val("");
    nodesStore.closeConfigureModuleDialog();
    nodesStore.addSelectedNodeModule(this._getModuleConfig());
    this._clearHandlers();
  }

  cancel() {
//    $(`#${this.dialogId}-data`).val("");
    nodesStore.closeConfigureModuleDialog();
    this._clearHandlers();
  }

  view() {
    return this.viewWithContent({title: "Configure Module", body: body({dialogId: this.dialogId})});
  }
}