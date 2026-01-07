#version 300 es
precision mediump float;






#include "../common/utilfrag.glsl"
#include "../common/util.glsl"
#include "../common/generated_functions.glsl"


out vec4 color;


//camera params
uniform vec3 cameraPos;
uniform mat3 cameraMatrix;

uniform vec4 incolor;//only rgb are used currently (not alpha)

const int ABERTH_MAXITER = 40;
const float ABERTH_THRESHOLD = 1e-3;
const float ROOT_ZERRO_THRESHOLD = 1e-1;


void aberth_method(inout Complex[NUM_ROOTS] roots, vec3 rayDir, vec3 rayOrigin) {
    for (int iter = 0; iter < ABERTH_MAXITER; iter++) {
        float max_change = 0.0; // Track the largest change in roots

        for (int k = 0; k < NUM_ROOTS; k++) {
            // Evaluate the polynomial and its derivative at the current root
            DualComplex res=DualComplexSummofsquares(rayDir,rayOrigin,roots[k]);
            Complex a = ComplexDiv(
                res.xy,
                res.zw
            );


        #if USE_DOUBLEROOTS
            Complex rk=roots[k];
            Complex s =ComplexInv(rk-ComplexConjugate(rk)); // Summation term
            for (int j = 0; j < NUM_ROOTS; j++) {
                if (j != k) { // Avoid self-interaction
                    s += ComplexInv(rk - roots[j])+ComplexInv(rk - ComplexConjugate(roots[j]));
                }
            }
        #else
            Complex s = Complex(0.0); // Summation term
            for (int j = 0; j < NUM_ROOTS; j++) {
                if (j != k) {
                    Complex diff = roots[k] - roots[j];
                    s += ComplexInv(diff);
                }
            }
        #endif

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

void initial_roots(out Complex[NUM_ROOTS] roots,Complex center) {
    const Complex r1 = Complex(cos(goldenangle), sin(goldenangle)); // Base complex number
    roots[0]=r1;
    for (int i = 1; i < NUM_ROOTS; i++) {
        roots[i] = ComplexMul(r1, roots[i-1]);
    }
    for (int i = 0; i < NUM_ROOTS; i++) {
        roots[i]+=center;
    }
}

void Raymarch(vec3 rayDir, vec3 rayOrigin,out float error,out float x) {
    
    Complex[NUM_ROOTS] roots;
    initial_roots(roots,Complex(1.0,0.0));
    //inout Complex[NUM_ROOTS] roots, vec3 rayDir, vec3 rayOrigin
    aberth_method(roots,rayDir,rayOrigin);
    

    error=inf;
    x=inf;
    for(int i = 0; i < NUM_ROOTS; ++i){
        Complex r=roots[i];
        r.y=abs(r.y);

        if(r.x>=0. && r.x<x && r.y<ROOT_ZERRO_THRESHOLD){
            error=r.y;
            x=r.x;
        }
    }

}



#include "../common/raycastingmain.glsl"
