import { LazyRenderingPipeline } from "../LazyRenderingPipeline.js";
import { Shader } from "../../glwrapper/glwrapper.js";
//import { shaderSources } from "../glwrapper/shaderimporter.js";

//import { pointshaderfactory } from "./pointcloudrenderer.js";


//import { PackedVoxelGrid } from "../voxelutil/v1/PackedVoxelGrid.js";
import { TransformFeedbackWrapper } from "../../glwrapper/TransformFeedbackWrapper.js";
//import { VoxelVertexMapper } from "../voxelutil/v1/VoxelVertexMapper.js";

import * as tables from "../../voxelutil/mctabel.js";
//import { PackedVoxelGridFilter } from "../voxelutil/v1/PackedVoxelGridFilter.js";
//import { PackedVoxelGridFilter2 } from "../voxelutil/v2/PackedVoxelGridFilter.js";
//import { VoxelVertexMapper2 } from "../voxelutil/v2/VoxelVertexMapper.js";
//import { PackedVoxelGrid2 } from "../voxelutil/v2/PackedVoxelGrid.js";

import { Voxels } from "../../voxelutil/v3/voxels.js";
/**
 * Checks if a 3D vector is near zero in magnitude.
 * @param {[number, number, number]} vec - The input vector [x, y, z].
 * @param {number} [epsilon=1e-10] - Tolerance for near-zero check.
 * @returns {boolean} True if vector length is less than epsilon.
 */
function isVec3NearZero([x, y, z], epsilon = 0) {
  return x * x + y * y + z * z <= epsilon * epsilon;
}

/**
 * Computes the dot product of two 3D vectors.
 * @param {[number, number, number]} a - First vector.
 * @param {[number, number, number]} b - Second vector.
 * @returns {number} The dot product a · b.
 */
function dotVec3([ax, ay, az], [bx, by, bz]) {
  return ax * bx + ay * by + az * bz;
}


/**
 * Computes the reordering index array to convert values from `fromOrder` to `toOrder`.
 * Each order is an array of coordinate arrays, e.g., [[0,0,0], [1,0,0], ...]
 *
 * @param {number[][]} fromOrder - The current order of coordinates.
 * @param {number[][]} toOrder - The desired target order of coordinates.
 * @returns {number[]} - An array of indices such that
 *                       reordered[i] = original[reordering[i]] matches toOrder.
 */
export function makeReordering(fromOrder, toOrder) {
  return toOrder.map(target =>
    fromOrder.findIndex(source =>
      source[0] === target[0] &&
      source[1] === target[1] &&
      source[2] === target[2]
    )
  );
}


/**
 * Reorders elements in the array according to the given reordering.
 *
 * @template T
 * @param {T[]} array - The array to reorder.
 * @param {number[]} reordering - The index map (as produced by `makeReordering`).
 * @returns {T[]} - The reordered array.
 */
export function reorderArray(array, reordering) {
  return reordering.map(i => array[i]);
}


function float32arrayify(input) {
  if (input instanceof Float32Array) return input;

  if (Array.isArray(input)) {
    if (input.length === 0) return new Float32Array(); // Empty input

    const first = input[0];
    if (Array.isArray(first)) {
      return new Float32Array(input.flat());
    } else {
      return new Float32Array(input); // flat number[]
    }
  }

  if (input && typeof input[Symbol.iterator] === "function") {
    return float32arrayify(Array.from(input));
  }

  throw new TypeError("Expected Float32Array, number[], number[][], or iterable of numbers");
}

/**
 * Runs a transform feedback shader on a single input attribute (e.g. vec3 array).
 * Handles buffer, VAO, and shader setup internally.
 */
class SingleInputTransformFeedback extends TransformFeedbackWrapper {
  /**
   * @param {WebGL2RenderingContext} gl - The WebGL2 context.
   * @param {string} vertexShaderSource - GLSL source for the vertex shader.
   * @param {string} [inputAttribName="inValue"] - The name of the single input attribute (e.g., "position").
   * @param {string|string[]} [varyings=["outValue"]] - Names of output variables to capture via transform feedback.
   * @param {number} [componentsPerVertex=3] - Number of components per input vertex (e.g., 3 for vec3).
   */
  constructor(
    gl,
    vertexShaderSource,
    inputAttribName = "inValue",
    varyings = ["outValue"],
    componentsPerVertex = 3
  ) {
    super(gl, vertexShaderSource, Array.isArray(varyings) ? varyings : [varyings]);

    this.componentsPerVertex = componentsPerVertex;

    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    this.pointBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);

