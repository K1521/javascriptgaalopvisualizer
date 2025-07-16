

uniform float[?] args;


#define POLYDEGREE ? //degree of polynomial
#define USE_DOUBLEROOTS ? //if the poly is a sum of squares
#if USE_DOUBLEROOTS
    #define NUM_ROOTS (POLYDEGREE / 2)
#else
    #define NUM_ROOTS POLYDEGREE
#endif
const int numoutputs=?;






#define Complex vec2
Complex ComplexMul(Complex a, Complex b) {
    // Complex multiplication: (a.x + i*a.y) * (b.x + i*b.y)
    return Complex(
        a.x * b.x - a.y * b.y, // Real part
        a.x * b.y + a.y * b.x  // Imaginary part
    );
}
Complex ComplexSquare(Complex a) {
    // Complex multiplication: (a.x + i*a.y) * (b.x + i*b.y)
    return Complex(
        a.x * a.x - a.y * a.y, // Real part
        2.0 * a.x * a.y  // Imaginary part
    );
}
Complex ComplexDiv(Complex a, Complex b) {
    // Complex division: (a.x + i*a.y) / (b.x + i*b.y)
    return Complex(
        (a.x * b.x + a.y * b.y) ,
        (a.y * b.x - a.x * b.y)
    ) / dot(b,b);
}
Complex ComplexInv(Complex a) {
    // Complex division: 1 / (a.x + i*a.y)
    return a*Complex(1,-1) / dot(a,a);
}
Complex ComplexConjugate(Complex a) {
    // Complex division: 1 / (a.x + i*a.y)
    return a*Complex(1,-1);
}


#define DualComplex vec4
DualComplex DualComplexMul(DualComplex a,DualComplex b){
    return DualComplex(ComplexMul(a.xy,b.xy),ComplexMul(a.xy,b.zw)+ComplexMul(a.zw,b.xy));
}
DualComplex DualComplexSqare(DualComplex a){
    return DualComplex(ComplexSquare(a.xy),2.0*ComplexMul(a.xy,a.zw));
}
DualComplex DualComplexAdd(DualComplex a,float b){
    return DualComplex(a.x+b, a.yzw);
}


#define xyzDual vec4
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


DualComplex DualComplexSummofsquares(vec3 rayDir, vec3 rayOrigin,Complex a){?} //gets replaced

float Summofsquares(vec3 rayDir, vec3 rayOrigin,float a){?}

xyzDual xyzDualSummofsquares(vec3 pos) {?}

void DualF(vec3 rayDir, vec3 rayOrigin,float a,out Dual[numoutputs] result) {?}







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

Intervall IntervallSummofsquares(Intervall _V_X,Intervall _V_Y,Intervall _V_Z) {?}

bool evaluatevoxelIntervall3d(Intervall x, Intervall y, Intervall z) {?}