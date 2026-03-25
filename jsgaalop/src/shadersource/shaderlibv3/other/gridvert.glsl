#version 300 es
precision highp float;

in uint gridindex;

uniform mat3 cameraMatrix;
uniform vec3 cameraPos;
//uniform vec2 windowsize;

//const float FOV = 120.0;
const float NEAR = 0.01;
const float FAR = 100.0;

out vec3 v_viewPos;
//flat out vec3 v_color;
out vec3 v_worldPos;

uniform vec2 focal;

#include "../compute/grideval.glsl"

void main() {
    vec3 position=calcpos(gridindex);
    vec3 worldPos = position;
    v_worldPos=position;
    vec3 viewVec = transpose(cameraMatrix) * (worldPos - cameraPos);
    v_viewPos = viewVec;

    // Perspective projection (manually)
    //float aspect = windowsize.x / windowsize.y;
    //float f = 1.0 / tan(radians(FOV) * 0.5);
    viewVec.z*=-1.;

    vec2 xy=focal*viewVec.xy;

    //float x_clip = f * viewVec.x;
    //float y_clip = f * viewVec.y* aspect;
    float z_clip = (FAR + NEAR) / (NEAR - FAR) * viewVec.z + (2.0 * FAR * NEAR) / (NEAR - FAR);
    float w_clip = -viewVec.z;

    gl_Position = vec4(xy, z_clip, w_clip);

    //v_color = pseudoRandomColor(position);
}