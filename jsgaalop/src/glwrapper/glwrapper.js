import { Matrix,Vector } from "../util/linalg1.js";
import { TupleMap } from "../util/tuplemap.js";






const pendingFences=[];
let lastCompleated=null;
/**
 * i had some webgl2 context crashes but only somtimes. (like maybe once in 5 minutes)
 * The gpu and cpu are desynced. This means the cpu can be like 2 frames ahead of the cpu or something like that.
 * This makes finding where the context crashed hard.
 * to find where the context crashes my idea was to add fences to the gpu while also storring the current stacktrace.
 * This way i could somewhat see where the last executed glsl command happen in javascript.
 * this method throws if the context is lost. It also gives me the stacktrace of the latt executed and next pending fence point.
 * After implementing this function and adding some calls throughout thecode, the bug disappeared.
 * This means i dont know why it crashed but it currently works. 
 * @param {WebGL2RenderingContext} gl 
 */
export function throwonglerror(gl,makefence=true){
  if(gl.isContextLost()&&pendingFences){
    console.log("lastCompleated");
    console.log(lastCompleated);
    if(pendingFences.length>0){
      console.log("next pending");
      console.log(pendingFences[0].stack);
    }else console.log("no pending fences")
  }
  while(pendingFences.length>0 && gl.clientWaitSync(pendingFences[0].sync, 0, 0)==gl.ALREADY_SIGNALED){
    const {sync,stack}=pendingFences.shift();
    lastCompleated=stack;
    gl.deleteSync(sync);
  }
  if(makefence){
  const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  //gl.flush(); // important, but NOT finish()

  pendingFences.push({
    sync,
    stack: new Error().stack
  });
}


  const error=gl.getError();

  if(error==gl.NO_ERROR)return;
  if(error==gl.INVALID_ENUM)throw new Error("gl.INVALID_ENUM");
  if(error==gl.INVALID_VALUE)throw new Error("gl.INVALID_VALUE");
  if(error==gl.INVALID_OPERATION)throw new Error("gl.INVALID_OPERATION");
  if(error==gl.INVALID_FRAMEBUFFER_OPERATION)throw new Error("gl.INVALID_FRAMEBUFFER_OPERATION");
  if(error==gl.OUT_OF_MEMORY)throw new Error("gl.OUT_OF_MEMORY");
  if(error==gl.CONTEXT_LOST_WEBGL)throw new Error("gl.CONTEXT_LOST_WEBGL");
  if(gl.isContextLost())throw new Error("Context lost");
  throw new Error(error);
}


export class Shader{
  static emptyfragmentshader = `#version 300 es
  precision highp float;
  void main() {
  }
  `;


  /**
 * Creates and links a WebGL shader program from provided vertex and fragment shader sources.
 * Also sets up transform feedback varyings if provided.
 *
 * @param {WebGL2RenderingContext} gl - The WebGL context to use for shader creation and linking.
 * @param {string} vertexShaderSource - GLSL source code for the vertex shader.
 * @param {string} fragmentShaderSource - GLSL source code for the fragment shader.
 *                                         If not provided, an empty fragment shader is used.
 * @param {string[] | undefined} varyings - (Optional) List of varying variable names to be captured
 *                                          for transform feedback. If provided, transform feedback
 *                                          is set up before linking the program.
 * @param {GLenum | undefined} buffermode - (Optional) Specifies the transform feedback buffer mode.
 *                                          Can be either `gl.INTERLEAVED_ATTRIBS` or `gl.SEPARATE_ATTRIBS`.
 *                                          Defaults to `gl.INTERLEAVED_ATTRIBS` if not set.
 *
 * @throws Will throw a descriptive error if shader compilation fails.
 *         Shader sources will be logged with line numbers for debugging.
 *
 * @example
 * const shader = new Shader(gl, vertexSrc, fragSrc);
 * shader.use();
 */
  
