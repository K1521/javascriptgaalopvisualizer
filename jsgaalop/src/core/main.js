

//import { Vector, Matrix, Multidual } from './../util/linalg1.js';
//import {Cameracontroll,renderingpipeline,renderingpipeline_coeffxyz,Shader} from "../glwrapper/glwrapper.js";
import { shaderSources } from "../glwrapper/shaderimporter.js";
import {GaalopGraph,visitnodes,VarOperand,AddOperand,MulOperand,NegOperand,ConstOperand,DivOperand} from "./graph2.js";
import { RenderableObject } from "./RenderableObject.js";
//import { pinv, multiply, transpose ,qr} from 'https://cdn.jsdelivr.net/npm/mathjs@14.5.2/+esm';
import { RenderContext } from "./RenderContext.js";
import { matrixextractor } from "../objectcontext/matrixextractor.js";
import { BasisConvert } from "../objectcontext/BasisConvert.js";


import { pointcloudrenderer } from "../pipelines/pointcloudrenderer.js";
import { linegridrenderer } from "../pipelines/linegridrenderer.js";
import { simplerenderer } from "../pipelines/simplerenderer.js";
import { matrixrenderer } from "../pipelines/matrixrenderer.js";
import { Voxelrenderer } from "../pipelines/Voxelrenderer.js";
import { addPipelineSelectorForObject } from "../ui/PipelineSelector.js";
import { MarchingCubesRenderer } from "../pipelines/MarchingCubesRenderer.js";

import { makeSlider,ReorderableList } from "../ui/sliders.js";
import { MarchingCubesRenderer2 } from "../pipelines/MarchingCubesRenderer2.js";



function evaluateGraphMultidual(rayDir, rayOrigin,t,graph,resultscache){
  t=new Vector(t);
  const x=new Multidual(Vector.add(rayOrigin.x(),t.mul(rayDir.x())),1,0,0,rayDir.x(),0,0);
  const y=new Multidual(Vector.add(rayOrigin.y(),t.mul(rayDir.y())),0,1,0,rayDir.y(),0,0);
  const z=new Multidual(Vector.add(rayOrigin.z(),t.mul(rayDir.z())),0,0,1,rayDir.z(),0,0);
  
  const nametovar=new Map([
    ["_V_X",x],
    ["_V_Y",y],
    ["_V_Z",z]
  ]);
  for(const [cpunode,gpunode]of graph.cpu_out_to_gpu_in.entries()){
    if(!resultscache.has(cpunode)){


      throw new Error("missing "+cpunode.name+" in cache");
    }
      //console.log("found "+cpunode.name+" in cache");
    nametovar.set(gpunode.operand.name,resultscache.get(cpunode));
  }


return visitnodes(graph.GPUgraph,(node,parentresults)=>{
            if(node.operand instanceof VarOperand) {

                if(nametovar.has(node.operand.name)){
                    return Multidual.promote(nametovar.get(node.operand.name));
                }else{
                    //console.log("missing variable "+node.operand.name);
                    //return new Multidual(0,0,0,0,0,0,0);
                    throw new Error("missing variable "+node.operand.name);
                }
            }
            if(node.operand instanceof AddOperand){
                return parentresults.reduce((prev,cur)=>prev.add(cur));
            }
            if(node.operand instanceof MulOperand){
                return parentresults.reduce((prev,cur)=>prev.mul(cur));
            }
            if(node.operand instanceof NegOperand){
                return parentresults[0].mul(-1);
            }
            if(node.operand instanceof ConstOperand){
                return Multidual.promote(node.operand.value);
            }
            if(node.operand instanceof DivOperand){
              //console.log("div "+parentresults[0]);
                return parentresults[0].div(parentresults[1]);//only maximal degree
            }
            throw new Error("bad operation :"+node.operand.constructor.name);
        },resultscache).get(graph.GPUgraph);
}


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

      gl.finish();
      this.animate(timestamp); // forward timestamp here
      gl.flush();

    requestAnimationFrame((ts) => this.loop2(ts));
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

