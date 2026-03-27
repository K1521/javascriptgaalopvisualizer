import { makeSlider,makeLogSlider } from "../../ui/sliders.js";
import { simplerenderer } from "./simplerenderer.js";
export class udfrenderer extends simplerenderer{

  constructor(ctx,gl,visgraph,fragmentShaderSourceTemplate,color){
    super(ctx,gl,visgraph,fragmentShaderSourceTemplate,color);
    this.threshold=visgraph.parents.length==1?1e-3:1e-2;//thicker lines for curves
    this.maxstep=1;
    this.m=1;
  }
  makeOptions(element){
    //element.display="table";
    element.classList.add("sliderholder");
    const slidertemplate=document.querySelector(`template[data-type=slider]`);
    element.appendChild(makeLogSlider(slidertemplate,"maxstep",
      (x)=>{this.maxstep=x;this.ctx?.requestRender();},
    {min:1e-2,max:1e1,value:this.maxstep}));
    element.appendChild(makeLogSlider(slidertemplate,"threshold",
      (x)=>{this.threshold=x;this.ctx?.requestRender();
    },{value:this.threshold}));
    element.appendChild(makeLogSlider(slidertemplate,"m",
      (x)=>{this.m=x;this.ctx?.requestRender();},
    {min:0.01,max:10,value:this.m}));

  }



  render(ctx){
    this.shader.use();
    this.shader.uniform1f("threshold",this.threshold);
    this.shader.uniform1f("maxstep",this.maxstep);
    this.shader.uniform1f("m",this.m);
    super.render(ctx);
  }
}
