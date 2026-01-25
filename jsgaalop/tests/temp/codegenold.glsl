#version 300 es
precision mediump float;

//#include "../common/utilfrag.glsl"
//#include "../common/util.glsl"

// from http://127.0.0.1:5508/jsgaalop/src/shadersource/shaderlibv1/common/generated_functions.glsl @ line 1


uniform float[3] args;


#define POLYDEGREE 4 //degree of polynomial (for the sum of squares)
#define USE_DOUBLEROOTS 0 //if the poly is a sum of squares

#if USE_DOUBLEROOTS
    #define NUM_ROOTS (POLYDEGREE / 2)
#else
    #define NUM_ROOTS POLYDEGREE
#endif

const int numoutputs=1;






#define Complex vec2
Complex ComplexAdd(Complex a, Complex b) {return a+b;}
Complex ComplexAdd(float a, Complex b) {return Complex(a + b.x,b.y);}
Complex ComplexAdd(Complex a, float b) {return ComplexAdd(b,a);}

Complex ComplexSub(Complex a, Complex b) {return a-b;}
Complex ComplexSub(float a, Complex b) {return Complex(a - b.x,b.y);}
Complex ComplexSub(Complex a, float b) {return Complex(a.x -b ,a.y);}

Complex ComplexMul(Complex a, Complex b) {
    // Complex multiplication: (a.x + i*a.y) * (b.x + i*b.y)
    return Complex(
        a.x * b.x - a.y * b.y, // Real part
        a.x * b.y + a.y * b.x  // Imaginary part
    );
}
Complex ComplexMul(Complex a, float b) {return a*b;}
Complex ComplexMul(float a, Complex b) {return a*b;}
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


DualComplex DualComplexSummofsquares(vec3 rayDir, vec3 rayOrigin,Complex a) {
    DualComplex _V_X=DualComplex(ComplexMul(Complex(rayDir.x,0.),a)+Complex(rayOrigin.x,0.),rayDir.x,0.);
    DualComplex _V_Y=DualComplex(ComplexMul(Complex(rayDir.y,0.),a)+Complex(rayOrigin.y,0.),rayDir.y,0.);
    DualComplex _V_Z=DualComplex(ComplexMul(Complex(rayDir.z,0.),a)+Complex(rayOrigin.z,0.),rayDir.z,0.);
    DualComplex _node0 = DualComplexSqare(_V_Y);
    DualComplex _node1 = (((DualComplexSqare(_V_X)+_node0)+DualComplexSqare(_V_Z))/2.0);
    DualComplex _node2 = ((((((-(args[0]*DualComplexSqare(_V_X)))+(-(args[0]*_node0)))+(-(-4.0*DualComplexSqare(_node1))))+(-(args[1]*_node1)))+(-(args[1]*_node1)))+DualComplex(args[2],0.,0.,0.));
    return _node2;
}
 //gets replaced

float Summofsquares(vec3 rayDir, vec3 rayOrigin,float a) {
    float _V_X=rayDir.x*a+rayOrigin.x;
    float _V_Y=rayDir.y*a+rayOrigin.y;
    float _V_Z=rayDir.z*a+rayOrigin.z;
    float _node0 = (_V_Y*_V_Y);
    float _node1 = ((((_V_X*_V_X)+_node0)+(_V_Z*_V_Z))/2.0);
    float _node2 = ((((((-(args[0]*(_V_X*_V_X)))+(-(args[0]*_node0)))+(-(-4.0*(_node1*_node1))))+(-(args[1]*_node1)))+(-(args[1]*_node1)))+args[2]);
    return _node2;
}

float Summofsquares(vec3 rayDir, vec3 rayOrigin,float a){
float _V_X = (rayOrigin.x+(a*rayDir.x));
float _generatednode1 = (_V_X*_V_X);
float _V_Y = (rayOrigin.y+(a*rayDir.y));
float _generatednode3 = (_V_Y*_V_Y);
float _V_Z = (rayOrigin.z+(a*rayDir.z));
float _node1 = (((_generatednode1+_generatednode3)+(_V_Z*_V_Z))*0.5);
float _generatednode6 = (args[1]*_node1);
float _generatednode7 = (args[2]-(((((args[0]*_generatednode1)+(args[0]*_generatednode3))+((_node1*_node1)*-4.0))+_generatednode6)+_generatednode6));
return (_generatednode7*_generatednode7);
}



