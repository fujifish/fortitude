import template from "views/modules/select";
import Component from 'components/relax/Component';

export default class Select extends Component {
  constructor(name, items = []) {
    super('select-' + name);
    this.name = name;
    this.items = items;
  }

  setItems(items) {
    this.items = items;
    return this;
  }

  init() {
    $(`#${this.componentId} .select2`).select2();
  }

  afterRender() {
    $(`#${this.componentId} .select2`).select2();
  }

  viewMounted() {
    super.viewMounted();
    $(`#${this.componentId} .select2`).select2();
  }

  view() {
    return template({ name: this.name, items: this.items });
  }
}
