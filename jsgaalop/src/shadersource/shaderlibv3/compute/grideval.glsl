
uniform vec3 low;
uniform vec3 high;
uniform ivec3 dim;


vec3 calcpos(){
    
    //x*ny*nz+y*nz+z
    int i = gl_VertexID / (dim.y * dim.z);
    int j = (gl_VertexID / dim.z) % dim.y;
    int k = gl_VertexID % dim.z;
    return mix(low, high, vec3(i,j,k) / vec3(dim - 1));
}

vec3 calcpos(uint idx) {
    uint i = idx / uint(dim.y * dim.z);
    uint j = (idx / uint(dim.z)) % uint(dim.y);
    uint k = idx % uint(dim.z);

    return mix(low, high, vec3(i,j,k) / vec3(dim - 1));
}

vec3 calcpos(int idx) {
    int i = idx / (dim.y * dim.z);
    int j = (idx / dim.z) % dim.y;
    int k = idx % dim.z;

    return mix(low, high, vec3(i,j,k) / vec3(dim - 1));
}