xyzDual xyzDualSummofsquares(vec3 pos) {
    xyzDual _V_X=xyzDual(1.,0.,0.,pos.x);
    xyzDual _V_Y=xyzDual(0.,1.,0.,pos.y);
    xyzDual _V_Z=xyzDual(0.,0.,1.,pos.z);
    xyzDual _node0 = xyzDualSqare(_V_Y);
    xyzDual _node1 = (((xyzDualSqare(_V_X)+_node0)+xyzDualSqare(_V_Z))/2.0);
    xyzDual _node2 = ((((((-(args[0]*xyzDualSqare(_V_X)))+(-(args[0]*_node0)))+(-(-4.0*xyzDualSqare(_node1))))+(-(args[1]*_node1)))+(-(args[1]*_node1)))+xyzDual(0.,0.,0.,args[2]));
    return _node2;
}


/*void DualF(vec3 rayDir, vec3 rayOrigin,float a,out Dual[numoutputs] result) {
    Dual _V_X=Dual(rayDir.x*a+rayOrigin.x,rayDir.x);
    Dual _V_Y=Dual(rayDir.y*a+rayOrigin.y,rayDir.y);
    Dual _V_Z=Dual(rayDir.z*a+rayOrigin.z,rayDir.z);
    Dual _node0 = DualSquare(_V_Y);
    Dual _node1 = (((DualSquare(_V_X)+_node0)+DualSquare(_V_Z))/2.0);
    Dual _node2 = ((((((-(args[0]*DualSquare(_V_X)))+(-(args[0]*_node0)))+(-(-4.0*DualSquare(_node1))))+(-(args[1]*_node1)))+(-(args[1]*_node1)))+Dual(args[2],0.));
    result[0]=_node2;
    }

*/
void DualF(vec3 rayDir, vec3 rayOrigin,float a,out Dual[numoutputs] result) {}







#define Intervall vec2 // Interval type: [min, max]
// Interval addition
Intervall IntervallAdd(Intervall a, Intervall b) {
    return Intervall(a.x + b.x, a.y + b.y);
}
Intervall IntervallAdd(float a, Intervall b) {return a+b;}
Intervall IntervallAdd(Intervall a, float b) {return a+b;}

// Interval subtraction
Intervall IntervallSub(Intervall a, Intervall b) {
    return Intervall(a.x - b.y, a.y - b.x);
}
Intervall IntervallSub(float a, Intervall b) {return Intervall(a - b.y, a - b.x);}
Intervall IntervallSub(Intervall a, float b) {return a-b;}

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
Intervall IntervallMul(float a, Intervall b) {
    float l = a * b.x;
    float h = a * b.y;
    return Intervall(min(l, h), max(l, h));
}
Intervall IntervallMul(Intervall a, float b) {return IntervallMul(b,a);}

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

Intervall IntervallSummofsquares(Intervall _V_X,Intervall _V_Y,Intervall _V_Z) {
    Intervall _node0 = IntervallSquare(_V_Y);
    Intervall _node1 = IntervallMul(((IntervallSquare(_V_X)+_node0)+IntervallSquare(_V_Z)),Intervall(1./2.0));
    Intervall _node2 = (((((IntervallNeg(IntervallMul(Intervall(args[0]),IntervallSquare(_V_X)))+IntervallNeg(IntervallMul(Intervall(args[0]),_node0)))+IntervallNeg(IntervallMul(Intervall(-4.0),IntervallSquare(_node1))))+IntervallNeg(IntervallMul(Intervall(args[1]),_node1)))+IntervallNeg(IntervallMul(Intervall(args[1]),_node1)))+Intervall(args[2]));
    return _node2;
}


