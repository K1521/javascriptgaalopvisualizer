import { MultiresBase } from "./MultiresBase.js";
import { textureFramebuffer } from "../glwrapper/textureFramebuffer.js";

import { RenderContext } from "../core/RenderContext.js";
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

    if (this.scheduler!=null) {
      this.ctx.requestRender();
    }
  }

  render() {
    if (this.scheduler==null) return;
    const result = this.scheduler.next();
    if (result.done) {
      this.scheduler = null;
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
      this.framebufferLow.resize(Math.floor(width * 0.2),Math.floor(height * 0.2));
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
    }


    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.ctx.updateViewport();

    //gl.finish();
  

    //
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
      }

    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.framebuffer.upscale();

    gl.disable(gl.SCISSOR_TEST);
  }

  *tileScheduler(tileSize = 256) {
    this.renderNormal(); // Optional low-res fallback render
    yield;

    const ctx = this.ctx;
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;

    /*for (let tileY = 0; tileY < height; tileY += tileSize) {
      for (let tileX = 0; tileX < width; tileX += tileSize) {
        const w = Math.min(tileSize, width - tileX);
        const h = Math.min(tileSize, height - tileY);

        this.renderTile(tileX, tileY, w, h);
        yield;
      }
    }*/
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

  tiles.sort((a, b) => a.distSq - b.distSq);//i wantet a sort of circular pattern

  for (const { tileX, tileY, w, h } of tiles) {
    this.renderTile(tileX, tileY, w, h);
    yield;
  }
}

}
