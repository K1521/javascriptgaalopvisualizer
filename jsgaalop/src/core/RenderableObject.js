
import { LazyRenderingPipeline } from "../pipelines/LazyRenderingPipeline.js";
import { RenderContext } from "./RenderContextold.js";

export class RenderableObject {
  constructor(name,context) {
    this.name = name;
    this.pipelines = new Map(); // methodName -> ShaderPipeline
    this.activePipelineName = null;
    /** @type{RenderContext} */
    this.ctx=context;
  }



  addPipeline(name,pipeline){
    if(this.pipelines.has(name))throw new Error("option already exists");
    this.pipelines.set(name,pipeline);
    pipeline.setRenderableObject(this);
  }


  /**
   * @type {LazyRenderingPipeline}
   */
  get activePipeline() {
    return this.pipelines.get(this.activePipelineName);
  }

  setActivePipeline(name) {
    if(name==null || name==""){
      this.activePipelineName=null;
      this.ctx.requestRender();
      return;
    }

    if (!this.pipelines.has(name)) {
      console.warn("pipline option doesnt exist");
    }
    if(this.activePipelineName==name)return;
    this.activePipelineName = name;
    context.scheduleOnRender(()=>this.activePipeline?.init());//inits the lazy pipeline but defers it to render to avoid conflicts
    this.ctx.requestRender();
  }

updateParams() {
  this.activePipeline?.init();
  this.activePipeline?.updateParams(this.ctx);
}

render() {
  this.activePipeline?.init();
  this.activePipeline?.render(this.ctx);
}

isTilable() {
  return this.activePipeline?.isTilable();
}


  
}

