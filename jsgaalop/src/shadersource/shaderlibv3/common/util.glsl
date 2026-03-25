



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
    return dot(v,vec3(1));
}
int vsum(ivec3 v) {
    return v.x+v.y+v.z;
}
float vmax(vec3 v) {
    return max(max(v.x, v.y), v.z);
}


float solveLinearThreshold(//inverse of lerp
    float x1, float y1,
    float x2, float y2,
    float threshold
){
    float dy = y2 - y1;
    //if(abs(dy) < 1e-12) return x1; // avoid division by zero

    float t = (threshold - y1) / dy;
    return x1 + t * (x2 - x1);
}

float hash(vec3 p) {
    ivec3 f1 = ivec3(p * 65531.0);
    ivec3 f2 = ivec3(sin(p) * 65531.0);
    ivec3 f4 = ivec3(sin(p * 65531.0) * 65531.0);
    ivec3 f5 = f1 * f2.zxy + ivec3(p).zxy * f4.yxz;
    ivec3 m = f5 * 1664525 + 1013904223;
    int h = m.x ^ m.y ^ m.z;
    return float(h & 0x7fffffff) / 2147483647.0; // normalize to [0,1)
}


vec3 pseudoRandomColor(vec3 seed) {
    return vec3(
        hash(seed + vec3(1.0, 0.0, 0.0)),
        hash(seed + vec3(0.0, 1.0, 0.0)),
        hash(seed + vec3(0.0, 0.0, 1.0))
    )*0.8+0.2;
}