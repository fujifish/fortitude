import Component from 'components/relax/Component';
import template from 'views/nodes/progress';
import routerStore from 'store/relax/RouterStore';

export default class Progress extends Component{
  constructor(title) {
    super(title.replace(/ /g, '-'));
    this.title = title;
    this._togglePopover = function(diff) {
      var oldPath = diff.lhs;
      if (oldPath.indexOf('/nodes#') != -1) {
        $(`#${this.componentId} [data-toggle="popover"]`).off();
      } else if (routerStore.isNodePage()) {
        $(`#${this.componentId} [data-toggle="popover"]`).popover();
      }
    }.bind(this);
  }

  setProgress(used, total) {
    this.used = used;
    this.total = total;
  }

  setType(type) {
    this.type = type;
    return this;
  }

  setPopoverTitle(popoverTitle) {
    this.popoverTitle = popoverTitle;
    return this;
  }

  view() {
    routerStore.off('path', this._togglePopover);
    routerStore.on('path', this._togglePopover);

    var data = {
      title: this.title,
      used: this.used,
      total: this.total,
      usedPercent: Math.floor((this.used * 100) / this.total),
      type: this.type,
      popoverTitle: this.popoverTitle
    };
    return template(data);
  }
}