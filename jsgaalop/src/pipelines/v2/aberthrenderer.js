import { makeSlider,makeLogSlider } from "../../ui/sliders.js";
import { simplerenderer } from "./simplerenderer.js";
export class aberthrenderer extends simplerenderer{

  makeOptions(element){
    //element.display="table";
    element.classList.add("sliderholder");
    const slidertemplate=document.querySelector(`template[data-type=slider]`);
    element.appendChild(makeLogSlider(slidertemplate,"epsilon",
      (x)=>{this.eps=x;this.ctx?.requestRender();}
    ));
    element.appendChild(makeLogSlider(slidertemplate,"beta",
      (x)=>{this.beta=x;this.ctx?.requestRender();
    }));

  }


  render(ctx){
    this.shader.use();
    this.shader.uniform1f("eps",this.eps||1e-3);
    this.shader.uniform1f("beta",this.beta||1e-3);
    super.render(ctx);
  }
}
