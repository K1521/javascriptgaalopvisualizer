import { LazyRenderingPipeline } from "./LazyRenderingPipeline.js";
import { Shader } from "../glwrapper/glwrapper.js";
import { shaderSources } from "../glwrapper/shaderimporter.js";

import { pointshaderfactory } from "./pointcloudrenderer.js";
export class Voxelrenderer extends LazyRenderingPipeline{

  constructor(gl,visgraph, vertexshader,color) {
    super(() => {

      this.scale=4;
      this.maxlevel=10;//dont set higher than 10
      this.maxvoxel=3750000;//max vertCount is 30000000 so definetly dont subdivide if there are more than 30000000/8=3750000

      this.visgraph=visgraph;
      this.gl = gl;
      //vertexshader=testvoxelshader;
      vertexshader=visgraph.gencode(vertexshader);

      //setup voxel subdivision
      this.voxelshader = new Shader(gl,vertexshader, null, ["outPackedVoxel"]);


      //input vao and buffer
      this.vao = gl.createVertexArray();
      gl.bindVertexArray(this.vao);
      this.inbuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.inbuffer);
      const voxel_positionAttribLoc = this.voxelshader.getAttribLocation("inPackedVoxel"); 
      gl.enableVertexAttribArray(voxel_positionAttribLoc);
      gl.vertexAttribIPointer(voxel_positionAttribLoc, 1, gl.INT, 0, 0); // integer attribute
      gl.bindVertexArray(null);


      //output transform feedback and buffer
      this.tf = gl.createTransformFeedback();

      //this.chunkSize = 4096;
      this.outbuffer = gl.createBuffer();
      gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, this.outbuffer);
      //gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER, this.chunkSize * 4, gl.DYNAMIC_READ);//4 bytes per int

      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.tf);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.outbuffer);

      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);


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


    //voxel subdivision

    this.voxelshader.use();
    this.visgraph.setuniforms(ctx.nodecache,this.voxelshader);
   
    gl.uniform1f(this.voxelshader.getUniformLocation("scale"),this.scale); 


    gl.bindVertexArray(this.vao);

    gl.enable(gl.RASTERIZER_DISCARD);

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.tf);
    //gl.beginTransformFeedback(gl.POINTS);

    let inarray = [0];
    

    for (let level = 1; level <=this.maxlevel && inarray.length<this.maxvoxel; level++) {
      //for (; level < 6; level++) inarray=this.subdivideVoxels(inarray, level-1);

      inarray=this.subdivideVoxels(inarray, level-1);//subdivides voxels from level-1 to level

      /*if(inarray.some(x=>this.packVoxel(this.unpackVoxel(x))!=x)){
        throw new Error("bad voxel packing");
      }*/
      inarray.forEach(x=>{
        if(this.packVoxel(...this.unpackVoxel(x))!=x){
          throw new Error("bad voxel packing");
        }
      })

      console.log(level,inarray.length);
      gl.uniform1i(this.voxelshader.getUniformLocation("level"), level);
      //console.log("in",inarray);
      //console.log(inarray.map(x=>this.unpackVoxel(x)));

      //const edgelength=this.voxelEdgeLength(level)/2;
      //const points=inarray.flatMap(packed=>this.voxelToPosition(this.unpackVoxel(packed)));//.map(x=>x+edgelength);
      //console.log("inputmid",points);

      /*let processedResults = [];
      for (let i = 0; i < inarray.length; i += this.chunkSize) {
        const chunk = inarray.slice(i, i + this.chunkSize);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.inbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Int32Array(chunk), gl.STATIC_DRAW);

        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS, 0, chunk.length);
        gl.endTransformFeedback();

        gl.finish();

        // Read back results
        gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, this.outbuffer);
        const results = new Int32Array(chunk.length);
        gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, results);


        // Use results for next iteration
        //console.log(results);
        processedResults.push(...Array.from(results).filter(x => x !== -1));
      }
      //console.log(results);
      inarray = processedResults;*/


        //const chunk = inarray.slice(i, i + this.chunkSize);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.inbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Int32Array(inarray), gl.STATIC_DRAW);

        gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, this.outbuffer);//set buffer size
        gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER,inarray.length * 4, gl.DYNAMIC_READ);//*4 because  size is in bytes and i have ints


        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS, 0, inarray.length);
        gl.endTransformFeedback();

        gl.finish();

        // Read back results
        gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, this.outbuffer);
        const results = new Int32Array(inarray.length);
        gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, results);


        // Use results for next iteration
        //console.log(results);
        inarray=Array.from(results).filter(x => x !== -1);
      


      //console.log(inarray);
      //console.log("out",inarray);
      //console.log(inarray.map(x=>this.unpackVoxel(x)));
      this.level=level;
    }

    //gl.endTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    gl.disable(gl.RASTERIZER_DISCARD);
    gl.bindVertexArray(null);

    //voxel to points




    const edgelength=this.voxelEdgeLength(this.level)/2;
    const points=inarray.flatMap(packed=>this.voxelToPosition(this.unpackVoxel(packed))).map(x=>x+edgelength);
    //console.log(points);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pointbuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(points) , gl.STATIC_DRAW);
    this.pointbuffer_size=inarray.length;


    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  voxelEdgeLength(level) {
    // Total divisions along one axis at max level is 2^10 (1024)
    // At level 0: 1 voxel spans the entire [-1,1] range → length = 2.0
    // Each level subdivides by factor of 2, so edge length halves each level
    // So edge length = 2.0 / 2^level

    return 2.0 / (1 << level);
  }



  packVoxel(x, y, z) {
    if(x>0x3FF || y>0x3FF || z>0x3FF)throw new Error("coord out of bounds");
    return ( (z & 0x3FF) << 20 ) | ( (y & 0x3FF) << 10 ) | (x & 0x3FF);
  }
  unpackVoxel(packed) {
    // packed is an int 
    // We use >>> 0 to treat as unsigned 32-bit integer
    const u = packed >>> 0;//not actually needed
    //const u=packed;
    const x = u & 0x3FF;           // lower 10 bits
    const y = (u >>> 10) & 0x3FF;  // next 10 bits
    const z = (u >>> 20) & 0x3FF;  // next 10 bits
    return [x,y,z];
  }

  voxelToPosition(voxelCoords) {
    // voxelCoords: [x, y, z], each in [0..1023]

    return voxelCoords.map(c => this.scale*((c) * (2.0 / 1024.0) - 1.0));
  }

  /**
   * Given an array of packed voxels and current subdivision level,
   * returns a flat array of their 8 child voxels each.
   * 
   * @param {number[]} parentVoxels - array of packed voxels (ints)
   * @param {number} currentLevel - subdivision level (0 to 9)
   * @returns {number[]} Array of packed child voxels
  */
  subdivideVoxels(parentVoxels, currentLevel) {
    const step = 1 << (10 - currentLevel - 1);
    //const dx = step;
    //const dy = step << 10;
    //const dz = step << 20;
    const dx = this.packVoxel(step, 0, 0);
    const dy = this.packVoxel(0, step, 0);
    const dz = this.packVoxel(0, 0, step);
    //console.log(dx,this.unpackVoxel(dx),currentLevel);
    if(currentLevel==10){
      throw new Error("level to high");
    }

    return parentVoxels.flatMap(packedVoxel => [
      packedVoxel,
      packedVoxel + dx,
      packedVoxel + dy,
      packedVoxel + dz,
      packedVoxel + dx + dy,
      packedVoxel + dx + dz,
      packedVoxel + dy + dz,
      packedVoxel + dx + dy + dz,
    ]);
  }

  isTilable(){return false;}
}
