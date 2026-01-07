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




const float nan=sqrt(-1.);
const float inf=pow(999.,999.);
const float pi=3.14159265359;
const float goldenangle = (3.0 - sqrt(5.0)) * pi;



vec3 normaltocol(vec3 normal){
    //return normal*vec2(1.,-1.).xxy/.2+0.5;
    //return vec3(normal.x*0.5+0.5,normal.y*0.5+0.5,normal.z);
    return vec3(normal.xy*0.5+0.5,-normal.z);

}



float vsum(vec3 v) {
    return v.x+v.y+v.z;
}
int vsum(ivec3 v) {
    return v.x+v.y+v.z;
}
float vmax(vec3 v) {
    return max(max(v.x, v.y), v.z);
}


