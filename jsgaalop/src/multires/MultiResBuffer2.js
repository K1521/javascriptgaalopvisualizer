
class MultiResBuffer2 extends MultiresBase{
  constructor(ctx){
    super();
    this.ctx=ctx;
    this.framebuffer=new textureFramebuffer(ctx.gl,100,100);
  }

  resize(){
    const canvas=this.ctx.canvas;
      const dpr = window.devicePixelRatio || 1;
      const width = Math.floor(canvas.clientWidth * dpr);
      const height = Math.floor(canvas.clientHeight * dpr);
      canvas.width = width;
      canvas.height = height;
      //console.log(width,height);
      this.framebuffer.resize(Math.floor(width * 0.3),Math.floor(height * 0.3));
  }

  render() {
   /** @type{RenderContext} */
    const ctx = this.ctx;
    const gl = ctx.gl;


    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //context.updateViewport();

    this.framebuffer.clear();
    this.framebuffer.updateViewport();
    this.framebuffer.bind();
    for(const object of this.ctx.objects.values()){
      object.render(this.ctx);
    }


    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.ctx.updateViewport();

    //gl.finish();
  

    //
    
    this.framebuffer.upscale();
  }

}
