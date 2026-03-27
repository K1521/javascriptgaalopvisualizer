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
    element.appendChild(makeSlider(slidertemplate,"iter1",
      (x)=>{this.iter1=x;this.ctx?.requestRender();
    },{min:1,max:50,step:1,value:20}));
    element.appendChild(makeSlider(slidertemplate,"iter2",
      (x)=>{this.iter2=x;this.ctx?.requestRender();
    },{min:1,max:50,step:1,value:20}));
    element.appendChild(makeLogSlider(slidertemplate,"AT",
      (x)=>{this.ABERTH_THRESHOLD=x;this.ctx?.requestRender();}
    ,{min:1e-20,max:1,value:1e-10}));

  }


  render(ctx){
    this.shader.use();
    this.shader.uniform1f("eps",this.eps||1e-3);
    this.shader.uniform1f("beta",this.beta||1e-3);
     this.shader.uniform1i("iter1",this.iter1||20);
     this.shader.uniform1i("iter2",this.iter2||20);

     this.shader.uniform1f("ABERTH_THRESHOLD",this.ABERTH_THRESHOLD||1e-10);
    
    super.render(ctx);
  }
}
