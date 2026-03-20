

//import { pointshaderfactory } from "./pointcloudrenderer.js";


//import { PackedVoxelGrid } from "../voxelutil/v1/PackedVoxelGrid.js";
//import { PackedVoxelGridFilter } from "../voxelutil/v1/PackedVoxelGridFilter.js";


import { LazyRenderingPipeline } from "../LazyRenderingPipeline.js";
import { Shader ,throwonglerror} from "../../glwrapper/glwrapper.js";
import {  TransformFeedbackWrapper} from "../../glwrapper/TransformFeedbackWrapper.js";
//import { loadWithIncludesRelativeToShadersource } from "../../glwrapper/shaderimporter.js";
import {PointShader} from "./pointrenderutil.js"
import { Grid3D } from "../../voxelutil/v3/grid.js";
import { makeSlider ,makeLogSlider} from "../../ui/sliders.js";


/** //argsort by chatgpt
 * argsort: gibt Indizes sortiert nach den Werten zurück
 * @param {Float32Array|Array} values - Array der Werte
 * @returns {Uint32Array} indices - sortierte Indizes
 */
function argsort(values) {
  const n = values.length;
  const indices = new Uint32Array(n);

  // Indizes initialisieren
  for (let i = 0; i < n; i++) indices[i] = i;

  // Sortieren nach Werte
  indices.sort((a, b) => values[a] - values[b]);

  return indices;
}

export class TopGridRenderer extends LazyRenderingPipeline{

  constructor(context,gl,visgraph, vertexshader,color) {
    super(() => {
      this.ctx=context;
      this.scale=4;
      this.samples=50;
      this.grid=new Grid3D([-this.scale,-this.scale,-this.scale],[this.scale,this.scale,this.scale],[this.samples,this.samples,this.samples])

      //this.maxvoxel=375000;//max vertCount is 30000000 so definetly dont subdivide if there are more than 30000000/8=3750000

      this.visgraph=visgraph;
      this.gl = gl;

      this.pointrenderer=new PointShader(gl,color);

      this.tf=new TransformFeedbackWrapper(gl, visgraph.gencodeR(vertexshader),["result"]);   
      
      this.percentile=0.01;
      this.percentilechanged=true;
      this.pointrenderer.pointsize=-3;
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
    if(this.paramsversion!=ctx.evalContext.paramsversion){
    this.paramsversion=ctx.evalContext.paramsversion;

    const gl=this.gl;

    this.tf.shader.use();
    this.visgraph.setuniforms(this.tf.shader,ctx.evalContext);
    this.grid.setUniforms(this.tf.shader);

    const filter=this.tf.run(this.grid.size())[0];
    for(let i=0;i<filter.length;i++){filter[i]=Math.abs(filter[i]);}
    this.idx=argsort(filter);
    this.percentilechanged=true;
    }
    if(this.percentilechanged){
      this.percentilechanged=false;
      const points=this.grid.getPointLinearBatch(this.idx.slice(0,Math.floor(this.idx.length*this.percentile)));
      this.pointrenderer.setpoints(points);
    }

    //const [points,radius]=grideval(this.tf,[-this.scale,-this.scale,-this.scale],[this.scale,this.scale,this.scale],[this.samples,this.samples,this.samples]);
    
    //throwonglerror(gl);
    
  }



 makeOptions(element) {
    element.classList.add("sliderholder");
    const slidertemplate = document.querySelector(`template[data-type=slider]`);

    // Percentile Slider (0.001..0.1)
    element.appendChild(makeLogSlider(
      slidertemplate,
      "percentile",
      (value) => {
        this.percentile = value;
        this.percentilechanged = true;
        this.ctx?.requestRender();
      },
      { min: 1e-5, max: 1, value: this.percentile }
    ));

    // Grid Size Slider (samples: 16..512)
    element.appendChild(makeSlider(
      slidertemplate,
      "samples",
      (value) => {
        this.samples = Math.round(value);
        if (this.grid) {
          this.grid.setDim([this.samples, this.samples, this.samples]);
        }
        this.paramsversion=null;
        this.ctx?.requestRender();
         return value.toString();
      },
      { min: 10, max: 100, value: this.samples ,step:1}
    ));

    // Scale Slider (grid bounds: 1..20)
    element.appendChild(makeSlider(
      slidertemplate,
      "scale",
      (value) => {
        this.scale = value;
        if (this.grid) {
          this.grid.setBounds([-this.scale, -this.scale, -this.scale], [this.scale, this.scale, this.scale]);
        }
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