    const location = this.shader.getAttribLocation(inputAttribName);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, componentsPerVertex, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
  }

  /**
   * Runs the transform feedback shader on the given input.
   * @param {Float32Array | number[] | number[][] | Iterable<number>} inputData - Input data (flat or nested array).
   * @returns {Float32Array[]} An array of Float32Arrays, one per output varying.
   */
  transform(inputData) {
    const inputArray = float32arrayify(inputData);
    if (inputArray.length % this.componentsPerVertex !== 0) {
      throw new Error(`Input length must be divisible by ${this.componentsPerVertex}`);
    }

    const gl = this.gl;
    const vertexCount = inputArray.length / this.componentsPerVertex;

    this.useshader();
    gl.bindVertexArray(this.vao);

    // Allocate or update buffer (assumes size doesn't shrink often)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, inputArray, gl.DYNAMIC_DRAW);

    const result = super.run(vertexCount);
    gl.bindVertexArray(null);

    return result;
  }
}



  const vShader=`#version 300 es
precision highp float;

in vec3 position;

uniform mat3 cameraMatrix;
uniform vec3 cameraPos;
//uniform vec2 windowsize;

//const float FOV = 120.0;
const float NEAR = 0.01;
const float FAR = 100.0;

out vec3 v_viewPos;

// Simple hash function to generate a float from a vec3 seed
/*float hash(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
}*/
/*float hash(vec3 p) {
    p += fract(p * 0.1031);
    p += dot(p, sin(p.yzx*12345.))*123.;
    return fract((p.x + p.y) * p.z);
}*/

float hash(vec3 p) {
    ivec3 f1 = ivec3(p * 65531.0);
    ivec3 f2 = ivec3(sin(p) * 65531.0);
    ivec3 f4 = ivec3(sin(p * 65531.0) * 65531.0);
    ivec3 f5 = f1 * f2.zxy + ivec3(p).zxy * f4.yxz;
    ivec3 m = f5 * 1664525 + 1013904223;
    int h = m.x ^ m.y ^ m.z;
    return float(h & 0x7fffffff) / 2147483647.0; // normalize to [0,1)
}


vec3 pseudoRandomColor(vec3 seed) {
    return vec3(
        hash(seed + vec3(1.0, 0.0, 0.0)),
        hash(seed + vec3(0.0, 1.0, 0.0)),
        hash(seed + vec3(0.0, 0.0, 1.0))
    )*0.8+0.2;
}
flat out vec3 v_color;
out vec3 v_worldPos;

uniform vec2 focal;

void main() {
    vec3 worldPos = position;
    v_worldPos=position;
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
const fShader=`#version 300 es
// Fragment Shader
precision highp float;

in vec3 v_viewPos;
in vec3 v_worldPos;


uniform vec4 incolor;

out vec4 fragColor;

const float zMax = 1000.0;

flat in vec3 v_color;//pseudo random color based on vertex pos of one of the triangles

