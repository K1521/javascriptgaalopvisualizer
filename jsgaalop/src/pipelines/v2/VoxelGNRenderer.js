

//import { pointshaderfactory } from "./pointcloudrenderer.js";


//import { PackedVoxelGrid } from "../voxelutil/v1/PackedVoxelGrid.js";
//import { PackedVoxelGridFilter } from "../voxelutil/v1/PackedVoxelGridFilter.js";


import { LazyRenderingPipeline } from "../LazyRenderingPipeline.js";
import { Shader ,throwonglerror} from "../../glwrapper/glwrapper.js";
import {  TransformFeedbackWrapper} from "../../glwrapper/TransformFeedbackWrapper.js";
import { shaderSources } from "../../glwrapper/shaderimporter.js";
import {PointShader} from "./pointrenderutil.js"
import { makeSlider } from "../../ui/sliders.js";

function sum(arr){
  let acc=0;
  for(let x of arr)acc+=x;
  return acc;
}
function mix(x,y,a){
  return x*(1-a)+y*a;
}
function grideval(tf,low,high,dim,threshold=1e-1){
  const[nx,ny,nz]=dim;


  tf.shader.use();
  tf.shader.uniform3f("low",...low);
  tf.shader.uniform3f("high",...high);
  tf.shader.uniform3i("dim",...dim);
  const posandf=tf.run(nx*ny*nz)[0];
  let idx=0;
  
  
  let l=0;
  for(let i=0;i<posandf.length/4;i++)if(posandf[i*4+3]<threshold)l++;
  const points=new Float32Array(l*3);
  l=0;
  for(let i=0;i<posandf.length/4;i++)if(posandf[i*4+3]<threshold){
    points[l++]=posandf[i*4+0];//x
    points[l++]=posandf[i*4+1];//y
    points[l++]=posandf[i*4+2];//z
  };
  
  return points;

}

export class VoxelGNRenderer extends LazyRenderingPipeline{

  constructor(context,gl,visgraph, vertexshader,color) {
    super(() => {

      this.scale=4;
      this.samples=50;
      //this.maxvoxel=375000;//max vertCount is 30000000 so definetly dont subdivide if there are more than 30000000/8=3750000

      this.visgraph=visgraph;
      this.gl = gl;

      this.pointrenderer=new PointShader(gl,color);

      this.tfstepeval=new TransformFeedbackWrapper(gl, visgraph.gencodeR(vertexshader),["result"]);   
      
     this.ctx=context;

     this.eps=0.1;
    });
  }

  

    
  render(ctx) {

    /*const gl = this.gl;
    gl.depthFunc(gl.LESS);
    gl.enable(gl.DEPTH_TEST);
    this.pointshader.use();
    gl.uniform4fv(this.pointshader.getUniformLocation('incolor'), [this.color.r,this.color.g,this.color.b,1.0]);
    ctx.updateUniforms(this.pointshader); // sets cameraPos and cameraMatrix and windowsize
    gl.bindVertexArray(this.pointvao);
    gl.drawArrays(gl.POINTS, 0, this.pointbuffer_size);
    gl.bindVertexArray(null);*/
    //ctx.updateUniforms(this.pointrenderer.shader);// sets cameraPos and cameraMatrix and windowsize
    this.pointrenderer.render(ctx);
  }
  
  
  updateParams(ctx){
    if(this.paramsversion==ctx.evalContext.paramsversion)return;
    this.paramsversion=ctx.evalContext.paramsversion;

    const gl=this.gl;

    this.tfstepeval.shader.use();
    this.visgraph.setuniforms(this.tfstepeval.shader,ctx.evalContext);
    
    const points=grideval(this.tfstepeval,[-this.scale,-this.scale,-this.scale],[this.scale,this.scale,this.scale],[this.samples,this.samples,this.samples],this.eps);
    this.pointrenderer.setpoints(points);
    //throwonglerror(gl);
  }

 
makeOptions(element){
  const slidertemplate=document.querySelector(`template[data-type=slider]`);
  element.appendChild(makeSlider(slidertemplate,"epsilon",
    (x)=>{
      this.eps=Math.pow(10,(x-1)*15);
      this.ctx?.requestRender();
      this.paramsversion=null;
      return this.eps.toExponential(2);
    }));
  
}
  


  isTilable(){return false;}
}




