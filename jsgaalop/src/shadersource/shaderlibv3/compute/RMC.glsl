#version 300 es
precision mediump float;



//#include "../common/util.glsl"
#include "../common/RDenseEvalGenerator.glsl"

uniform int singularoutput;
in vec3 pos;
out vec4 result;
void main(){//used by the marching cubes
    if(numoutputs==1)result=xyzDualrowR(pos);
    else result=xyzDualsusR(pos);

}


