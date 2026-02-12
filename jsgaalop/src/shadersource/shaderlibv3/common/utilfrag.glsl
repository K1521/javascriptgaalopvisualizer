//use ACTIVATE_DEBUG_COLOR to activate the debugcolor(vec3 color) function


// These options are used in raycastingmain.glsl to control the texture appearance.
// Define TEXTURE_MODE to select the 3D texture pattern.
#define TEXTURE_MODE_CHECKER   1
#define TEXTURE_MODE_ISOLINES  2
#define TEXTURE_MODE_FLAT      3

// These options are used in raycastingmain.glsl to control the color appearance.
// Define COLOR_MODE to select a option
#define COLOR_MODE_INCOLOR 1 //color from uniform
#define COLOR_MODE_NORMALS 2 //color defined by normals

// These options are used in raycastingmain.glsl to control lighting.
// Define LIGHTING_MODE to select a option
#define LIGHTING_MODE_POINTLIGHT_PHONG 1
#define LIGHTING_MODE_OFF 2

// These options are used in raycastingmain.glsl to control how normals for color are computed.
// normals are only computed if COLOR_MODE_NORMALS or not LIGHTING_MODE_OFF
// Define NORMALS_MODE to select a option
#define NORMALS_MODE_PIXEL_GRADIENTS 1
#define NORMALS_MODE_FIRST_DERIV 2

#include "./util.glsl"

vec3 getNormalPixelGradients(vec3 p){//normal aproximation in 2x2 pixels
    return normalize( -cross(dFdx(p), dFdy(p)) );
}
/*vec3 getNormalPixelGradients(vec3 p,vec3 rayDir){//normal aproximation in 2x2 pixels
    vec3 res= normalize( -cross(dFdx(p), dFdy(p)) );
    res*=sign(dot(res,rayDir));
    return res;
}*/


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

