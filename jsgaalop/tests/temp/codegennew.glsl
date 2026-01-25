#version 300 es
precision mediump float;

//#include "../common/utilfrag.glsl"
//#include "../common/util.glsl"

// from http://127.0.0.1:5508/jsgaalop/src/shadersource/shaderlibv1/common/generated_functions.glsl @ line 1


uniform float[3] args;


#define POLYDEGREE 0 //degree of polynomial (for the sum of squares)
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


DualComplex DualComplexSummofsquares(vec3 rayDir, vec3 rayOrigin,Complex a){
Complex _generatednode0 = ComplexAdd(rayOrigin.x,ComplexMul(a,rayDir.x));
Complex _generatednode1 = ComplexSquare(_generatednode0);
Complex _generatednode2 = ComplexAdd(rayOrigin.y,ComplexMul(a,rayDir.y));
Complex _generatednode3 = ComplexSquare(_generatednode2);
Complex _generatednode4 = ComplexAdd(rayOrigin.z,ComplexMul(a,rayDir.z));
Complex _generatednode5 = ComplexMul(ComplexAdd(ComplexAdd(_generatednode1,_generatednode3),ComplexSquare(_generatednode4)),0.5);
Complex _generatednode6 = ComplexMul(args[1],_generatednode5);
Complex _generatednode7 = ComplexSub(args[2],ComplexAdd(ComplexAdd(ComplexAdd(ComplexAdd(ComplexMul(args[0],_generatednode1),ComplexMul(args[0],_generatednode3)),ComplexMul(ComplexSquare(_generatednode5),-4.0)),_generatednode6),_generatednode6));
Complex _generatednode8 = ComplexAdd(_generatednode7,_generatednode7);
Complex _generatednode9 = ComplexMul(_generatednode5,ComplexMul((-_generatednode8),-4.0));
Complex _generatednode10 = ComplexMul(ComplexAdd(ComplexAdd(ComplexAdd(ComplexMul(args[1],(-_generatednode8)),ComplexMul(args[1],(-_generatednode8))),_generatednode9),_generatednode9),0.5);
Complex _generatednode11 = ComplexMul(_generatednode4,_generatednode10);
Complex _generatednode12 = ComplexMul(args[0],(-_generatednode8));
Complex _generatednode13 = ComplexMul(_generatednode2,ComplexAdd(_generatednode10,_generatednode12));
Complex _generatednode14 = ComplexMul(_generatednode0,_generatednode10);
Complex _generatednode15 = ComplexMul(_generatednode0,_generatednode12);
return vec4(ComplexSquare(_generatednode7),ComplexAdd(ComplexAdd(ComplexMul(rayDir.z,ComplexAdd(_generatednode11,_generatednode11)),ComplexMul(rayDir.y,ComplexAdd(_generatednode13,_generatednode13))),ComplexMul(rayDir.x,ComplexAdd(ComplexAdd(ComplexAdd(_generatednode14,_generatednode14),_generatednode15),_generatednode15))));
} //gets replaced

float Summofsquares(vec3 rayDir, vec3 rayOrigin,float a){
float _generatednode0 = (rayOrigin.x+(a*rayDir.x));
float _generatednode1 = (_generatednode0*_generatednode0);
float _generatednode2 = (rayOrigin.y+(a*rayDir.y));
float _generatednode3 = (_generatednode2*_generatednode2);
float _generatednode4 = (rayOrigin.z+(a*rayDir.z));
float _generatednode5 = (((_generatednode1+_generatednode3)+(_generatednode4*_generatednode4))*0.5);
float _generatednode6 = (args[1]*_generatednode5);
float _generatednode7 = (args[2]-(((((args[0]*_generatednode1)+(args[0]*_generatednode3))+((_generatednode5*_generatednode5)*-4.0))+_generatednode6)+_generatednode6));
return (_generatednode7*_generatednode7);
}




xyzDual xyzDualSummofsquares(vec3 pos) {
float _generatednode0 = (pos.x*pos.x);
float _generatednode1 = (pos.y*pos.y);
float _generatednode2 = (((_generatednode0+_generatednode1)+(pos.z*pos.z))*0.5);
float _generatednode3 = (args[1]*_generatednode2);
float _generatednode4 = (args[2]-(((((args[0]*_generatednode0)+(args[0]*_generatednode1))+((_generatednode2*_generatednode2)*-4.0))+_generatednode3)+_generatednode3));
float _generatednode5 = (_generatednode4+_generatednode4);
float _generatednode6 = (_generatednode2*((-_generatednode5)*-4.0));
float _generatednode7 = (((((args[1]*(-_generatednode5))+(args[1]*(-_generatednode5)))+_generatednode6)+_generatednode6)*0.5);
float _generatednode8 = (pos.x*_generatednode7);
float _generatednode9 = (args[0]*(-_generatednode5));
float _generatednode10 = (pos.x*_generatednode9);
float _generatednode11 = (pos.y*(_generatednode7+_generatednode9));
float _generatednode12 = (pos.z*_generatednode7);
return vec4((((_generatednode8+_generatednode8)+_generatednode10)+_generatednode10),(_generatednode11+_generatednode11),(_generatednode12+_generatednode12),(_generatednode4*_generatednode4));
}

