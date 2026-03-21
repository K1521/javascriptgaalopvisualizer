

import { Vector} from './../util/linalg1.js';
//import {Cameracontroll,renderingpipeline,renderingpipeline_coeffxyz,Shader} from "../glwrapper/glwrapper.js";
import { loadWithIncludesRelativeToShadersource} from "../glwrapper/shaderimporter.js";
import {TransformFeedbackWrapper} from "../glwrapper/TransformFeedbackWrapper.js";
import {GaalopGraph} from "./codegenv4/codegenBackpropergation2.js";
import { RenderableObject } from "./RenderableObject.js";
//import { pinv, multiply, transpose ,qr} from 'https://cdn.jsdelivr.net/npm/mathjs@14.5.2/+esm';
import { RenderContext } from "./RenderContext.js";
//import { matrixextractor } from "../objectcontext/matrixextractor.js";
//import { BasisConvert } from "../objectcontext/BasisConvert.js";


//import { pointcloudrenderer } from "../pipelines/pointcloudrenderer.js";
//import { linegridrenderer } from "../pipelines/linegridrenderer.js";
//import { simplerenderer } from "../pipelines/v2/simplerenderer.js";
import { aberthrenderer } from "../pipelines/v2/aberthrenderer.js";
import { udfrenderer } from "../pipelines/v2/udfrenderer.js";
import { Voxelrenderer } from "../pipelines/v2/Voxelrenderer.js";
import { VoxelDistRenderer } from "../pipelines/v2/VoxelDistRenderer.js";
import { VoxelGNRenderer } from "../pipelines/v2/VoxelGNRenderer.js";
import { VoxelIterRenderer } from '../pipelines/v2/VoxelIterRenderer.js';
//import { matrixrenderer } from "../pipelines/matrixrenderer.js";
//import { Voxelrenderer } from "../pipelines/Voxelrenderer.js";
import { addPipelineSelectorForObject } from "../ui/PipelineSelector.js";
//import { MarchingCubesRenderer } from "../pipelines/MarchingCubesRenderer.js";

import { makeSlider,ReorderableList } from "../ui/sliders.js";
//import { MarchingCubesRenderer2 } from "../pipelines/MarchingCubesRenderer2.js";
import { MarchingCubesRenderer } from '../pipelines/v2/MarchingCubesRenderer2.js';
import { TopGridRenderer } from '../pipelines/v2/TopGrid.js';
//import { throwonglerror } from "../glwrapper/glwrapper.js";

window.DEBUG_LOG = ["test"];

class RenderLoop {
  constructor(gl, animate) {
    this.gl = gl;
    this.animate = animate; // now expects a timestamp param
    this.syncold = null;
    this.syncnew = null;
    this.running = false;
  }

