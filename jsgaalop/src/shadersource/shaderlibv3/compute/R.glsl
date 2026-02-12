#version 300 es
precision mediump float;






//#include "../common/util.glsl"
#include "../common/RevalGenerator.glsl"

in vec3 pos;
out float row;
out float sus;
void main(){
    row=rowR(pos);//rowR(pos);
    sus=susR(pos);
}

