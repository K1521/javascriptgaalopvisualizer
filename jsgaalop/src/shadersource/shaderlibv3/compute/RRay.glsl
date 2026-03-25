#version 300 es
precision mediump float;


#include "../common/RDenseEvalGenerator.glsl"
#include "../common/util.glsl"


uniform vec3 low;
uniform vec3 high;
uniform ivec3 dim;


vec3 calcpos(ivec3 idx){    //x*ny*nz+y*nz+z
    //int i = gl_VertexID / (dim.y * dim.z);
    //int j = (gl_VertexID / dim.z) % dim.y;
    //int k = gl_VertexID % dim.z;
    return mix(low, high,  vec3(idx)/ vec3(dim - 1));
}

//const int ABERTH_MAXITER = 40;
const float ABERTH_THRESHOLD = 1e-6;//this sthreshold is nessesary so the shader compiles faster because it prevents loop unrolling i think


#define NUM_ROOTS basismaxdegree

void aberth_method_poly(inout Complex[NUM_ROOTS] roots, vec3 rayDir, vec3 rayOrigin,int maxiter) {
    for (int iter = 0; iter < maxiter; iter++) {
        float max_change = 0.0; // Track the largest change in roots

        for (int k = 0; k < NUM_ROOTS; k++) {
            // Evaluate the polynomial and its derivative at the current root
            DualComplex res=DCrowR(rayDir,rayOrigin,roots[k]);
            Complex a = ComplexDiv(
                res.xy,
                res.zw
            );


        
            Complex s = Complex(0.0); // Summation term
            for (int j = 0; j < NUM_ROOTS; j++) {
                if (j != k) {
                    Complex diff = roots[k] - roots[j];
                    s += ComplexInv(diff);
                }
            }
        

            // Compute the correction term
            Complex w = ComplexDiv(a, Complex(1.0, 0.0) - ComplexMul(a, s));
            if(any(isnan(w))||any(isinf(w)))continue;
            roots[k] -= w; // Update the root

            // Track the maximum change in root
            max_change = float(max(max_change, length(w)));
        }
        

        // If the maximum change is smaller than the threshold, stop early
        if (max_change < ABERTH_THRESHOLD) {
            //debugcolor(vec3(float(iter+1)/float(ABERTH_MAXITER)));
            break; // Converged, exit the loop
        }
    }
}


void aberth_method_horner(inout Complex[NUM_ROOTS] roots,float[NUM_ROOTS+1] coeffs,int maxiter) {
    for (int iter = 0; iter < maxiter; iter++) {
        float max_change = 0.0; // Track the largest change in roots

        for (int k = 0; k < NUM_ROOTS; k++) {
            // Evaluate the polynomial and its derivative at the current root
            DualComplex res=DChorner(roots[k],coeffs);//DCsusR(rayDir,rayOrigin,roots[k]);
            Complex a = ComplexDiv(
                res.xy,
                res.zw
            );


        
            Complex s = Complex(0.0); // Summation term
            for (int j = 0; j < NUM_ROOTS; j++) {
                if (j != k) {
                    Complex diff = roots[k] - roots[j];
                    s += ComplexInv(diff);
                }
            }
        

            // Compute the correction term
            Complex w = ComplexDiv(a, Complex(1.0, 0.0) - ComplexMul(a, s));
            if(any(isnan(w))||any(isinf(w)))continue;
            roots[k] -= w; // Update the root

            // Track the maximum change in root
            max_change = float(max(max_change, length(w)));
        }
        

        // If the maximum change is smaller than the threshold, stop early
        if (max_change < ABERTH_THRESHOLD) {
            //debugcolor(vec3(float(iter+1)/float(ABERTH_MAXITER)));
            break; // Converged, exit the loop
        }
    }
}

