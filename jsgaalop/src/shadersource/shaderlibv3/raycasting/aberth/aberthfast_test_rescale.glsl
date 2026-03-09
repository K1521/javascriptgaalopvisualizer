#version 300 es
precision mediump float;


#define ACTIVATE_DEBUG_COLOR



#include "../../common/utilfrag.glsl"
#include "../../common/RevalGenerator.glsl"


const int ABERTH_MAXITER = 40;
//const float ABERTH_THRESHOLD = 1e-6;
const float ROOT_ZERRO_THRESHOLD = 1e-2;

#define NUM_ROOTS basismaxdegree
//#define polylen basismaxdegree+1

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
        /*if (max_change < ABERTH_THRESHOLD) {
            //debugcolor(vec3(float(iter+1)/float(ABERTH_MAXITER)));
            break; // Converged, exit the loop
        }*/
    }
}


void aberth_method_sus(inout Complex[NUM_ROOTS] roots, vec3 rayDir, vec3 rayOrigin,int maxiter) {
    for (int iter = 0; iter < maxiter; iter++) {
        float max_change = 0.0; // Track the largest change in roots

        for (int k = 0; k < NUM_ROOTS; k++) {
            // Evaluate the polynomial and its derivative at the current root
            DualComplex res=DCsusR(rayDir,rayOrigin,roots[k]);
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
        /*if (max_change < ABERTH_THRESHOLD) {
            //debugcolor(vec3(float(iter+1)/float(ABERTH_MAXITER)));
            break; // Converged, exit the loop
        }*/
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
        /*if (max_change < ABERTH_THRESHOLD) {
            //debugcolor(vec3(float(iter+1)/float(ABERTH_MAXITER)));
            break; // Converged, exit the loop
        }*/
    }
}

void initial_roots(out Complex[NUM_ROOTS] roots) {
    const Complex r1 = Complex(cos(goldenangle), sin(goldenangle)); // Base complex number
    roots[0]=r1;
    for (int i = 1; i < NUM_ROOTS; i++) {
        roots[i] = ComplexMul(r1, roots[i-1]);
    }
}
void initial_roots(out Complex[NUM_ROOTS] roots,Complex center) {
    initial_roots(roots);
    for (int i = 0; i < NUM_ROOTS; i++) roots[i]+=center;
}

float calcscale(float[NUM_ROOTS+1] coeffs){
    //from https://dl.acm.org/doi/epdf/10.1145/2699468
    //Algorithm 954: An Accurate and Efﬁcient Cubic and QuarticEquation Solver for Physical ApplicationsN. FLOCKE, Flash Center for Computational Science, University of Chicago
    float m=0.;
    float leadinv = 1./coeffs[NUM_ROOTS];
    for(int i=0;i<NUM_ROOTS;i++)
        m=max(m,
            pow(abs(coeffs[i]*leadinv),1./float(NUM_ROOTS-i))
        );
    //all real roots are in intervall [-2m,2m]
    return m;
}

void Raymarch(vec3 rayDir, vec3 rayOrigin,out float error,out float xmin,vec2 v_rayDirXY) {
    
    
    // ---- Quadrant constants ----
const int QUAD_TOP_LEFT     = 0;
const int QUAD_TOP_RIGHT    = 1;
const int QUAD_BOTTOM_LEFT  = 2;
const int QUAD_BOTTOM_RIGHT = 3;

// ---- Determine quadrant ----
int quadrant;

bool left =  (v_rayDirXY.x < 0.0);
bool top  =  (v_rayDirXY.y > 0.0);

if ( left &&  top) quadrant = QUAD_TOP_LEFT;
else if (!left &&  top) quadrant = QUAD_TOP_RIGHT;
else if ( left && !top) quadrant = QUAD_BOTTOM_LEFT;
else                    quadrant = QUAD_BOTTOM_RIGHT;


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


if (quadrant == QUAD_TOP_LEFT) {

    // Reference: slow but accurate
    aberth_method_poly(roots, rayDir, rayOrigin, 40);

} else {

    float k = calcscale(coeffs); // real roots in [-2k,2k]  +2k /4  
    float scale=0.;
    float offset=0.;

    if (quadrant == QUAD_BOTTOM_LEFT) {
        scale = 1.0;
        offset = 0.0;
    }
    else if (quadrant == QUAD_BOTTOM_RIGHT) {
        scale = k;
        offset = 0.;
    }
    else { // QUAD_TOP_RIGHT x*k+k    (y)/k-1
        scale = k;
        offset = k;
    }

    for (int i = 0; i < NUM_ROOTS + 1; i++) {
        float x = xi[i] * scale + offset;
        yi[i] = rowR(rayOrigin + rayDir * x);
    }

    makeCoeffs(yi, coeffs);
    aberth_method_horner(roots, coeffs, 40);

    for (int i = 0; i < NUM_ROOTS + 1; i++) {
        roots[i].x = roots[i].x * scale + offset;
    }
}

    error=inf;
    xmin=inf;
    float imag=inf;
    for(int i = 0; i < NUM_ROOTS; ++i){
        Complex r=roots[i];r.y=abs(r.y);
        //Complex r=candidates[i];
        
        if(r.x<0.)continue;
        float y=susR(rayDir*r.x+rayOrigin);

        if(r.x<xmin && y<ROOT_ZERRO_THRESHOLD){
            error=y;
            xmin=r.x;
            imag=r.y;
        }
    }
   
}

#include "../../common/raycastingmain.glsl"
