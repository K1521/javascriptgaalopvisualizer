#version 300 es
precision mediump float;


#include "./grideval.glsl"
#include "../common/util.glsl"
#include "../common/RDenseEvalGenerator.glsl"

in vec4 pos;
out vec4 result;


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
    const int MAX_ITERS = 10;
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


void main(){
    result=FindZero(calcpos());
}