void initial_roots(out Complex[NUM_ROOTS] roots) {
    /*const Complex r1 = Complex(cos(goldenangle), sin(goldenangle)); // Base complex number
    roots[0]=r1;
    for (int i = 1; i < NUM_ROOTS; i++) {
        roots[i] = ComplexMul(r1, roots[i-1]);
        float angle = float(i) * (2*pi / float(NUM_ROOTS)); // 2*PI / NUM_ROOTS
        roots[i] = Complex(cos(angle), sin(angle));
    }*/
    for (int i = 0; i < NUM_ROOTS; i++) {
        float angle = float(i) * (2.*pi / float(NUM_ROOTS)); // 2*PI / NUM_ROOTS
        roots[i] = Complex(cos(angle), sin(angle));
    }
}
void initial_roots(out Complex[NUM_ROOTS] roots,Complex center) {
    initial_roots(roots);
    for (int i = 0; i < NUM_ROOTS; i++) roots[i]+=center;
}


void Raymarch(vec3 rayDir, vec3 rayOrigin,out vec2[NUM_ROOTS] result) {
    
    
    //inout Complex[NUM_ROOTS] roots, vec3 rayDir, vec3 rayOrigin
    //aberth_method(roots,rayDir,rayOrigin);
    //aberth_method2(roots,rayDir,rayOrigin);
    float[NUM_ROOTS+1] xi;
    makeChebyshevNodes(xi);
    float[NUM_ROOTS+1] coeffs;
    float[NUM_ROOTS+1] yi;
    for(int i=0;i<NUM_ROOTS+1;i++) yi[i]=rowR(rayOrigin+rayDir*xi[i]);
    makeCoeffs(yi,coeffs);
    Complex[NUM_ROOTS] roots;
    initial_roots(roots);
    aberth_method_horner(roots,coeffs,20);
    aberth_method_poly(roots,rayDir,rayOrigin,20);
    //aberth_method_sus(roots,rayDir,rayOrigin,5);
    //
    
    for(int i = 0; i < NUM_ROOTS; ++i){
        float a=roots[i].x;
        result[i]=vec2(a,susR(rayDir*a+rayOrigin));
        
    }

}

#if NUM_ROOTS > 0
out vec2 result0;
#endif
#if NUM_ROOTS > 1
out vec2 result1;
#endif
#if NUM_ROOTS > 2
out vec2 result2;
#endif
#if NUM_ROOTS > 3
out vec2 result3;
#endif
#if NUM_ROOTS > 4
out vec2 result4;
#endif
#if NUM_ROOTS > 5
out vec2 result5;
#endif
#if NUM_ROOTS > 6
out vec2 result6;
#endif
#if NUM_ROOTS > 7
out vec2 result7;
#endif
#if NUM_ROOTS > 8
out vec2 result8;
#endif
#if NUM_ROOTS > 9
out vec2 result9;
#endif

void main(){
    vec3 rd;
    ivec3 idx;
    ivec2 offset;
    offset[0]=dim.x * dim.y;
    offset[1]=offset[0]+dim.y * dim.z;
    if(gl_VertexID<offset[0]){//xy
        int localid=gl_VertexID;
        idx=ivec3(localid/dim.x,localid%dim.y,0);
        rd=vec3(0,0,1);
    }else if(gl_VertexID<offset[1]){//yz
        int localid=gl_VertexID-offset[0];
        idx=ivec3(0,localid/dim.y,localid%dim.z);
        rd=vec3(1,0,0);
    }else{//xz
        int localid=gl_VertexID-offset[1];
        idx=ivec3(localid/dim.x,0,localid%dim.z);
        rd=vec3(0,1,0);
    }
    vec3 ro=calcpos(idx);
    
    vec2 result[NUM_ROOTS];
    Raymarch(rd,ro,result);

    #if NUM_ROOTS > 0
    result0 = result[0];
    #endif
    #if NUM_ROOTS > 1
    result1 = result[1];
    #endif
    #if NUM_ROOTS > 2
    result2 = result[2];
    #endif
    #if NUM_ROOTS > 3
    result3 = result[3];
    #endif
    #if NUM_ROOTS > 4
    result4 = result[4];
    #endif
    #if NUM_ROOTS > 5
    result5 = result[5];
    #endif
    #if NUM_ROOTS > 6
    result6 = result[6];
    #endif
    #if NUM_ROOTS > 7
    result7 = result[7];
    #endif
    #if NUM_ROOTS > 8
    result8 = result[8];
    #endif
    #if NUM_ROOTS > 9
    result9 = result[9];
    #endif
}

