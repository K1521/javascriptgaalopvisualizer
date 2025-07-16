vec3 getNormal(vec3 p){//normal aproximation in 2x2 pixels
    return normalize( -cross(dFdx(p), dFdy(p)) );
}
