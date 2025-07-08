import { LazyRenderingPipeline } from "./LazyRenderingPipeline.js";
import { Shader } from "../glwrapper/glwrapper.js";
import { shaderSources } from "../glwrapper/shaderimporter.js";
export class pointcloudrenderer extends LazyRenderingPipeline{

  static vShader=`#version 300 es
// Vertex Shader
//this shader is so complicated because i wrote my raycasting code before this and then made this code to fit the raycasting logic
precision highp float;

in vec3 position;

out vec3 vWorldPos;

uniform mat3 cameraMatrix;
uniform vec3 cameraPos;
uniform vec2 windowsize;


const float FOV=120.;
const float FOVfactor=1./tan(radians(FOV) * 0.5);
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
    gl_PointSize = 3.0;
}`;
  static fShader=`#version 300 es
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

  static pointshader=null;
  constructor(gl,visgraph,axis_aligned_glsl,color){
    super(()=>{
      this.orthsize=100;
      const text_frame=pointcloudrenderer.createRootOutputTextures(gl,this.orthsize,this.orthsize);
      this.framebuffer=text_frame[1];
      this.textures=text_frame[0];

      this.gl=gl;
      this.visgraph=visgraph;

      const frag=visgraph.gencode(axis_aligned_glsl);
    const orthshader=new Shader(gl, shaderSources.vertRaycastFullscreen,frag );
    orthshader.use();
      //this.context=context;
      this.orthshader=orthshader;  


      this.pointbuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.pointbuffer);

      pointcloudrenderer.pointshader ??= new Shader(gl, pointcloudrenderer.vShader, pointcloudrenderer.fShader);

      this.color=color;
      


      this.pointvao=gl.createVertexArray();
      gl.bindVertexArray(this.pointvao);
      gl.bindBuffer(gl.ARRAY_BUFFER,  this.pointbuffer);
      const positionAttribLoc=pointcloudrenderer.pointshader.getAttribLocation("position");
      gl.enableVertexAttribArray(positionAttribLoc);
      gl.vertexAttribPointer(positionAttribLoc, 3, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);

      /*const allpoints = this.renderorth();
      //const pointBuffers = allpoints.map(obj => new Float32Array(obj.flat()));
      //... make openglbuffer
      console.log(allpoints);
      this.pointBuffers = allpoints.map(obj => {
        const flatData = new Float32Array(obj.flat());//TODO fix this uglyly chatgpt code
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatData, gl.STATIC_DRAW);
        return { buffer, count: flatData.length / 3 };
      });*/


      //...make point renderer
      this.count=0;
      
    });
  }

  updateParams(ctx){
    if(this.paramsversion==ctx.paramsversion)return;
    this.paramsversion=ctx.paramsversion;
    

    const gl = this.gl;
    
    const attachments = [
      gl.COLOR_ATTACHMENT0,
      gl.COLOR_ATTACHMENT1,
      gl.COLOR_ATTACHMENT2,
      gl.COLOR_ATTACHMENT3
    ];
    

    const s=this.orthsize;
    const pixelbuffer = new Float32Array(s*s * 4);

    const projections = [
      // +X axis
      new Matrix([
        [0, 0, 1],
        [0, 1, 0],
        [-1, 0, 0]
      ]),
      // +Y axis
      new Matrix([
        [1, 0, 0],
        [0, 0, 1],
        [0, -1, 0]
      ]),
      // +Z axis
      new Matrix([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
      ])
    ];


   
    
    const points = [];

    this.orthshader.use();
    this.visgraph.setuniforms(ctx.nodecache,this.orthshader);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.drawBuffers(attachments);
    
    //ctx.bindquadvao();

    gl.viewport(0,0,s,s);

    const windowsizeLocation = this.orthshader.getUniformLocation('windowsize');
    gl.uniform2fv(windowsizeLocation, [s,s]);
    const scale=5.;
    for (let projection of projections) {
      projection=projection.mul(scale);
      const axis = projection.mul(new Vector([0, 0, 1]));

      const c2wLocation = this.orthshader.getUniformLocation("cameraMatrix");
      gl.uniformMatrix3fv(c2wLocation, true, new Float32Array(projection.array.flat()));

      
      
      
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      for (const attachment of attachments) {
        gl.readBuffer(attachment);
        gl.readPixels(0, 0, s,s, gl.RGBA, gl.FLOAT, pixelbuffer);

        

        for (let y = 0; y < s; y++) {
          for (let x = 0; x < s; x++) {
            const idx = 4 * (y * s + x);
            
            const uv = new Vector([
              (2 * x + 1 - s) / s,
              (2 * y + 1 - s) / s,
              0
            ]);
            const ro = projection.mul(uv);

            for (const i of [0, 2]) {
              const a = pixelbuffer[idx + i];
              const imag = pixelbuffer[idx + i + 1];
              if (!Number.isFinite(a) || !Number.isFinite(imag)||imag>0.01) continue;
              const pt = ro.add(axis.mul(a));
              points.push(pt.array);
            }
          }
        }
      }
    }


    
    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.pointbuffer);
    this.count=points.length;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points.flat()), gl.STATIC_DRAW);


  }

  render(ctx) {
    const gl = this.gl;
    gl.depthFunc(gl.LESS);
    gl.enable(gl.DEPTH_TEST);
    pointcloudrenderer.pointshader.use();
    gl.uniform4fv(pointcloudrenderer.pointshader.getUniformLocation('incolor'), [this.color.r,this.color.g,this.color.b,1.0]);
    ctx.updateUniforms(pointcloudrenderer.pointshader); // sets cameraPos and cameraMatrix and windowsize
    gl.bindVertexArray(this.pointvao);
    gl.drawArrays(gl.POINTS, 0, this.count);
    gl.bindVertexArray(null);
  }



  static createRootOutputTextures(gl, width, height) {
    const textures = [];
    const attachments = [
      gl.COLOR_ATTACHMENT0,
      gl.COLOR_ATTACHMENT1,
      gl.COLOR_ATTACHMENT2,
      gl.COLOR_ATTACHMENT3
    ];
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    for (const attachment of attachments) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA32F,//gl.RGBA16F,
        width, height, 0,
        gl.RGBA, gl.FLOAT, null
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, tex, 0
      );
      textures.push(tex);
    }

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.error("Framebuffer incomplete:", status);
    }

    return [textures,framebuffer];
  }

   isTilable(){return false;}

}
