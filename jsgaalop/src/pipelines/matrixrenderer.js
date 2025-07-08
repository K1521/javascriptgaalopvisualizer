import { LazyRenderingPipeline } from "./LazyRenderingPipeline.js";
import { Shader } from "../glwrapper/glwrapper.js";
import { shaderSources } from "../glwrapper/shaderimporter.js";
export class matrixrenderer extends LazyRenderingPipeline{

  
  constructor(ctx,gl,visgraph,matrixmaker,fragmentShaderSource,color){
    super(()=>{
      //const frag=visgraph.gencode(fragmentShaderSourceTemplate);

      this.shader=new Shader(gl, shaderSources.vertRaycastFullscreen,fragmentShaderSource );
      this.shader.use();
      //TODO make a shader cache
      
      gl.uniform4fv(this.shader.getUniformLocation('incolor'), [color.r,color.g,color.b,1.0]);
      
      this.visgraph=visgraph;
      this.matrixmaker=matrixmaker;

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
    if(this.paramsversion==ctx.paramsversion)return;
    this.paramsversion=ctx.paramsversion;
    this.shader.use();
    //this.visgraph.setuniforms(ctx.nodecache,this.shader);
    console.log(this.visgraph.name);
    this.matrixmaker.setuniforms(ctx.nodecache,this.shader);

  }

   isTilable(){return true;}
}
