import { LazyRenderingPipeline } from "./LazyRenderingPipeline.js";
import { Shader } from "../glwrapper/glwrapper.js";
import { shaderSources } from "../glwrapper/shaderimporter.js";
export class linegridrenderer extends LazyRenderingPipeline{

  /*static vShader=`#version 300 es
  // Vertex Shader
precision highp float;

in vec3 position;

uniform mat3 cameraMatrix;
uniform vec3 cameraPos;
uniform vec2 windowsize;

const float FOV=120.;
const float FOVfactor=1./tan(radians(FOV) * 0.5);

out vec3 v_viewPos; // view-space position for frag

void main() {
    vec3 worldPos = position;
    vec3 viewVec = transpose(cameraMatrix) * (worldPos - cameraPos);
    v_viewPos = viewVec;

    float x = FOVfactor * viewVec.x / viewVec.z;
    float y = FOVfactor * viewVec.y / viewVec.z * (windowsize.x / windowsize.y);

    // We can just set z and w here to 1.0 (or something else), and calculate depth in frag
    gl_Position = vec4(x, y, 0.0, 1.0);

    gl_PointSize = 3.0; // for points
}`;*/
  static vShader=`#version 300 es
precision highp float;

in vec3 position;

uniform mat3 cameraMatrix;
uniform vec3 cameraPos;
uniform vec2 windowsize;

const float FOV = 120.0;
const float NEAR = 0.01;
const float FAR = 100.0;

out vec3 v_viewPos;

// Simple hash function to generate a float from a vec3 seed
float hash(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
}

vec3 pseudoRandomColor(vec3 seed) {
    return vec3(
        hash(seed + vec3(1.0, 0.0, 0.0)),
        hash(seed + vec3(0.0, 1.0, 0.0)),
        hash(seed + vec3(0.0, 0.0, 1.0))
    )*0.8+0.2;
}
flat out vec3 v_color;

uniform vec2 focal;

void main() {
    vec3 worldPos = position;
    vec3 viewVec = transpose(cameraMatrix) * (worldPos - cameraPos);
    v_viewPos = viewVec;

    // Perspective projection (manually)
    //float aspect = windowsize.x / windowsize.y;
    //float f = 1.0 / tan(radians(FOV) * 0.5);
    viewVec.z*=-1.;

    vec2 xy=focal*viewVec.xy;

    //float x_clip = f * viewVec.x;
    //float y_clip = f * viewVec.y* aspect;
    float z_clip = (FAR + NEAR) / (NEAR - FAR) * viewVec.z + (2.0 * FAR * NEAR) / (NEAR - FAR);
    float w_clip = -viewVec.z;

    gl_Position = vec4(xy, z_clip, w_clip);
    gl_PointSize = 5.0;

    v_color = pseudoRandomColor(position);
}`;
static fShader=`#version 300 es
// Fragment Shader
precision highp float;

in vec3 v_viewPos;

uniform vec4 incolor;

out vec4 fragColor;

const float zMax = 1000.0; // same as your normalization factor

flat in vec3 v_color;

void main() {
    if (v_viewPos.z <= 0.0) {
        discard;
    }
    //gl_FragDepth=0.;
    float z = v_viewPos.z/ zMax;//length(v_viewPos) / zMax; 

    // Write to depth buffer manually
    gl_FragDepth =clamp(z ,0.,1.);

    fragColor = vec4(incolor.rgb, 1.0);
    //fragColor = vec4(v_color, 1.0);
}`;
  static pointshader=null;
  constructor(gl,visgraph,axis_aligned_glsl,color){
    super(()=>{
      this.orthsize=100;
      const text_frame=linegridrenderer.createRootOutputTextures(gl,this.orthsize,this.orthsize);
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
      //gl.bindBuffer(gl.ARRAY_BUFFER, this.pointbuffer);
      this.linebuffer = gl.createBuffer();
      this.trianglesbuffer = gl.createBuffer();
      this.edgelinebuffer = gl.createBuffer();

      linegridrenderer.lineshader ??= new Shader(gl, linegridrenderer.vShader, linegridrenderer.fShader);

      this.color=color;
      


      this.pointvao=gl.createVertexArray();
      gl.bindVertexArray(this.pointvao);
      gl.bindBuffer(gl.ARRAY_BUFFER,  this.pointbuffer);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.linebuffer);

      const positionAttribLoc=linegridrenderer.lineshader.getAttribLocation("position");
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
      // +X axis  //u -> -z    v ->  y
      new Matrix([
        [0, 0, 1],
        [0, 1, 0],
        [-1, 0, 0]
      ]),
      // +Y axis  //u ->  x    v -> -z
      new Matrix([
        [1, 0, 0],
        [0, 0, 1],
        [0, -1, 0]
      ]),
      // +Z axis  //u ->  x    v ->  y
      /*new Matrix([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
      ])*/
     // -Z axis  //u ->  y    v ->  x
      new Matrix([
        [0, 1, 0],
        [1, 0, 0],
        [0, 0, -1]
      ])
    ];
    // +X axis  //u -> -z    v ->  y
    // +Y axis  //u ->  x    v -> -z
    // +Z axis  //u ->  x    v ->  y

  
    
    const points = [];

    this.orthshader.use();
    this.visgraph.setuniforms(ctx.nodecache,this.orthshader);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.drawBuffers(attachments);
    
    //ctx.bindquadvao();

    gl.viewport(0,0,s,s);

    const windowsizeLocation = this.orthshader.getUniformLocation('windowsize');
    gl.uniform2fv(windowsizeLocation, [s, s]);
    const scale=5.;
    const planes=[];

    


  

    for (let projection of projections) {
      projection=projection.mul(scale);
      const axis = projection.mul(new Vector([0, 0, 1]));

      //array init for shape [s,s,0] later becomes y,x,root,[pointindex,a,imag]
      const plane=Array.from({ length: s }, () =>Array.from({ length: s }, () => []));
      planes.push(plane);

      const c2wLocation = this.orthshader.getUniformLocation("cameraMatrix");
      gl.uniformMatrix3fv(c2wLocation, true, new Float32Array(projection.array.flat()));

      
      
      
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      for (const attachment of attachments) {
        gl.readBuffer(attachment);
        gl.readPixels(0, 0, s, s, gl.RGBA, gl.FLOAT, pixelbuffer);

        

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

              plane[y][x].push([points.length,((a + 1) * s - 1) / 2,imag]);
              points.push(pt.array);

              //pointindex, a in bucket space,error
              //why ((a + 1) * s - 1) / 2?
              //(2 * x + 1 - s) / s=a
              //(2 * x + 1 ) / s-1=a
              //(2 * x + 1 ) / s=a+1
              //(2 * x + 1 ) =(a+1)*s
              //2 * x =((a+1)*s-1)
              //x =((a+1)*s-1)/2 
              //this means a is transformed in the same space as x

              
            }

          }
        }
      }

      //remove close points
      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          const raypoints = plane[y][x];
          raypoints.sort(([, a], [, b]) => a - b);

          for (let i = 0; i < raypoints.length - 1; i++) {
            const [, a1, error1] = raypoints[i];
            const [, a2, error2] = raypoints[i + 1];

            if (Math.floor(a1) !== Math.floor(a2)) continue;
            if (Math.abs(a2 - a1) < 0.03) {
              //console.log("removed");
              // Remove the one with higher error
              if (error1 <= error2) {
                raypoints.splice(i + 1, 1);
              } else {
                raypoints.splice(i, 1);
              }
              i--; // stay on same index to check against the new neighbor
            }
          }
        }
      }
    }

    

    //console.log(planes);
    // +X axis  //u -> -z    v ->  y
    // +Y axis  //u ->  x    v -> -z
    // +Z axis  //u ->  x    v ->  y
    const lines = [];
    //const triangles = [];
    const edgeline=[];

   for(let i=0;i<3;i++){ 
    const xplane=planes[i];
    const yplane=planes[(i+1)%3];
    //const cordset=new Set();

  

    for (let z = 0; z < s; z++) {
      const xrow=xplane.map(row=>row[z]);//xplane[z];//row in y direction ,ray in x dir
      const yrow=yplane[z];//yplane.map(row=>row[z]);//row in x direction ,ray in y dir 

      const squares=new Map();


      //console.log(y,((point[0]/scale+1)*s-1)/2,((point[1]/scale+1)*s-1)/2,((point[2]/scale+1)*s-1)/2);//should be the same
      function getSquare(x, y) {
        if (x < 0 || x >= s || y < 0 || y >= s) return undefined;

        const key = y * s + x;
        let square = squares.get(key);
        if (square !== undefined) return square;

        square = {
          upper: [],
          lower: [],
          left:  [],
          right: []
        };
        squares.set(key, square);
        return square;
      }

      const epsilon = 0; // or 0.5 / s
      /*function transformpoint(x,y,z){
        //all.map(idx=>points[idx].map(p=>(((p/scale + 1) * s - 1) / 2))))
        //c=(((p/scale + 1) * s - 1) / 2)
        const p=[x,y,z].map(c=>((2*c+1)/s-1)*scale);
        if (!p.every(Number.isFinite) ) {
          console.warn("Invalid point ", p);
        }
        return p;
      }*/

      for (let y = 0; y < s; y++) {
        for (let [pointidx, x] of xrow[y]) {


          const xf = Math.floor(x);
          const frac = x - xf;

          // Always add to main bucket
          getSquare(xf, y)?.lower.push(pointidx);
          getSquare(xf, y - 1)?.upper.push(pointidx);

          //edgeline.push(transformpoint(xf,    y,     z),transformpoint(xf+1,    y,     z));


          // Optionally duplicate to neighbor if near edge
          /*const nearLeftEdge = frac < epsilon;
          const nearRightEdge = 1 - frac < epsilon;

          if (nearLeftEdge) {
            getSquare(xf - 1, y)?.lower.push(pointidx);
            getSquare(xf - 1, y - 1)?.upper.push(pointidx);
          }
          if (nearRightEdge) {
            getSquare(xf + 1, y)?.lower.push(pointidx);
            getSquare(xf + 1, y - 1)?.upper.push(pointidx);
          }*/
          
        }
      }

      for (let x = 0; x < s; x++) {
        for (let [pointidx, y] of yrow[x]) {


          const yf = Math.floor(y);
          const frac = y - yf;

          // Always add to main bucket
          getSquare(x, yf)?.left.push(pointidx);
          getSquare(x - 1, yf)?.right.push(pointidx);

          //edgeline.push(transformpoint(x,    yf,     z),transformpoint(x,    yf+1,     z));


          /*const p1 = transformpoint(x, yf, z);
          const p2 = transformpoint(x, yf + 1, z);
          if (p1[0] !== p2[0] && p1[1] !== p2[1]) {
            console.warn("Diagonal?", p1, p2);
          }

          // Optionally add to neighbor buckets if close to vertical edge
          const nearTopEdge = frac < epsilon;
          const nearBottomEdge = 1 - frac < epsilon;

          if (nearTopEdge) {
            getSquare(x, yf - 1)?.left.push(pointidx);
            getSquare(x - 1, yf - 1)?.right.push(pointidx);
          }
          if (nearBottomEdge) {
            getSquare(x, yf + 1)?.left.push(pointidx);
            getSquare(x - 1, yf + 1)?.right.push(pointidx);
          }*/
          
        }
      }

      

      for (const [key,{ lower, upper, left, right }] of squares) {
        const all = [...lower, ...upper, ...left, ...right];
        const y = Math.floor(key / s);
        const x = key % s;


                /*triangles.push(
          transformpoint(x,     y,     z), // A
          transformpoint(x + 1, y,     z), // B
          transformpoint(x + 1, y + 1, z), // C

          transformpoint(x,     y,     z), // A
          transformpoint(x + 1, y + 1, z), // C
          transformpoint(x,     y + 1, z)  // D
        );*/

        if (all.length === 1) {
          // Only one point — skip
          //console.log(x,y,"Ambiguous junction with", all.length, "points:", all.map(idx=>points[idx].map(p=>(((p/scale + 1) * s - 1) / 2))));
          continue;
        } else if (all.length === 2) {
          // Exactly two — create a line
          lines.push(all[0]); 
          lines.push(all[1]);
          //console.log(lower, upper, left, right);
          if(![lower, upper, left, right].some(a=>a.length==2)){
            //lines.push(all[0]); 
            //lines.push(all[1]);
          }

        } else {
          // More than two
          //console.log(x,y,"Ambiguous junction with", all.length, "points:", all.map(idx=>points[idx].map(p=>(((p/scale + 1) * s - 1) / 2))));

          for(let i=0;i<all.length;i++){
            for(let j=i+1;j<all.length;j++){
              lines.push(all[i]); 
              lines.push(all[j]);
            }
          }
        }
        /*const epsilon = 1e-4;
        const allpoints=all.map(idx=>points[idx].map(p=>(((p/scale + 1) * s - 1) / 2)));
        if (allpoints.some(([px, py,pz]) =>
          px < x - epsilon || px > x + 1 + epsilon ||
          py < y - epsilon || py > y + 1 + epsilon  || 
          isNaN(px) || isNaN(py) || isNaN(pz)
        )) {
          console.warn(`Bucket mismatch at (${x}, ${y})`);
          //console.log("Points:", allpoints);
        }*/

      }
     
    }

    //console.log("iterated over {} points ",pointinarraycount,edgeline.length/2,pointset.size);
}



    //console.log(Array.from(cordset).sort((a, b) => a - b));
    //((pointto2d(point)/scale+1)*s-1)/2 inverse point transform


