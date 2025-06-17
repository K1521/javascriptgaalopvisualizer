#version 300 es
//precision highp float;
precision highp int;//needed for voxel packing
//precision highp uint;//needed for voxel packing


uniform float[?] args;
in int inPackedVoxel;
flat out int outPackedVoxel;

uniform int level;
uniform float scale;

ivec3 unpackVoxel(int packed) {
    uint u = uint(packed);
    uint x = u & 0x3FFu;
    uint y = (u >> 10u) & 0x3FFu;
    uint z = (u >> 20u) & 0x3FFu;
    return ivec3(x, y, z);
}

vec3 voxelToPosition(ivec3 voxelCoords) {
    //return vec3(voxelCoords) * (2.0 / 1024.0) - 1.0;//maps to [-1,1]
    return scale*vec3(voxelCoords-ivec3(512)) / (512.0);//potentially more precision (like 1 bit)
}

int packVoxel(ivec3 coords) {
    return int((coords.z << 20u) | (coords.y << 10u) | coords.x);
}

bool evaluatevoxel(vec2 x, vec2 y, vec2 z);
// true -> keep voxel
// false -> discard voxel -> voxel empty

void main() {
    ivec3 parent = unpackVoxel(inPackedVoxel);
    vec3 poslow = voxelToPosition(parent);
    vec3 poshigh = voxelToPosition(parent + ivec3(1 << (10 - level))); // levels go from 0 to 10
    //so in one axis i have at level 0 cords [0->[0,1024]->[-1,1]]
    //so in one axis i have at level 1 cords [0->[0,512]->[-1,0],512->[512,1024]->[0,1]]

    //outPackedVoxel=packVoxel(ivec3(parent.x,3u,parent.z));
    //outPackedVoxel=packVoxel(parent + ivec3(1 << (10 - level)));
    //outPackedVoxel=packVoxel(uvec(poslow*1024));
    //return;
    //outPackedVoxel=int(poslow.x);
    //return;

    if (evaluatevoxel(vec2(poslow.x, poshigh.x), vec2(poslow.y, poshigh.y), vec2(poslow.z, poshigh.z))) {
        outPackedVoxel = inPackedVoxel;
    } else {
        outPackedVoxel = -1;
    }
}

#define Intervall vec2 // Interval type: [min, max]


// Interval addition
Intervall IntervallAdd(Intervall a, Intervall b) {
    return Intervall(a.x + b.x, a.y + b.y);
}

// Interval subtraction
Intervall IntervallSub(Intervall a, Intervall b) {
    return Intervall(a.x - b.y, a.y - b.x);
}

// Interval multiplication
Intervall IntervallMul(Intervall a, Intervall b) {
    float ll = a.x * b.x;
    float lh = a.x * b.y;
    float hl = a.y * b.x;
    float hh = a.y * b.y;
    float lo = min(min(ll, lh), min(hl, hh));
    float hi = max(max(ll, lh), max(hl, hh));
    return Intervall(lo, hi);
}

/*// Interval division
Intervall IntervallDiv(Intervall a, Intervall b) {
    if (b.x <= 0.0 && b.y >= 0.0) {
        // Division by interval containing zero is undefined
        return Intervall(-INFINITY, INFINITY);
    }
    float ll = a.x / b.x;
    float lh = a.x / b.y;
    float hl = a.y / b.x;
    float hh = a.y / b.y;
    float lo = min(min(ll, lh), min(hl, hh));
    float hi = max(max(ll, lh), max(hl, hh));
    return Intervall(lo, hi);
}*/

// Interval square
Intervall IntervallSquare(Intervall a) {
    if (a.x >= 0.0) return Intervall(a.x * a.x, a.y * a.y);
    if (a.y <= 0.0) return Intervall(a.y * a.y, a.x * a.x);
    float hi = max(a.x * a.x, a.y * a.y);
    return Intervall(0.0, hi);
}

// Interval negation
Intervall IntervallNeg(Intervall a) {
    return Intervall(-a.y, -a.x);
}

bool IntervallContains(Intervall a, float value) {
    return value >= a.x && value <= a.y;
}

// Interval width
float IntervallWidth(Intervall a) {
    return a.y - a.x;
}

// Interval midpoint
float IntervallMidpoint(Intervall a) {
    return (a.x + a.y) * 0.5;
}

bool evaluatevoxelIntervall3d(Intervall x, Intervall y, Intervall z) {?}



bool evaluatevoxel(Intervall x, Intervall y, Intervall z) {
    return evaluatevoxelIntervall3d(x,y,z);
}