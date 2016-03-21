

let components = [];
$(() => {
  components.forEach(function(component){
    component.viewMounted();
  });
});

export default class Component {
  constructor(name){
    this.componentId = name || this.constructor.name;
    components.push(this);
  }

  viewMounted(){

  }

  beforeRender(){

  }

  afterRender(){

  }

    initialView(){
    return `<div id="${this.componentId}">${this.view()}</div>`;
  }

  render(){
    this.beforeRender();
    let component = $('#'+this.componentId);
    if(component.length){
      component.html(this.view());
    }
    this.afterRender();
  }

  view(){
    throw new Error(`${this.componentId} view not implemented`);
  }

}