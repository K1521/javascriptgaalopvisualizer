import { Shader } from "./glwrapper.js";

export class ShaderCache {
  constructor(gl, vertexShaderSource, fragmentShaderSource, varyings = undefined, buffermode = undefined) {
    this.vertexShaderSource = vertexShaderSource;
    this.fragmentShaderSource = fragmentShaderSource;
    this.varyings = varyings;
    this.buffermode = buffermode;
    this.defaultGL = gl;

    this.cache = new WeakMap(); // one Shader per GL context
  }

  getnew(gl) {
    gl ??= this.defaultGL;
    if (!gl) throw new Error("No WebGL context provided.");
    return new Shader(gl, this.vertexShaderSource, this.fragmentShaderSource, this.varyings,  this.buffermode );
  }

  getcached(gl) {
    gl ??= this.defaultGL;
    if (!gl) throw new Error("No WebGL context provided.");
    if (!this.cache.has(gl)) {
      this.cache.set(gl, this.getnew(gl));
    }
    return this.cache.get(gl);
  }
}
