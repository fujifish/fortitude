import template from "views/sidebar";
import Component from 'components/relax/Component';
import routerStore from 'store/relax/RouterStore';

export default class SideBar extends Component {
  constructor(routes) {
    super('SideBar');
    this.routes = routes;
    routerStore.on('path', () => {
      $(`.sidebar-menu li`).removeClass('active');
      $(`.sidebar-menu li[data-path='${routerStore.currentMainPath()}']`).addClass('active');
    });
  }

  viewMounted() {
    $(`#${this.componentId} a`).click(function(e) {
      var href = $(this).attr("href");
      routerStore.changeRoute(href, href.match(/\/(.+)$/) && href.match(/\/(.+)$/)[1]);
      return false;
    });
  }

  view() {
    return template({ routes: this.routes, selected: routerStore.currentMainPath() });
  }
}
