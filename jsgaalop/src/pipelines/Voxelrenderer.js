import { LazyRenderingPipeline } from "./LazyRenderingPipeline.js";
import { shaderSources } from "../glwrapper/shaderimporter.js";

import { pointshaderfactory } from "./pointcloudrenderer.js";


import { PackedVoxelGrid } from "../voxelutil/PackedVoxelGrid.js";
import { PackedVoxelGridFilter } from "../voxelutil/PackedVoxelGridFilter.js";



export class Voxelrenderer extends LazyRenderingPipeline{

  constructor(gl,visgraph, vertexshader,color) {
    super(() => {

      this.scale=4;
      this.maxlevel=10;//dont set higher than 10
      this.maxvoxel=3750000;//max vertCount is 30000000 so definetly dont subdivide if there are more than 30000000/8=3750000

      this.visgraph=visgraph;
      this.gl = gl;
      //vertexshader=testvoxelshader;
      

      this.voxelfilter=new PackedVoxelGridFilter(gl, visgraph.gencode(vertexshader),visgraph);   
      //this.voxelfilter.maxvoxel=100000

      //setup point rendering
      this.pointbuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.pointbuffer);
      this.pointbuffer_size=0;

      this.pointshader=pointshaderfactory.getcached(gl);

      this.color=color;
      
      this.pointvao=gl.createVertexArray();
      gl.bindVertexArray(this.pointvao);
      gl.bindBuffer(gl.ARRAY_BUFFER,  this.pointbuffer);
      const point_positionAttribLoc=this.pointshader.getAttribLocation("position");
      gl.enableVertexAttribArray(point_positionAttribLoc);
      gl.vertexAttribPointer(point_positionAttribLoc, 3, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);
    });
  }

  

    
  render(ctx) {
    const gl = this.gl;
    gl.depthFunc(gl.LESS);
    gl.enable(gl.DEPTH_TEST);
    this.pointshader.use();
    gl.uniform4fv(this.pointshader.getUniformLocation('incolor'), [this.color.r,this.color.g,this.color.b,1.0]);
    ctx.updateUniforms(this.pointshader); // sets cameraPos and cameraMatrix and windowsize
    gl.bindVertexArray(this.pointvao);
    gl.drawArrays(gl.POINTS, 0, this.pointbuffer_size);
    gl.bindVertexArray(null);
  }
  
  updateParams(ctx) {
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
  }


  isTilable(){return false;}
}




