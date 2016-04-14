import bootstrap from 'admin-lte/bootstrap/css/bootstrap.css';
import adminlte from 'admin-lte/dist/css/AdminLTE.css';
import adminlteskin from 'admin-lte/dist/css/skins/skin-blue.css';
import fontawesome from 'font-awesome/css/font-awesome.css';
import appcss from 'css/app.css'
import datatables_bs_css from 'datatables.net-bs/css/dataTables.bootstrap.css';

import bootstrapjs from 'admin-lte/bootstrap/js/bootstrap';
import adminltejs from 'admin-lte/dist/js/app';
import jsonform from 'json-form/lib/jsonform';
import datatables from 'datatables.net/js/jquery.dataTables';
import datatables_bs from 'datatables.net-bs/js/dataTables.bootstrap';


import template from "views/app";
import Navigation from "components/Navigation";
import SideBar from 'components/Sidebar';
import Modules from 'components/modules/Modules';
import Nodes from 'components/nodes/Nodes';
import Component from 'components/relax/Component';
import RouterStore from 'store/relax/RouterStore';

class App extends Component {
  constructor() {
    super("App");
    this.routerStore = new RouterStore([
      {title: "Nodes", component: new Nodes(), path: "/nodes"},
      {title: "Modules", component: new Modules(), path: "/modules"}
    ]);
    this.routerStore.on('selected', selected => {
      this._makeVisible(selected.rhs);
    });
  }

  _makeVisible(index) {
    if (index != -1) {
      $(`.wrapper .content section`).hide();
      $(`.wrapper .content section[data-index=${index}]`).show();
      $('#header-name').text(this.routerStore.state.routes[index].title);
    }
  }

  viewMounted() {
    this._makeVisible(0);
  }

  initialView() {
    let data = {
      navigation: new Navigation().initialView(),
      sidebar: new SideBar(this.routerStore).initialView(),
      content: this.routerStore.state.routes.map(function(e) {
        return e.component.initialView();
      }),
      footer: ""
    };
    return template(data);
  }
}

$('#app').html(new App().initialView());
