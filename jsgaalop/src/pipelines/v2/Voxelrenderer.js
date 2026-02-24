

//import { pointshaderfactory } from "./pointcloudrenderer.js";


//import { PackedVoxelGrid } from "../voxelutil/v1/PackedVoxelGrid.js";
//import { PackedVoxelGridFilter } from "../voxelutil/v1/PackedVoxelGridFilter.js";


import { LazyRenderingPipeline } from "../LazyRenderingPipeline.js";
import { Shader ,throwonglerror} from "../../glwrapper/glwrapper.js";
import {  TransformFeedbackWrapper} from "../../glwrapper/TransformFeedbackWrapper.js";
import { shaderSources } from "../../glwrapper/shaderimporter.js";
import {PointShader} from "./pointrenderutil.js"

function sum(arr){
  let acc=0;
  for(let x of arr)acc+=x;
  return acc;
}

export class Voxelrenderer extends LazyRenderingPipeline{

  constructor(gl,visgraph, vertexshader,color) {
    super(() => {

      this.scale=4;
      this.maxlevel=9;//dont set higher than 10
      this.maxvoxel=3750000;//max vertCount is 30000000 so definetly dont subdivide if there are more than 30000000/8=3750000

      this.visgraph=visgraph;
      this.gl = gl;

      this.pointrenderer=new PointShader(gl,color);

      this.voxelfilter=new TransformFeedbackWrapper(gl, visgraph.gencodeR(vertexshader),["result"]);   
      
      this.voxelvao=gl.createVertexArray();
      gl.bindVertexArray(this.voxelvao);
      this.voxelbuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER,  this.voxelbuffer);
      ["X","Y","Z"].forEach((attr,i)=>{
        const low=this.voxelfilter.shader.getAttribLocation(attr);
        gl.enableVertexAttribArray(low);
        gl.vertexAttribPointer(low, 2, gl.FLOAT, false, 6*4, 2*4*i);
      })
      gl.bindVertexArray(null);
      gl.bindBuffer(gl.ARRAY_BUFFER,  null);
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
  
  /*updateParams(ctx) {
    if (this.paramsversion === ctx.paramsversion) return;
    this.paramsversion = ctx.paramsversion;

    const gl = this.gl;
    //voxel to points
    const voxelGrid=new PackedVoxelGrid([[-this.scale,this.scale],[-this.scale,this.scale],[-this.scale,this.scale]]);
    this.voxelfilter.useshader();
    this.visgraph.setuniforms(ctx.nodecache, this.voxelfilter.shader);
    this.voxelfilter.apply(voxelGrid,ctx);

    const points=voxelGrid.getPositions(0.5,0.5,0.5);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pointbuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(points) , gl.STATIC_DRAW);
    this.pointbuffer_size=voxelGrid.length;


    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }*/
  updateParams(ctx){
    if(this.paramsversion==ctx.evalContext.paramsversion)return;
    this.paramsversion=ctx.evalContext.paramsversion;

    const gl=this.gl;
    
    this.voxelfilter.shader.use();
    this.visgraph.setuniforms(this.voxelfilter.shader,ctx.evalContext);
    
    gl.bindVertexArray(this.voxelvao);
    gl.bindBuffer(gl.ARRAY_BUFFER,  this.voxelbuffer);
//throwonglerror(gl);

    let voxelsflat=new Float32Array([-this.scale,this.scale,-this.scale,this.scale,-this.scale,this.scale]);
    for(let i=0;i<this.maxlevel;i++){
      const voxelCount = voxelsflat.length / 6;
      if(voxelCount>this.maxvoxel||voxelCount==0)break;
      const filter=this.makevoxelsfilter(voxelsflat);
      voxelsflat=this.subdivide(voxelsflat,filter);
    }


    const filter=this.makevoxelsfilter(voxelsflat);
    const points=this.topoint(voxelsflat,filter);
    
    
    //throwonglerror(gl);
    gl.bufferData(gl.ARRAY_BUFFER, 0 , gl.STATIC_DRAW);//clear data    
    gl.bindVertexArray(null);
    //throwonglerror(gl);
    gl.bindBuffer(gl.ARRAY_BUFFER,  null);
    //throwonglerror(gl);
    console.log(points.slice(0,10));
    this.pointrenderer.setpoints(points);
    //throwonglerror(gl);
  }

  makevoxelsfilter(voxelsflat){// [xmin1,xmax1,ymin1,ymax1,zmin1,zmax1, ...,xminn,...,zmaxn]
    const gl=this.gl;
    if(voxelsflat.length==0)return new Float32Array();
    //gl.bindVertexArray(this.voxelvao);
    //throwonglerror(gl);
    gl.bufferData(gl.ARRAY_BUFFER,voxelsflat , gl.STATIC_DRAW);    
    //throwonglerror(gl);
    const filter=this.voxelfilter.run(voxelsflat.length/6)[0];//array of 0,1
    //throwonglerror(gl);
    return filter;
  }

  filtervoxels(voxelsflat,filter){
    const voxelCount = voxelsflat.length / 6;
    const result = new Float32Array(sum(filter) * 6);
    let offset=0;
    for (let i = 0; i < voxelCount; i++)if (filter[i]) 
      for(let j=0;j<6;j++) result[offset++]=voxelsflat[i*6+j];
    return result;
  }
  

  /**
   * 
   * @param {Float32Array} voxelsflat 
   * @param {Int32Array} filter 
   */
  subdivide(voxelsflat,filter=null){
    const voxelCount = voxelsflat.length / 6;
    const result = new Float32Array((filter?sum(filter):voxelCount) * 6 * 8);
    let offset = 0;

    for (let i = 0; i < voxelCount; i++)if (!filter || filter[i]) {
      const base = i*6;
      const xmin = voxelsflat[base+0], xmax = voxelsflat[base+1], xmid = (xmin + xmax) * 0.5;
      const ymin = voxelsflat[base+2], ymax = voxelsflat[base+3], ymid = (ymin + ymax) * 0.5;
      const zmin = voxelsflat[base+4], zmax = voxelsflat[base+5], zmid = (zmin + zmax) * 0.5;

      for (let xi=0; xi<2; xi++) for (let yi=0; yi<2; yi++) for (let zi=0; zi<2; zi++) {
        result[offset++] = xi===0? xmin:xmid; result[offset++] = xi===0? xmid:xmax;
        result[offset++] = yi===0? ymin:ymid; result[offset++] = yi===0? ymid:ymax;
        result[offset++] = zi===0? zmin:zmid; result[offset++] = zi===0? zmid:zmax;
      }
    }
    return result;
  }
  topoint(voxelsflat,filter=null){
    const voxelCount = voxelsflat.length / 6;
    const result = new Float32Array((filter?sum(filter):voxelCount) * 3);
    let offset = 0;

    for (let i = 0; i < voxelCount; i++)if (!filter || filter[i]) {
      const base = i*6;
      const xmin = voxelsflat[base+0], xmax = voxelsflat[base+1], xmid = (xmin + xmax) * 0.5;
      const ymin = voxelsflat[base+2], ymax = voxelsflat[base+3], ymid = (ymin + ymax) * 0.5;
      const zmin = voxelsflat[base+4], zmax = voxelsflat[base+5], zmid = (zmin + zmax) * 0.5;
      result[offset++] = xmid;
      result[offset++] = ymid;
      result[offset++] = zmid;
    }
    return result;
  }


  isTilable(){return false;}
}




