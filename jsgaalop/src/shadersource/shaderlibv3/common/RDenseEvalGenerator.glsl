


//template for gencodeR

#include "./ComplexDuals.glsl"
#include "./xyzDuals.glsl"
#include "./Dual.glsl"
#include "./Intervall.glsl"




//all the ? get generated in codegenBackpropergation2 in class visualisationtargetnode in method gencodeR
const int basislength=?;
#define basismaxdegree ?
const int numoutputs=?;
const int basislength4=(basislength+3)/4;

uniform vec4[(basislength-(basislength/4)*2)*(basislength/4+1)] RDense;
const float[(basismaxdegree+1)*(basismaxdegree+1)] Vinv = float[](?);

void MatmulRDense(vec4[basislength] P,out vec4[basislength] b){?}
void MatmulRDense(vec2[basislength] P,out vec2[basislength] b){?}

void makeDualComplexP(vec3 rayDir, vec3 rayOrigin,Complex a,out DualComplex[basislength] P) {?}
void makeP(vec3 pos,out float[basislength] P) {?}
void makexyzDualP(vec3 pos,out xyzDual[basislength] P) {?}
void makeDualP(vec3 rayDir, vec3 rayOrigin,float a,out Dual[basislength] P) {?}
void makeIntervallP(Intervall X,Intervall Y,Intervall Z,out Intervall[basislength] P) {?}

float square(float x){return x*x;}
void makePvec4r(vec3 pos,out vec4[basislength4] Pvec4){
  	float[basislength] P;
  	makeP(pos,P);
	const int offset0=basislength4*4-basislength;
	for (int i = 0; i < basislength4; i++) {
      int k = i * 4-offset0;
      Pvec4[i] = vec4(k + 0 >= 0 ? P[k + 0] : 0.0,
                      k + 1 >= 0 ? P[k + 1] : 0.0,
                      k + 2 >= 0 ? P[k + 2] : 0.0,
                      k + 3 >= 0 ? P[k + 3] : 0.0);
  	}  
}

float susRDenseUnrolled(vec3 pos){?}





vec4 xyzDualsusR(vec3 pos){
  	vec4[basislength] P;
	  makexyzDualP(pos,P);
    vec4[basislength] b;
    MatmulRDense(P,b);
  	vec4 res=vec4(0.);
    for(int i=0;i<basislength;i++){
      res+=xyzDualSqare(b[i]);
    }
   
   return res;
}




vec4 DCsusR(vec3 ro,vec3 rd,Complex a){
  	vec4[basislength] P;
    makeDualComplexP(ro,rd,a,P);
    vec4[basislength] b;
    MatmulRDense(P,b);
  	vec4 res=vec4(0.);
    for(int i=0;i<basislength;i++){
      res+=DualComplexSqare(b[i]);
    }
    return res;
}

vec2 DualsusR(vec3 ro,vec3 rd,float a){
  	vec2[basislength] P;
    makeDualP(ro,rd,a,P);
    vec2[basislength] b;
    MatmulRDense(P,b);
  	vec2 res=vec2(0.);
    for(int i=0;i<basislength;i++){
      res+=DualSquare(b[i]);
    }
    return res;
}

float GaussNewtonStepR(vec3 ro,vec3 rd,float a,float eps){
  	vec2[basislength] P;
	  makeDualP(ro,rd,a,P);
    vec2[basislength] b;
    MatmulRDense(P,b);
  	vec2 res=vec2(0.);
  	int ri=0;
    for(int i=0;i<basislength;i++){
      Dual acc=b[i];
      res+=acc.y*acc;
    }
   
   return res.x/(eps+res.y);
}


