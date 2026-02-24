
#define xyzDual vec4
xyzDual xyzDualAdd(xyzDual a,xyzDual b){
    return a+b;
}
xyzDual xyzDualMul(xyzDual a,xyzDual b){
    return xyzDual(a.w*b.xyz+b.w*a.xyz,a.w*b.w);
}
xyzDual xyzDualSqare(xyzDual a){
    return xyzDual(2.*a.w*a.xyz,a.w*a.w);
}
xyzDual xyzDualSqrt(xyzDual a){
    float sqrtf=sqrt(a.w);
    return xyzDual(a.xyz/(2.*sqrtf),sqrtf);
}
xyzDual xyzDualAbs(xyzDual a) {
    return xyzDual(a.xyz*sign(a.w),abs(a.w));
}