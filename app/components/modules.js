  import template from "../views/modules.ejs";
  import ModulesList from './modulesList';
  import AddModuleDialog from './addModuleDialog';
  import Component from './component';
  import ModuleDetails from './moduleDetails';

  export default class Modules extends Component {
    constructor(){
      super('modules');
    }

    initialView(){
      const data = {
        modulesList: new ModulesList().initialView(),
        moduleDetails: new ModuleDetails().initialView(),
        addModuleDialog: new AddModuleDialog().initialView(),
      };
      return template(data);
    }
  }
