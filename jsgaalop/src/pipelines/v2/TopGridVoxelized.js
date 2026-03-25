

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

const vert=await loadWithIncludesRelativeToShadersource("shaderlibv3/other/gridvert.glsl");
const frag=await loadWithIncludesRelativeToShadersource("shaderlibv3/other/trifrag.glsl");
class GridTriRenderer{
  constructor(gl,color){
    this.gl=gl;
    this.color=color;

    this.shader=new Shader(gl,
      vert,frag
    );

    this.vertexBuffer = gl.createBuffer();

    // Create VAO
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

    // One uint per vertex
    const loc = this.shader.getAttribLocation("gridindex"); // shader attribute location
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribIPointer(loc, 1, gl.UNSIGNED_INT, 0, 0);

    gl.bindVertexArray(null);
  }
  render(ctx){
    const gl=this.gl;
    gl.depthFunc(gl.LESS);
    gl.enable(gl.DEPTH_TEST);

    this.shader.use();
    this.shader.uniform4fv('incolor', [this.color.r,this.color.g,this.color.b,1.0]);
    ctx.updateUniforms(this.shader); // sets cameraPos and cameraMatrix and focal
    this.grid.setUniforms(this.shader);
    gl.bindVertexArray(this.vao); // VAO with vertex positions bound
    //gl.drawElements(gl.LINES, this.lineCount, gl.UNSIGNED_SHORT, 0);
    gl.drawArrays(gl.TRIANGLES, 0, this.count);
    //gl.drawArrays(gl.POINTS, 0, this.count);
    gl.bindVertexArray(null);


  }
  setdata(grid, tri) {
    this.grid=grid;
    const gl = this.gl;

    // Ensure tri is a Uint32Array (one uint per vertex)
    let data;
    if (tri instanceof Uint32Array) {
      data = tri;
    } else {
      data = new Uint32Array(tri);
    }

    this.count = data.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
}



export class TopGridRendererVoxelized extends LazyRenderingPipeline{

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
    this.percentile=0.01;
    this.percentilechanged=true;
    
    this.scale=4;
    this.samples=50;
    this.solverType=1;
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
    this.nullspacesorted=filter.slice().sort();
    this.nullspace=filter;
    this.percentilechanged=true;
    }
    if(this.percentilechanged){
      this.percentilechanged=false;

      const thresh=this.nullspacesorted[Math.min(Math.floor(this.nullspacesorted.length*this.percentile),this.nullspacesorted.length-1)];
      const tri=[];
      const voxelgrid=this.grid.makevoxelgrid();

      let nullspaceidx=0;
      const [vsx,vsy,vsz]=voxelgrid.stride;
      const [gsx,gsy,gsz]=this.grid.stride;
      const [nx,ny,nz]=this.grid.dim;
      for(let ix=0;ix<nx;ix++)
      for(let iy=0;iy<ny;iy++)
      for(let iz=0;iz<nz;iz++,nullspaceidx++){
        const p0=vsx*ix+vsy*iy+vsz*iz;
        const px=p0+vsx;
        const py=p0+vsy;
        const pz=p0+vsz;
        const pxy=p0+vsx+vsy;
        const pxz=p0+vsx+vsz;
        const pyz=p0+vsy+vsz;
        
        //const nullspaceidx=gsx*ix+gsy*iy+gsz*iz;
        const nullspacehere=this.nullspace[nullspaceidx];

        if(ix>0&&(this.nullspace[nullspaceidx-gsx]<thresh)!=(nullspacehere<thresh)){
          tri.push(p0,py,pyz,p0,pyz,pz);
        }
        if(iy>0&&(this.nullspace[nullspaceidx-gsy]<thresh)!=(nullspacehere<thresh)){
          tri.push(p0,px,pxz,p0,pxz,pz);
        }
        if(iz>0 && (this.nullspace[nullspaceidx-gsz]<thresh)!=(nullspacehere<thresh)){
          tri.push(p0,px,pxy,p0,pxy,py);
        }
      }
    
      this.trigridrenderer.setdata(voxelgrid,tri);
    }

    //const [points,radius]=grideval(this.tf,[-this.scale,-this.scale,-this.scale],[this.scale,this.scale,this.scale],[this.samples,this.samples,this.samples]);
    
    //throwonglerror(gl);
    
  }



 makeOptions(element) {

  const select = document.createElement("select");

  [
    { name: "GaussNewton", value: 0 },
    { name: "f", value: 1 },
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




