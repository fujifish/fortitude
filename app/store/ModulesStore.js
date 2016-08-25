import Store from 'store/relax/Store'

class ModulesStore extends Store {
  constructor() {
    super({
      modules: [],
      selectedModule: null,
      selectedVersion: null,
      modulesLoading: false,
      addingModule: false,
      modulesSyncedAt: null,
    });
  }

  get modules() {
    return this.state.modules;
  }

  setSelectedModule(moduleName) {
    this.state.selectedModule = moduleName;
    this.commit();
  }

  setSelectedVersion(version) {
    this.state.selectedVersion = version;
    this.commit();
  }

  getSelectedVersion() {
    var module = this.modules && this.modules.filter(m => m.name == this.state.selectedModule)[0];
    return module && module.versions.filter(v => v.version == this.state.selectedVersion)[0];
  }

  _handleModulesResult(promise) {
    promise
      .then(modules => {
        this.state.modules = modules;
        this.state.modulesLoading = false;
        this.state.selectedVersion = null;
        this.state.selectedModule = null;
        this.state.modulesSyncedAt = (new Date()).getTime();
        this.commit();
      }).catch(ex => {
        throw new Error("Oops! Something went wrong and we couldn't create your modules. Ex: " + ex.message);
      })
  }

  fetchModules() {
    this.state.modulesLoading = true;
    this.commit();
    return this._handleModulesResult(this.makeRequest('get', '/modules'));
  }

  openAddModuleDialog() {
    this.state.addingModule = true;
    this.commit();
  }

  closeAddModuleDialog() {
    this.state.addingModule = false;
    this.commit();
  }

  addModule(module) {
    if (module == null || module.length == 0) {
      throw new Error("Empty input for new module.");
    }
    this.state.modulesLoading = true;
    this.commit();
    return this._handleModulesResult(this.makeRequest('post', '/modules', module));
  }

  deleteModule(name, version) {
    this.state.modulesLoading = true;
    this.commit();
    return this._handleModulesResult(this.makeRequest('delete', '/modules/' + encodeURIComponent(name) + '/' + encodeURIComponent(version)));
  }

}

export default new ModulesStore();