vec4 GaussNewtonStepR(vec3 pos,float beta){
  	vec4[basislength] P;
	  makexyzDualP(pos,P);
    vec4[basislength] F;
    MatmulRDense(P,F);

    vec4 JtJdiagandf=vec4(vec3(beta),0);
    vec3 JtJ_xy_xz_zy=vec3(0);
    vec3 Jtf=vec3(0);
    //float f=0.;
    for(int i=0;i<basislength;i++){
      vec4 xyzf=F[i];
      //JtJdiag+=xyzf.xyz*xyzf.xyz;
      JtJdiagandf+=xyzf*xyzf;
      JtJ_xy_xz_zy+=xyzf.xxy*xyzf.yzz;
      Jtf+=xyzf.xyz*xyzf.w;
      //f+=xyzf.w*xyzf.w;
    }

    float f=JtJdiagandf.w;

    //[a11 a21 a31 a12 a22 a32 a13 a23 a33]
    //
    /*
    |a11=xx=JtJdiag.x a12=xy=JtJ_xy_xz_zy[0] a13=xz=JtJ_xy_xz_zy[1]|
    |a21=yx=JtJ_xy_xz_zy[0] a22=yy=JtJdiag.y a23=yz=JtJ_xy_xz_zy[2]|
    |a31=zx=JtJ_xy_xz_zy[1] a32=zy=JtJ_xy_xz_zy[2] a33=zz=JtJdiag.z|
    */
    mat3 JtJ=mat3(//column major
      JtJdiagandf.x,JtJ_xy_xz_zy[0],JtJ_xy_xz_zy[1],
      JtJ_xy_xz_zy[0],JtJdiagandf.y,JtJ_xy_xz_zy[2],
      JtJ_xy_xz_zy[1],JtJ_xy_xz_zy[2],JtJdiagandf.z
    );
    vec3 result=-inverse(JtJ)*Jtf;
    return vec4(result,f);//return the step and the sus
    
}


float susR(vec3 pos){
  return susRDenseUnrolled(pos);
}

vec4 DCrowR(vec3 ro,vec3 rd,Complex a){
    vec4[basislength] P;
	  makeDualComplexP(ro,rd,a,P);
  	vec4 acc=vec4(0.);
    const int offset0=basislength4*4-basislength;
    for(int j=0;j<basislength;j++){
      int k=offset0+j;
      acc+=RDense[k/4][k%4]*P[j];
    }
    return acc;
}


vec4 xyzDualrowR(vec3 pos){//not optimized but i needed  it
  	vec4[basislength] P;
	  makexyzDualP(pos,P);
    vec4[basislength] b;
    MatmulRDense(P,b);
    return b[0];
}

float rowR(vec3 pos){
    vec4[basislength4] Pvec4;
    makePvec4r(pos,Pvec4);
  	float acc=0.;
    for(int j=0;j<basislength4;j++)acc+=dot(RDense[j],Pvec4[j]);
    return acc;
}



float horner(float x,float[basismaxdegree+1] coeffs){
	float res=0.; 
    for(int i=0;i<basismaxdegree+1;i++){
    	res=coeffs[basismaxdegree-i]+x*res;
    }
  	return res;
}
    
DualComplex DChorner(Complex x,float[basismaxdegree+1] coeffs){
	DualComplex res=vec4(0); 
    for(int i=0;i<basismaxdegree+1;i++){
    	res=DualComplexAdd(coeffs[basismaxdegree-i],DualComplexMul(DualComplex(x,1,0),res));
        //res=x.x*res+x.y*vec2(1,-1).yxyx*res.yxwz+DualComplex(coeffs[basismaxdegree-i],0.,res.xy);
    }
  	return res;
}

void makeChebyshevNodes(out float xi[basismaxdegree+1]) {
    for(int i=0;i<basismaxdegree+1;i++) {
        xi[i] = cos((2.*float(i) + 1.)*3.14159265359 / (2.0 * float(basismaxdegree + 1)));
    }
}
void makeY(vec3 ro,vec3 rd,float[basismaxdegree+1] xi,out float[basismaxdegree+1] yi){
    for(int i=0;i<basismaxdegree+1;i++) yi[i]=rowR(ro+rd*xi[i]);
}

void makeCoeffs(float[basismaxdegree+1] yi,out float[basismaxdegree+1] coeffs){
  for(int i=0;i<basismaxdegree+1;i++) {
    coeffs[i]=0.;
    for(int j=0;j<basismaxdegree+1;j++) coeffs[i]+=Vinv[i*(basismaxdegree+1)+j]*yi[j];
  }
}