  loop(timestamp) {
    if (!this.running) return;

    const gl = this.gl;

    /*if (!this.syncold){
        const status=gl.clientWaitSync(this.syncold,  gl.SYNC_FLUSH_COMMANDS_BIT, 0);
        //console.log(status);
        if(status==gl.TIMEOUT_EXPIRED)console.log("TIMEOUT_EXPIRED");
        else if(status==gl.ALREADY_SIGNALED)console.log("ALREADY_SIGNALED");
        else if(status==gl.CONDITION_SATISFIED)console.log("CONDITION_SATISFIED");
        else if(status==gl.WAIT_FAILED)console.log("WAIT_FAILED");
        
      }*/
    if (
      !this.syncold || 
      gl.clientWaitSync(this.syncold,  gl.SYNC_FLUSH_COMMANDS_BIT, 0)!== gl.TIMEOUT_EXPIRED
    )  {
      if (this.syncold) {
        gl.deleteSync(this.syncold);
        this.syncold = null;
      }

      this.animate(timestamp); // forward timestamp here
      //gl.finish();

      this.syncold = this.syncnew;
      this.syncnew = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      //gl.finish();
    }
    

    requestAnimationFrame((ts) => this.loop(ts));
  }
    loop3(timestamp) {
    if (!this.running) return;

    const gl = this.gl;
    

     /*if (!this.syncold){
        const status=gl.clientWaitSync(this.syncold,  gl.SYNC_FLUSH_COMMANDS_BIT, 0);
        //console.log(status);
        if(status==gl.TIMEOUT_EXPIRED)console.log("TIMEOUT_EXPIRED");
        else if(status==gl.ALREADY_SIGNALED)console.log("ALREADY_SIGNALED");
        else if(status==gl.CONDITION_SATISFIED)console.log("CONDITION_SATISFIED");
        else if(status==gl.WAIT_FAILED)console.log("WAIT_FAILED");
        
      }*/
    let gpubussy=false;
    if (!this.syncold){
        const status=gl.clientWaitSync(this.syncold,  gl.SYNC_FLUSH_COMMANDS_BIT, 0);
        gl.deleteSync(this.syncold);
        gpubussy||=status!== gl.TIMEOUT_EXPIRED

        //console.log(status);
        /*if(status==gl.TIMEOUT_EXPIRED)console.log("TIMEOUT_EXPIRED");
        else if(status==gl.ALREADY_SIGNALED)console.log("ALREADY_SIGNALED");
        else if(status==gl.CONDITION_SATISFIED)console.log("CONDITION_SATISFIED");
        else if(status==gl.WAIT_FAILED)console.log("WAIT_FAILED");*/
        
      }

    if (gpubussy) {

      this.animate(timestamp); // forward timestamp here
      //gl.finish();

      this.syncold = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      //gl.finish();
    }
    

    requestAnimationFrame((ts) => this.loop(ts));
  }
  loop2(timestamp) {
    if (!this.running) return;
    const gl = this.gl;
    //throwonglerror(gl);
    if(!this.syncs)this.syncs=[];//.map(()=>gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0));
    while(this.syncs.length>0 && gl.clientWaitSync(this.syncs[0], 0, 0)==gl.ALREADY_SIGNALED){
      gl.deleteSync(this.syncs[0]);this.syncs.shift();
    }
    if(this.syncs.length<2){
      //throwonglerror(gl);
      this.animate(timestamp);
      //throwonglerror(gl);
      this.syncs.push(gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0)); 
      //throwonglerror(gl);
      gl.flush();  
      //throwonglerror(gl);
    }

    requestAnimationFrame((ts) => this.loop2(ts));
  }

  loop4(timestamp) {
    if (!this.running) return;

    const gl = this.gl;

      
      this.animate(timestamp); // forward timestamp here
      gl.finish();

    requestAnimationFrame((ts) => this.loop4(ts));
  }
  start() {
    if (!this.running) {
      this.running = true;
      requestAnimationFrame((ts) => this.loop2(ts));
    }
  }

  stop() {
    this.running = false;
  }
}


const fpscounter=document.getElementById('fpsCounter')
const mainCanvas = document.getElementById('mainCanvas');
const diagramCanvas = document.getElementById('diagramCanvas');
const gl = mainCanvas.getContext('webgl2',{preserveDrawingBuffer: true,antialias: false});//preserveDrawingBuffer for color picking

if (!gl) {
  alert("WebGL not supported!");
}
const ext = gl.getExtension('EXT_color_buffer_float');
if (!ext) {
    console.error('EXT_color_buffer_float not supported');
}


const traces = [];


async function load(url) {
  const response = await fetch(url);
  if (!response.ok) {
    console.error('Failed to load:', url);
    return '';
  }
  return await response.text();
}


  

function init_sliders_and_parameters(context,graph) {
  context.registerParams(graph.inputScalars.keys(), { ignoreReserved: true });
  const sliderPanel = new ReorderableList(document.getElementById("sliderPanel"));

  const template = sliderPanel.getTemplate("slider");
  for (const name of context.evalContext.variables.keys()) {
      sliderPanel.addItem(makeSlider(template, name, (value) => context.paramsChanged([[name, value]]), { min: -1, max: 1, value: 0 }));
  }

  /*for (let i = 0; i < 100; i++) {
    sliderPanel.addItem(makeSlider(template, i));
  }*/

  if (!sliderPanel.ListElement.querySelector(`.${ReorderableList.ITEM_CLASS}`)) {
    //if the slider box is empty dont display the box
    document.getElementById("sliderscroll").style.display = "none";
  }
  context.paramsChanged();//populate the cache
}











