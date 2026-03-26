

//import { pointshaderfactory } from "./pointcloudrenderer.js";


//import { PackedVoxelGrid } from "../voxelutil/v1/PackedVoxelGrid.js";
//import { PackedVoxelGridFilter } from "../voxelutil/v1/PackedVoxelGridFilter.js";


import { LazyRenderingPipeline } from "../LazyRenderingPipeline.js";
import { Shader ,throwonglerror} from "../../glwrapper/glwrapper.js";
import {  TransformFeedbackWrapper} from "../../glwrapper/TransformFeedbackWrapper.js";
//import { loadWithIncludesRelativeToShadersource } from "../../glwrapper/shaderimporter.js";
import { Grid3D } from "../../voxelutil/v3/grid.js";
import { makeSlider ,makeLogSlider} from "../../ui/sliders.js";
import { loadWithIncludesRelativeToShadersource } from "../../glwrapper/shaderimporter.js";


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

function Typemergeargsort(values) {//gemeni helped with this :)

  const isLittleEndian = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
  if (!isLittleEndian || !(values instanceof Float32Array)) {
    // Fallback auf den Standard-Argsort für Big-Endian oder normale Arrays
    return argsort(values);
  }


  //ca10x faster. only works for positive floats on machines with litle endian currently
  const n = values.length;
  const merged = new Uint32Array(n*2);
  const intvaluesview = new Uint32Array(values.buffer, values.byteOffset, values.length);


  for (let i = 0; i < n; i++) {
    merged[2*i] = i;
    merged[2*i+1] = intvaluesview[i];
  }
  new BigUint64Array(merged.buffer).sort();
  const result=new Uint32Array(n);
  for (let i = 0; i < n; i+=1) {
    result[i] = merged[2*i];
  }
  return result;
}

import { GridTriRenderer } from "./TopGridVoxelized.js";



export class GridRendererVoxelized extends LazyRenderingPipeline{

