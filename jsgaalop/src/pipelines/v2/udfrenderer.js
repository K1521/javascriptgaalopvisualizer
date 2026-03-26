import { makeSlider,makeLogSlider } from "../../ui/sliders.js";
import { simplerenderer } from "./simplerenderer.js";
export class udfrenderer extends simplerenderer{

  makeOptions(element){
    //element.display="table";
    element.classList.add("sliderholder");
    const slidertemplate=document.querySelector(`template[data-type=slider]`);
    element.appendChild(makeLogSlider(slidertemplate,"maxstep",
      (x)=>{this.maxstep=x;this.ctx?.requestRender();},
    {min:1e-2,max:1e1,value:1}));
    element.appendChild(makeLogSlider(slidertemplate,"threshold",
      (x)=>{this.threshold=x;this.ctx?.requestRender();
    }));
    element.appendChild(makeLogSlider(slidertemplate,"m",
      (x)=>{this.m=x;this.ctx?.requestRender();},
    {min:0.01,max:10,value:1}));

  }


  render(ctx){
    this.shader.use();
    this.shader.uniform1f("threshold",this.threshold||1e-3);
    this.shader.uniform1f("maxstep",this.maxstep||1e-3);
    this.shader.uniform1f("m",this.m||1);
    super.render(ctx);
  }
}
