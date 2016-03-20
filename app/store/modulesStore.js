import Store from 'store/relax/Store'

class ModulesStore extends Store {
  constructor() {
    super({modules: [], selectedIndex: -1, modulesLoading: false, addingModule: false});
  }


  _flattenModulesData(modules) {
    let result = [];
    modules.forEach(function(mod) {
      result = result.concat(mod.versions.sort());
    });
    return result;
  }

  _handleModulesResult(promise){
      promise
      .then(this._flattenModulesData)
      .then(modules => {
        this.state.modules = modules;
        this.state.selectedIndex = 0;
        this.state.modulesLoading = false;
        this.commit();
      }).catch(ex => {
        throw new Error("Oops! Something went wrong and we couldn't create your modules. Ex: " + ex.message);
      })
  }


  fetchModules() {
    this.state.modulesLoading = true;
    this.commit();
    return this._handleModulesResult(this.makeRequest('get','/modules'));
  }

  openAddModuleDialog(){
    this.state.addingModule = true;
    this.commit();
  }

  closeAddModuleDialog(){
    this.state.addingModule = false;
    this.commit();
  }

  setSelectedIndex(selectedIndex){
    this.state.selectedIndex = selectedIndex;
    this.commit();
  }

  addModule(module){
    if(module == null || module.length == 0)
      throw new Error("Empty input for new module.");
    this.state.modulesLoading = true;
    this.commit();
    return this._handleModulesResult(this.makeRequest('post','/modules', module));
  }

  deleteModule(name, version){
    this.state.modulesLoading = true;
    this.commit();
    return this._handleModulesResult(this.makeRequest('delete','/modules/'+ encodeURIComponent(name) + '/' + encodeURIComponent(version)));
  }

}

export default new ModulesStore();