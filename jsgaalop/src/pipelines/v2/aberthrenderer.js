import { makeSlider } from "../../ui/sliders.js";
import { simplerenderer } from "./simplerenderer.js";
export class aberthrenderer extends simplerenderer{

makeOptions(element){
  const slidertemplate=document.querySelector(`template[data-type=slider]`);
  element.appendChild(makeSlider(slidertemplate,"epsilon",
    (x)=>{
      this.eps=Math.pow(10,(x-1)*15);
      this.ctx?.requestRender();
      return this.eps.toExponential(2);
    }));
  element.appendChild(makeSlider(slidertemplate,"beta",
    (x)=>{
      this.beta=Math.pow(10,(x-1)*15);;
      this.ctx?.requestRender();
      return this.beta.toExponential(2);
    }));
  
}


render(ctx){
  this.shader.use();
  this.shader.uniform1f("eps",this.eps||1e-3);
  this.shader.uniform1f("beta",this.beta||1e-3);
  super.render(ctx);
}
}
