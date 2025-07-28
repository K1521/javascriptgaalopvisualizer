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







void DualComplexRaymarchGauss(vec3 rayDir, vec3 rayOrigin,out float error,out float x){
    const float threshold=1e-2;
    const float minstep=0.00001;
    //const int numoutputs=?;


    Dual[numoutputs] result;

    x=0.0;
    error=inf;
    float xact=0.0;
    //Dual res;

    //sphere tracing aproximation

    float delta;
    for(int i=0;i<60;i++){
        DualF(rayDir,rayOrigin,xact,result);
        Dual res=Dual(0.);
        float summofsquares=0.;
        for(int j=0;j<numoutputs;j++){
            Dual outputj=result[j];
            summofsquares+=outputj.x*outputj.x;
            res+=outputj*outputj.y;
            //res+=DualSquare(outputj);
        };

        float e=summofsquares;
        if(e<error){
            x=xact;
            error=e;
        }

        delta= res.x / res.y*0.5;

        if(error<threshold && delta>0.)return;

        xact+=max(abs(delta),minstep);;
        
    }
    if(error<threshold && delta>0.)return;
    x=inf;
}

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
    DualComplexRaymarchGauss(rayDir,rayOrigin,error,x);

    /*
    x=0.0;
    error=inf;
    float xact=0.;
    for(int i=0;i<60;i++){
        xyzDual res=xyzDualSummofsquares(rayDir*x+rayOrigin);
        error=res.w ;
        
        float delta= abs(res.w / length(res.xyz));
        if(error<1e-3 && delta < 1e-3)return;
        //TODO while error is getting lower refine until below threshold
        x+=delta;
        
    }
    error=inf;
    x=inf;*/

    

    /*for(int i=0;i<5;i++){
        DualF(rayDir,rayOrigin,xact,result);
        Dual res=Dual(0.);
        float summofsquares=0.;
        for(int j=0;j<numoutputs;j++){
            Dual outputj=result[j];
            summofsquares+=outputj.x*outputj.x;
            res+=outputj*outputj.y;
            //res+=DualSquare(outputj);
        };

        float e=summofsquares;
        if(e<error){
            x=xact;
            error=e;
        }
        xact-=res.x / res.y;
    }
    if(error<threshold)return;*/
    //x=inf;
    //if(delta<0.)x=inf;

    //newton iterations
    /*for(int i=0;i<60;i++){
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
    if(dot(rayDir,res.xyz)>0.)x=inf;*/



    //ganja
    /*float lastd = 1000.0;
    for (int i=0; i<1000; i++) {
    float d = sqrt(xyzDualSummofsquares(rayDir*x+rayOrigin).w);
    float diff = 0.0001*(1.0+2000.0*d)*0.1;
    if (d < threshold){
        x=x + (lastd-threshold)/(lastd-d)*diff;
        return;
    } 
    lastd = d; x += diff;
    }
    x=inf;*/

         	




}

#include "../common/raycastingmain.glsl"
