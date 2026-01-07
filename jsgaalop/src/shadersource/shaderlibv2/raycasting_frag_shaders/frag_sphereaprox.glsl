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






/*
void DualComplexRaymarchNewton(vec3 rayDir, vec3 rayOrigin,out float error,out float x){
    //newton iterations
    for(int i=0;i<60;i++){
        res=xyzDualSummofsquares(rayDir*xact+rayOrigin);
        float f_=dot(rayDir,res.xyz);
        float e=abs(res.w);
        if(e<error){
            x=xact;
            error=e;
        }

        if(error<threshold && f_<0.)return;

        float delta= max(abs(e/ f_),minstep)*0.5;

        xact+=delta;
        
    }
    x=inf;
    if(dot(rayDir,res.xyz)>0.)x=inf;
}*/




void Raymarch(vec3 rayDir, vec3 rayOrigin,out float error,out float x) {
    x=0.0;
    error=inf;
    float xact=0.;
    float delta;
    for(int i=0;i<60;i++){
        xyzDual res=xyzDualSummofsquares(rayDir*xact+rayOrigin);
        float e=abs(res.w);

        
        delta= abs(res.w / length(res.xyz));
        if(e<error){
            error=e;
            x=xact;
        }
        else if(error<1e-3 && delta < 1e-3)return;
        //TODO while error is getting lower refine until below threshold
        xact+=delta;
        
    }
    if(error<1e-3 && delta < 1e-3)return;
    error=inf;
    x=inf;



}

#include "../common/raycastingmain.glsl"