  constructor(context,gl,visgraph, vertexshader,color) {
    super(() => {
      this.ctx=context;

      

      //this.maxvoxel=375000;//max vertCount is 30000000 so definetly dont subdivide if there are more than 30000000/8=3750000

      this.visgraph=visgraph;
      this.gl = gl;

      this.trigridrenderer=new GridTriRenderer(gl,color);

      this.tf=new TransformFeedbackWrapper(gl, visgraph.gencodeR(vertexshader),["result"]);   
      




     
    });

    this.grid=new Grid3D([-this.scale,-this.scale,-this.scale],[this.scale,this.scale,this.scale],[this.samples,this.samples,this.samples]);
    this.threshold=0.5;
    this.threshchanged=true;
    
    this.scale=4;
    this.samples=50;
    this.solverType=2;
  }

  

    
  render(ctx) {

  
    this.trigridrenderer.render(ctx);
  }
  
  
  updateParams(ctx){
    if(this.paramsversion!=ctx.evalContext.paramsversion){
    this.paramsversion=ctx.evalContext.paramsversion;

    const gl=this.gl;

    this.tf.shader.use();
    this.tf.shader.uniform1i("solver",this.solverType);
    this.visgraph.setuniforms(this.tf.shader,ctx.evalContext);
    this.grid.setUniforms(this.tf.shader);

    const filter=this.tf.run(this.grid.size())[0];
    for(let i=0;i<filter.length;i++){filter[i]=Math.abs(filter[i]);}
    //this.nullspacesorted=filter.slice().sort();
    this.nullspace=filter;
    this.threshchanged=true;
    }
    if(this.threshchanged){
      this.threshchanged=false;

      //const thresh=//this.nullspacesorted[Math.min(Math.floor(this.nullspacesorted.length*this.threshold),this.nullspacesorted.length-1)];
      const thresh=Math.sqrt(this.grid.dx**2+this.grid.dy**2+this.grid.dz**2)/2*this.threshold;

      const voxelgrid=this.grid.makevoxelgrid();
      let triidx=0;
      let nullspaceidx=0;
      const [vsx,vsy,vsz]=voxelgrid.stride;
      const [gsx,gsy,gsz]=this.grid.stride;
      const [nx,ny,nz]=this.grid.dim;
      const tri=new Uint32Array(18*vsx*vsy*vsz);
      const nullspace = this.nullspace;
      for(let ix=0;ix<=nx;ix++)
      for(let iy=0;iy<=ny;iy++)
      for(let iz=0;iz<=nz;iz++){
        const nullspaceidx=gsx*ix+gsy*iy+gsz*iz;
        const p0=vsx*ix+vsy*iy+vsz*iz;
        const px=p0+vsx;
        const py=p0+vsy;
        const pz=p0+vsz;
        const pxy=p0+vsx+vsy;
        const pxz=p0+vsx+vsz;
        const pyz=p0+vsy+vsz;
        
        //const nullspaceidx=gsx*ix+gsy*iy+gsz*iz;
        //const nullspacehere=nullspace[nullspaceidx]; 
        const currentBelow = (ix < nx && iy < ny && iz < nz) && nullspace[nullspaceidx] < thresh; 
        

        if (iy < ny && iz < nz &&(currentBelow!=((ix>0)&& (nullspace[nullspaceidx-gsx]<thresh)))){
                 tri[triidx++] = p0; tri[triidx++] = py; tri[triidx++] = pyz;
        tri[triidx++] = p0; tri[triidx++] = pyz; tri[triidx++] = pz;
        }

        //if(ix>0&&(nullspace[nullspaceidx-gsx]<thresh)!=currentBelow){}
       // if(iy>0&&(nullspace[nullspaceidx-gsy]<thresh)!=currentBelow){
          if (ix < nx && iz < nz &&(currentBelow!=((iy>0)&& (nullspace[nullspaceidx-gsy]<thresh)))){
          tri[triidx++] = p0; tri[triidx++] = px; tri[triidx++] = pxz;
        tri[triidx++] = p0; tri[triidx++] = pxz; tri[triidx++] = pz;
        }
       // if(iz>0 && (nullspace[nullspaceidx-gsz]<thresh)!=currentBelow){
          if (iy < ny && iy < ny &&(currentBelow!=((iz>0)&& (nullspace[nullspaceidx-gsz]<thresh)))){
          tri[triidx++] = p0; tri[triidx++] = px; tri[triidx++] = pxy;
        tri[triidx++] = p0; tri[triidx++] = pxy; tri[triidx++] = py;
        }
       
      }
    
      this.trigridrenderer.setdata(voxelgrid,tri.subarray(0,triidx));
    }

    //const [points,radius]=grideval(this.tf,[-this.scale,-this.scale,-this.scale],[this.scale,this.scale,this.scale],[this.samples,this.samples,this.samples]);
    
    //throwonglerror(gl);
    
  }



 makeOptions(element) {

  const select = document.createElement("select");

  [
    { name: "GaussNewton", value: 0 },
    //{ name: "f", value: 1 },
    { name: "udfaprox", value: 2 }
  ].forEach(s => {
    const option = document.createElement("option");
    option.value = s.value;
    option.textContent = s.name;
    select.appendChild(option);
  });

  select.value = this.solverType;

  select.addEventListener("change", e => {
    this.solverType = Number(e.target.value); // wichtig: GLSL erwartet int
    this.paramsversion = null;
    this.ctx?.requestRender();
  });

  element.appendChild(select);


    element.classList.add("sliderholder");
    const slidertemplate = document.querySelector(`template[data-type=slider]`);

    // Percentile Slider (0.001..0.1)
    element.appendChild(makeLogSlider(
      slidertemplate,
      "threshold",
      (value) => {
        this.threshold = value;
        this.threshchanged = true;
        this.ctx?.requestRender();
      },
      { min: 1e-1, max: 1, value: this.threshold }
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
      { min: 10, max: 200, value: this.samples ,step:1}
    ));

    // Scale Slider (grid bounds: 1..20)
    element.appendChild(makeSlider(
      slidertemplate,
      "gridsize",
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


  }

  


  isTilable(){return false;}
}




