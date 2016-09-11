import Component from 'components/relax/Component';
import template from 'views/clipboard';
import Clipboard from 'clipboard'

export default class ClipBoard extends Component {
  constructor(name, target = null, title = '') {
    super(`${name}-clipboard`);
    this.target = target;
    this.title = title;
  }

  init(getter = null) {
    // needs 'target' or 'getter' (target is css selector of input, getter is used to dynamically get the text)
    this.clipboard = getter ? new Clipboard(`#${this.componentId}-btn`, { text: getter }) : new Clipboard(`#${this.componentId}-btn`);

    var _this = this;
    this.clipboard.on('error', function(e) {
      console.error(`ClipBoard error, componentId: ${_this.componentId} action: ${e.action} trigger: ${e.trigger}`);
    });
    this.clipboard.on('success', function(e) {
      _this.onCpySuccess && _this.onCpySuccess(e.text);
    });
  }

  onCopy(onCpy) {
    this.onCpySuccess = onCpy;
  }

  destroy() {
    this.clipboard && this.clipboard.destroy();
  }

  view() {
    return template({id: `${this.componentId}`, target: this.target, title: this.title });
  }
}