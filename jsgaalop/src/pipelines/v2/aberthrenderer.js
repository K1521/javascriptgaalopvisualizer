import { makeSlider } from "../../ui/sliders.js";
import { simplerenderer } from "./simplerenderer.js";
export class aberthrenderer extends simplerenderer{

makeOptions(element){
  const slidertemplate=document.querySelector(`template[data-type=slider]`);
  element.appendChild(makeSlider(slidertemplate,"epsilon",
    (x)=>{
      this.eps=x;
      this.ctx?.requestRender();
    }));
  
}


render(ctx){
  this.shader.use();
  this.shader.uniform1f("eps",this.eps||1e-3);
  super.render(ctx);
}
}
