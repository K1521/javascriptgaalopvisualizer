

//import { pointshaderfactory } from "./pointcloudrenderer.js";


//import { PackedVoxelGrid } from "../voxelutil/v1/PackedVoxelGrid.js";
//import { PackedVoxelGridFilter } from "../voxelutil/v1/PackedVoxelGridFilter.js";


import { LazyRenderingPipeline } from "../LazyRenderingPipeline.js";
import { Shader ,throwonglerror} from "../../glwrapper/glwrapper.js";
import {  TransformFeedbackWrapper} from "../../glwrapper/TransformFeedbackWrapper.js";
//import { shaderSources } from "../../glwrapper/shaderimporter.js";
import {PointShader} from "./pointrenderutil.js"
import { Voxels } from "../../voxelutil/v3/voxels.js";
import { makeSlider ,makeLogSlider} from "../../ui/sliders.js";
function sum(arr){
  let acc=0;
  for(let x of arr)acc+=x;
  return acc;
}

export class Voxelrenderer extends LazyRenderingPipeline{

  constructor(context,gl,visgraph, vertexshader,color) {
    super(() => {
      this.ctx=context;

     

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

    this.scale=4;
    this.maxlevel=12;
    this.maxvoxel=50000;//3750000;//max vertCount is 30000000 so definetly dont subdivide if there are more than 30000000/8=3750000
  }

  

    
  render(ctx) {
    this.pointrenderer.render(ctx);
  }
  
 
  updateParams(ctx){
    if(this.paramsversion==ctx.evalContext.paramsversion)return;
    this.paramsversion=ctx.evalContext.paramsversion;

    const gl=this.gl;
    
    this.voxelfilter.shader.use();
    this.visgraph.setuniforms(this.voxelfilter.shader,ctx.evalContext);
    
    gl.bindVertexArray(this.voxelvao);
    gl.bindBuffer(gl.ARRAY_BUFFER,  this.voxelbuffer);
//throwonglerror(gl);

    const voxels=new Voxels(this.scale);
    voxels.subdivideAndFilter((v)=>this.makevoxelsfilter(v),this.maxlevel,this.maxvoxel);
    const points=voxels.toPoints();
    
    
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


   makeOptions(element) {
      element.classList.add("sliderholder");
      const slidertemplate = document.querySelector(`template[data-type=slider]`);
  
      
      // Grid Size Slider (samples: 16..512)
      element.appendChild(makeSlider(
        slidertemplate,
        "maxlevel",
        (value) => {
          this.maxlevel = Math.round(value);
          this.paramsversion=null;
          this.ctx?.requestRender();
           return value.toString();
        },
        { min: 5, max: 15, value: this.maxlevel ,step:1}
      ));
  
      // Scale Slider (grid bounds: 1..20)
      element.appendChild(makeSlider(
        slidertemplate,
        "scale",
        (value) => {
          this.scale = value;
          this.paramsversion=null;
          this.ctx?.requestRender();
        },
        { min: 1, max: 10, value: this.scale }
      ));
      element.appendChild(makeLogSlider(
        slidertemplate,
        "maxvoxel",
        (value) => {
          this.maxvoxel = value;
          this.paramsversion=null;
          this.ctx?.requestRender();
        },
        { min: 100, max: 500000, value: this.maxvoxel }
      ));
  
      element.appendChild(makeSlider(slidertemplate,"pointsize",
          (x)=>{
            if (this.pointrenderer) {
                this.pointrenderer.pointsize = -x;
            }
            this.ctx?.requestRender();
            this.paramsversion=null;
            return x.toString();
          },{min:1,max:10,value:3,step:1}));
    }

  isTilable(){return false;}
}




