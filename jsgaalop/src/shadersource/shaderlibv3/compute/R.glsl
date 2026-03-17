#version 300 es
precision mediump float;






#include "../common/util.glsl"
//#include "../common/RevalGenerator.glsl"


#include "../common/RDenseevalGenerator.glsl"

in vec3 pos;
out float row;
out float sus;
out float udfaprox;
void main(){
    row=rowR(pos);//rowR(pos);
    sus=susR(pos);
    xyzDual xyzf=xyzDualsusR(pos);
    udfaprox=xyzf.w/(1e-12+length(xyzf.xyz));
}

