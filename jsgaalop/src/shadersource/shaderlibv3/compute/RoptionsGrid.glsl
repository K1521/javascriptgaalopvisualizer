#version 300 es
precision mediump float;


#include "./grideval.glsl"
//#include "../common/util.glsl"
#include "../common/RDenseEvalGenerator.glsl"

in vec3 pos;
out float result;
uniform int solver;
void main(){
    vec3 startpos=calcpos();
    switch (solver) {

        case 0:
            result = length(GaussNewtonStepR(startpos, 0.01).xyz);
            break;

        default:
        case 1:
            result = susR(startpos);
            break;

        case 2: {
            vec4 xyzf = xyzDualsusR(startpos);
            result = xyzf.w / (1e-20 + length(xyzf.xyz));
            break;
        }
    }
}