bool evaluatevoxelIntervall3d(Intervall x, Intervall y, Intervall z) {
    float _V_X=(x.x+x.y)/2.;
    float _V_Y=(y.x+y.y)/2.;
    float _V_Z=(z.x+z.y)/2.;
    float delta=(x.y-x.x)/2.;
    float _node0 = -1.0;
    float _node1 = (1.0*delta);
    float _node2 = (_node1*_node1);
    float _node3 = (_node0*(args[0]*_node2));
    float _node4 = -4.0;
    float _node5 = 2.0;
    float _node6 = (_node2/_node5);
    float _node7 = (_V_X*_V_X);
    float _node8 = (_V_Y*_V_Y);
    float _node9 = (((_node7+_node8)+(_V_Z*_V_Z))/_node5);
    float _node10 = (_node6*_node9);
    float _node11 = (_node1*_V_X);
    float _node12 = (_node11+_node11);
    float _node13 = (_node12/_node5);
    float _node14 = (_node0*(args[1]*_node6));
    float _node15 = (((_node3+(_node0*(_node4*((_node10+(_node13*_node13))+_node10))))+_node14)+_node14);
    float _node16 = 0.0;
    float _node17 = (_node13*_node9);
    float _node18 = (_node0*(args[1]*_node13));
    float _node19 = abs(((((_node0*(args[0]*_node12))+(_node0*(_node4*(_node17+_node17))))+_node18)+_node18));
    float _node20 = (_node0*(args[1]*_node9));
    float _node21 = ((((((_node0*(args[0]*_node7))+(_node0*(args[0]*_node8)))+(_node0*(_node4*(_node9*_node9))))+_node20)+_node20)+args[2]);
    float _node22 = (_node10+_node10);
    float _node23 = (_node1*_V_Y);
    float _node24 = (_node23+_node23);
    float _node25 = (_node24/_node5);
    float _node26 = (((_node3+(_node0*(_node4*(_node22+(_node25*_node25)))))+_node14)+_node14);
    float _node27 = (_node9*_node25);
    float _node28 = (_node0*(args[1]*_node25));
    float _node29 = abs(((((_node0*(args[0]*_node24))+(_node0*(_node4*(_node27+_node27))))+_node28)+_node28));
    float _node30 = (_node6*_node6);
    float _node31 = (_node0*(_node4*_node30));
    float _node32 = min(_node31,_node16);
    float _node33 = (_node6*_node13);
    float _node34 = abs((_node0*(_node4*(_node33+_node33))));
    float _node35 = (-_node34);
    float _node36 = (_node0*(_node4*(_node30+_node30)));
    float _node37 = min(_node36,_node16);
    float _node38 = (_node6*_node25);
    float _node39 = abs((_node0*(_node4*(_node38+_node38))));
    float _node40 = (-_node39);
    float _node41 = (_node1*_V_Z);
    float _node42 = ((_node41+_node41)/_node5);
    float _node43 = (_node6*_node42);
    float _node44 = abs((_node0*(_node4*(_node43+_node43))));
    float _node45 = (-_node44);
    float _node46 = (_node13*_node25);
    float _node47 = abs((_node0*(_node4*(_node46+_node46))));
    float _node48 = (_node13*_node42);
    float _node49 = abs((_node0*(_node4*(_node48+_node48))));
    float _node50 = (((_node0*(_node4*(_node22+(_node42*_node42))))+_node14)+_node14);
    float _node51 = (_node9*_node42);
    float _node52 = (_node0*(args[1]*_node42));
    float _node53 = abs((((_node0*(_node4*(_node51+_node51)))+_node52)+_node52));
    float _node54 = (_node25*_node42);
    float _node55 = abs((_node0*(_node4*(_node54+_node54))));
    float _node56 = max(_node31,_node16);
    float _node57 = max(_node36,_node16);
if (!(((((((((((((((((((((((((min(_node15,_node16)+(-_node19))+_node21)+min(_node26,_node16))+(-_node29))+_node32)+_node35)+_node37)+_node40)+_node37)+_node45)+_node35)+(-_node47))+_node35)+(-_node49))+min(_node50,_node16))+(-_node53))+_node32)+_node40)+_node37)+_node45)+_node40)+(-_node55))+_node32)+_node45) <= 0. && 0. <= ((((((((((((((((((((((((max(_node15,_node16)+_node19)+_node21)+max(_node26,_node16))+_node29)+_node56)+_node34)+_node57)+_node39)+_node57)+_node44)+_node34)+_node47)+_node34)+_node49)+max(_node50,_node16))+_node53)+_node56)+_node39)+_node57)+_node44)+_node39)+_node55)+_node56)+_node44))) return false;
    return true;
}

// from http://127.0.0.1:5508/jsgaalop/src/shadersource/shaderlibv1/ @ line 8

in vec3 position;
out vec4 result;

void main(){
    //result=xyzDualSummofsquares(position);
    result=vec4(0.);
    for(int i=0;i<1000;i++)
    //result+=vec4(Summofsquares(position,position.zxy,position.z));
    result+=xyzDualSummofsquares(position+vec3(i)*0.1);
}
