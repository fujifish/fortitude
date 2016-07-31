import Dialog from 'components/Dialog';
import nodesStore from 'store/NodesStore';
import modulesStore from 'store/ModulesStore'
import body from 'views/nodes/configureModuleDialog/body'
import common from '../../common';

export default class ConfigureModuleDialog extends Dialog {
  constructor() {
    super('ConfigureModuleDialog');
    nodesStore.on('nodeDetails.configureModuleDialog', diff => {
      diff.rhs ? this.show() : this.hide();
    });
  }

  setConfiguredModule(context){
    this.context = context;
    this.readOnly = context && !!context.readOnly;
  }


  _handlers(){
    let _this = this;
    let selectName = $('#nodeModuleName');
    selectName.change(()=> {
      selectVersion.empty();
      // populate available versions
      var module = selectName.find(':selected').data();

      module.versions.sort((a,b) => common.versionCompare(a.version, b.version)).forEach(function(v) {
        selectVersion.append($('<option>', {text: v.version, data: v}));
      });
      if(this.context) {
        selectVersion.find('option').filter(function() {
          return $(this).text() == _this.context.module.version;
        }).attr('selected', true);
      }

      selectVersion.trigger('change');

      if(this.readOnly) selectVersion.attr('disabled', 'disabled');
      else selectVersion.removeAttr("disabled");

    });

    // populate configuration of the selected version
    let selectVersion = $('#nodeModuleVersion');
    selectVersion.change(()=> {
      let version = selectVersion.find(':selected').data();
      let schema = version.schema && version.schema.configure;
      let form = (version.form && version.form.configure) || ['*'];
      let module = this.context && this.context.module;
      var values = module && module.state && module.state.configure && module.state.configure.data;
      if (!schema) {
        schema = {config: {type: "string", title: "Raw JSON Configuration"}, default: "{}"};
        form = [{key: 'config', type: 'textarea'}];
        values = {config: values && JSON.stringify(values, null, 2)};
      }

      var configElementCont = $('#nodeModuleConfiguration');
      configElementCont.empty();
      configElementCont.off();
      configElementCont.jsonForm({
        schema: schema,
        form: form ,
        value: values
      });
      if(this.readOnly) $('#nodeModuleConfiguration').find('input, textarea, button, select').attr('disabled','disabled');
      else $('#nodeModuleConfiguration').find('input, textarea, button, select').removeAttr("disabled");
    });
  }

  _clearHandlers(){
    $('#nodeModuleName').off();
    $('#nodeModuleVersion').off();
    this.readOnly = false;
  }

  show(){
    super.show();
    let _this = this;
    let selectName = $('#nodeModuleName');
    selectName.empty();
    // populate available modules (filter out 'outpost' modules)
    modulesStore.state.modules.forEach(function(m) {
      if (m.name !== 'outpost') {
        selectName.append($('<option>', {text: m.name, data: m}));
      }
    });

    this._handlers();
    if(this.context) {
      selectName.find('option').filter(function() {
        return $(this).text() == _this.context.module.name;
      }).attr('selected', true);
      selectName.prop('disabled', true);
    }else{
      selectName.removeAttr('disabled');
    }

    let module = this.context && this.context.module;
    if (module && module.state && module.state.start && module.state.start.data && module.state.start.data.started) {
      $('#nodeModuleStarted').iCheck('check');
    } else {
      $('#nodeModuleStarted').iCheck('uncheck');
    }

    if(this.readOnly) $('#nodeModuleStarted').prop('disabled', true);
    else $('#nodeModuleStarted').removeAttr("disabled");

    selectName.trigger('change');
  }

  viewMounted() {
    super.viewMounted();
  }

  _getModuleConfig(){
    let selectVersion = $('#nodeModuleVersion');
    var module = JSON.parse(JSON.stringify(selectVersion.find(':selected').data()));
    var schema = module.schema;
    var config = $('#nodeModuleConfiguration').jsonFormValue();
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
      data: {started: $('#nodeModuleStarted').prop('checked')},
      time: new Date().toISOString()
    };
    return module;
  }

  ok() {
//    modulesStore.addModule($(`#${this.dialogId}-data`).val());
//    $(`#${this.dialogId}-data`).val("");
    nodesStore.closeConfigureModuleDialog();
    if(this.context){
      nodesStore.updateSelectedNodeModule(this.context.index, this._getModuleConfig());
    }else{
      nodesStore.addSelectedNodeModule(this._getModuleConfig());
    }
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