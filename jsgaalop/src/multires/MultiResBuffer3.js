import { MultiresBase } from "./MultiresBase.js";
import { textureFramebuffer } from "../glwrapper/textureFramebuffer.js";
import { throwonglerror } from "../glwrapper/glwrapper.js";
import { RenderContext } from "../core/RenderContextold.js";
export class MultiResBuffer3 extends MultiresBase {
  constructor(ctx) {
    super();
    this.ctx = ctx;
    this.framebufferLow = new textureFramebuffer(ctx.gl, 100, 100);
    this.framebuffer = new textureFramebuffer(ctx.gl, 100, 100);

    this.scheduler = null;
    this.resetscheduler();
  }

  resetscheduler() {
    this.scheduler = this.tileScheduler();
  }

  update() {
    if (this.ctx.changed) {
      this.resetscheduler();
    }

    if (!this.finished) {
      this.ctx.requestRender();
    }
  }

  get finished(){
    return this.scheduler==null;
  }

  render() {
    if (this.scheduler==null) return;
    const result = this.scheduler.next();
    if (result.done) {
      this.scheduler = null;
    }
  }

  *tileScheduler(tileSize = 256) {
    this.renderNormal(); // Optional low-res fallback render
    yield;

    for (const { tileX, tileY, w, h } of this.generateTilesCircular2(tileSize)) {
      this.renderTile(tileX, tileY, w, h);
      yield;
    }
  }
 /*render() {
  if (this.scheduler == null) return;

  const timeBudget = 4.0; // in milliseconds — experiment with this value
  const startTime = performance.now();
  let renderedonce=false;
  while (!renderedonce || performance.now() - startTime < timeBudget) {
    renderedonce=true;
    this.ctx.gl.finish();
    const result = this.scheduler.next();
    if (result.done) {
      this.scheduler = null;
      break;
    }
    // (optional) you could process `result.value` here if needed
  }
}*/


  resize(){
    const canvas=this.ctx.canvas;
      const dpr = window.devicePixelRatio || 1;
      const width = Math.floor(canvas.clientWidth * dpr);
      const height = Math.floor(canvas.clientHeight * dpr);
      canvas.width = width;
      canvas.height = height;
      //console.log(width,height);
      this.framebufferLow.resize(Math.ceil(width * 0.2),Math.ceil(height * 0.2));
      this.framebuffer.resize(width,height);

      this.resetscheduler();
  }



  renderNormal() {
   /** @type{RenderContext} */
    const ctx = this.ctx;
    const gl = ctx.gl;


    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //context.updateViewport();

    this.framebufferLow.clear();
    this.framebuffer.clear();

   /*
    for(const object of this.ctx.objects.values()){

      let targetbuffer;
      if(object.isTilable()){
        targetbuffer=this.framebufferLow;
      }else{
        targetbuffer=this.framebuffer;
      }


       targetbuffer.updateViewport();
       targetbuffer.bind();
      object.render(this.ctx);
    }*/


    this.framebufferLow.updateViewport();
    this.framebufferLow.bind();
    for(const object of this.ctx.objects.values()){
      if(object.isTilable()){
        object.render(this.ctx);
        //throwonglerror(gl);
      }
    }

    this.framebuffer.updateViewport();
    this.framebuffer.bind();
    for(const object of this.ctx.objects.values()){
      if(!object.isTilable()){
        object.render(this.ctx);
        //throwonglerror(gl);
      }
    }





    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.ctx.updateViewport();

    //gl.finish();
  

    gl.depthFunc(gl.LESS);
    gl.enable(gl.DEPTH_TEST);
    this.framebufferLow.upscale();
    this.framebuffer.upscale();
  }

  renderTile(x, y, w, h) {
    const ctx = this.ctx;
    const gl = ctx.gl;

    this.ctx.updateViewport();
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x, y, w, h);
    this.framebuffer.bind();
    for (const object of this.ctx.objects.values()) {
      if (object.isTilable()) {
        object.render(this.ctx);
        //throwonglerror(gl);
      }

    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.framebuffer.upscale();

    gl.disable(gl.SCISSOR_TEST);
  }




  generateTilesCircular(tileSize) {
    const ctx = this.ctx;
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;

    const centerX = width / 2;
    const centerY = height / 2;

    const tiles = [];

    for (let tileY = 0; tileY < height; tileY += tileSize) {
      for (let tileX = 0; tileX < width; tileX += tileSize) {
        const cx = tileX + tileSize / 2;
        const cy = tileY + tileSize / 2;
        const distSq = (cx - centerX) ** 2 + (cy - centerY) ** 2;

        tiles.push({
          tileX,
          tileY,
          w: Math.min(tileSize, width - tileX),
          h: Math.min(tileSize, height - tileY),
          distSq
        });
      }
    }

    tiles.sort((a, b) => a.distSq - b.distSq); //i wantet a sort of circular pattern
    return tiles;
  }

  generateTilesCircular2(tileSize) {
    //same as generate tiles circular but all tiles are nearly same size (some are 1 larger) instead of cutting at the edge
    const ctx = this.ctx;
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;

    const centerX = width / 2;
    const centerY = height / 2;

    const tiles = [];


    function roundHalfEven(x) {
      //you could also just use round but this makes the pattern more symetrically (in praxis you wont be able to see this i think but iwill leave it in)
      //this is also called bankers round
      //i prototyped this in python which uses bankers round
      const floor = Math.floor(x);
      const diff = x - floor;
      if (diff < 0.5) return floor;
      if (diff > 0.5) return floor + 1;
      return (floor % 2 === 0) ? floor : floor + 1;
    }

    function subdivide(totwidth, numberOfintervalls) {
      //this is the best method i could find for interleaving a intervall eavenly
      
      const result = [];
      for (let i = 0; i < numberOfintervalls; i++) {
          const start = roundHalfEven(totwidth *    i    / numberOfintervalls);
          const end   = roundHalfEven(totwidth * (i + 1) / numberOfintervalls);
          result.push([start,end - start]);//start,width
      }
      return result;
    }

    const xw=subdivide(width,Math.ceil(width/tileSize))
    const yh=subdivide(height,Math.ceil(height/tileSize))

    for (let [tileY,h] of yh) {
      for (let [tileX,w] of xw) {
        const cx = tileX + w / 2;
        const cy = tileY + h / 2;
        const distSq = (cx - centerX) ** 2 + (cy - centerY) ** 2;

        tiles.push({tileX,tileY,w,h,distSq});
      }
    }

    tiles.sort((a, b) => a.distSq - b.distSq); //i wantet a sort of circular pattern
    return tiles;
  }
}