xyzDual xyzDualSummofsquares(vec3 pos) {
float _generatednode0 = (pos.x*pos.x);
float _generatednode1 = (pos.y*pos.y);
float _generatednode2 = (((_generatednode0+_generatednode1)+(pos.z*pos.z))*0.5);
float _generatednode3 = (args[1]*_generatednode2);
float _generatednode4 = (args[2]-(((((args[0]*_generatednode0)+(args[0]*_generatednode1))+((_generatednode2*_generatednode2)*-4.0))+_generatednode3)+_generatednode3));
float _generatednode5 = (_generatednode4+_generatednode4);
float _generatednode6 = (_generatednode2*((-_generatednode5)*-4.0));
float _generatednode7 = (((((args[1]*(-_generatednode5))+(args[1]*(-_generatednode5)))+_generatednode6)+_generatednode6)*0.5);
float _generatednode8 = (pos.x*_generatednode7);
float _generatednode9 = (args[0]*(-_generatednode5));
float _generatednode10 = (pos.x*_generatednode9);
float _generatednode11 = (pos.y*(_generatednode7+_generatednode9));
float _generatednode12 = (pos.z*_generatednode7);
return vec4((((_generatednode8+_generatednode8)+_generatednode10)+_generatednode10),(_generatednode11+_generatednode11),(_generatednode12+_generatednode12),(_generatednode4*_generatednode4));
}

