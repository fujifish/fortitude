import Component from 'components/relax/Component';
import template from 'views/nodes/progress';

export default class Progress extends Component{
  constructor(title, used, total) {
    super(title.replace(/ /g, '-'));
    this.used = used;
    this.title = title;
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

  // $(`#${this.componentId} [data-toggle="popover"]`).popover();

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