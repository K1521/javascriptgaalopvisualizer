import { makeSlider,makeLogSlider } from "../../ui/sliders.js";
import { simplerenderer } from "./simplerenderer.js";
export class aberthrendererf extends simplerenderer{

  makeOptions(element){
    //element.display="table";
    element.classList.add("sliderholder");
    const slidertemplate=document.querySelector(`template[data-type=slider]`);

  
    element.appendChild(makeLogSlider(slidertemplate,"threshold",
      (x)=>{this.thresh=x;this.ctx?.requestRender();}
    ,{min:1e-20,max:1,value:1e-10}));

  }


  render(ctx){
    this.shader.use();
    this.shader.uniform1f("thresh",this.thresh||1e-10);
    super.render(ctx);
  }
}
