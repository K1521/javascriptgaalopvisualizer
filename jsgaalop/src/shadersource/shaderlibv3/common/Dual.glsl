#define Dual vec2
Dual DualMul(Dual a, Dual b) {
    return Dual(a.x * b.x, a.x * b.y + a.y * b.x);
}
Dual DualSquare(Dual a) {
    return Dual(a.x * a.x, 2.0 * a.x * a.y);
}
Dual DualSqrt(Dual a) {
    float sqrtf = sqrt(a.x);
    return Dual(sqrtf, a.y / (2.0 * sqrtf));
}
Dual DualAbs(Dual a) {
    return Dual(abs(a.x), a.y * sign(a.x));
}
Dual DualAdd(Dual a, Dual b) {
    return a+b;
}