  import template from "views/modules/modules";
  import ModulesList from 'components/modules/ModulesList';
  import AddModuleDialog from 'components/modules/AddModuleDialog';
  import Component from 'components/relax/Component';
  import ModuleDetails from 'components/modules/ModuleDetails';

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
