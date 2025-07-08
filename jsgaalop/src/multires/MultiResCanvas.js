
class MultiResCanvas extends MultiresBase{
  constructor(ctx){
    super();
    this.ctx=ctx;


    this.highResolutionScale = 0.3;
    this.lowResolutionScale = 0.2;
    this.stillTime = performance.now();
    this.setScale(this.lowResolutionScale);//sets scale
  }

  resize(){
    this.setScale();
  }

  target(){
    this.ctx.updateViewport();
    const gl=this.ctx.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  }

  update(){
    const now = performance.now();
    const moving = this.ctx.moved;

    if(this.highResolutionScale==this.lowResolutionScale){
        //pass 
    }else if (moving) {
      this.stillTime = now;
      if (!this.isLowRes) {
        this.setScale(this.lowResolutionScale);
        //console.log("set to low res");
        this.ctx.requestRender();
      };
      
    }else if (this.isLowRes && (now - this.stillTime > 500)) {//not moving for 0.5 sec
      this.setScale(this.highResolutionScale);
        //console.log("set to high res");

      this.ctx.requestRender();
    }
  }

  
  get isLowRes(){return this.scale<this.highResolutionScale;}


  setScale(scale=undefined) {
    if(scale)this.scale=scale;
    const canvas=this.ctx.canvas;
    const dpr = window.devicePixelRatio || 1;
    const width = Math.floor(canvas.clientWidth * dpr * this.scale);
    const height = Math.floor(canvas.clientHeight * dpr * this.scale);
    canvas.width = width;
    canvas.height = height;
  }



  render() {
        const gl=this.ctx.gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //context.updateViewport();

    this.clear();
    this.target();
    for(const object of this.ctx.objects.values()){
      object.render(this.ctx);
    }


    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.ctx.updateViewport();

    //gl.finish();
  }
  clear(){
    const gl=this.ctx.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    //gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }
}
