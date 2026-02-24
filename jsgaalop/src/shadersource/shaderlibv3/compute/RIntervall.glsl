#version 300 es
precision mediump float;



//#include "../common/util.glsl"
#include "../common/RevalGenerator.glsl"

in vec2 X;
in vec2 Y;
in vec2 Z;
flat out int result;
void main(){
    result=int(boolIntervallR(X,Y,Z,1e-8));
}