//function transpose(matrix) {return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));}
function rankQR(matrix, eps = 1e-10) {
  const { R } = qr(matrix);
  let rank = 0;
  console.log(R);

  for (let row of R) {
    const nonZero = row.some(val => Math.abs(val) > eps);
    if (nonZero) rank++;
  }

  return rank;
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

const xValues = [];
let yValues = [];
/*for (let x = 0; x <= 20; x += 0.01) {
  xValues.push(x);
  yValues.push(0);
}*/
/*const traces = [{
  x: xValues,
  y: yValues,
  mode: 'lines',
  name: 'f(x)',
  line: { color: 'blue' }
}];*/
const traces = [{
  x: xValues,
  y: yValues,
  mode: 'markers', // this is the key for point cloud
  type: 'scatter', // scatter + markers = point cloud
  name: 'Render Time vs Scale',
  marker: {
    color: 'blue',
    size: 4,
    opacity: 0.6
  }
}];
Plotly.newPlot('plotlyDiagram',traces , { title: 'f' ,margin:{l:40,r:20,b:40,t:40}});

function DualSummofsquares(rayDir, rayOrigin,coefficients){

    //Multidual(f,dx,dy,dz,d1,d2,d3);
    const x=new Multidual(rayOrigin.x(),1,0,0,rayDir.x(),0,0);
    const y=new Multidual(rayOrigin.y(),0,1,0,rayDir.y(),0,0);
    const z=new Multidual(rayOrigin.z(),0,0,1,rayDir.z(),0,0);
    
    const xx=x.square();
    const yy=y.square();
    const zz=z.square();

    const r=xx.add(yy).add(zz);
    const rp=(r.add(1)).mul(0.5);
    const rm=(r.add(-1)).mul(0.5);

    const xy=x.mul(y);
    const yz=y.mul(z);
    const zx=z.mul(x);

    const xrp=x.mul(rp);
    const xrm=x.mul(rm);
    const yrp=y.mul(rp);
    const yrm=y.mul(rm);
    const zrp=z.mul(rp);
    const zrm=z.mul(rm);

    const rprp=rp.mul(rp);
    const rmrm=rm.mul(rm);
    const rprm=rp.mul(rm);

    const terms = [
      xx, xy, zx, xrm, xrp,
      yy, yz, yrm, yrp,
      zz, zrm, zrp,
      rmrm, rprm, rprp
    ];

    let sum=new Multidual(0,0,0,0,0,0,0);
    for(let j=0;j<coefficients.length;j++){

        let blade = new Multidual(0,0,0,0,0,0,0); // Start with first term
        for (let i = 0; i < terms.length; i++) {
          blade = blade.add(terms[i].mul(coefficients[j][i]));
        }

        sum=sum.add(blade.square());
    }
    return (sum);

    //[x**2, x*y, x*z, rm*x, rp*x, y**2, y*z, rm*y, rp*y, z**2, rm*z, rp*z, rm**2, rm*rp, rp**2]
}
function drawplot(camera,coefficients){
  const raydir=camera.c2w.mul(new Vector([0,0,1]));
  for(let i=0;i<xValues.length;i++){

    const res=DualSummofsquares(raydir,camera.cameraPos.add(raydir.mul(xValues[i])),coefficients);
    //let x=new Multidual(-0.001,0,0,0,1,0,0);
    //let xx=x.square().sqrt();
    //let xxx=xx;//xx.mul(xx).mul(xx);
    //yValues[i]=xxx.d3;
    //console.log(`${xxx.f} ${xxx.d1} ${xxx.d2} ${xxx.d3}`);
    yValues[i]=Math.sqrt(res.f);//ganja
    //yValues[i]=res.f/Math.sqrt(res.dx*res.dx+res.dy*res.dy,res.dz*res.dz);//newton2
    //yValues[i]=res.f/res.d1;//newton1
    //yValues[i]=-2*res.f*res.d1/(2*res.d1*res.d1-res.f*res.d2);
    //yValues[i]=-2*res.f*res.d1/(res.d1*(1+Math.sqrt((1-2*res.f*res.d2/(res.d1*res.d1)))));
    //console.log(yValues[i]);
  }
  Plotly.redraw('plotlyDiagram');
}




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
  for (const name of graph.inputScalars.keys()) {
    if (!RenderContext.RESERVED_PARAMS.has(name)) {
      sliderPanel.addItem(makeSlider(template, name, (value) => context.paramsChanged([[name, value]]), { min: -1, max: 1, value: 0 }));
    }
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










let context;
async function main(){

    //let gajson=await load("./jsonexport.json");
    //let gajson=await load("./torus.json");
    //let gajson=await load("./assets/torus_intersect.json");
    //let gajson=await load("./assets/torus_intersect_p.json");
    //let gajson=await load("./assets/jsonexport.json");
    //let gajson=await load("./assets/torus.json");
    //let gajson=await load("./assets/torustorusintersect.json");
    let gajson=await load("./assets/torus_plane_intersect.json");
    const graph=new GaalopGraph();
    graph.fromjson(gajson);
    console.log(graph.inputScalars);
    //console.log(graph);



  context=new RenderContext(mainCanvas,gl);
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

  const object_visualization_controls = document.getElementById('object-visualization-controls');

  for(const visgraph of graph.createVisualisationgraphs2()){
    const obj= new RenderableObject(visgraph.name);
    //context.objects.push(obj);
    //if(visgraph.name==="t"){
      context.addObject(obj);



      
    

    visgraph.simplify();

    //console.log(visgraph);
    //console.log(visgraph.name);
    const matex=new matrixextractor(visgraph,BasisConvert.dcga);
    //console.log(matex.M(context.params));

      //continue;
      
      
    //const frag=visgraph.gencodeAberthHybrid(fragmentShaderSourceTemplate);
    //const frag=visgraph.gencodexyzDual(fragmentShaderSourceTemplate);

    console.log(visgraph.name+ " degree:"+ visgraph.calcpolydegree_gpu()+" issquared:"+visgraph.issquared);
    //console.log(frag);

    //visgraph.setuniforms(values,shader);
    const color=graph.objectcolormap.get(visgraph.name); 
    
    //gl.uniform4fv(shader.getUniformLocation('incolor'), [color.r,color.g,color.b,1.0]);
    
    
    obj.addPipeline("point",new pointcloudrenderer(gl,visgraph,shaderSources.fragTemplateAxisAligned,color));
    obj.addPipeline("lines",new linegridrenderer(gl,visgraph,shaderSources.fragTemplateAxisAligned,color));
    obj.addPipeline("aberth",new simplerenderer(context,gl,visgraph,shaderSources.fragTemplateAberth,color));
    obj.addPipeline("gauss",new simplerenderer(context,gl,visgraph,shaderSources.fragTemplateDualGauss,color));
    obj.addPipeline("sphere",new simplerenderer(context,gl,visgraph,shaderSources.fragTemplateSphere,color));
    obj.addPipeline("aberth_matrix",new matrixrenderer(context,gl,visgraph,matex,shaderSources.fragTemplateAberthMatrix,color));
    obj.addPipeline("voxelpoint",new Voxelrenderer(gl,visgraph,shaderSources.vertTemplateVoxel,color));
    obj.addPipeline("voxelpoint2",new Voxelrenderer(gl,visgraph,shaderSources.vertTemplateVoxelBool,color));
    obj.addPipeline("marching_cubes",new MarchingCubesRenderer(gl,visgraph,shaderSources.vertTemplateVoxelBool,shaderSources.computeTemplatexyzDual,color));
    obj.addPipeline("marching_cubes2",new MarchingCubesRenderer2(gl,visgraph,shaderSources.vertTemplateVoxelBig,shaderSources.computeTemplatexyzDual,color));

    //obj.setActivePipeline("voxelpoint2");
    //context.updateParams();
    //obj.setActivePipeline("aberth");
     //context.updateParams();
    addPipelineSelectorForObject(obj,object_visualization_controls);

    
      

      /*const newyvalues=evaluateGraphMultidual(new Vector([0,0,1]),new Vector([0,0,0]),xValues,visgraph,values).f.array;
      console.log(newyvalues);//push this code at the right pos and also check if the output is a array or a scalar
      yValues.length=0;
      yValues.push(...newyvalues);
      Plotly.redraw('plotlyDiagram');*/
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
    
  const now = performance.now() / 1000; // convert ms to seconds
  const interval = 2; // switch every 2 seconds
  
  /*if (Math.floor(now) % (interval * 2) < interval) {
    torus.setActivePipeline("aberth");
    //context.updateParams();
    //torus.setActivePipeline("point");
  } else {
    torus.setActivePipeline("point");
  }*/

  if(false){
    context.updateParams();


    const start = performance.now();
    const scale = Math.random() * 0.35 + 0.05;
    context.update(deltatime)
    context.setScale(scale); // adjust your scale logic accordingly
    context.render();
    const end = performance.now();
    const frameTime = end - start;
    xValues.push(scale);
    yValues.push(1000/frameTime);

    Plotly.redraw('plotlyDiagram');
  }else{
    
    
    context.updateParams();
  if(context.render(deltatime)){
      //drawplot(camera,funmat.array);
      deltatimeavg=deltatimeavg*0.90+deltatime*0.10;
      fpscounter.innerText = `FPS: ${Math.ceil(1/deltatimeavg)}`;
    }
  }
    
    //renderer.render();
    
    
  }
  const renderLoop = new RenderLoop(gl, animate);
  renderLoop.start();
}
main();