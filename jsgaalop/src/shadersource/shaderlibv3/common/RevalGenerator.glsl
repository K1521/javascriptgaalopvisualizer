


//template for gencodeR

#include "./ComplexDuals.glsl"


const int basislength=?;
const int basismaxdegree=?;
const int basislength4=(basislength+3)/4;
void makeDualComplexP(vec3 rayDir, vec3 rayOrigin,Complex a,out DualComplex[basislength] P) {?}
void makeP(vec3 pos,out float[basislength] P) {?}


uniform float[basislength*(basislength+1)/2] R;
const float[(basismaxdegree+1)*(basismaxdegree+1)] Vinv = float[](?);

void makeP4(vec3 pos,out vec4[basislength4] Pvec4){
  	float[basislength] P;
  	makeP(pos,P);
	for (int i = 0; i < basislength4; i++) {
      int k = i * 4;
      Pvec4[i] = vec4(k + 0 < basislength ? P[k + 0] : 0.0,k + 1 < basislength ? P[k + 1] : 0.0,k + 2 < basislength ? P[k + 2] : 0.0,k + 3 < basislength ? P[k + 3] : 0.0);
  	}
}

vec4 DCsusR(vec3 ro,vec3 rd,Complex a){
  	vec4[basislength] P;
	makeDualComplexP(ro,rd,a,P);
  	vec4 res=vec4(0.);
  	int ri=0;
    for(int i=0;i<basislength;i++){
      vec4 acc=vec4(0.);
      for(int j=i;j<basislength;j++,ri++)acc+=R[ri]*P[j];
      res+=DualComplexSqare(acc);
    }
   
   return res;
}

float susR(vec3 pos){
  	float[basislength] P;
	makeP(pos,P);
  	float res=0.;
  	int ri=0;
    for(int i=0;i<basislength;i++){
      float acc=0.;
      for(int j=i;j<basislength;j++,ri++)acc+=R[ri]*P[j];
      res+=acc*acc;
    }
   
   return res;
}

vec4 DCrowR(vec3 ro,vec3 rd,Complex a){
    vec4[basislength] P;
	makeDualComplexP(ro,rd,a,P);
  	vec4 res=vec4(0.);
    for(int j=0;j<basislength;j++)res+=R[j]*P[j];
    return res;
}

float rowR(vec3 pos){
    float[basislength] P;
	makeP(pos,P);
    float acc=0.;
    for(int j=0;j<basislength;j++)acc+=R[j]*P[j];
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