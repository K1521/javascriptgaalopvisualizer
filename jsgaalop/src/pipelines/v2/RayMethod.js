

//import { pointshaderfactory } from "./pointcloudrenderer.js";


//import { PackedVoxelGrid } from "../voxelutil/v1/PackedVoxelGrid.js";
//import { PackedVoxelGridFilter } from "../voxelutil/v1/PackedVoxelGridFilter.js";


import { LazyRenderingPipeline } from "../LazyRenderingPipeline.js";
import { Shader ,throwonglerror} from "../../glwrapper/glwrapper.js";
import {  TransformFeedbackWrapperInterleaved} from "../../glwrapper/TransformFeedbackWrapper.js";
//import { loadWithIncludesRelativeToShadersource } from "../../glwrapper/shaderimporter.js";
import {PointShader} from "./pointrenderutil.js"
import { makeSlider ,makeLogSlider} from "../../ui/sliders.js";




export class RayMethod extends LazyRenderingPipeline{

  constructor(context,gl,visgraph, vertexshader,color) {
    super(() => {
      this.ctx=context;

      

      //this.maxvoxel=375000;//max vertCount is 30000000 so definetly dont subdivide if there are more than 30000000/8=3750000

      this.visgraph=visgraph;
      this.gl = gl;

      this.pointrenderer=new PointShader(gl,color);
      this.numroots=visgraph.generatecodeRcached().basismaxdegree;
      const varyings = Array.from({length: this.numroots}, (_, i) => `result${i}`);
      this.tf=new TransformFeedbackWrapperInterleaved(gl, visgraph.gencodeR(vertexshader),varyings);   
      
     this.pointrenderer.pointsize=-3;
    });

    

    this.percentilechanged=true;
    
    this.scale=4;
    this.samples=50;

    this.low=[-this.scale,-this.scale,-this.scale];
    this.high=[this.scale,this.scale,this.scale];
    this.dim=[this.samples,this.samples,this.samples];
    this.eps=1e-5;
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

    this.tf.shader.use();
    this.tf.shader.uniform3f("low", ...this.low);
    this.tf.shader.uniform3f("high", ...this.high);
    this.tf.shader.uniform3i("dim", ...this.dim);

    this.visgraph.setuniforms(this.tf.shader,ctx.evalContext);
    

    const [dimx,dimy,dimz]=this.dim;
    const vertexcount=dimx*dimy+dimy*dimz+dimx*dimz;
    const result=this.tf.run(vertexcount);

    
    
    const points=[];
    let offset=0;
    const handleroots = (i, j, k, rd) => {
      const roX = this.low[0] + (this.high[0] - this.low[0]) * (i / (dimx - 1));
      const roY = this.low[1] + (this.high[1] - this.low[1]) * (j / (dimy - 1));
      const roZ = this.low[2] + (this.high[2] - this.low[2]) * (k / (dimz - 1));

      for (let r = 0; r < this.numroots; r++) {
        const a = result[offset++];
        const y = result[offset++];
        if (y < this.eps) {
          points.push(rd[0]*a + roX,rd[1]*a + roY,rd[2]*a + roZ);
        }
      }
    };

    const rdXY = [0, 0, 1];
    for (let i = 0; i < dimx; i++) {
      for (let j = 0; j < dimy; j++) {
        handleroots(i, j, 0, rdXY);
      }
    }

    const rdYZ = [1, 0, 0];
    for (let j = 0; j < dimy; j++) {
      for (let k = 0; k < dimz; k++) {
        handleroots(0, j, k, rdYZ);
      }
    }

    const rdXZ = [0, 1, 0];
    for (let i = 0; i < dimx; i++) {
      for (let k = 0; k < dimz; k++) {
        handleroots(i, 0, k, rdXZ);
      }
    }

    this.pointrenderer.setpoints(points);

    //for(r)
    

    //const [points,radius]=grideval(this.tf,[-this.scale,-this.scale,-this.scale],[this.scale,this.scale,this.scale],[this.samples,this.samples,this.samples]);
    
    //throwonglerror(gl);
    
  }



 makeOptions(element) {
    element.classList.add("sliderholder");
    const slidertemplate = document.querySelector(`template[data-type=slider]`);

    // Percentile Slider (0.001..0.1)
    element.appendChild(makeLogSlider(
      slidertemplate,
      "eps",
      (value) => {
        this.eps = value;
        this.paramsversion = null;
        this.ctx?.requestRender();
      },
      { min: 1e-15, max: 1, value: this.eps }
    ));

    // Grid Size Slider (samples: 16..512)
    element.appendChild(makeSlider(
      slidertemplate,
      "samples",
      (value) => {
        this.samples = Math.round(value);
        this.dim=[this.samples, this.samples, this.samples];
        this.paramsversion=null;
        this.ctx?.requestRender();
         return value.toString();
      },
      { min: 10, max: 500, value: this.samples ,step:1}
    ));

    // Scale Slider (grid bounds: 1..20)
    element.appendChild(makeSlider(
      slidertemplate,
      "scale",
      (value) => {
        this.scale = value;
        
        this.low=[-this.scale, -this.scale, -this.scale];
        this.high=[this.scale, this.scale, this.scale];
        
        this.paramsversion=null;
        this.ctx?.requestRender();
      },
      { min: 1, max: 10, value: this.scale }
    ));

    element.appendChild(makeSlider(slidertemplate,"pointsize",
        (x)=>{
          if (this.pointrenderer) {
              this.pointrenderer.pointsize = x;
          }
          this.ctx?.requestRender();
          this.paramsversion=null;
          return x.toString();
        },{min:-5,max:10,value:-3,step:1}));
  }

  


  isTilable(){return false;}
}




