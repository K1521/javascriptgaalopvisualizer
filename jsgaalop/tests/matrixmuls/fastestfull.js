const arraylength=100000;
const data = Array.from({ length: arraylength*3 }, () => Math.random());
const vao=gl.createVertexArray();
gl.bindVertexArray(vao);
const buffer=gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.DYNAMIC_DRAW);

// Attribute 0 → vec4 position
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(
  0,       // location
  3,       // vec
  gl.FLOAT,
  false,
  3*4,  // stride
  0        // offset
);

/*// Attribute 1 → vec3 offset + a
gl.enableVertexAttribArray(1);
gl.vertexAttribPointer(
  1,       // location
  4,       // vec4
  gl.FLOAT,
  false,
  8*4,
  4 * 4    // offset = 4 floats
);*/

const n=25;
//for(let n=1;n<25;n++){

let vertexshader=
`#version 300 es
precision mediump float;
const int n=${n};
const int rowlength=(n+3)/4;
uniform float[n] M; // 8x8 matrix in row-major
uniform float[n*(n+1)/2] R;
layout(std140) uniform MatrixBlock {
    //float M2[n*n];
    //vec4 M2[(n*n+3)/4];//+3 because ceildiv
    vec4 M2[n*rowlength];
};
    
layout(location = 0) in vec3 P0;   // xyz = position
//layout(location = 1) in vec4 P1; // xyz = offset + a
uniform vec4[n*rowlength] M3;
/*out vec4 result1;
out vec4 result2;*/
out float results;

uniform int rank;

void makeP(vec3 p,out float[n] P){
	for(int i=0;i<4;i++){P[i]=P0[i];P[i+4]=P0[i];}
} 
    
const int Plen=rowlength*4;
void makeP2(vec3 pos,out float[Plen] P) {
  float _generatednode0 = (pos.x*pos.x);
  P[0]=(_generatednode0*_generatednode0);
  float _generatednode1 = (pos.y*pos.y);
  P[1]=(_generatednode1*_generatednode0);
  float _generatednode2 = (pos.z*pos.z);
  P[2]=(_generatednode2*_generatednode0);
  P[3]=(_generatednode1*_generatednode1);
  P[4]=(_generatednode1*_generatednode2);
  P[5]=(_generatednode2*_generatednode2);
  P[6]=(pos.x*_generatednode0);
  P[7]=(_generatednode1*pos.x);
  P[8]=(_generatednode2*pos.x);
  P[9]=(pos.y*_generatednode0);
  P[10]=(pos.y*_generatednode1);
  P[11]=(pos.y*_generatednode2);
  P[12]=(pos.z*_generatednode0);
  P[13]=(_generatednode1*pos.z);
  P[14]=(pos.z*_generatednode2);
  P[15]=_generatednode1;
  P[16]=(pos.y*pos.z);
  P[17]=_generatednode2;
  P[18]=_generatednode0;
  P[19]=(pos.y*pos.x);
  P[20]=(pos.z*pos.x);
  P[21]=pos.y;
  P[22]=pos.z;
  P[23]=pos.x;
  P[24]=1.0;
}

    

void makeP2(vec3 pos,out vec4[rowlength] P) {
  float _generatednode0 = (pos.x*pos.x);
  P[0][0]=(_generatednode0*_generatednode0);
  float _generatednode1 = (pos.y*pos.y);
  P[0][1]=(_generatednode1*_generatednode0);
  float _generatednode2 = (pos.z*pos.z);
  P[0][2]=(_generatednode2*_generatednode0);
  P[0][3]=(_generatednode1*_generatednode1);
  P[1][0]=(_generatednode1*_generatednode2);
  P[1][1]=(_generatednode2*_generatednode2);
  P[1][2]=(pos.x*_generatednode0);
  P[1][3]=(_generatednode1*pos.x);
  P[2][0]=(_generatednode2*pos.x);
  P[2][1]=(pos.y*_generatednode0);
  P[2][2]=(pos.y*_generatednode1);
  P[2][3]=(pos.y*_generatednode2);
  P[3][0]=(pos.z*_generatednode0);
  P[3][1]=(_generatednode1*pos.z);
  P[3][2]=(pos.z*_generatednode2);
  P[3][3]=_generatednode1;
  P[4][0]=(pos.y*pos.z);
  P[4][1]=_generatednode2;
  P[4][2]=_generatednode0;
  P[4][3]=(pos.y*pos.x);
  P[5][0]=(pos.z*pos.x);
  P[5][1]=pos.y;
  P[5][2]=pos.z;
  P[5][3]=pos.x;
  P[6][0]=1.0;
  P[6][1]=0.0;
  P[6][2]=0.0;
  P[6][3]=0.0;
}

    
float getM2(int i){return M2[i>>2][i&3];}
    
void main() {
  results=0.;
  for(int s=0;s<100;s++){
    //float[n] result;
    //for(int i=0;i<n;i++){result[i]=0.;}
    //float[Plen] P;
    vec4[rowlength] Pvec4;
    makeP2(P0.xyz*float(s),Pvec4);
    //P[25] = 0.0;P[26] = 0.0;P[27] = 0.0;

    //vec4[rowlength] Pvec4;
    //for(int j=0;j<rowlength;j++)Pvec4[j]=vec4(P[j*4],P[j*4+1],P[j*4+2],P[j*4+3]);
    
    int ri=0;
    for(int i=0;i<n;i++){
      float acc=0.;
      
      /*for(int j=i;j<n;j++,ri++){
          acc+=getM2(i*n+j)*P[j];
          //acc+=M[i*n+j]*P[j];
          //acc+=M2[i*n+j]*P[j];
          //acc+=R[ri]*P[j];
          //result[i]+=M[i*n+j]*P[j];
          //result[j]+=M[j*8+i]*P[i];
      }*/
      //for(int j=0;j<n;j++)acc+=M[i*n+j]*P[j];
      for(int j=0;j<rowlength;j++)acc+=dot(M3[i*n+j],Pvec4[j]);

      //result[i]=acc;
      results+=acc*acc;
    }
  }
  
  //result1=vec4(result[0],result[1],result[2],result[3]);
  //result2=vec4(result[4],result[5],result[6],result[7]);
  //results=result[0]+result[1]+result[2]+result[3]+result[4]+result[5]+result[6]+result[7];
  //results+=result[0]*result[0]+result[1]*result[1]+result[2]*result[2]+result[3]*result[3]+result[4]*result[4]+result[5]*result[5]+result[6]*result[6]+result[7]*result[7];

}
`;

