import { LazyRenderingPipeline } from "./LazyRenderingPipeline.js";
import { Shader } from "../glwrapper/glwrapper.js";
import { shaderSources } from "../glwrapper/shaderimporter.js";

import { pointshaderfactory } from "./pointcloudrenderer.js";


import { PackedVoxelGrid } from "../voxelutil/PackedVoxelGrid.js";



export class Voxelrenderer extends LazyRenderingPipeline{

  constructor(gl,visgraph, vertexshader,color) {
    super(() => {

      this.scale=4;
      this.maxlevel=10;//dont set higher than 10
      this.maxvoxel=3750000;//max vertCount is 30000000 so definetly dont subdivide if there are more than 30000000/8=3750000

      this.visgraph=visgraph;
      this.gl = gl;
      //vertexshader=testvoxelshader;
      

      this.voxelfilter=new PackedVoxelGridFilter(gl,vertexshader,visgraph);   
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
    this.voxelfilter.apply(voxelGrid,ctx);

    const points=voxelGrid.getPositions(0.5,0.5,0.5);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pointbuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(points) , gl.STATIC_DRAW);
    this.pointbuffer_size=voxelGrid.length;


    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }


  isTilable(){return false;}
}




export class PackedVoxelGridFilter{
  constructor(gl,vertexshader,visgraph){
      this.maxlevel=10;//dont set higher than 10
      this.maxvoxel=3750000;//max vertCount is 30000000 so definetly dont subdivide if there are more than 30000000/8=3750000
      this.scale=4;
      this.gl = gl;
      this.visgraph=visgraph;


    vertexshader=visgraph.gencode(vertexshader);
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

  }
/**
 * 
 * @param {PackedVoxelGrid} voxelGrid 
 * @param {RenderingContext} ctx 
 */
  apply(voxelGrid,ctx){
    const gl = this.gl;


    //voxel subdivision

    this.voxelshader.use();
    this.visgraph.setuniforms(ctx.nodecache,this.voxelshader);
   
    //gl.uniform1f(this.voxelshader.getUniformLocation("scale"),this.scale); 
    const boundsMin = [voxelGrid.minx, voxelGrid.miny, voxelGrid.minz];
    this.voxelshader.uniform3fv("boundsMin", boundsMin);
    const boundsMax = [voxelGrid.maxx, voxelGrid.maxy, voxelGrid.maxz];
    this.voxelshader.uniform3fv("boundsMax", boundsMax);


    gl.bindVertexArray(this.vao);

    gl.enable(gl.RASTERIZER_DISCARD);

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.tf);
    //gl.beginTransformFeedback(gl.POINTS);

    //let inarray = [0];
    
    

    while (voxelGrid.level <this.maxlevel && voxelGrid.length<this.maxvoxel) {
      //for (; level < 6; level++) inarray=this.subdivideVoxels(inarray, level-1);

      //inarray=this.subdivideVoxels(inarray, level-1);//subdivides voxels from level-1 to level
      voxelGrid.subdivide();
      
      /*if(inarray.some(x=>this.packVoxel(this.unpackVoxel(x))!=x)){
        throw new Error("bad voxel packing");
      }*/
    
      console.log(voxelGrid.level,voxelGrid.length);
      gl.uniform1i(this.voxelshader.getUniformLocation("level"), voxelGrid.level);
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
        gl.bufferData(gl.ARRAY_BUFFER, new Int32Array(voxelGrid.voxels), gl.STATIC_DRAW);

        gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, this.outbuffer);//set buffer size
        gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER,voxelGrid.length * 4, gl.DYNAMIC_READ);//*4 because  size is in bytes and i have ints


        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS, 0, voxelGrid.length);
        gl.endTransformFeedback();

        gl.finish();

        // Read back results
        gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, this.outbuffer);
        const results = new Int32Array(voxelGrid.length);
        gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, results);


        // Use results for next iteration
        //console.log(results);
        voxelGrid.voxels=Array.from(results).filter(x => x !== -1);
      


      //console.log(inarray);
      //console.log("out",inarray);
      //console.log(inarray.map(x=>this.unpackVoxel(x)));
      //this.level=level;
    }
    gl.bufferData(gl.ARRAY_BUFFER, 0, gl.STATIC_DRAW);
    //gl.endTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    gl.disable(gl.RASTERIZER_DISCARD);
    gl.bindVertexArray(null);
    

  }
}