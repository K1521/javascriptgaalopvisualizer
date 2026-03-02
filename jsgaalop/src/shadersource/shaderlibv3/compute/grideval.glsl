
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