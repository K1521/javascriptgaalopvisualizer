#version 300 es
precision mediump float;


#define ACTIVATE_DEBUG_COLOR



#include "../common/utilfrag.glsl"
#include "../common/RDenseevalGenerator.glsl"


//const int ABERTH_MAXITER = 40;
const float ABERTH_THRESHOLD = 1e-4;
const float ROOT_ZERRO_THRESHOLD = 1e-4;

uniform float eps;
uniform float beta;

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


        
            Complex rk=roots[k];
            Complex s =ComplexInv(rk-ComplexConjugate(rk)); // Summation term
            for (int j = 0; j < NUM_ROOTS; j++) {
                if (j != k) { // Avoid self-interaction
                    s += ComplexInv(rk - roots[j])+ComplexInv(rk - ComplexConjugate(roots[j]));
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

vec2 newtonsus(vec3 rayDir, vec3 rayOrigin,vec2 a,int iter){
    for(int i=0;i<iter;i++){
        vec4 f=DCsusR(rayDir,rayOrigin,a);
        a-=ComplexDiv(f.xy,f.zw);
    }
    return a;
}

float gaussnewton(vec3 rayDir, vec3 rayOrigin,float a,int iter){
    for(int i=0;i<iter;i++)a-=GaussNewtonStepR(rayDir,rayOrigin,a,1e-12);
    return a;
}
float distanceLinePoint(vec3 ro, vec3 rd, vec3 p) {
    return length(cross(p - ro, rd));
}

float raySphereIntersect(vec3 ro, vec3 rd, vec3 center, float radius) {
    vec3 oc = ro - center;
    float b = dot(oc, rd);
    float c = dot(oc, oc) - radius * radius;
    float h = b*b - c;

    if (h < 0.0) return inf;  // no intersection

    h = sqrt(h);
    float t0 = -b - h;  // entry point
    float t1 = -b + h;  // exit point

    if (t0 >= 0.0) return t0;
    if (t1 >= 0.0) return t1;

    return inf;  // sphere is behind the ray
}

void Raymarch(vec3 rayDir, vec3 rayOrigin,out float error,out float xmin,vec2 v_rayDirXY) {
    
    
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
    

    
    error=inf;
    xmin=inf;
    for(int i = 0; i < NUM_ROOTS; ++i){
        float a=roots[i].x;
        //xyzDual f=xyzDualsusR(rayDir*a+rayOrigin);

        //vec3 p=abs(f.w)/(dot(f.xyz,f.xyz)+1e-10)*f.xyz;
        //pd=p-dot(p,rayDir)/dot(rayDir,rayDir)*rayDir
        //dist=sqrt(dot(pd,pd))

        //float e=length(cross(p, rayDir)) / length(rayDir);
        //float e=abs(f.w)/sqrt(dot(f.xyz,f.xyz)+1e-10);
        vec4 gn=GaussNewtonStepR(rayDir*a+rayOrigin,beta);
        float e=length(gn.xyz);
        float f=gn.w;
        //e*=1./(a*a);
        if(a<xmin && e<eps && a>=0. && abs(f)<1.){
                error=e;
                xmin=a;
            }
        /*if(v_rayDirXY.x>0.){
            a=raySphereIntersect(rayOrigin,rayDir,rayDir*a+rayOrigin+gn.xyz,eps);
            if(a<xmin && a>=0. && abs(f)<1.){
                error=e;
                xmin=a;
            }
        }else{
            if(a<xmin && e<eps && a>=0. && abs(f)<1.){
                error=e;
                xmin=a;
            }
        }*/
    }

    /*for(int i = 0; i < NUM_ROOTS; ++i){
        //float a=roots[i].x;
        //xyzDual f=xyzDualsusR(rayDir*a+rayOrigin);
        //a=gaussnewton(rayDir,rayOrigin,a,5);
        vec2 r=newtonsus(rayDir,rayOrigin,roots[i],2);
        float a=r.x;
        //vec3 p=abs(f.w)/(dot(f.xyz,f.xyz)+1e-10)*f.xyz;
        //pd=p-dot(p,rayDir)/dot(rayDir,rayDir)*rayDir
        //dist=sqrt(dot(pd,pd))

        //float e=length(cross(p, rayDir)) / length(rayDir);
        //float e=DCsusR(rayDir*a+rayOrigin);
        //e*=1./(a*a);
        float e=susR(rayDir*a+rayOrigin);
        if(a<xmin && a>=0. && e<1e-10){
            error=e;
            xmin=a;
        }
    }*/
}



#include "../common/raycastingmain.glsl"
