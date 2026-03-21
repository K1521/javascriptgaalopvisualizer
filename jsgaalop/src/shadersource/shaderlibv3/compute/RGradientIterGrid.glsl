#version 300 es
precision mediump float;


#include "./grideval.glsl"
#include "../common/util.glsl"
#include "../common/RDenseEvalGenerator.glsl"

in vec4 pos;
out vec4 result;
uniform int MAX_ITERS;

/* myy pseudocode 
posatbest=true;
for i in range(10)
    f,stepnew=GaussNewtonStepR(pos,beta);
    if f<fbest:
        posbest=pos
        fbest=f
        pos=posbest+stepnew
        posatbest=false
        beta/=1.1
    else if posatbest
        posatbest=false
        pos=posbest+stepnew
    else 
        posatbest=true
        pos=posbest
        beta*=1.1
*/

vec4 FindZero(vec3 pos)
{
    
    vec4 f=xyzDualsusR(pos);
    vec3 lastderiv=f.xyz;
    vec4 best = vec4(pos,f.w);
    float stepsize=1.;
    for(int i=0;i<MAX_ITERS;i++){
        f=xyzDualsusR(pos);
        vec3 deriv=normalize(f.xyz);
        if(dot(lastderiv,deriv)<0){stepsize*=0.5;}
        if(abs(f.w)<abs(best.w)){
            best = vec4(pos,f.w);
        }
        pos-=deriv*stepsize;
        lastderiv=deriv;
    }


    return best;
}


void main(){
    result=FindZero(calcpos());
}
