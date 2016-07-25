import bootstrap from 'admin-lte/bootstrap/css/bootstrap.css';
import adminlte from 'admin-lte/dist/css/AdminLTE.css';
import adminlteskin from 'admin-lte/dist/css/skins/skin-blue.css';
import fontawesome from 'font-awesome/css/font-awesome.css';
import appcss from 'css/app.css'
import favicon from 'images/favicon.png'
import datatables_bs_css from 'datatables.net-bs/css/dataTables.bootstrap.css';

import bootstrapjs from 'admin-lte/bootstrap/js/bootstrap';
import icheck from 'admin-lte/plugins/iCheck/icheck.js';
import adminltejs from 'admin-lte/dist/js/app';
import jsonform from 'json-form/lib/jsonform';
import datatables from 'datatables.net/js/jquery.dataTables';
import datatables_bs from 'datatables.net-bs/js/dataTables.bootstrap';

import template from "views/app";
import footerTemplate from "views/footer";
import Navigation from "components/Navigation";
import SideBar from 'components/Sidebar';
import Modules from 'components/modules/Modules';
import Nodes from 'components/nodes/Nodes';
import Component from 'components/relax/Component';
import routerStore from 'store/relax/RouterStore';

class App extends Component {
  constructor() {
    super("App");
    this.sideBarRoutes = [
      { title: "Nodes", component: new Nodes(), path: "/nodes", icon: 'cloud' },
      { title: "Modules", component: new Modules(), path: "/modules", icon: 'cube' }
    ];

    routerStore.setHomePath('/nodes').on('path', () => {
      this._makeVisible(routerStore.currentMainPath());
    });
  }

  _makeVisible(path) {
    $(`.wrapper .content section`).hide();
    $(`.wrapper .content section[data-path='${path}']`).show();
    $('#header-name').text(this.sideBarRoutes.find(r => r.path == path).title);
  }

  initialView() {
    let data = {
      navigation: new Navigation().initialView(),
      sidebar: new SideBar(this.sideBarRoutes).initialView(),
      content: this.sideBarRoutes.map(r => {
        return { view: r.component.initialView(), path: r.path }
      }),
      footer: footerTemplate({ version: window.fortitudeVersion, linkText: 'Outpost', url: 'https://github.com/capriza/outpost' })
    };
    return template(data);
  }
}

$('#app').html(new App().initialView());
