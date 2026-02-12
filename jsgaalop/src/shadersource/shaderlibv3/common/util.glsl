



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


