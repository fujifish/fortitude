import Store from 'store/relax/Store'

export default class RouterStore extends Store {
  constructor(routes) {
    super({routes: routes, selected: 0});
    let _this = this;
    window.onpopstate = function(event) {
      if (event.state && event.state.index !== undefined) {
        _this.state.selected = event.state.index;
        _this.commit();
      }
    };
  }

  changeRoute(path) {
    let index = this.state.routes.findIndex(function(item) {
      return item.path === path;
    });
    history.pushState({index: index}, '', path);
    this.state.selected = index;
    this.commit();
  }
}
