#version 300 es
precision mediump float;


//#define ACTIVATE_DEBUG_COLOR



#include "../common/utilfrag.glsl"
#include "../common/RDenseevalGenerator.glsl"



uniform float threshold;
uniform float maxstep;
uniform float m;
vec3 ray(float t,vec3 rayDir, vec3 rayOrigin){
    return t*rayDir+rayOrigin;
}

void Raymarch(vec3 rayDir, vec3 rayOrigin,out float error,out float xmin,vec2 v_rayDirXY) {
    
    xmin=0.;
    error=inf;
    /*for(int i=0;i<100;i++){
        Dual fa=DualsusR(rayDir,rayOrigin,xmin);
        float stepsize=min(maxstep,abs(fa.x)/(1e-12 +abs(fa.y))*.5);
        if(threshold>stepsize){
            error=abs(fa.x);
            return;
        }
        xmin+=stepsize;
    }*/
    float xlast=0.;
    float slast=0.;
    for(int i=0;i<100;i++){
        Dual fa=DualsusR(rayDir,rayOrigin,xmin);
        float stepsize=abs(fa.x)/(1e-12 +abs(fa.y))*.5;
        if(threshold>stepsize && fa.x<1e10){
            error=abs(fa.x);

            xmin=solveLinearThreshold(xlast,slast,xmin,stepsize,threshold);
            return;
        }
        xlast=xmin;
        slast=stepsize;
        xmin+=min(maxstep,m*stepsize);;
    }

    
    error=inf;
    xmin=inf;
   
}



#include "../common/raycastingmain.glsl"
