#version 300 es
precision mediump float;


//#define ACTIVATE_DEBUG_COLOR



#include "../common/utilfrag.glsl"
#include "../common/RDenseevalGenerator.glsl"



uniform float threshold;
uniform float maxstep;

vec3 ray(float t,vec3 rayOrigin,vec3 rayDir){
    return t*rayDir+rayOrigin;
}

void Raymarch(vec3 rayDir, vec3 rayOrigin,out float error,out float xmin,vec2 v_rayDirXY) {
    
    xmin=0.;
    error=inf;
    for(int i=0;i<100;i++){
        xyzDual xyzf=xyzDualsusR(ray(xmin,rayOrigin,rayDir));
        float stepsize=min(maxstep,xyzf.w/(1e-12+length(xyzf.xyz)));
        if(threshold>stepsize){
            error=stepsize;
            return;
        }
        xmin+=stepsize;
    }

    
    error=inf;
    xmin=inf;
   
}



#include "../common/raycastingmain.glsl"
