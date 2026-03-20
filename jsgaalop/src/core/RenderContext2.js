
import { throwonglerror } from "../glwrapper/glwrapper.js";
import { Cameracontroll } from "../glwrapper/cameracontroll.js";
import {MultiResBuffer3} from "../multires/MultiResBuffer3.js";
import {evalContext} from "./codegenv4/codegenBackpropergation2.js";



function radians(degrees) {
    return degrees * Math.PI / 180;
}





export class RenderContext {
  constructor(canvas,evalContext, gl, camera=undefined) {
    this.requestRender = this.requestRender.bind(this);
    this.camMoved = this.camMoved.bind(this);
    this.deferToRender = this.deferToRender.bind(this);


    this.canvas = canvas;
    this.gl = gl;

    this.camera = camera ?? new Cameracontroll(canvas, gl);
    /*this.params = new Map(); // key-value store for parameters
    this.nodecache= new Map(); 
    this.paramsversion=0;*/
    /**@type {evalContext} */
    this.evalContext=evalContext;

    this.objects=new Map();//list of RenderObjects

    this.multires=new MultiResBuffer3(this);//new MultiResBuffer2(this);


    this.scheduledfunctions=[];


    this.changed=true;
    this.moved=true;//moved is not used i belive?
    this.camera.onChange=this.camMoved;


    window.addEventListener("resize", this.deferToRender(()=>{
      this.multires.resize();
      this.requestRender();
      console.log("resize");
    }));
    window.dispatchEvent(new Event("resize"));
  }

  scheduleOnRender(fn){this.scheduledfunctions.push(fn);}
  deferToRender(fn) {
    return (...args) => {
      this.scheduleOnRender(() => fn(...args));
    };
  }


  addObject(obj){
    obj.ctx=this;
    if(this.objects.has(obj.name))
      console.warn("added object twice");
    this.objects.set(obj.name,obj);
  }

  requestRender(){ 
    this.changed=true;
  }

  camMoved(){
    this.requestRender();
    this.moved=true;//not used i belive?
    //console.log("changed");
  }


  static BUSY="busy";
   static FINISHED="finished";
    static UNCHANGED="unchanged";

  render(deltatime,force=false){
    //run all the scheduled functions
    for(const fn of this.scheduledfunctions)fn();
    this.scheduledfunctions=[]


    //console.log("render",this.changed)
    this.camera.update(deltatime);
    this.multires.update();

    if(!(this.changed||force))return RenderContext.UNCHANGED;
    this.changed=false;
    this.moved=false;
    throwonglerror(this.gl,true);
    this.multires.render();
    throwonglerror(this.gl,false);

    //return true;
    if(this.multires.finished){
      return RenderContext.FINISHED;
    }
    else return RenderContext.BUSY;
  }


  registerParams(newparams,{ignoreReserved=false}={}){
    this.evalContext.registerParams(newparams,{ignoreReserved});
  }
  //context.registerParams(graph.inputScalars.keys(), { ignoreReserved: true });

  /**
   * Merges new parameter values into the current parameter set.
   * Only registered parameters may be changed.
   * Reserved parameters are always rejected.
   * 
   * @param {Map<string, number>} newParams - Map of parameter names and new values.
   * @throws Will throw if any key is unregistered or reserved.
   */
  paramsChanged(newParams = new Map()) {
    this.evalContext.paramsChanged(newParams);
    this.requestRender();
  }

  updateParams(){
    throwonglerror(this.gl,true);
    for(const object of this.objects.values()){
      object.updateParams(this);
    }
    throwonglerror(this.gl,false);
  }
   
  


  get clientResolution(){
    //actual canvas res in pixel
    const canvas=this.canvas;
    return [canvas.clientWidth, canvas.clientHeight];
  }

  get resolution(){
    //canvas res for rendering
    const canvas=this.canvas;
    return [canvas.width,canvas.height];
  }
  updateUniforms(shader) {
    this.camera.updateuniforms(shader);
    this.updateUniformWindowsize(shader);
  }
  updateUniformWindowsize(shader){
    const windowsizeLoc = shader.getUniformLocation("windowsize");
    if (windowsizeLoc) shader.gl.uniform2fv(windowsizeLoc, this.resolution);


    const focalLoc = shader.getUniformLocation("focal");
    if (focalLoc) {
      const fovDeg = this.camera.fov;
      const aspect =  this.resolution[0] /  this.resolution[1];
      const f = 1.0 / Math.tan(radians(fovDeg) * 0.5);

      const focal = [f, f*aspect]; // x = horizontal focal, y = vertical focal //fov in x dir
      //const focal = [f/aspect, f]; // x = horizontal focal, y = vertical focal //fov in y dir
      shader.uniform2fv("focal", focal);
    }
  }
  updateViewport(gl=undefined){
    gl??=this.gl;
    const [w, h] = this.resolution;
    //gl.viewport(0, 0, w, h);
    gl.viewport(0, 0, w, h);

    //const windowsizeLocation = this.pointshader.getUniformLocation('windowsize');
    //shader.gl.uniform2fv(windowsizeLocation, this.resolution);
  }
  bindquad() {
    if (this._quad === undefined) {
      const gl = this.gl;
      const vertices = new Float32Array([
        -1, 1,
        -1, -1,
        1, 1,
        1, -1
      ]);

      this._quad= gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this._quad );
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this._quad );
  }

  bindquadvao(){
    if (this._quadvao === undefined) {
      this._quadvao = gl.createVertexArray();
      gl.bindVertexArray(this._quadvao);
      const loc = 0;//this.shader.getAttribLocation("uv");
      this.bindquad();
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }
    gl.bindVertexArray(this._quadvao);
    //return this._quadvao;
  }
  
}


