import Store from 'store/relax/Store'

class RouterStore extends Store {
  constructor() {
    super({ path: '' });
    let _this = this;

    window.onpopstate = function(event) {
      if (event.state && event.state.path !== undefined) {
        _this.state.path = event.state.path;
        _this.commit();
      }
    };
    $(document).ready(() => {
      _this.state.path = window.location.pathname + (window.location.hash || '');
      _this.commit();
    });
  }

  changeRoute(path) {
    history.pushState({path: path}, '', path);
    this.state.path = path;
    this.commit();
  }

  currentMainPath() {
    var path = this.state.path;
    if (['/',''].indexOf(path) != -1 || path.indexOf('/nodes') != -1) {
      path = '/nodes';
    } else if (['modules'].indexOf(path) != -1){
      path = '/modules';
    }
    return path;
  }
}

export default new RouterStore();
