#version 300 es
precision mediump float;



//#include "../common/util.glsl"
#include "../common/RevalGenerator.glsl"

in vec3 pos;
out float result;
void main(){
    result=GaussNewtonStepR(pos,0.01);
}