  constructor(gl,vertexShaderSource,fragmentShaderSource,varyings=undefined,buffermode=undefined){
    //this.programm=Shader.createProgram(gl, vertexShaderSource,fragmentShaderSource );

    if (typeof vertexShaderSource !== "string") {
      throw new TypeError("vertexShaderSource must be a string");
    }

    if (typeof fragmentShaderSource !== "string" && fragmentShaderSource !== null) {
      throw new TypeError("fragmentShaderSource must be a string or null");
    }

    // optional: check `gl` is a WebGL2 context
    if (!(gl instanceof WebGL2RenderingContext)) {
      throw new TypeError("gl must be a WebGL2RenderingContext");
    }

    // optional: varyings should be an array of strings if defined
    if (varyings !== undefined && !Array.isArray(varyings)) {
      throw new TypeError("varyings must be an array if provided");
    }

    // optional: buffermode should be gl.INTERLEAVED_ATTRIBS or gl.SEPARATE_ATTRIBS if defined
    if (buffermode !== undefined && buffermode !== gl.INTERLEAVED_ATTRIBS && buffermode !== gl.SEPARATE_ATTRIBS) {
      throw new TypeError("buffermode must be gl.INTERLEAVED_ATTRIBS or gl.SEPARATE_ATTRIBS if provided");
    }

    this.gl=gl;
    buffermode??=gl.INTERLEAVED_ATTRIBS; //cant be a default arg because gl doesnt exist

    //compile the shader
    this.vertexShader = Shader.compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    this.fragmentShader = Shader.compileShader(gl, fragmentShaderSource ?? Shader.emptyfragmentshader, gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    this.program=program;
    gl.attachShader(program, this.vertexShader);
    gl.attachShader(program, this.fragmentShader);

    if(varyings){
      this.varyings=varyings;
      gl.transformFeedbackVaryings(
        program,
        varyings,
        buffermode,
      );
    }

    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link failed:", gl.getProgramInfoLog(program));
    }


    //init cache
    this.attributelocations=new Map();
    this.uniformlocations=new Map();
  }

  dispose() {
    if (!this.gl) return; // already dead

    const gl = this.gl;

    if (this.program) {
      gl.useProgram(null);

      if (this.vertexShader) {
        gl.detachShader(this.program, this.vertexShader);
        gl.deleteShader(this.vertexShader);
      }

      if (this.fragmentShader) {
        gl.detachShader(this.program, this.fragmentShader);
        gl.deleteShader(this.fragmentShader);
      }

      gl.deleteProgram(this.program);
    }


    this.attributelocations?.clear();
    this.uniformlocations?.clear();


    this.vertexShader = null;
    this.fragmentShader = null;
    this.program = null;
    this.gl = null;
  }

  /**
   * Retrieves the list of WebGLActiveInfo objects for each transform feedback varying.
   *
   * @returns {WebGLActiveInfo[]|undefined} An array of info objects (name, size, type), or undefined if no varyings are defined.
   */
  getTransformFeedbackVaryings() {
    if (!this.varyings) return undefined;

    return this.varyings.map((_, i) =>
      this.gl.getTransformFeedbackVarying(this.program, i)
    );
  }
  

  use(){
    this.gl.useProgram(this.program);
  }

  getUniformLocation(name){
    var loc=this.uniformlocations.get(name);
    if(loc==undefined){
      loc=this.gl.getUniformLocation(this.program,name);
      this.uniformlocations.set(name,loc);
    }
    return loc;
  }
  getAttribLocation(name){
    var loc=this.attributelocations.get(name);
    if(loc==undefined){
      loc=this.gl.getAttribLocation(this.program,name);
      this.attributelocations.set(name,loc);
    }
    return loc;
  }
  
  static cache=new TupleMap();
  static compileShaderCached(gl, source, type){
    const cache=Shader.cache;
    const key=[gl, source, type];
    if(!cache.has(key)){
      return cache.set(key,Shader.compileShader(gl, source, type));
    }
    return cache.get(key);
  }

  static compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const infoLog = gl.getShaderInfoLog(shader);
      const shaderType = type === gl.VERTEX_SHADER ? "VERTEX" : "FRAGMENT";

      // Line-numbered source for debugging
      const numberedSource = source
        .split('\n')
        .map((line, i) => `${(i + 1).toString().padStart(3, ' ')}: ${line}`)
        .join('\n');

      console.groupCollapsed(`${shaderType} shader compilation failed`);
      console.log(numberedSource);
      console.groupEnd();