//console.log(triangles);


    
    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.pointbuffer);
    this.count=points.length;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points.flat()), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.edgelinebuffer);
    this.edgelinescount=edgeline.length;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(edgeline.flat()), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    //console.log(edgeline);

    /*gl.bindBuffer(gl.ARRAY_BUFFER, this.trianglesbuffer);
    this.trianglescount=triangles.length;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangles.flat()), gl.STATIC_DRAW);*/

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.linebuffer);
    this.lineCount = lines.length;  // number of vertices (2 per line)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lines), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    console.log(lines.length);

    //console.log(points.filter(row=>row.some(v=>v!=0.)));
    //const indices = points.map((row, i) => row.some(v => v !== 0) ? i : -1).filter(i => i !== -1);
  //console.log(indices);

  }

  render(ctx) {
    const gl = this.gl;
    gl.depthFunc(gl.LESS);
    gl.enable(gl.DEPTH_TEST);

    linegridrenderer.lineshader.use();
    gl.uniform4fv(linegridrenderer.lineshader.getUniformLocation('incolor'), [this.color.r,this.color.g,this.color.b,1.0]);
    ctx.updateUniforms(linegridrenderer.lineshader); // sets cameraPos and cameraMatrix and focal
    
    gl.bindVertexArray(this.pointvao); // VAO with vertex positions bound
    gl.drawElements(gl.LINES, this.lineCount, gl.UNSIGNED_SHORT, 0);
    //gl.drawArrays(gl.POINTS, 0, this.count);
    gl.bindVertexArray(null);



    /*gl.uniform4fv(linegridrenderer.lineshader.getUniformLocation('incolor'), [this.color.r*0.7,this.color.g*0.7,this.color.b*0.7,1.0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.trianglesbuffer);
    const positionLoc = linegridrenderer.lineshader.getAttribLocation('position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    //gl.drawArrays(gl.TRIANGLES, 0, this.trianglescount);
    //gl.disableVertexAttribArray(positionLoc);
    //console.log( this.trianglescount);



    gl.bindBuffer(gl.ARRAY_BUFFER, this.edgelinebuffer);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, this.edgelinescount);



    gl.disableVertexAttribArray(positionLoc);*/

    
    //gl.enable(gl.DEPTH_TEST);


    //gl.finish();
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
