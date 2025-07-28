
import { Shader } from "./glwrapper.js";
import { ShaderCache } from "./shadercache.js";
import { shaderSources } from "./shaderimporter.js";




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


export class textureFramebuffer{

  static upscaleshaderfactory=new ShaderCache(null,shaderSources.vertRaycastFullscreen,upscalefrag);

  upscale(){
    const gl=this.gl;


    //gl.depthFunc(gl.LESS);
    //gl.enable(gl.DEPTH_TEST);
    //gl.disable(gl.DEPTH_TEST);
    
    this.upscaleshader.use();
    

    // Bind low-res color texture to texture unit 0
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture_color);
    this.upscaleshader.uniform1i("u_color", 0);

    // Bind low-res depth texture to texture unit 1
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.texture_depth);
    //gl.uniform1i(this.upscaleshader.getUniformLocation("u_depth"), 1);
    this.upscaleshader.uniform1i("u_depth", 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Cleanup bindings (optional)
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.useProgram(null);
  }
  
  constructor(gl,width=0,height=0){
    this.gl=gl;
    this.upscaleshader=textureFramebuffer.upscaleshaderfactory.getcached(gl);



    this.framebuffer=gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

    this.texture_color=gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture_color);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture_color, 0
    );

    this.texture_depth=gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture_depth);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.texture_depth, 0
    );
    

    this.resize(width, height);


    {const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.error("Framebuffer incomplete:", status);
    }}

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  
  }

  bind(){
    const gl=this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
  }

  updateViewport(){
    const gl=this.gl;
    const [w, h] = this.resolution;
    gl.viewport(0, 0, w, h);
  }

  clear(){
    const gl=this.gl;
    this.bind();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    //gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  get resolution(){
    return this._resolution;
  }
  set resolution([width, height]){
    this.resize(width,height);
  }

  resize(width, height){
    this._resolution=[width,height];

    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture_color);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA8,
      width, height, 0,
      gl.RGBA, gl.UNSIGNED_BYTE, null
    );

    gl.bindTexture(gl.TEXTURE_2D, this.texture_depth);
    /*gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT16,
      width, height, 0,
      gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null
    );*/
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24,
      width, height, 0,
      gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null
    );
  }

    destroy() {
      const gl = this.gl;
      gl.deleteFramebuffer(this.framebuffer);
      gl.deleteRenderbuffer(this.renderbuffer_color);
      gl.deleteRenderbuffer(this.renderbuffer_depth);
    }


}
