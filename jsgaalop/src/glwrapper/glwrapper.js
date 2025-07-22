import { Matrix,Vector } from "../util/linalg1.js";
import { TupleMap } from "../util/tuplemap.js";


function radians(degrees){return degrees*Math.PI/180;}


export class Cameracontroll{
    constructor(canvas,gl,_onChange=null){
        //todo replace gl with this.gl
      this.canvas=canvas;
      this.colorpicker=true;
      this.c2w=Matrix.eye(3);
      this.cameraPos = new Vector([0,0,0]);
      this.gl=gl;
      this.mouse = {
        x: undefined,
        y: undefined,
        left: false,  
        right: false, 
        middle: false
      };
      this.keysPressed = {
        w: false,
        a: false,
        s: false,
        d: false,
        q: false,
        e: false,
        shift: false,
        space: false
      };

      this.initeventlisteners()

      this.onChange = _onChange;
    }

    set onChange(callback) {
      this._onChange = callback;
      this.camChanged();
    }

    camChanged(){
      this._onChange?.();
    }

    mousemove(event){
      const rect = this.canvas.getBoundingClientRect();
      const xcord=event.clientX - rect.left;
      const ycord=event.clientY - rect.top;
      //const dx=xcord-mouse.x;
      //const dy=event.clientY-mouse.y;
      if(this.mouse.x===undefined){
        this.mouse.x=xcord;
        this.mouse.y=ycord;
      }
  
      if(this.mouse.left){
        
        const width=rect.right-rect.left;
        const height=rect.bottom-rect.top;
        const fovfactor=1/Math.tan(radians(120)/2);
        
        const u= c=>(2.0*c-width)/width;//cords between [-1,1]
        const v= c=>(2.0*c-height)/width;
        const uangle=(Math.atan(u(xcord)/fovfactor)-Math.atan(u(this.mouse.x)/fovfactor));
        const vangle=(Math.atan(v(ycord)/fovfactor)-Math.atan(v(this.mouse.y)/fovfactor));
  
  
        this.c2w=this.c2w.mul(Matrix.rotationMatrix(new Vector([0,-1,0]),uangle).mul(
            Matrix.rotationMatrix(new Vector([-1,0,0]),vangle)));
        this.camChanged();
      }
  
      this.mouse.x = xcord;
      this.mouse.y = ycord;
    }
  
    mousedown(event){
      // Update mouse button states
      if (event.button === 0) this.mouse.left = true;    // Left button
      if (event.button === 1) this.mouse.middle = true;  // Middle button
      if (event.button === 2) this.mouse.right = true;   // Right button
  
      if(this.colorpicker){
        const x = event.clientX;
        const y = this.canvas.height - event.clientY; // Flip Y since WebGL has (0,0) at bottom-left
        const pixels = new Uint8Array(4); // RGBA
        this.gl.readPixels(x, y, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
        const color = `rgb(${(pixels[0]/255).toFixed(3)}, ${(pixels[1]/255).toFixed(3)}, ${(pixels[2]/255).toFixed(3)}, ${(pixels[3]/255).toFixed(3)})    rgb(${pixels[0]}, ${pixels[1]}, ${pixels[2]}, ${pixels[3]})    (${pixels[0]-128}, ${pixels[1]-128}, ${pixels[2]-128}, ${pixels[3]-128})`;
        console.log(color); // Display the color in console or UI
      }
    }
  
    mouseup(event){
      // Update mouse button states
      if (event.button === 0) this.mouse.left = false;
      if (event.button === 1) this.mouse.middle = false;
      if (event.button === 2) this.mouse.right = false;
    }
  
    keydown(event){
      if (event.key === ' ') {  // Space key
        this.keysPressed.space = true;
      }else{
        this.keysPressed[event.key.toLowerCase()]=true;
      }
    }
  
    keyup(event){
      if (event.key === ' ') {  // Space key
        this.keysPressed.space = false;
      }else{
        this.keysPressed[event.key.toLowerCase()]=false;
      }
    }
  
    initeventlisteners(){
      // Bind event listener functions to maintain 'this' context
      this.mousemove = this.mousemove.bind(this);
      this.mousedown = this.mousedown.bind(this);
      this.mouseup = this.mouseup.bind(this);
      this.keydown = this.keydown.bind(this);
      this.keyup = this.keyup.bind(this);
  
      window.addEventListener('mousemove', this.mousemove);
      this.canvas.addEventListener('mousedown', this.mousedown);//uses canvas because moving on other elements shouldnt influence the camera
      window.addEventListener('mouseup', this.mouseup);
      window.addEventListener('keydown',this.keydown);
      window.addEventListener('keyup',this.keyup);
    }
    update(deltatime){
      this.c2w=this.c2w.orthogonalize();//orthogonalize only against precision errors. probably unnessesary
      let movementfactor=deltatime;
      let deltapos=new Vector([0,0,0]);
      if(this.keysPressed.shift)movementfactor/=10;
      if(this.keysPressed.space)movementfactor*=5;
      if(this.keysPressed.a)deltapos=deltapos.add(new Vector([-1,0,0]));
      if(this.keysPressed.d)deltapos=deltapos.add(new Vector([1,0,0]));
      if(this.keysPressed.s)deltapos=deltapos.add(new Vector([0,0,-1]));
      if(this.keysPressed.w)deltapos=deltapos.add(new Vector([0,0,1]));
      if(this.keysPressed.q){
        this.c2w=this.c2w.mul(Matrix.rotationMatrix(new Vector([0,1,0]),radians(-movementfactor*30)));
        this.camChanged();
      };
      if(this.keysPressed.e){
        this.c2w=this.c2w.mul(Matrix.rotationMatrix(new Vector([0,1,0]),radians(movementfactor*30)));
        this.camChanged();
      };
      deltapos=deltapos.mul(movementfactor*4);
      if(deltapos.length()>0){
        this.camChanged();
        this.cameraPos = this.cameraPos.add(this.c2w.mul(deltapos));
      }
    }
    updateuniforms(shader){
      const cameraPosLocation = shader.getUniformLocation('cameraPos');
      shader.gl.uniform3fv(cameraPosLocation, this.cameraPos.array);
      const c2wLocation = shader.getUniformLocation("cameraMatrix");
      shader.gl.uniformMatrix3fv(c2wLocation, true, new Float32Array(this.c2w.array.flat()));
    }

    resizeCanvas(scale = 1.0) {
      const canvas = this.canvas;
      const dpr = window.devicePixelRatio || 1;
      const width = Math.floor(canvas.clientWidth * dpr * scale);
      const height = Math.floor(canvas.clientHeight * dpr * scale);
      canvas.width = width;
      canvas.height = height;
      return [width, height];
    }

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
    this.gl=gl;
    buffermode??=gl.INTERLEAVED_ATTRIBS; //cant be a default arg because gl doesnt exist

    //compile the shader
    const vertexShader = Shader.compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = Shader.compileShader(gl, fragmentShaderSource ?? Shader.emptyfragmentshader, gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    this.program=program;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

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
    if (loc === null) return;
    this.gl.uniform1i(loc, value);
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
  