async function main(gajson){
//alert("1")

    const graph=GaalopGraph.fromjson(gajson);
    console.log(graph.inputScalars);
    //console.log(graph);


  const evalcontext=graph.makeEvalcontext();
  let context=new RenderContext(mainCanvas,evalcontext,gl);
  window.context =context;
  
  //let funmat=new Matrix([[-3.2,0., 0., 0., 0.,-3.2,0., 0., 0., 0., 0., 0., 1.5125, -5.225,   4.5125]]);
  /**/
  //let renderer=new renderingpipeline_coeffxyz(camera,shader);
  //renderer.coefficientsxyz(funmat);

  init_sliders_and_parameters(context,graph);



  /*context.paramsChanged([
    ["a1", 0], ["a2", 0], ["a3", 0],
    ["b1", 0], ["b2", 0.4], ["b3", 0],
    ["c1", 0], ["c2", 0.45], ["c3", 0.2],
    ["d14", 0.5], ["d24", 0.4], ["d34", 0.3],
  ]);*/

  
  const visgraphs=graph.vistargets();
  for(const visgraph of visgraphs){
    const obj= new RenderableObject(visgraph.name);
    //context.objects.push(obj);
    //if(visgraph.name==="t"){
      context.addObject(obj);




    

    //visgraph.simplify();

    //console.log(visgraph);
    //console.log(visgraph.name);
    //const matex=new matrixextractor(visgraph,BasisConvert.dcga);
    //console.log(matex.M(context.params));

      //continue;
      
      
    //const frag=visgraph.gencodeAberthHybrid(fragmentShaderSourceTemplate);
    //const frag=visgraph.gencodexyzDual(fragmentShaderSourceTemplate);

    //console.log(visgraph.name+ " degree:"+ visgraph.calcpolydegree_gpu()+" issquared:"+visgraph.issquared);
    //console.log(frag);

    //visgraph.setuniforms(values,shader);
    const color=graph.objectcolormap.get(visgraph.name); 
    
    //gl.uniform4fv(shader.getUniformLocation('incolor'), [color.r,color.g,color.b,1.0]);

    
    /*obj.addPipeline("point",new pointcloudrenderer(gl,visgraph,shaderSources.fragTemplateAxisAligned,color));
    obj.addPipeline("lines",new linegridrenderer(gl,visgraph,shaderSources.fragTemplateAxisAligned,color));
    obj.addPipeline("aberth",new simplerenderer(context,gl,visgraph,shaderSources.fragTemplateAberth,color));
    obj.addPipeline("gauss",new simplerenderer(context,gl,visgraph,shaderSources.fragTemplateDualGauss,color));
    obj.addPipeline("sphere",new simplerenderer(context,gl,visgraph,shaderSources.fragTemplateSphere,color));
    obj.addPipeline("aberth_matrix",new matrixrenderer(context,gl,visgraph,matex,shaderSources.fragTemplateAberthMatrix,color));
    obj.addPipeline("voxelpoint",new Voxelrenderer(gl,visgraph,shaderSources.vertTemplateVoxel,color));
    obj.addPipeline("voxelpoint2",new Voxelrenderer(gl,visgraph,shaderSources.vertTemplateVoxelBool,color));
    obj.addPipeline("marching_cubes",new MarchingCubesRenderer(gl,visgraph,shaderSources.vertTemplateVoxelBool,shaderSources.computeTemplatexyzDual,color));
    obj.addPipeline("marching_cubes2",new MarchingCubesRenderer2(gl,visgraph,shaderSources.vertTemplateVoxelBig,shaderSources.computeTemplatexyzDual,color));*/
    

    //i found a firefox bug :(

    const aberthsource=await loadWithIncludesRelativeToShadersource("shaderlibv3/raycasting/aberth.glsl");
    obj.addPipeline("aberth",new aberthrenderer(context,gl,visgraph,aberthsource,color));

    const newtonsource=await loadWithIncludesRelativeToShadersource("shaderlibv3/raycasting/newton.glsl");
    obj.addPipeline("newton",new udfrenderer(context,gl,visgraph,newtonsource,color));

    const udfaproxsource=await loadWithIncludesRelativeToShadersource("shaderlibv3/raycasting/udfaprox.glsl");
    obj.addPipeline("udfaprox",new udfrenderer(context,gl,visgraph,udfaproxsource,color));
    

    const Rintervallsource=await loadWithIncludesRelativeToShadersource("shaderlibv3/compute/Rintervall.glsl");
    obj.addPipeline("voxelsubdivision",new Voxelrenderer(context,gl,visgraph,Rintervallsource,color));

    const gaussnewtondistsource=await loadWithIncludesRelativeToShadersource("shaderlibv3/compute/RGaussNewtonGrid.glsl");
    obj.addPipeline("RGaussNewtonGrid",new VoxelDistRenderer(context,gl,visgraph,gaussnewtondistsource,color));

    const Rgridsource=await loadWithIncludesRelativeToShadersource("shaderlibv3/compute/RGrid.glsl");
    obj.addPipeline("TopGrid",new TopGridRenderer(context,gl,visgraph,Rgridsource,color));
    
    
    //const gaussnewtonitersource=await loadWithIncludesRelativeToShadersource("shaderlibv3/compute/RGaussNewtonIterGrid.glsl");
    //obj.addPipeline("RGaussNewtonGridIter",new VoxelGNRenderer(context,gl,visgraph,gaussnewtonitersource,color));

   // const gaitersource=await loadWithIncludesRelativeToShadersource("shaderlibv3/compute/RGradientIterGrid.glsl");
    //obj.addPipeline("GradientMethod",new VoxelGNRenderer(context,gl,visgraph,gaitersource,color));
    const itersource=await loadWithIncludesRelativeToShadersource("shaderlibv3/compute/RIterGrid.glsl");
    obj.addPipeline("IterGrid",new VoxelIterRenderer(context,gl,visgraph,itersource,color));

   

    const Rgn=await loadWithIncludesRelativeToShadersource("shaderlibv3/compute/RGaussNewton.glsl");
    obj.addPipeline("MC",new MarchingCubesRenderer(context,gl,visgraph,Rintervallsource,Rgn,color))
    
    //obj.setActivePipeline("voxelpoint2");
    //context.updateParams();
    //obj.setActivePipeline("aberth");
     //context.updateParams();
    addPipelineSelectorForObject(obj);

    
      

      /*const newyvalues=evaluateGraphMultidual(new Vector([0,0,1]),new Vector([0,0,0]),xValues,visgraph,values).f.array;
      console.log(newyvalues);//push this code at the right pos and also check if the output is a array or a scalar
      yValues.length=0;
      yValues.push(...newyvalues);
      Plotly.redraw('plotlyDiagram');*/
  }

  const traces=[]; 
  const traceinfos=[]
  for(const visgraph of visgraphs){
    let vert=await loadWithIncludesRelativeToShadersource("shaderlibv3/compute/R.glsl");
    vert=visgraph.gencodeR(vert);
    const tf=new TransformFeedbackWrapper(gl,vert,["sus","row","udfaprox"]);
    const color=graph.objectcolormap.get(visgraph.name).toCss(); 
    const trace={
      x: [],y: [],
      mode: "lines",
      name: visgraph.name+"Row",
      marker: {color,size: 4,opacity: 0.6}
    }
    const trace2={
      x: [],y: [],
      mode: "lines",
      name: visgraph.name+"Sus",
      marker: {color,size: 4,opacity: 0.6}
    }
    const trace3={
      x: [],y: [],
      mode: "lines",
      name: visgraph.name+"udfaprox",
      marker: {color,size: 4,opacity: 0.6}
    }
    traces.push(trace,trace2,trace3);
    traceinfos.push({tf,visgraph,row:trace,sus:trace2,udfaprox:trace3});
  }
  Plotly.newPlot('plotlyDiagram',traces , { title: 'ROW AND SUS' ,margin:{l:40,r:20,b:40,t:40}},{responsive:true});

  const plotposvao=gl.createVertexArray();
  gl.bindVertexArray(plotposvao);
  const buffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  //gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.DYNAMIC_DRAW);

  // Attribute 0 → vec4 position
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(
    0,       // location
    3,       // vec
    gl.FLOAT,
    false,
    3*4,  // stride
    0        // offset
  );
  gl.bindVertexArray(null);

  function drawplot(camera){
    const raydir=camera.c2w.mul(new Vector([0,0,1]));
    const xValues=[...Array(1000).keys()].map(i=>i/100);
    //const xValues=[...Array(1000).keys()].map(i=>i);
    const positions=new Float32Array(xValues.flatMap(x=>{
      const pos=camera.cameraPos.add(raydir.mul(x));
      return pos.array;
    }));
    gl.bindVertexArray(plotposvao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER,positions,gl.DYNAMIC_DRAW);

    //i need a buffer for the tf to set the positions. the input is "in vec3 pos;"in the shader
    for(const t of traceinfos){
      t.tf.shader.use();
      t.visgraph.setuniformsR(t.tf.shader,context.evalContext);
      const [sus,row,udfaprox]=t.tf.run(xValues.length);
      t.row.x=xValues;t.sus.x=xValues;t.udfaprox.x=xValues;
      t.row.y=row;//.map(x=>Math.log(x));
      t.sus.y=sus;//.map(x=>Math.log(x));//maybe wee need a cast because run returns float32array
      t.udfaprox.y=udfaprox;//.map(x=>Math.log(x));
    }
    gl.bindVertexArray(null);

    Plotly.redraw("plotlyDiagram");
  }

  





  
  //throw Error("you shall not pass");
  //context.render();
  //context.updateParams();
  //context.updateParams();
  //console.log(gl);
  //let renderer=new pointrenderer(context,gl,shaders);


  
  
  
//context.objects.get("t").setActivePipeline("point");
//context.objects.get("t").setActivePipeline("aberth");
//context.objects.get("intersect").setActivePipeline("lines");
//console.log(context.objects.get("t").visgraph);
  
//context.objects.get("intersect").setActivePipeline("aberth");
//context.objects.get("p").setActivePipeline("aberth");


//context.objects.get("t").setActivePipeline("aberth");
//context.objects.get("intersect").setActivePipeline("aberth");
//context.objects.get("p").setActivePipeline("point");
//context.objects.get("p").setActivePipeline(null);
//context.objects.get("t").setActivePipeline(null);


  
  //main programm
  
  let deltatimeavg=0
  let lastTime = 0;
  function animate(timestamp){
    let deltatime = (timestamp - lastTime) / 1000; // Convert to seconds
    lastTime = timestamp;
      
    const t0 = performance.now(); 
    const interval = 2; // switch every 2 seconds
    
    /*if (Math.floor(now) % (interval * 2) < interval) {
      torus.setActivePipeline("aberth");
      //context.updateParams();
      //torus.setActivePipeline("point");
    } else {
      torus.setActivePipeline("point");
    }*/

      if(context.camera.keysPressed["r"]){
        context.evalContext.clear();
      }
      

    if(false){
      context.updateParams();


      const start = performance.now();
      const scale = Math.random() * 0.35 + 0.05;
      context.update(deltatime)
      context.setScale(scale); 
      context.render();
      const end = performance.now();
      const frameTime = end - start;
      xValues.push(scale);
      yValues.push(1000/frameTime);

      Plotly.redraw('plotlyDiagram');
    }else{
      
      
      context.updateParams();
       if(context.camera.keysPressed["r"]){
        console.log(performance.now()-t0); 
      }
      const status=context.render(deltatime);
      if(status!=RenderContext.UNCHANGED){
        //drawplot(camera,funmat.array);
        //
        deltatimeavg=deltatimeavg*0.90+deltatime*0.10;
        fpscounter.innerText = `FPS: ${Math.ceil(1/deltatimeavg)}`;
      } 
      if(status==RenderContext.FINISHED){
        drawplot(context.camera);
      }
      console.log(status);
    }

    
      
      //renderer.render();
      
      
  }
  const renderLoop = new RenderLoop(gl, animate);
  renderLoop.start();
}
//main();

let jsonfile;
const dropOverlay = document.getElementById('dropOverlay');

// Show the overlay
dropOverlay.classList.add('active');

// Wait for a single file drop
window.addEventListener('dragover', e => {
  e.preventDefault();            // prevent browser from opening file
  e.stopPropagation();           // optional but safe
  //dropOverlay.classList.add('active');
});

jsonfile = await new Promise((resolve, reject) => {
  const onDrop = async e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      window.removeEventListener('drop', onDrop); // remove listener manually
      resolve(text);
    } catch (err) {
      reject(err);
    }
  };

  window.addEventListener('drop', onDrop);
});

// Hide the overlay
dropOverlay.classList.remove('active');

// Run your main function with the dropped file
main(jsonfile);

//let gajson=await load("./jsonexport.json");
//let gajson=await load("./torus.json");
//let gajson=await load("./assets/torus_intersect.json");
//let gajson=await load("./assets/torus_intersect_p.json");
//let gajson=await load("./assets/jsonexport.json");
//let gajson=await load("./assets/torus.json");
//let gajson=await load("./assets/torustorusintersect.json");
//let gajson=await load("./assets/torus_plane_intersect.json");