void main() {
    if (v_viewPos.z <= 0.0) {
        discard;
    }
    //gl_FragDepth=0.;
    float z = v_viewPos.z/ zMax;//length(v_viewPos) / zMax; 

    // Write to depth buffer manually
    gl_FragDepth =clamp(z ,0.,1.);

    //fragColor = vec4(incolor.rgb, 1.0);
    //fragColor = vec4(v_color, 1.0);
    float pattern = 0.5 + 0.5 * mod(floor(v_worldPos.x * 4.0) + floor(v_worldPos.y * 4.0) + floor(v_worldPos.z * 4.0), 2.0);
    fragColor = vec4(incolor.rgb*pattern, 1.0);
    //fragColor = vec4(v_color, 1.0);
 
}`;


class Voxelfilter{
  constructor(gl,vertexshader,visgraph){
    this.visgraph=visgraph;
    this.gl=gl;
    this.voxelfilter=new TransformFeedbackWrapper(gl, vertexshader,["result"]);   
    this.shader=this.voxelfilter.shader;
    this.voxelvao=gl.createVertexArray();
    gl.bindVertexArray(this.voxelvao);
    this.voxelbuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,  this.voxelbuffer);
    ["X","Y","Z"].forEach((attr,i)=>{
      const low=this.voxelfilter.shader.getAttribLocation(attr);
      gl.enableVertexAttribArray(low);
      gl.vertexAttribPointer(low, 2, gl.FLOAT, false, 6*4, 2*4*i);
    })
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER,  null);
    
  }
  use(ctx){
    const gl=this.gl;
    this.voxelfilter.shader.use();
    this.visgraph.setuniforms(this.voxelfilter.shader,ctx.evalContext);
    gl.bindVertexArray(this.voxelvao);
    gl.bindBuffer(gl.ARRAY_BUFFER,  this.voxelbuffer);
  }
  filter(voxelsflat){
    const gl=this.gl;
    if(voxelsflat.length==0)return new Float32Array();
    //gl.bindVertexArray(this.voxelvao);
    //throwonglerror(gl);
    gl.bufferData(gl.ARRAY_BUFFER,voxelsflat , gl.STATIC_DRAW);    
    //throwonglerror(gl);
    const filter=this.voxelfilter.run(voxelsflat.length/6)[0];//array of 0,1
    //throwonglerror(gl);
    return filter;
  }
}



export class MarchingCubesRenderer extends LazyRenderingPipeline{
  constructor(context,gl,visgraph, vertexshaderfilter,vertexshadergaussnewton,color) {
    super(() => {
      this.ctx=context;
      this.scale=4;
      this.visgraph=visgraph;
      this.gl = gl;
      //vertexshader=testvoxelshader;


  
      this.voxelfilter=new Voxelfilter(gl, visgraph.gencodeR(vertexshaderfilter),visgraph);   
      this.maxvoxel=10000;
      this.maxlevel=14;

      this.gaussnewton=new SingleInputTransformFeedback(gl,visgraph.gencodeR(vertexshadergaussnewton),"pos",["result"],3);
      
      this.trishader=new Shader(gl,vShader,fShader);   

      this.color=color;


      this.pointbuffer = gl.createBuffer();//
      this.pointvao=gl.createVertexArray();
      gl.bindVertexArray(this.pointvao);
      gl.bindBuffer(gl.ARRAY_BUFFER,  this.pointbuffer);
      const positionAttribLoc=this.trishader.getAttribLocation("position");
      gl.enableVertexAttribArray(positionAttribLoc);
      gl.vertexAttribPointer(positionAttribLoc, 3, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);
      this.count=0;
      
    });
  }

  

    
  render(ctx) {
    /** @type{WebGL2RenderingContext} */
    const gl=this.gl;
    gl.depthFunc(gl.LESS);
    gl.enable(gl.DEPTH_TEST);

    this.trishader.use();
    gl.uniform4fv(this.trishader.getUniformLocation('incolor'), [this.color.r,this.color.g,this.color.b,1.0]);
    ctx.updateUniforms(this.trishader); // sets cameraPos and cameraMatrix and focal
    
    gl.bindVertexArray(this.pointvao); // VAO with vertex positions bound
    //gl.drawElements(gl.LINES, this.lineCount, gl.UNSIGNED_SHORT, 0);
    gl.drawArrays(gl.TRIANGLES, 0, this.count);
    //gl.drawArrays(gl.POINTS, 0, this.count);
    gl.bindVertexArray(null);


    
  }
  
  updateParams(ctx) {
    if(this.paramsversion==ctx.evalContext.paramsversion)return;
    this.paramsversion=ctx.evalContext.paramsversion;

    const gl = this.gl;
    //voxel to points
    const voxelGrid=new Voxels(this.scale);
    
    this.voxelfilter.use(ctx);
    voxelGrid.subdivideAndFilter((voxels)=>this.voxelfilter.filter(voxels),this.maxlevel,this.maxvoxel);
    
  

    const {indices:origindex,verts:vertices}=voxelGrid.cornerpointsUnique();
    

    //const voxelvertices=new VoxelVertexMapper2(voxelGrid);



    /*gl.bindBuffer(gl.ARRAY_BUFFER,this.pointbuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(voxelvertices.getVertices()),gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER,null);
    this.count=voxelvertices.getVertices().length/3;
    return;*/

    this.gaussnewton.useshader();
    //this.visgraph.setuniforms(this.voxelfilter.shader,ctx.evalContext);
    this.visgraph.setuniforms(this.gaussnewton.shader,ctx.evalContext);
    const [evaluationresults]=this.gaussnewton.transform(vertices);
    const [vertflat,triflat]=this.marchingcubes(origindex,vertices,evaluationresults);
    this.count=vertflat.length/3;
    gl.bindBuffer(gl.ARRAY_BUFFER,this.pointbuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertflat),gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER,null);

  }


  /**
   * 
   * 
   * @param {Float32Array} evaluationresults 
   */
  marchingcubes(origindex,verticees,evaluationresults){
    
    const cubecornersgrey=[[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0], [1, 1, 0],[1, 1, 1],[1, 0, 1],[1, 0, 0]]; 
    const remappingidxCubeToGrey=makeReordering(Voxels.cornerOffset,cubecornersgrey);
    
    const cubecornerstable=tables.cubecorners;
    const remappingidxGreyToTabel=makeReordering(cubecornersgrey,cubecornerstable);
    const zero=[0,0,0];


    let hasnegative=false;
    let haspositive=false;
    for(let i=3;i<evaluationresults.length&&!(hasnegative && haspositive);i+=4){
      if(evaluationresults[i]<0){
        hasnegative=true;
      }
      if(evaluationresults[i]>0){
        haspositive=true;
      }
    }
    const hasposneg=hasnegative && haspositive;
    console.log("hasposneg",hasposneg);
    const vertflat=[];
    const triflat=[];
    //for(const vertexIndices of voxelvertices.getVoxels()){
    for(let voxeloffset=0;voxeloffset<origindex.length;voxeloffset+=8){
      //const vertexIndices= Array.from({length: 8}, (_, i) => origindex[voxeloffset + i]);
      const vertexIndices=origindex.slice(voxeloffset, voxeloffset + 8);
      const vertexIndicesGrey=reorderArray(vertexIndices,remappingidxCubeToGrey);
      const vertexIndicesTabel=reorderArray(vertexIndicesGrey,remappingidxGreyToTabel);

      let tableindex=0;
      if(hasposneg){
        const values=vertexIndicesTabel.map(idx=>{
          const base=idx*4;
          return evaluationresults[base+3];
        });
        for(let i=0;i<8;i++){
          if(values[i]>0)tableindex|=1<<i;
        }
      } else{
        const vecs=vertexIndicesGrey.map(idx=>{
          const base=idx*4;
          return [0,1,2].map(offset=>evaluationresults[base+offset]);
        });

        let lastvec;//lastvec cant be zero
        for(let i=0;i<8;i++){
          if(isVec3NearZero(vecs[i])){
            vecs[i]=zero;
          }else{
            lastvec=vecs[i];//lastvec is vecs[7]. if it would be 0 it is vecs[6] an so on
          }
        }


        let actsign=true;
        let signs=[];
        for(let i=0;i<8;i++){
          const actvec=vecs[i];
          if(actvec===zero){
            signs.push(actsign);
            //prevent a sign switch at 0
            // vu=[1,0,0] vd=[-1,0,0] 
            //the idea is that if i have [vu zero vd] or [vu zero zero vd] or similar
            //i only do one sign change
          }else{ 
            if(dotVec3(actvec,lastvec)<0)actsign=!actsign;
            signs.push(actsign);
            lastvec=actvec;
          }
        }
        signs=reorderArray(signs,remappingidxGreyToTabel);

        for(let i=0;i<8;i++){
          if(signs[i])tableindex|=1<<i;
        }
      }


      const activeedges=tables.EdgeMasks[tableindex];
      if(activeedges===0)continue;

      const interpolatedVertices = new Array(12).fill(undefined);

      for (let edgeIndex = 0; edgeIndex < 12; edgeIndex++) {
        if ((activeedges & (1 << edgeIndex)) === 0) continue;

        const [vi0, vi1] = tables.EdgeVertexIndices[edgeIndex];
        const idx0 = vertexIndicesTabel[vi0];
        const idx1 = vertexIndicesTabel[vi1];

        //const pos0 = voxelvertices.getVertex(idx0); // vec3
        //const pos1 = voxelvertices.getVertex(idx1); // vec3
        const pos0=verticees.slice(idx0*3,idx0*3+3);
        const pos1=verticees.slice(idx1*3,idx1*3+3);

        const val0 = evaluationresults[idx0 * 4+3]; // assumes scalar is at .x
        const val1 = evaluationresults[idx1 * 4+3];

        const t = Math.abs(val0) / (Math.abs(val0) + Math.abs(val1));
        const interp = [
          pos0[0] + t * (pos1[0] - pos0[0]),
          pos0[1] + t * (pos1[1] - pos0[1]),
          pos0[2] + t * (pos1[2] - pos0[2]),
        ];

        interpolatedVertices[edgeIndex] = interp;
      }

      const triEdges = tables.TriangleTable[tableindex];
      let baseIndex = vertflat.length / 3;

      for (let i = 0; i < triEdges.length; i += 3) {
        const e0 = triEdges[i];
        if (e0 === -1) break;

        const e1 = triEdges[i + 1];
        const e2 = triEdges[i + 2];

        const v0 = interpolatedVertices[e0];
        const v1 = interpolatedVertices[e1];
        const v2 = interpolatedVertices[e2];

        //if (!v0 || !v1 || !v2) continue; // skip incomplete triangle

        vertflat.push(...v0, ...v1, ...v2);
        triflat.push(baseIndex, baseIndex + 1, baseIndex + 2);
        baseIndex += 3;
      }








    }

    return [vertflat,triflat];
  }



  isTilable(){return false;}
}