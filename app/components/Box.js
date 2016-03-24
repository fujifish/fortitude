import Component from 'components/relax/Component';
import template from "views/box";

export default class Box extends Component {
  constructor(name, options) {
    super(name);
    this.options = options || {};
    this.options.style = this.options.style || 'default';
  }

  viewWithContent(content) {
    return template({content: content, style: this.options.style});
  }

  renderLoading(loading) {
    if (loading) {
      $(`#${this.componentId} > div`).append($('<div class="overlay"><i class="fa fa-spinner fa-spin"></i></div>'));
    } else {
      $(`#${this.componentId} > div .overlay`).remove();
    }
  }

}