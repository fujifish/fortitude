import Component from 'components/relax/Component';
import template from "views/box";

export default class Box extends Component{
  constructor(name){
    super(name);
  }

  viewWithContent(content){
    return template({content: content});
  }

  renderLoading(loading){
    if(loading){
      $(`#${this.componentId} > div`).append($('<div class="overlay"><i class="fa fa-refresh fa-spin"></i></div>'));
    }else{
      $(`#${this.componentId} > div .overlay`).remove();
    }
  }

}