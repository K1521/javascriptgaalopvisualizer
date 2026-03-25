#version 300 es
// Fragment Shader
precision highp float;



in vec3 v_viewPos;
in vec3 v_worldPos;


uniform vec4 incolor;

out vec4 fragColor;

const float zMax = 1000.0;

flat in vec3 v_color;

#include "../common/util.glsl"

bool checker(vec3 p,float scale){
    return mod(vsum(floor(p * scale)), 2.0)>0.5;
}


void main() {
    if (v_viewPos.z <= 0.0) {
        discard;
    }
    //gl_FragDepth=0.;
    float z = v_viewPos.z/ zMax;//length(v_viewPos) / zMax; 

    // Write to depth buffer manually
    gl_FragDepth =clamp(z ,0.,1.);

    //fragColor = vec4(incolor.rgb, 1.0);
    //fragColor = vec4(v_color, 1.0);
    float pattern = checker(v_worldPos,4.0)?1.0:0.5;
    fragColor = vec4(incolor.rgb*pattern, 1.0);
    //fragColor = vec4(v_color, 1.0);
 
}