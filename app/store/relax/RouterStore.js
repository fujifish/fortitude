import Store from 'store/relax/Store'

class RouterStore extends Store {
  constructor() {
    super({ path: '' });

    window.onpopstate = (event) => {
      if (event.state && event.state.path !== undefined) {
        this.state.path = event.state.path;
        this.commit();
      }
    };
    
    $(document).ready(() => {
      this.state.path = window.location.pathname + (window.location.hash || '');
      this.commit();
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

  urlValueOf(key) {
    var params = window.location.search.substring(1);
    var value = params.match(new RegExp(key + '=([^&]+)'));
    return value && value[1] && decodeURIComponent(value[1]) || '';
  }

  nodeId() {
    var path = this.state.path || window.location.pathname + (window.location.hash || '');
    return path.match(/#([^&]+)/) && path.match(/#([^&]+)/)[1];
  }
  
  isNodePage() {
    return this.page() == 'nodes/:id';
  }

  isNodesPage() {
    return this.page() == 'nodes';
  }

  page() {
    var page;
    var path = this.state.path;
    if (path) {
      if (path.indexOf('/nodes#') != -1) {
        page = 'nodes/:id';
      } else if (path == '/modules') {
        page = 'modules';
      } else  {
        page = 'nodes';
      }
    }
    return page;
  }
}

export default new RouterStore();
