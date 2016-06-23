import Component from 'components/relax/Component';
import template from 'views/nodes/syncTimer';
import nodesStore from 'store/NodesStore';
import routerStore from 'store/relax/RouterStore';
import common from '../../common';

export default class SyncTimer extends Component {
  constructor() {
    super("SyncTimer");
    nodesStore.on('nodeDetails.commandsSyncedAt', () => {
      this.render()
    }).on('nodesSyncedAt', () => {
      this.render()
    });
  }

  beforeRender() {
    super.beforeRender();
    window.clearInterval(this.updatedId);
    window.clearTimeout(this.flashId);
  }

  afterRender() {
    super.afterRender();
    
    this.updatedId = window.setInterval(() => {
      $(`#${this.componentId} .sync-time > span`).html(this._time());
    }, 3000);
    
    this.flashId = window.setTimeout(() => {
      $(`#${this.componentId} .sync-time > i`).removeClass('syncing');
    }, 1000);
  }

  view() {
    return template({ time: this._time() });
  }

  _time() {
    var time;
    if (routerStore.isNodePage()) {
      time = nodesStore.state.nodeDetails.commandsSyncedAt
    } else if (routerStore.isNodesPage()) {
      time = nodesStore.state.nodesSyncedAt
    }
    return time && common.timeSince(time) || 'N/A';
  }
}



