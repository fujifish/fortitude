import Component from 'components/relax/Component';
import template from 'views/downloader';

export default class Downloader extends Component {
  constructor(name, title, dataGetter) {
    super(`${name}-downloader`);
    this.dataGetter = dataGetter;
    this.title = title || '';
  }

  setFileName(fileName) {
    this.fileName = fileName;
    return this;
  }

  init() {
    $(`#${this.componentId}-btn`).on('click', ()=> {
      var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.dataGetter() || ''));
      $(`#${this.componentId}-a`).attr('href', dataStr).attr('download', this.fileName || 'fortitude.txt').get(0).click();
    });
  }

  destroy() {
    $(`#${this.componentId}-btn`).off();
  }

  view() {
    return template({id: `${this.componentId}`, fileName: this.fileName || 'fortitude.txt', title: this.title });
  }
}