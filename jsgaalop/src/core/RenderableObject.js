
import { RenderContext } from "./RenderContext.js";

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
    this.activePipeline?.init();//inits the lazy pipeline
    this.ctx.requestRender();
  }

updateParams() {
  this.activePipeline?.updateParams(this.ctx);
}

render() {
  this.activePipeline?.render(this.ctx);
}

isTilable() {
  return this.activePipeline?.isTilable();
}


  
}