/*void DualF(vec3 rayDir, vec3 rayOrigin,float a,out Dual[numoutputs] result) {
float _generatednode0 = (rayOrigin.x+(a*rayDir.x));
float _generatednode1 = (_generatednode0*_generatednode0);
float _generatednode2 = (rayOrigin.y+(a*rayDir.y));
float _generatednode3 = (_generatednode2*_generatednode2);
float _generatednode4 = (rayOrigin.z+(a*rayDir.z));
float _generatednode5 = (((_generatednode1+_generatednode3)+(_generatednode4*_generatednode4))*0.5);
float _generatednode6 = (args[1]*_generatednode5);
float _generatednode7 = (rayDir.x*_generatednode0);
float _generatednode8 = (_generatednode7+_generatednode7);
float _generatednode9 = (rayDir.y*_generatednode2);
float _generatednode10 = (_generatednode9+_generatednode9);
float _generatednode11 = (rayDir.z*_generatednode4);
float _generatednode12 = (((_generatednode10+_generatednode8)+(_generatednode11+_generatednode11))*0.5);
float _generatednode13 = (_generatednode12*_generatednode5);
float _generatednode14 = (_generatednode12*args[1]);
result[0]=vec2((args[2]-(((((args[0]*_generatednode1)+(args[0]*_generatednode3))+((_generatednode5*_generatednode5)*-4.0))+_generatednode6)+_generatednode6)),(-(((((_generatednode8*args[0])+(_generatednode10*args[0]))+((_generatednode13+_generatednode13)*-4.0))+_generatednode14)+_generatednode14)));
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
Intervall _generatednode0 = IntervallSquare(_V_X);
Intervall _generatednode1 = IntervallSquare(_V_Y);
Intervall _generatednode2 = IntervallMul(((_generatednode0+_generatednode1)+IntervallSquare(_V_Z)),0.5);
Intervall _generatednode3 = IntervallMul(args[1],_generatednode2);
Intervall _generatednode4 = IntervallSub(args[2],((((IntervallMul(args[0],_generatednode0)+IntervallMul(args[0],_generatednode1))+IntervallMul(IntervallSquare(_generatednode2),-4.0))+_generatednode3)+_generatednode3));
return IntervallSquare(_generatednode4);
}

bool evaluatevoxelIntervall3d(Intervall x, Intervall y, Intervall z) {
    float _V_X=(x.x+x.y)/2.;
    float _V_Y=(y.x+y.y)/2.;
    float _V_Z=(z.x+z.y)/2.;
    float delta=(x.y-x.x)/2.;

float _generatednode0 = (delta*delta);
float _generatednode1 = (args[0]*_generatednode0);
float _generatednode2 = (_generatednode0*0.5);
float _generatednode3 = (_V_X*_V_X);
float _generatednode4 = (_V_Y*_V_Y);
float _generatednode5 = (((_generatednode3+_generatednode4)+(_V_Z*_V_Z))*0.5);
float _generatednode6 = (_generatednode2*_generatednode5);
float _generatednode7 = (delta*_V_X);
float _generatednode8 = (_generatednode7+_generatednode7);
float _generatednode9 = (_generatednode8*0.5);
float _generatednode10 = (args[1]*_generatednode2);
float _generatednode11 = (-(((_generatednode1+(((_generatednode6+(_generatednode9*_generatednode9))+_generatednode6)*-4.0))+_generatednode10)+_generatednode10));
float _generatednode12 = (_generatednode9*_generatednode5);
float _generatednode13 = (args[1]*_generatednode9);
float _generatednode14 = abs((-((((args[0]*_generatednode8)+((_generatednode12+_generatednode12)*-4.0))+_generatednode13)+_generatednode13)));
float _generatednode15 = (args[1]*_generatednode5);
float _generatednode16 = (args[2]-(((((args[0]*_generatednode3)+(args[0]*_generatednode4))+((_generatednode5*_generatednode5)*-4.0))+_generatednode15)+_generatednode15));
float _generatednode17 = (_generatednode6+_generatednode6);
float _generatednode18 = (delta*_V_Y);
float _generatednode19 = (_generatednode18+_generatednode18);
float _generatednode20 = (_generatednode19*0.5);
float _generatednode21 = (-(((_generatednode1+((_generatednode17+(_generatednode20*_generatednode20))*-4.0))+_generatednode10)+_generatednode10));
float _generatednode22 = (_generatednode5*_generatednode20);
float _generatednode23 = (args[1]*_generatednode20);
float _generatednode24 = abs((-((((args[0]*_generatednode19)+((_generatednode22+_generatednode22)*-4.0))+_generatednode23)+_generatednode23)));
float _generatednode25 = (_generatednode2*_generatednode2);
float _generatednode26 = (-(_generatednode25*-4.0));
float _generatednode27 = min(_generatednode26,0.0);
float _generatednode28 = (_generatednode2*_generatednode9);
float _generatednode29 = abs((-((_generatednode28+_generatednode28)*-4.0)));
float _generatednode30 = (-((_generatednode25+_generatednode25)*-4.0));
float _generatednode31 = min(_generatednode30,0.0);
float _generatednode32 = (_generatednode2*_generatednode20);
float _generatednode33 = abs((-((_generatednode32+_generatednode32)*-4.0)));
float _generatednode34 = (delta*_V_Z);
float _generatednode35 = ((_generatednode34+_generatednode34)*0.5);
float _generatednode36 = (_generatednode2*_generatednode35);
float _generatednode37 = abs((-((_generatednode36+_generatednode36)*-4.0)));
float _generatednode38 = (_generatednode9*_generatednode20);
float _generatednode39 = abs((-((_generatednode38+_generatednode38)*-4.0)));
float _generatednode40 = (_generatednode9*_generatednode35);
float _generatednode41 = abs((-((_generatednode40+_generatednode40)*-4.0)));
float _generatednode42 = (-((((_generatednode17+(_generatednode35*_generatednode35))*-4.0)+_generatednode10)+_generatednode10));
float _generatednode43 = (_generatednode5*_generatednode35);
float _generatednode44 = (args[1]*_generatednode35);
float _generatednode45 = abs((-((((_generatednode43+_generatednode43)*-4.0)+_generatednode44)+_generatednode44)));
float _generatednode46 = (_generatednode20*_generatednode35);
float _generatednode47 = abs((-((_generatednode46+_generatednode46)*-4.0)));
float _generatednode48 = max(_generatednode26,0.0);
float _generatednode49 = max(_generatednode30,0.0);
if (!((min(_generatednode11,0.0)+_generatednode14+_generatednode16+min(_generatednode21,0.0)+_generatednode24+_generatednode27+_generatednode29+_generatednode31+_generatednode33+_generatednode31+_generatednode37+_generatednode29+_generatednode39+_generatednode29+_generatednode41+min(_generatednode42,0.0)+_generatednode45+_generatednode27+_generatednode33+_generatednode31+_generatednode37+_generatednode33+_generatednode47+_generatednode27+_generatednode37) <= 0. && 0. <= ((max(_generatednode11,0.0)+_generatednode16+max(_generatednode21,0.0)+_generatednode48+_generatednode49+_generatednode49+max(_generatednode42,0.0)+_generatednode48+_generatednode49+_generatednode48)-(_generatednode14+_generatednode24+_generatednode29+_generatednode33+_generatednode37+_generatednode29+_generatednode39+_generatednode29+_generatednode41+_generatednode45+_generatednode33+_generatednode37+_generatednode33+_generatednode47+_generatednode37)))) return false;
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
