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

  // return the path after the domain and before any other sub path (before any '/').
  currentMainPath() {
    var path = this.state.path;
    if (['/',''].indexOf(path) != -1) {
      path = this.homePath || '/';
    } else if (path.indexOf('#') != -1) {
      path = path.substr(0, path.indexOf('#'));
    }
    return path;
  }

  setHomePath(path) {
    this.homePath = path;
    return this;
  }
}

export default new RouterStore();