      // Throw with detailed message (includes new line)
      throw new Error(`Shader compile failed (${shaderType}):\n${infoLog}`);
    }

    return shader;
  }

  resolveUniformLocation(nameOrLocation) {
    return (typeof nameOrLocation === "string")
      ? this.getUniformLocation(nameOrLocation)
      : nameOrLocation;
  }

  uniform1i(nameOrLocation, value) {
    const loc = this.resolveUniformLocation(nameOrLocation);
    if (loc === null) return false;
    this.gl.uniform1i(loc, value);
  }

  uniform2i(nameOrLocation, v1,v2) {
    const loc = this.resolveUniformLocation(nameOrLocation);
    if (loc === null) return false;
    this.gl.uniform2i(loc, v1,v2);
  }

  uniform3i(nameOrLocation, v1,v2,v3) {
    const loc = this.resolveUniformLocation(nameOrLocation);
    if (loc === null) return false;
    this.gl.uniform3i(loc, v1,v2,v3);
  }

  uniform4i(nameOrLocation, v1,v2,v3,v4) {
    const loc = this.resolveUniformLocation(nameOrLocation);
    if (loc === null) return false;
    this.gl.uniform4i(loc, v1,v2,v3,v4);
  }

  uniform1f(nameOrLocation, v1) {
    const loc = this.resolveUniformLocation(nameOrLocation);
    if (loc === null) return false;
    this.gl.uniform1f(loc, v1);
  }

  uniform2f(nameOrLocation, v1,v2) {
    const loc = this.resolveUniformLocation(nameOrLocation);
    if (loc === null) return false;
    this.gl.uniform2f(loc, v1,v2);
  }

  uniform3f(nameOrLocation, v1,v2,v3) {
    const loc = this.resolveUniformLocation(nameOrLocation);
    if (loc === null) return false;
    this.gl.uniform3f(loc, v1,v2,v3);
  }

  uniform4f(nameOrLocation, v1,v2,v3,v4) {
    const loc = this.resolveUniformLocation(nameOrLocation);
    if (loc === null) return false;
    this.gl.uniform4f(loc, v1,v2,v3,v4);
  }

  uniform1fv(nameOrLocation, value) {
    const loc = this.resolveUniformLocation(nameOrLocation);
    if (loc === null) return false;
    this.gl.uniform1fv(loc, value);
  }

  uniform2fv(nameOrLocation, value) {
    const loc = this.resolveUniformLocation(nameOrLocation);
    if (loc === null) return;
    this.gl.uniform2fv(loc, value);
  }

  uniform3fv(nameOrLocation, value) {
    const loc = this.resolveUniformLocation(nameOrLocation);
    if (loc === null) return;
    this.gl.uniform3fv(loc, value);
  }

  uniform4fv(nameOrLocation, value) {
    const loc = this.resolveUniformLocation(nameOrLocation);
    if (loc === null) return;
    this.gl.uniform4fv(loc, value);
  }

  setuniform1fs(kvmap){
    for([k,v]of kvmap.entries()){
      this.uniform1f(k,v);
    }
  }


}


  export class renderingpipeline{
    constructor(cameracontroll,shader){
      this.camera=cameracontroll;
      this.shader=shader;
      this.verticesbuffer=this.makeVerticesbuffer();
      

      this.resizeCanvas=this.resizeCanvas.bind(this)
      this.resizeCanvas();
      window.addEventListener("resize", this.resizeCanvas);
  
    }
    render(){
      this.camera.updateuniforms(this.shader);
      //gl.clearColor(0.0, 0.0, 0.0, 1.0);
      //gl.clear(gl.COLOR_BUFFER_BIT);
      this.shader.gl.drawArrays(this.shader.gl.TRIANGLE_STRIP, 0, 4);
      this.camera.changed=false;
    }
    resizeCanvas() {
      const canvas=this.camera.canvas;
      const windowsizeLocation = this.shader.getUniformLocation('windowsize');
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      this.shader.gl.viewport(0, 0, canvas.width, canvas.height);
      const windowsize = [canvas.width, canvas.height];
      this.shader.gl.uniform2fv(windowsizeLocation, windowsize);
      this.camera.changed=true;
    }
   
    makeVerticesbuffer(){
      let gl=this.shader.gl;
      const vertices = new Float32Array([
        -1, 1,
        -1,-1,
        1, 1,
        1,-1
      ]);
  
      const verticesbuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, verticesbuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  
      const positionAttribLocation =this.shader.getAttribLocation("a_position");
      gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(positionAttribLocation);
      return verticesbuffer;
    }
  
  
  
  }

export class renderingpipeline_coeffxyz extends renderingpipeline{
    constructor(cameracontroll,shader){
      super(cameracontroll,shader);
      this.funmatbuffer=undefined;//this is here so i dont forget it
  
    }
    
   
    coefficientsxyz(funmat){
      for(let i=0;i<funmat.size()[0];i++)
      for(let j=0;j<funmat.size()[1];j++){
        this.shader.gl.uniform1f(this.shader.getUniformLocation(`coefficientsxyz[${i*15+j}]`), funmat.array[i][j]);
      }
    }
    coefficientsxyzbuffer(funmat){
      let gl=this.shader.gl;
      if(this.ubo===undefined) this.ubo=this.makeCoefficientsxyzBuffer();
      gl.bindBuffer(gl.UNIFORM_BUFFER, this.ubo);
      gl.bufferData(gl.UNIFORM_BUFFER, new Float32Array(funmat.array.flat().map(x=>[x,0,0,0]).flat()), gl.STATIC_DRAW);
    }
    makeCoefficientsxyzBuffer(){
      let gl=this.shader.gl;
      const ubo = gl.createBuffer();
      gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
      const blockIndex = gl.getUniformBlockIndex(this.shader.programm, "MyUBO");
      // Bind the UBO to a binding point (0 in this case)
      gl.uniformBlockBinding(shader.programm, blockIndex, 0);
      // Bind the UBO to the uniform binding point (0)
      gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, ubo);
      return ubo;
    }
   
  
  }
  



