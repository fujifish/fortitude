import template from "views/navigation";
import Component from 'components/relax/Component';

export default class Navigation extends Component {
  constructor() {
    super('Navigation');
  }

  viewMounted() {
    $('.sidebar-toggle').on('click',() => {
      localStorage.setItem('navigation/collapsed', !this._isCollapsed());
    });

    if (localStorage.getItem('navigation/collapsed') == 'true' && !this._isCollapsed()) {
      $('body').addClass('sidebar-collapse');
    }
  }

  initialView() {
    return template();
  }

  _isCollapsed() {
    return !!($('.sidebar-collapse').length);
  }
}
