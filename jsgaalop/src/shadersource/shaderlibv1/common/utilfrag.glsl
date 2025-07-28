//use ACTIVATE_DEBUG_COLOR to activate the debugcolor(vec3 color) function

#include "./util.glsl"

vec3 getNormalPixelGradients(vec3 p){//normal aproximation in 2x2 pixels
    return normalize( -cross(dFdx(p), dFdy(p)) );
}


#ifdef ACTIVATE_DEBUG_COLOR
    vec3 overwritecol = vec3(0.0);
    bool overrideactive = false;
    void debugcolor(vec3 color) {
        overrideactive = true;
        overwritecol = color;
    }
#else
    void debugcolor(vec3 color) {}//avoids compiler errors
#endif

