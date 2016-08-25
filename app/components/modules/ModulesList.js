import template from "views/modules/modulesList";
import modulesStore from 'store/ModulesStore';
import Box from 'components/Box';
import Select from 'components/modules/Select'
import common from '../../common'

export default class ModulesList extends Box {
  constructor() {
    super('ModulesList', {style: 'primary'});
    modulesStore.on('modulesSyncedAt', modules => {
      this.render();
    });
    modulesStore.on('modulesLoading', loading => {
      this.renderLoading(loading.rhs);
    });
  }

  _handlers() {
    $("#moduleListAddButton").click(()=> {
      modulesStore.openAddModuleDialog();
    });
    this._populateModules();
  }

  viewMounted() {
    super.viewMounted();
    this._handlers();
    modulesStore.fetchModules();
  }

  beforeRender() {
    super.beforeRender();
    $("#moduleListAddButton").off();
    $(`#${this.componentId} .select2.name`).off();
    $(`#${this.componentId} .select2.version`).off();
  }

  afterRender() {
    super.afterRender();
    this._handlers();
  }

  view() {
    this.moduleNames = new Select('Name');
    this.moduleVersions = new Select('Version');
    return this.viewWithContent(template({
      moduleNames: this.moduleNames.initialView(),
      moduleVersions: this.moduleVersions.initialView()
    }));
  }

  _populateVersion() {
    var moduleName = $(`#${this.componentId} .select2.name`).val();
    var module = modulesStore.modules.filter(m => m.name == moduleName)[0] || (modulesStore.modules.sort())[0];
    var versions;
    if (module) {
      versions = module.versions.map(v => v.version).sort(common.versionCompare);
      this.moduleVersions.setItems(versions);
    }

    $(`#${this.componentId} .select2.version`).off();

    this.moduleVersions.render();
    this.moduleVersions.init();
    // set selected version as the first item
    modulesStore.setSelectedVersion(versions && versions[0] || null);
    $(`#${this.componentId} .select2.version`).change(function() {
      modulesStore.setSelectedVersion($(this).val());
    });
  }

  _populateModules() {
    var modules = modulesStore.modules.map(m => m.name ).sort();

    $(`#${this.componentId} .select2.name`).off();
    this.moduleNames.setItems(modules);
    this.moduleNames.render();
    this.moduleNames.init();

    let _this = this;
    $(`#${this.componentId} .select2.name`).change(function() {
      modulesStore.setSelectedModule($(this).val());
      _this._populateVersion();
    });

    modulesStore.setSelectedModule(modules[0]);
    this._populateVersion();
  }
}
