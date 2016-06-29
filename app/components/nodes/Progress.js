import Component from 'components/relax/Component';
import template from 'views/nodes/progress';
import routerStore from 'store/relax/RouterStore';

export default class Progress extends Component{
  constructor(title, used, total) {
    super(title.replace(/ /g, '-'));
    this.used = used;
    this.title = title;
    this.total = total;

    // this needs to change to after view (initial) is called
    routerStore.on('path', diff => {
      var oldPath = diff.lhs;
      if (oldPath.indexOf('/nodes#') != -1) {
        $(`#${this.componentId} [data-toggle="popover"]`).off();
      } else if (routerStore.isNodePage()) {
        $(`#${this.componentId} [data-toggle="popover"]`).popover();
      }
    });
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