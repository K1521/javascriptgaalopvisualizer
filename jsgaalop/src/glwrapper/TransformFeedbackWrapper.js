import { Shader } from "./glwrapper.js";


export function makeGLTypeInfoMap(gl) {
  return {
    [gl.BYTE]:              { name: "BYTE", components: 1 },
    [gl.UNSIGNED_BYTE]:     { name: "UNSIGNED_BYTE", components: 1 },
    [gl.SHORT]:             { name: "SHORT", components: 1 },
    [gl.UNSIGNED_SHORT]:    { name: "UNSIGNED_SHORT", components: 1 },
    [gl.INT]:               { name: "INT", components: 1 },
    [gl.UNSIGNED_INT]:      { name: "UNSIGNED_INT", components: 1 },
    [gl.FLOAT]:             { name: "FLOAT", components: 1 },

    [gl.FLOAT_VEC2]:        { name: "FLOAT_VEC2", components: 2 },
    [gl.FLOAT_VEC3]:        { name: "FLOAT_VEC3", components: 3 },
    [gl.FLOAT_VEC4]:        { name: "FLOAT_VEC4", components: 4 },

    [gl.INT_VEC2]:          { name: "INT_VEC2", components: 2 },
    [gl.INT_VEC3]:          { name: "INT_VEC3", components: 3 },
    [gl.INT_VEC4]:          { name: "INT_VEC4", components: 4 },

    [gl.UNSIGNED_INT_VEC2]: { name: "UNSIGNED_INT_VEC2", components: 2 },
    [gl.UNSIGNED_INT_VEC3]: { name: "UNSIGNED_INT_VEC3", components: 3 },
    [gl.UNSIGNED_INT_VEC4]: { name: "UNSIGNED_INT_VEC4", components: 4 },

    [gl.BOOL]:              { name: "BOOL", components: 1 },
    [gl.BOOL_VEC2]:         { name: "BOOL_VEC2", components: 2 },
    [gl.BOOL_VEC3]:         { name: "BOOL_VEC3", components: 3 },
    [gl.BOOL_VEC4]:         { name: "BOOL_VEC4", components: 4 },

    [gl.FLOAT_MAT2]:        { name: "FLOAT_MAT2", components: 4 },
    [gl.FLOAT_MAT3]:        { name: "FLOAT_MAT3", components: 9 },
    [gl.FLOAT_MAT4]:        { name: "FLOAT_MAT4", components: 16 },

    [gl.FLOAT_MAT2x3]:      { name: "FLOAT_MAT2x3", components: 6 },
    [gl.FLOAT_MAT2x4]:      { name: "FLOAT_MAT2x4", components: 8 },
    [gl.FLOAT_MAT3x2]:      { name: "FLOAT_MAT3x2", components: 6 },
    [gl.FLOAT_MAT3x4]:      { name: "FLOAT_MAT3x4", components: 12 },
    [gl.FLOAT_MAT4x2]:      { name: "FLOAT_MAT4x2", components: 8 },
    [gl.FLOAT_MAT4x3]:      { name: "FLOAT_MAT4x3", components: 12 }
  };
}


export class TransformFeedbackWrapper {

  /**
   * Constructs a TransformFeedbackWrapper instance.
   *
   * @param {WebGL2RenderingContext} gl - The WebGL2 rendering context.
   * @param {string} vertexshader - The GLSL source code for the vertex shader.
   * @param {string[]} varyings - A list of output variable names (as strings) to be captured via transform feedback.
   *
   * The specified varyings must exactly match the names of `out` variables in the vertex shader.
   * Each varying will be assigned a separate buffer, and the shader will be compiled with transform feedback enabled.
   */
  constructor(gl, vertexshader, varyings) {
    this.gl = gl;
    this.shader = new Shader(gl, vertexshader, null, varyings);
    this.varyings = this.shader.getTransformFeedbackVaryings();
    this.buffers = [];
    //output transform feedback and buffer
    this.tf = gl.createTransformFeedback();

    const typemap = makeGLTypeInfoMap(gl);
    //console.log(typemap);



    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.tf);

    this.buffers = this.varyings.map((varying, i) => {
      const buffer = gl.createBuffer();
      //gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER,outbuffer);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, i, buffer);
      const { name:varyingTypeName, components:componentsPerElement } = typemap[varying.type];
      let arrayConstructor;

      if (varyingTypeName.startsWith("FLOAT")) {
        arrayConstructor = Float32Array;
      } else if (varyingTypeName.startsWith("INT")) {
        arrayConstructor = Int32Array;
      } else if (varyingTypeName.startsWith("UNSIGNED_INT")) {
        arrayConstructor = Uint32Array;
      } else {
        throw new Error("Unsupported varying type: " + varyingTypeName);
      }
      const elementsPerVertex = varying.size;
      const elementsPerVertexTotal = elementsPerVertex * componentsPerElement;
      const bytesPerVertex = elementsPerVertexTotal * arrayConstructor.BYTES_PER_ELEMENT;
      //const bytesPerVertex=arrayConstructor.BYTES_PER_ELEMENT*elementsPerVertex*componentsPerElement;
      return { buffer, arrayConstructor, elementsPerVertex, componentsPerElement, bytesPerVertex, elementsPerVertexTotal };
    });
    Float32Array.BYTES_PER_ELEMENT;

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

  }
  useshader() {
    this.shader.use();
  }

  /**
   * 
   * @param {Number} vertexcount 
   * @returns {(Int32Array|Uint32Array|Float32Array)[]}
   */
  run(vertexcount) {
    const gl = this.gl;
    this.shader.use();

    gl.enable(gl.RASTERIZER_DISCARD);

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.tf);
    //gl.beginTransformFeedback(gl.POINTS);
    for (const { bytesPerVertex, buffer } of this.buffers) {
      gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, buffer); //set buffer size
      gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER, bytesPerVertex * vertexcount, gl.DYNAMIC_READ);
    }


    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, vertexcount);
    gl.endTransformFeedback();

    gl.finish();

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    gl.disable(gl.RASTERIZER_DISCARD);
    //gl.bindVertexArray(null);
    // Read back results
    const results = [];
    for (const { elementsPerVertexTotal, arrayConstructor, buffer } of this.buffers) {
      //const {by,arrayConstructor}=this.buffers[i];
      const outArray = new arrayConstructor(elementsPerVertexTotal * vertexcount);
      gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, buffer); //set buffer size
      gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, outArray);
      results.push(outArray);
    }
    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);

    return results;

  }
  clearbuffers(){
    const gl=this.gl;
    for (const { buffer } of this.buffers) {
      gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, buffer); //set buffer size
      gl.bufferData(gl.ARRAY_BUFFER, 0, gl.STATIC_DRAW);
    }
  }
}
