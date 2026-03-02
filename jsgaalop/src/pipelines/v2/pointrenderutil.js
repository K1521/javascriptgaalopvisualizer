import { LazyRenderingPipeline } from "../LazyRenderingPipeline.js";
import { Shader } from "../../glwrapper/glwrapper.js";
import { shaderSources } from "../../glwrapper/shaderimporter.js";
import { Matrix ,Vector} from "../../util/linalg1.js";
import { ShaderCache } from "../../glwrapper/shadercache.js";


const vShader=`#version 300 es
// Vertex Shader
//this shader is so complicated because i wrote my raycasting code before this and then made this code to fit the raycasting logic
precision highp float;

in vec3 position;

out vec3 vWorldPos;

uniform mat3 cameraMatrix;
uniform vec3 cameraPos;
uniform vec2 windowsize;

uniform float pointsize;
//const float FOV=120.;
//const float FOVfactor=1./tan(radians(FOV) * 0.5);
uniform vec2 focal;

void main() {
    vec3 worldPos = position;
    vWorldPos=position;
    vec3 viewVec = transpose(cameraMatrix) * (worldPos - cameraPos); // Transform to camera space

    // Reconstruct screen-space position (NDC) manually
    //float x = FOVfactor*viewVec.x / ( viewVec.z);
    //float y = FOVfactor*viewVec.y / ( viewVec.z)*(windowsize.x / windowsize.y);

    vec2 xy=focal*viewVec.xy/viewVec.z;

    // Perspective projection manually: NDC.x/y in [-1, 1], z = normalized depth
    float z = viewVec.z/1000.;//length(viewVec)*sign(viewVec.z) / 1000.0; // Normalize depth to match raymarch

    // Convert z to NDC (-1 to 1): GPU expects this for depth
    float ndcZ = z * 2.0 - 1.0;

    gl_Position = vec4(xy, ndcZ, 1.0);

    // Optional point size
    //gl_PointSize = 3.0;
    if(pointsize>0.)gl_PointSize=pointsize* (focal.x+focal.y)*0.5 / viewVec.z;
    else gl_PointSize=-pointsize;

    gl_PointSize = clamp(gl_PointSize, 1.0, 20.0);

}`;
const fShader=`#version 300 es
// Fragment Shader
precision highp float;
uniform vec4 incolor;
out vec4 fragColor;
in vec3 vWorldPos; 
void main() {
    float pattern = 0.5 + 0.5 * mod(floor(vWorldPos.x * 4.0) + floor(vWorldPos.y * 4.0) + floor(vWorldPos.z * 4.0), 2.0);
    vec3 col = incolor.rgb * pattern;
    fragColor = vec4(col, 1.0);
}

`;

export const pointshaderfactory=new ShaderCache(null,vShader,fShader);

export class PointShader{
  constructor(gl,color){
    this.gl=gl;
    this.color=color;
    
    this.count=0;
    this.shader=pointshaderfactory.getcached(gl);
    
    this.vao=gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    this.pointbuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,  this.pointbuffer);
    const positionAttribLoc=this.shader.getAttribLocation("position");
    gl.enableVertexAttribArray(positionAttribLoc);
    gl.vertexAttribPointer(positionAttribLoc, 3, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    this.pointsize=-3;
  }
  render(ctx){
    const color=this.color;
    const gl=this.gl;
    this.shader.use();
    this.shader.uniform1f('pointsize', this.pointsize);
    this.shader.uniform4fv('incolor', [color.r,color.g,color.b,1.0]);
    ctx.updateUniforms(this.shader); // sets cameraPos and cameraMatrix and windowsize
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.POINTS, 0, this.count);
    gl.bindVertexArray(null);
  }
  setpoints(points){
    const gl=this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pointbuffer);
    this.count=points.length/3;
    
    if(points.length>0)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
    else 
        gl.bufferData(gl.ARRAY_BUFFER,0, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

  }

}
