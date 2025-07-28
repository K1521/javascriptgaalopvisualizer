import { Shader } from "../../glwrapper/glwrapper.js";
import { TransformFeedbackWrapper } from "../../glwrapper/TransformFeedbackWrapper.js";





export class PackedVoxelGridFilter2 {
  constructor(gl, vertexshader, visgraph) {
    this.maxlevel = 16; //dont set higher than 16
    this.maxvoxel = 3750000; //max vertCount is 30000000 so definetly dont subdivide if there are more than 30000000/8=3750000
    this.scale = 4;

    this.gl = gl;
    this.visgraph = visgraph;


    //vertexshader = visgraph.gencode(vertexshader);
    this.tf = new TransformFeedbackWrapper(gl, vertexshader, ["outPackedVoxel"]);


    //input vao and buffer
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    this.inbuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.inbuffer);
    const voxel_positionAttribLoc = this.tf.shader.getAttribLocation("inPackedVoxel");
    gl.enableVertexAttribArray(voxel_positionAttribLoc);
    gl.vertexAttribIPointer(voxel_positionAttribLoc, 3, gl.UNSIGNED_SHORT , 6, 0); // integer attribute
    gl.bindVertexArray(null);
  }



  useshader(){
    this.tf.useshader();
  }

  /**
   *
   * @param {PackedVoxelGrid2} voxelGrid
   */
  apply(voxelGrid) {
    const gl = this.gl;


    this.useshader();
    

    //gl.uniform1f(this.shader.getUniformLocation("scale"),this.scale); 
    const boundsMin = [voxelGrid.packer.minx, voxelGrid.packer.miny, voxelGrid.packer.minz];
    this.tf.shader.uniform3fv("boundsMin", boundsMin);
    const boundsMax = [voxelGrid.packer.maxx, voxelGrid.packer.maxy, voxelGrid.packer.maxz];
    this.tf.shader.uniform3fv("boundsMax", boundsMax);


    gl.bindVertexArray(this.vao);

    //gl.enable(gl.RASTERIZER_DISCARD);
    //gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.tf);
    while (voxelGrid.level < this.maxlevel && voxelGrid.length < this.maxvoxel) {
      voxelGrid.subdivide();
      console.log(voxelGrid.level, voxelGrid.length);
      gl.uniform1i(this.tf.shader.getUniformLocation("level"), voxelGrid.level);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, this.inbuffer);
      
      
      gl.bufferData(gl.ARRAY_BUFFER, voxelGrid.getVoxelsXyzFlatUInt16(), gl.STATIC_DRAW);

      //gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, this.outbuffer); //set buffer size
      //gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER, voxelGrid.length * 4, gl.DYNAMIC_READ); //*4 because  size is in bytes and i have ints


      //gl.beginTransformFeedback(gl.POINTS);
      //gl.drawArrays(gl.POINTS, 0, voxelGrid.length);
      //gl.endTransformFeedback();

      //gl.finish();

      // Read back results
      //gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, this.outbuffer);
      //const results = new Int32Array(voxelGrid.length);
      //gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, results);
      const outputarray=this.tf.run(voxelGrid.length)[0];

      // Use results for next iteration
      voxelGrid.voxels = voxelGrid.voxels.filter((val,index)=>outputarray[index]);



      //console.log(inarray);
      //console.log("out",inarray);
      //console.log(inarray.map(x=>this.unpackVoxel(x)));
      //this.level=level;
    }
    gl.bufferData(gl.ARRAY_BUFFER, 0, gl.STATIC_DRAW);
    
    //gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    //gl.disable(gl.RASTERIZER_DISCARD);
    gl.bindVertexArray(null);
    this.tf.clearbuffers();

  }
}
