#version 300 es
precision mediump float;


#include "./grideval.glsl"
//#include "../common/util.glsl"
#include "../common/RDenseEvalGenerator.glsl"

in vec3 pos;
out float result;
void main(){
    result=susR(calcpos());
}

