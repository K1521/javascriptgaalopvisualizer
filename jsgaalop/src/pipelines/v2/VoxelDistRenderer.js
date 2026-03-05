

//import { pointshaderfactory } from "./pointcloudrenderer.js";


//import { PackedVoxelGrid } from "../voxelutil/v1/PackedVoxelGrid.js";
//import { PackedVoxelGridFilter } from "../voxelutil/v1/PackedVoxelGridFilter.js";


import { LazyRenderingPipeline } from "../LazyRenderingPipeline.js";
import { Shader ,throwonglerror} from "../../glwrapper/glwrapper.js";
import {  TransformFeedbackWrapper} from "../../glwrapper/TransformFeedbackWrapper.js";
//import { loadWithIncludesRelativeToShadersource } from "../../glwrapper/shaderimporter.js";
import {PointShader} from "./pointrenderutil.js"

function sum(arr){
  let acc=0;
  for(let x of arr)acc+=x;
  return acc;
}
function mix(x,y,a){
  return x*(1-a)+y*a;
}
function grideval(tf,low,high,dim,m=1){
  const[nx,ny,nz]=dim;
  const[minx,miny,minz]=low;
  const[maxx,maxy,maxz]=high;

  tf.shader.use();
  tf.shader.uniform3f("low",...low);
  tf.shader.uniform3f("high",...high);
  tf.shader.uniform3i("dim",...dim);
  const filter=tf.run(nx*ny*nz)[0];
  let idx=0;
  const dx=(maxx-minx)/(nx-1);
  const dy=(maxy-miny)/(ny-1);
  const dz=(maxz-minz)/(nz-1);

  const radius=Math.sqrt(dx*dx+dy*dy+dz*dz);

  const threshold=m*Math.sqrt(dx*dx+dy*dy+dz*dz)/2;
  
  let l=0;
  for(let i=0;i<filter.length;i++)if(filter[i]<threshold)l++;
  const points=new Float32Array(l*3);
  l=0;
  for(let i=0;i<nx;i++){
    const x=mix(minx,maxx,i/(nx-1));
    for(let j=0;j<ny;j++){
      const y=mix(miny,maxy,j/(ny-1));
      for(let k=0;k<nz;k++){
        const z=mix(minz,maxz,k/(nz-1));
        if(filter[idx]<threshold){
          points[l++]=x;
          points[l++]=y;
          points[l++]=z;
        }
        idx+=1;
      }
    }
  }
  return [points,radius];

}

export class VoxelDistRenderer extends LazyRenderingPipeline{

  constructor(gl,visgraph, vertexshader,color) {
    super(() => {

      this.scale=4;
      this.samples=200;
      //this.maxvoxel=375000;//max vertCount is 30000000 so definetly dont subdivide if there are more than 30000000/8=3750000

      this.visgraph=visgraph;
      this.gl = gl;

      this.pointrenderer=new PointShader(gl,color);

      this.tfstepeval=new TransformFeedbackWrapper(gl, visgraph.gencodeR(vertexshader),["result"]);   
      
     
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
    
    const [points,radius]=grideval(this.tfstepeval,[-this.scale,-this.scale,-this.scale],[this.scale,this.scale,this.scale],[this.samples,this.samples,this.samples]);
    this.pointrenderer.setpoints(points);
    //throwonglerror(gl);
  }

 

  


  isTilable(){return false;}
}




