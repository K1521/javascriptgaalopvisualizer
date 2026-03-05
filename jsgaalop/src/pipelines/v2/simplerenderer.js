import { LazyRenderingPipeline } from "../LazyRenderingPipeline.js";
import { Shader } from "../../glwrapper/glwrapper.js";
import { loadWithIncludesRelativeToShadersource } from "../../glwrapper/shaderimporter.js";

const vertRaycastFullscreen=await loadWithIncludesRelativeToShadersource("./vertRaycastFullscreen.glsl")
export class simplerenderer extends LazyRenderingPipeline{

  constructor(ctx,gl,visgraph,fragmentShaderSourceTemplate,color){
    super(()=>{
      this.ctx=ctx;
      const frag=visgraph.gencodeR(fragmentShaderSourceTemplate);

      this.shader=new Shader(gl, vertRaycastFullscreen,frag );
      this.shader.use();
      
      gl.uniform4fv(this.shader.getUniformLocation('incolor'), [color.r,color.g,color.b,1.0]);
      
      this.visgraph=visgraph;

    })
  }
  render(ctx){
    const gl=ctx.gl;

    gl.depthFunc(gl.LESS);
    gl.enable(gl.DEPTH_TEST);
    this.shader.use();
    ctx.updateUniforms(this.shader);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  updateParams(ctx){
    if(this.paramsversion==ctx.evalContext.paramsversion)return;
    this.paramsversion=ctx.evalContext.paramsversion;
    this.shader.use();
    this.visgraph.setuniforms(this.shader,ctx.evalContext);
  }
  isTilable(){return true;}
}
