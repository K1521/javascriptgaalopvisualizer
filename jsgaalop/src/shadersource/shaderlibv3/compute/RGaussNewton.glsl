#version 300 es
precision mediump float;



//#include "../common/util.glsl"
#include "../common/RDenseEvalGenerator.glsl"

uniform int singularoutput;
in vec3 pos;
out vec4 result;
void main(){
    if(numoutputs==1)result=xyzDualrowR(pos);
    else result=GaussNewtonStepR(pos,0.01);

}


