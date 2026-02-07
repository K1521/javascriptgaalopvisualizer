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
const iter=100;
const n=25;
//for(let n=1;n<25;n++){
//for(let iter=1;iter<100;iter++){
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
uniform int iter;
 
    
const int Plen=rowlength*4;
void makeP2(vec3 pos,out float[n] P) {
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

void makePvec4(vec3 pos,out vec4[rowlength] Pvec4){
  	float[n] P;
  	makeP2(pos,P);
	for (int i = 0; i < rowlength; i++) {
      int k = i * 4;
      Pvec4[i] = vec4(k + 0 < n ? P[k + 0] : 0.0,k + 1 < n ? P[k + 1] : 0.0,k + 2 < n ? P[k + 2] : 0.0,k + 3 < n ? P[k + 3] : 0.0);
  	}
}
    

#define Complex vec2
Complex ComplexAdd(Complex a, Complex b) {return a+b;}
Complex ComplexAdd(float a, Complex b) {return Complex(a + b.x,b.y);}
Complex ComplexAdd(Complex a, float b) {return ComplexAdd(b,a);}

Complex ComplexMul(Complex a, Complex b) {
    // Complex multiplication: (a.x + i*a.y) * (b.x + i*b.y)
    return Complex(
        a.x * b.x - a.y * b.y, // Real part
        a.x * b.y + a.y * b.x  // Imaginary part
    );
}
Complex ComplexMul(Complex a, float b) {return a*b;}
Complex ComplexMul(float a, Complex b) {return a*b;}
Complex ComplexSquare(Complex a) {
    // Complex multiplication: (a.x + i*a.y) * (b.x + i*b.y)
    return Complex(
        a.x * a.x - a.y * a.y, // Real part
        2.0 * a.x * a.y  // Imaginary part
    );
}
Complex ComplexDiv(Complex a, Complex b) {
    // Complex division: (a.x + i*a.y) / (b.x + i*b.y)
    return Complex(
        (a.x * b.x + a.y * b.y) ,
        (a.y * b.x - a.x * b.y)
    ) / dot(b,b);
}
Complex ComplexInv(Complex a) {
    // Complex division: 1 / (a.x + i*a.y)
    return a*Complex(1,-1) / dot(a,a);
}
Complex ComplexConjugate(Complex a) {
    // Complex division: 1 / (a.x + i*a.y)
    return a*Complex(1,-1);
}

#define DualComplex vec4

DualComplex DualComplexMul(DualComplex a,DualComplex b){
    return DualComplex(ComplexMul(a.xy,b.xy),ComplexMul(a.xy,b.zw)+ComplexMul(a.zw,b.xy));
}
DualComplex DualComplexSqare(DualComplex a){
    return DualComplex(ComplexSquare(a.xy),2.0*ComplexMul(a.xy,a.zw));
}
DualComplex DualComplexAdd(DualComplex a,float b){
    return DualComplex(a.x+b, a.yzw);
}

void makeDualComplexP(vec3 rayDir, vec3 rayOrigin,Complex a,out DualComplex[n] P) {
Complex _generatednode0 = ComplexAdd(rayOrigin.x,ComplexMul(a,rayDir.x));
Complex _generatednode1 = ComplexSquare(_generatednode0);
Complex _generatednode2 = ComplexMul(rayDir.x,_generatednode0);
Complex _generatednode3 = ComplexAdd(_generatednode2,_generatednode2);
Complex _generatednode4 = ComplexMul(_generatednode3,_generatednode1);
P[0]=vec4(ComplexSquare(_generatednode1),ComplexAdd(_generatednode4,_generatednode4));
Complex _generatednode5 = ComplexAdd(rayOrigin.y,ComplexMul(a,rayDir.y));
Complex _generatednode6 = ComplexSquare(_generatednode5);
Complex _generatednode7 = ComplexMul(rayDir.y,_generatednode5);
Complex _generatednode8 = ComplexAdd(_generatednode7,_generatednode7);
P[1]=vec4(ComplexMul(_generatednode6,_generatednode1),ComplexAdd(ComplexMul(_generatednode8,_generatednode1),ComplexMul(_generatednode3,_generatednode6)));
Complex _generatednode9 = ComplexAdd(rayOrigin.z,ComplexMul(a,rayDir.z));
Complex _generatednode10 = ComplexSquare(_generatednode9);
Complex _generatednode11 = ComplexMul(rayDir.z,_generatednode9);
Complex _generatednode12 = ComplexAdd(_generatednode11,_generatednode11);
P[2]=vec4(ComplexMul(_generatednode10,_generatednode1),ComplexAdd(ComplexMul(_generatednode12,_generatednode1),ComplexMul(_generatednode3,_generatednode10)));
Complex _generatednode13 = ComplexMul(_generatednode8,_generatednode6);
P[3]=vec4(ComplexSquare(_generatednode6),ComplexAdd(_generatednode13,_generatednode13));
P[4]=vec4(ComplexMul(_generatednode6,_generatednode10),ComplexAdd(ComplexMul(_generatednode8,_generatednode10),ComplexMul(_generatednode12,_generatednode6)));
Complex _generatednode14 = ComplexMul(_generatednode12,_generatednode10);
P[5]=vec4(ComplexSquare(_generatednode10),ComplexAdd(_generatednode14,_generatednode14));
P[6]=vec4(ComplexMul(_generatednode0,_generatednode1),ComplexAdd(ComplexMul(rayDir.x,_generatednode1),ComplexMul(_generatednode3,_generatednode0)));
P[7]=vec4(ComplexMul(_generatednode6,_generatednode0),ComplexAdd(ComplexMul(rayDir.x,_generatednode6),ComplexMul(_generatednode8,_generatednode0)));
P[8]=vec4(ComplexMul(_generatednode10,_generatednode0),ComplexAdd(ComplexMul(rayDir.x,_generatednode10),ComplexMul(_generatednode12,_generatednode0)));
P[9]=vec4(ComplexMul(_generatednode5,_generatednode1),ComplexAdd(ComplexMul(rayDir.y,_generatednode1),ComplexMul(_generatednode3,_generatednode5)));
P[10]=vec4(ComplexMul(_generatednode5,_generatednode6),ComplexAdd(ComplexMul(rayDir.y,_generatednode6),ComplexMul(_generatednode8,_generatednode5)));
P[11]=vec4(ComplexMul(_generatednode5,_generatednode10),ComplexAdd(ComplexMul(rayDir.y,_generatednode10),ComplexMul(_generatednode12,_generatednode5)));
P[12]=vec4(ComplexMul(_generatednode9,_generatednode1),ComplexAdd(ComplexMul(rayDir.z,_generatednode1),ComplexMul(_generatednode3,_generatednode9)));
P[13]=vec4(ComplexMul(_generatednode6,_generatednode9),ComplexAdd(ComplexMul(rayDir.z,_generatednode6),ComplexMul(_generatednode8,_generatednode9)));
P[14]=vec4(ComplexMul(_generatednode9,_generatednode10),ComplexAdd(ComplexMul(rayDir.z,_generatednode10),ComplexMul(_generatednode12,_generatednode9)));
P[15]=vec4(_generatednode6,_generatednode8);
P[16]=vec4(ComplexMul(_generatednode5,_generatednode9),ComplexAdd(ComplexMul(rayDir.y,_generatednode9),ComplexMul(rayDir.z,_generatednode5)));
P[17]=vec4(_generatednode10,_generatednode12);
P[18]=vec4(_generatednode1,_generatednode3);
P[19]=vec4(ComplexMul(_generatednode5,_generatednode0),ComplexAdd(ComplexMul(rayDir.x,_generatednode5),ComplexMul(rayDir.y,_generatednode0)));
P[20]=vec4(ComplexMul(_generatednode9,_generatednode0),ComplexAdd(ComplexMul(rayDir.x,_generatednode9),ComplexMul(rayDir.z,_generatednode0)));
P[21]=vec4(_generatednode5,Complex(rayDir.y,0.0));
P[22]=vec4(_generatednode9,Complex(rayDir.z,0.0));
P[23]=vec4(_generatednode0,Complex(rayDir.x,0.0));
P[24]=vec4(Complex(1.0,0.0),Complex(0.0,0.0));
}
    
float susM3(vec3 pos){//fastest
	vec4[rowlength] Pvec4;
    makePvec4(pos,Pvec4);
  	float res=0.;
  	float acc=0.;
    for(int i=0;i<n;i++){
      acc=0.;  
      for(int j=0;j<rowlength;j++)acc+=dot(M3[i*rowlength+j],Pvec4[j]);
      res+=acc*acc;
    }
    return res;
}

float susMCD2(float a){
  	vec4[n] P;
	makeDualComplexP(P0.xyz,P0.zxy*P0.yzx,Complex(a,2.*a+1.),P);
  	vec4 res=vec4(0.);
  	int ri=0;
    for(int i=0;i<n;i++){
      vec4 acc=vec4(0.);
      for(int j=0;j<n;j++,ri++)acc+=M[ri]*P[j];
      res+=DualComplexSqare(acc);
    }
   
   return dot(res,vec4(1.));
}
float susM(vec3 pos){
  	float[n] P;
	makeP2(pos,P);
  	float res=0.;
  	int ri=0;
    for(int i=0;i<n;i++){
      float acc=0.;
      for(int j=0;j<n;j++,ri++)acc+=M[ri]*P[j];
      res+=acc*acc;
    }
   
   return res;
}

/*
float sus(vec3 pos){
	//float[n] result;
    //for(int i=0;i<n;i++){result[i]=0.;}
    //float[Plen] P;
    vec4[rowlength] Pvec4;
    makeP2(pos,Pvec4);
    //P[25] = 0.0;P[26] = 0.0;P[27] = 0.0;

    //vec4[rowlength] Pvec4;
    //for(int j=0;j<rowlength;j++)Pvec4[j]=vec4(P[j*4],P[j*4+1],P[j*4+2],P[j*4+3]);
    float res=0.;
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
   /*   for(int j=0;j<rowlength;j++)acc+=dot(M3[i*n+j],Pvec4[j]);

      //result[i]=acc;
      res+=acc*acc;
    }
  return res;
}*/



float MCDrow(float a){
    vec4[n] P;
	makeDualComplexP(P0.xyz,P0.zxy*P0.yzx,Complex(a,2.*a+1.),P);
  	vec4 res=vec4(0.);
    for(int j=0;j<n;j++)res+=M[j]*P[j];
   
    return dot(res,vec4(1.));
}    
void main() {
  results=0.;
  for(int s=0;s<iter;s++){
    results+=MCDrow(float(s));
    //results+=susM(float(s)*P0.xyz);
	//results+=susMCD2(float(s));
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
tf.shader.uniform4fv("M3", new Float32Array(n*(Math.ceil(n/4)*4)).map(() => Math.random()));
tf.shader.uniform1fv("R", new Float32Array(R));
tf.shader.uniform1i("rank", n);
tf.shader.uniform1i("iter", iter);

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
appendResult(iter,Math.min(...timings).toFixed(2),mean.toFixed(2),Math.max(...timings).toFixed(2));
//appendLog(Math.min(...timings),mean,Math.max(...timings));
//appendResult(r1[0].slice(0,4),r1[1].slice(4,8));
//appendLog(r1[0].length,r1[1].length);
appendResult(r1[0].slice(0,4));
//}
//appendLog(gl.getParameter(gl.MAX_UNIFORM_BLOCK_SIZE));
// often 16 KB or 64 KB
//}