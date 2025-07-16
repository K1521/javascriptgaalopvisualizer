



const float nan=sqrt(-1.);
const float inf=pow(999.,999.);
const float pi=3.14159265359;
const float goldenangle = (3.0 - sqrt(5.0)) * pi;



vec3 normaltocol(vec3 normal){
    return normal*vec2(1,-1).xxy/.2+0.5;
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


bool checker(vec3 p,float scale){
    return mod(vsum(floor(p * scale)), 2.0)>0.5;
}
bool isolines(vec3 p, float scale, float width) {
    return any(lessThan(fract(p * scale), vec3(width)));  // Checks if any component is less than width
}