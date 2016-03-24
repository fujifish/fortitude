import template from "views/sidebar";
import Component from 'components/relax/Component';

export default class SideBar extends Component {
  constructor(routerStore) {
    super('SideBar');
    this.routerStore = routerStore;
    this.routerStore.on('selected', selected => {
      $(`.sidebar-menu li[data-index!=${selected}]`).removeClass('active');
      $(`.sidebar-menu li[data-index=${selected}]`).addClass('active');
    });

  }

  viewMounted() {
    let _this = this;
    $(`#${this.componentId} a`).click(function(e) {
      var href = $(this).attr("href");
      _this.routerStore.changeRoute(href);
      return false;
    });
  }

  view() {
    return template({routes: this.routerStore.state.routes, selected: this.routerStore.state.selected});
  }
}
