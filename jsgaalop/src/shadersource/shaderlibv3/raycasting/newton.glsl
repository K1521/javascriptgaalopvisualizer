#version 300 es
precision mediump float;


//#define ACTIVATE_DEBUG_COLOR



#include "../common/utilfrag.glsl"
#include "../common/RDenseevalGenerator.glsl"



uniform float threshold;
uniform float maxstep;

vec3 ray(float t,vec3 rayDir, vec3 rayOrigin){
    return t*rayDir+rayOrigin;
}

void Raymarch(vec3 rayDir, vec3 rayOrigin,out float error,out float xmin,vec2 v_rayDirXY) {
    
    xmin=0.;
    error=inf;
    for(int i=0;i<100;i++){
        Dual fa=DualsusR(rayDir,rayOrigin,xmin);
        float stepsize=min(maxstep,abs(fa.x)/(1e-12 +abs(fa.y))*.5);
        if(threshold>stepsize){
            error=abs(fa.x);
            return;
        }
        xmin+=stepsize;
    }

    
    error=inf;
    xmin=inf;
   
}



#include "../common/raycastingmain.glsl"
