#version 300 es
precision mediump float;






//#//include "../common/utilfrag.glsl"
//#//include "../common/util.glsl"
//#include "../common/generated_functions.glsl"


in vec3 position;
out vec4 result;

void main(){
    result=xyzDualSummofsquares(position);
}