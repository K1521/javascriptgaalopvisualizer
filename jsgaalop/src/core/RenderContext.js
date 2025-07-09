
import { Cameracontroll } from "../glwrapper/glwrapper.js";
import {MultiResBuffer3} from "../multires/MultiResBuffer3.js";

function radians(degrees) {
    return degrees * Math.PI / 180;
}



export class RenderContext {
  constructor(canvas, gl, camera=undefined) {
    this.requestRender = this.requestRender.bind(this);
    this.camMoved = this.camMoved.bind(this);



    this.canvas = canvas;
    this.gl = gl;

    this.camera = camera ?? new Cameracontroll(canvas, gl);
    this.params = new Map(); // key-value store for parameters
    this.nodecache= new Map(); 
    this.paramsversion=0;

    this.objects=new Map();;//list of RenderObjects

    this.multires=new MultiResBuffer3(this);//new MultiResBuffer2(this);



    window.addEventListener("resize", ()=>{
      this.multires.resize();
      this.requestRender();
    });
    window.dispatchEvent(new Event("resize"));


    


    this.changed=true;
    this.moved=true;//moved is not used i belive?
    this.camera.onChange=this.camMoved;
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

  

  render(deltatime,force=false){
    console.log("render",this.changed)
    this.camera.update(deltatime);
    this.multires.update();

    if(!(this.changed||force))return false;
    this.changed=false;
    this.moved=false;
    
    this.multires.render();
    return true;
  }



  paramsChanged(newparams=undefined){
    this.params=newparams??this.params;
    this.nodecache=new Map(this.params);
    this.paramsversion = (this.paramsversion + 1) % Number.MAX_SAFE_INTEGER;//the modulo is useless because it wont overflow for years if you call this thousends of times per seccond
    
  }

  updateParams(){
    for(const object of this.objects.values()){
      object.updateParams(this);
    }
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
      const fovDeg = 120;
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