const tf=new TransformFeedbackWrapper(gl,vertexshader, ["results"]);
//const tf=new TransformFeedbackWrapper(gl,vertexshader, ["result1","result2"]);
tf.shader.use();
const M = new Float32Array(n*n).map(() => Math.random());
//const R =range(8).map(i=>M.slice( 0 8,8 15,15 21   8*9/2-(n)*(n+1)/2  8*9/2-(n+2)*(n+2)/2 
const R=[];
for (let row = 0; row < n; row++) for (let col = row; col < n; col++) R.push(M[row*8 + col]);
tf.shader.uniform1fv("M", M);
tf.shader.uniform1fv("M3", new Float32Array(n*(Math.ceil(n/4)*4)).map(() => Math.random()));
tf.shader.uniform1fv("R", new Float32Array(R));
tf.shader.uniform1i("rank", n);

appendLog( new Float32Array(n*(Math.ceil(n/4)*4)).map(() => Math.random()).length);

const blockIndex = gl.getUniformBlockIndex(tf.shader.program, "MatrixBlock");
const blockSize  = gl.getActiveUniformBlockParameter(
  tf.shader.program,
  blockIndex,
  gl.UNIFORM_BLOCK_DATA_SIZE
);
const ubo = gl.createBuffer();
gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
gl.bufferData(gl.UNIFORM_BUFFER, blockSize, gl.DYNAMIC_DRAW);
gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, ubo);
gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
//gl.bufferSubData(gl.UNIFORM_BUFFER, 0, new Float32Array([...M].flatMap(x=>[x,0,0,0])));
gl.bufferSubData(gl.UNIFORM_BUFFER, 0, M);



// bind block → binding point 0
gl.uniformBlockBinding(tf.shader.program, blockIndex, 0);

const r1=tf.run(arraylength)
const timings=range(20).map(()=>{
  gl.finish();
  const t0 = performance.now();
  const result1 = tf.run(arraylength)[0];
  return performance.now()-t0;
})
const mean = timings.reduce((a, b) => a + b, 0) / timings.length;
appendResult(n,Math.min(...timings).toFixed(2),mean.toFixed(2),Math.max(...timings).toFixed(2));
//appendLog(Math.min(...timings),mean,Math.max(...timings));
//appendResult(r1[0].slice(0,4),r1[1].slice(4,8));
//appendLog(r1[0].length,r1[1].length);
appendResult(r1[0].slice(0,4));
//}
//appendLog(gl.getParameter(gl.MAX_UNIFORM_BLOCK_SIZE));
// often 16 KB or 64 KB
