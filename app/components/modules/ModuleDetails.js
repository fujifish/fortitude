import Box from 'components/Box'
import template from 'views/modules/moduleDetails';
import modulesStore from 'store/ModulesStore';

export default class ModuleDetails extends Box {
  constructor() {
    super('ModuleDetails', modulesStore);
    modulesStore.on('selectedIndex', selectedIndex => {
      this.render();
    });
  }

  view() {
    let content = modulesStore.state.modules.length > 0 ? modulesStore.state.modules[modulesStore.state.selectedIndex]: null;
    return this.viewWithContent(template({content: content}));
  }
}