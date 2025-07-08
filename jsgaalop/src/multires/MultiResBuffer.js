
class MultiResBuffer{
  constructor(ctx){
    this.ctx=ctx;
    this.inithigh(736,350);
    this.initlow(100,100);
    this.initupscaleshader();
  }

  

  initupscaleshader(){
    const gl=this.ctx.gl;

    const upscalefrag=`#version 300 es
    precision highp float;

    in vec2 v_uv;
    out vec4 fragColor;

    uniform sampler2D u_color;
    uniform sampler2D u_depth;

    void main() {
      // Sample color and depth from low-res textures
      fragColor = texture(u_color, v_uv);

      float depth = texture(u_depth, v_uv).r;
      gl_FragDepth = depth; // Pass depth manually
    }`;
    this.upscaleshader=new Shader(gl,shaderSources.vertRaycastFullscreen,upscalefrag);
  }



  render_low() {
   /** @type{RenderContext} */
    const ctx = this.ctx;
    const gl = ctx.gl;

    // 1) Blit high-res framebuffer color to default framebuffer (canvas)
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.high_framebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null); // default framebuffer

    const [width,height] = ctx.resolution;
    {const err = gl.getError();
    if (err !== gl.NO_ERROR) {
      console.warn("Rendering error:", err);
    }}

    // Blit color and buffer
    gl.blitFramebuffer(
      0, 0, 1000, 1000,       // src rect
      0, 0, width, height,       // dst rect
      gl.COLOR_BUFFER_BIT,       // mask
      gl.NEAREST                 // filter
    );
    {const err = gl.getError();
    if (err !== gl.NO_ERROR) {
      console.warn("Rendering error:", err);
    }}
    gl.blitFramebuffer(
      0, 0, 1000, 1000,       // src rect
      0, 0, width, height,       // dst rect
      gl.DEPTH_BUFFER_BIT,       // mask
      gl.NEAREST                 // filter
    );
     {const err = gl.getError();
    if (err !== gl.NO_ERROR) {
      console.warn("Rendering error:", err);
    }}


    // Unbind framebuffers after blit
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);

    // 2) Now upscale low-res texture over the default framebuffer
    gl.depthFunc(gl.LESS);
    gl.enable(gl.DEPTH_TEST);
    
    this.upscaleshader.use();

    // Bind low-res color texture to texture unit 0
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.low_texture_color);
    this.upscaleshader.uniform1i("u_color", 0);

    // Bind low-res depth texture to texture unit 1
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.low_texture_depth);
    //gl.uniform1i(this.upscaleshader.getUniformLocation("u_depth"), 1);
    this.upscaleshader.uniform1i("u_depth", 1);

    // Draw fullscreen triangle or quad (depending on your setup)
    ctx.bindquadvao();
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Cleanup bindings (optional)
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.useProgram(null);


    {const err = gl.getError();
    if (err !== gl.NO_ERROR) {
      console.warn("Rendering error:", err);
    }}
  }
  clear(){
    const gl=this.ctx.gl;
    for(const fb of [this.high_framebuffer,this.low_framebuffer,null]){
      gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }
  }


  inithigh(width, height){
    const ctx = this.ctx;
    const gl=ctx.gl;


    this.high_framebuffer=gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.high_framebuffer);

    this.high_renderbuffer_color=gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER,this.high_renderbuffer_color);
    //gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA8, width, height);//or RGB8
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.RENDERBUFFER,this.high_renderbuffer_color);

    this.high_renderbuffer_depth=gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER,this.high_renderbuffer_depth);
    //gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);//or gl.DEPTH_COMPONENT24 or gl.DEPTH_COMPONENT32F
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,this.high_renderbuffer_depth);
    

    this.resizehigh(width, height);

    {const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.error("Framebuffer incomplete:", status);
    }}
  }

  initlow(width, height){
    const ctx = this.ctx;
    const gl=ctx.gl;


    this.low_framebuffer=gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.low_framebuffer);

    this.low_texture_color=gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.low_texture_color);
    /*gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA8,
      width, height, 0,
      gl.RGBA, gl.UNSIGNED_BYTE, null
    );*/
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.low_texture_color, 0
    );

    this.low_texture_depth=gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.low_texture_depth);
    /*gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT16,
      width, height, 0,
      gl.RGBA, gl.UNSIGNED_SHORT, null
    );*/
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.low_texture_depth, 0
    );
    

    this.resizelow(width, height);

    {const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.error("Framebuffer incomplete:", status);
    }}

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  resizehigh(width, height){
    const gl = this.ctx.gl;
    gl.bindRenderbuffer(gl.RENDERBUFFER,this.high_renderbuffer_color);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA8, width, height);//or RGB8

    gl.bindRenderbuffer(gl.RENDERBUFFER,this.high_renderbuffer_depth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
  }

  resizelow(width, height){
    const gl = this.ctx.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.low_texture_color);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA8,
      width, height, 0,
      gl.RGBA, gl.UNSIGNED_BYTE, null
    );

    gl.bindTexture(gl.TEXTURE_2D, this.low_texture_depth);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT16,
      width, height, 0,
      gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null
    );
  }

  destroy() {
    const gl = this.ctx.gl;
    gl.deleteFramebuffer(this.high_framebuffer);
    gl.deleteRenderbuffer(this.high_renderbuffer_color);
    gl.deleteRenderbuffer(this.high_renderbuffer_depth);

    gl.deleteFramebuffer(this.low_framebuffer);
    gl.deleteTexture(this.low_texture_color);
    gl.deleteTexture(this.low_texture_depth);
  }




}


