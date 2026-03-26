#version 300 es
precision mediump float;


//#define ACTIVATE_DEBUG_COLOR



#include "../common/utilfrag.glsl"
#include "../common/RDenseevalGenerator.glsl"



uniform float threshold;
uniform float maxstep;
uniform float m;

vec3 ray(float t,vec3 rayOrigin,vec3 rayDir){
    return t*rayDir+rayOrigin;
}

void Raymarch(vec3 rayDir, vec3 rayOrigin,out float error,out float xmin,vec2 v_rayDirXY) {
    
    /*xmin=0.;
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
    xmin=inf;*/
    xmin=0.;
    error=inf;
    float xlast=0.;
    float slast=0.;
    const float eps=0.;//1e-15;
    for(int i=0;i<100;i++){
        float f=sqrt(susR(ray(xmin,rayOrigin,rayDir)));
        float stepsize=f;
        if(threshold>stepsize){
            error=stepsize;

            //xmin=solveLinearThreshold(xlast,slast,xmin,stepsize,threshold);
            float x1=xlast;
            float x2=xmin;
            float y1=slast;//>threshold
            float y2=stepsize;//<threshold

            for(int j=0;j<2;j++){
                float x=solveLinearThreshold(x1,y1,x2,y2,threshold);
                f=sqrt(susR(ray(x,rayOrigin,rayDir)));
                float y=f;
                if(y>threshold){
                    y1=y;
                    x1=x;
                }else{
                    y2=y;
                    x2=x;
                }
            }
            xmin=solveLinearThreshold(x1,y1,x2,y2,threshold);

            return;
        }
        xlast=xmin;
        slast=stepsize;
        xmin+=min(maxstep,m*stepsize);
    }
    error=inf;
    xmin=inf;
   
}



#include "../common/raycastingmain.glsl"
