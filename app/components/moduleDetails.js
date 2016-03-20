import Box from './box'
import template from '../views/moduleDetails.ejs';
import modulesStore from '../store/modulesStore';

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