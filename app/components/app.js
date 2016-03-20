import bootstrap from 'admin-lte/bootstrap/css/bootstrap.css';
//import fontawesome from 'font-awesome/css/font-awesome.css'
import adminlte from 'admin-lte/dist/css/AdminLTE.css';
import adminlteskin from 'admin-lte/dist/css/skins/skin-blue.css';
import fontawesome from 'font-awesome/css/font-awesome.css';

import bootstrapjs from 'admin-lte/bootstrap/js/bootstrap'
import adminltejs from 'admin-lte/dist/js/app'

import template from "../views/app.ejs";
import Navigation from "./navigation"
import SideBar from './sidebar'
import Modules from './modules'

class App{
  initialView(){
    let data = {
      navigation: new Navigation().initialView(),
      sidebar: new SideBar().initialView(),
      content: new Modules().initialView(),
      footer: ""
    };
    return template(data);
  }
}

$('#app').html(new App().initialView());
