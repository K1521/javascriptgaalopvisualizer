#version 300 es
precision mediump float;


#include "./grideval.glsl"
#include "../common/util.glsl"
#include "../common/RDenseEvalGenerator.glsl"

in vec4 pos;
out vec4 result;
uniform int MAX_ITERS;
uniform int solverType;
// uniform to select method: 0 = Levenberg-Marquardt, 1 = Gradient, 2 = Newton-like
vec4 levenbergmarquad(vec3 pos)
{
    //i think there is something wrong with this implementation :( it works but does only converge somewhat slow
    //onst int MAX_ITERS = 10;
    const float damping=2.;//must be >1
    float beta=0.5;

    vec3 posbest = pos;
    float fbest = inf;

    bool posatbest = true;

    for(int i = 0; i < MAX_ITERS; i++)
    {
        vec4 gn = GaussNewtonStepR(pos, beta);//actually levenberg marquad
        vec3 gnstep = gn.xyz;
        float f = gn.w;

        if(f < fbest)
        {
            // Improvement
            posbest = pos;
            fbest = f;

            pos = posbest + gnstep;
            posatbest = false;

            beta /= damping;     //decrease damping (bigger step next)
        }
        else if(posatbest)
        {
            // Try stepping from best anyway
            posatbest = false;
            pos = posbest + gnstep;
        }
        else
        {
            // Revert to best
            posatbest = true;
            pos = posbest;

            beta *= damping;     //increase damping (smaller step next)
        }

        //if(length(gnstep) < 1e-6)break;
    }

    return vec4(posbest, fbest);
}

vec4 GradientMethod(vec3 pos)
{
    vec3 lastderiv=vec3(0);
    vec4 best = vec4(pos,inf);
    float stepsize=1.;
    for(int i=0;i<MAX_ITERS;i++){
        vec4 f=xyzDualsusR(pos);
        vec3 deriv=normalize(f.xyz);
        if(dot(lastderiv,deriv)<0.){stepsize*=0.5;}
        if(abs(f.w)<abs(best.w)){
            best = vec4(pos,f.w);
        }
        pos-=deriv*stepsize;
        lastderiv=deriv;
    }


    return best;
}

vec4 Newtonlike(vec3 pos){
    vec4 best = vec4(pos,inf);
    for(int i=0;i<MAX_ITERS;i++){
        vec4 f=xyzDualsusR(pos);
        if(abs(f.w)<abs(best.w)){
            best = vec4(pos,f.w);
        }
        pos-=f.w/(dot(f.xyz,f.xyz)+1e-30)*f.xyz;
    }


    return best;
}

vec4 GradNewtonlike(vec3 pos){
    vec3 lastderiv=vec3(0);
    vec4 best = vec4(pos,inf);
    float stepsize=2./1.1;
    for(int i=0;i<MAX_ITERS;i++){
        vec4 f=xyzDualsusR(pos);
        vec3 deriv=f.w/(dot(f.xyz,f.xyz)+1e-30)*f.xyz;
        if(dot(lastderiv,deriv)<0.){stepsize/=1.1;}else{stepsize*=1.1;}
        if(abs(f.w)<abs(best.w)){
            best = vec4(pos,f.w);
        }
        pos-=deriv*stepsize;
        lastderiv=deriv;
    }


    return best;
}


void main(){
    vec3 startpos=calcpos();
    // uniform to select method: 0 = Levenberg-Marquardt, 1 = Gradient, 2 = Newton-like
    

    vec4 resultValue;

    if (solverType == 0) {
        result = levenbergmarquad(startpos);
    } else if (solverType == 1) {
        result = GradientMethod(startpos);
    } else if (solverType == 2){ // default = Newton-like
        result = Newtonlike(startpos);
    } else {
        result= GradNewtonlike(startpos);
    }

}
