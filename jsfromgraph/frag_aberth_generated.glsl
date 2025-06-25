#version 300 es
precision mediump float;





uniform float[?] args;//gets replaced



out vec4 color;


//camera params
uniform vec3 cameraPos;
uniform vec2 windowsize;
uniform mat3 cameraMatrix;

uniform vec4 incolor;//only rgb are used currently (not alpha)


const float FOV=120.;
const float FOVfactor=1./tan(radians(FOV) * 0.5);
const int ABERTH_MAXITER = 40;
const float ABERTH_THRESHOLD = 1e-3;
const float ROOT_ZERRO_THRESHOLD = 1e-1;

//remember to sqare the ROOT_ZERRO_THRESHOLD 

#define POLYDEGREE ?
#define USE_DOUBLEROOTS ?

#if USE_DOUBLEROOTS
    #define NUM_ROOTS (POLYDEGREE / 2)
#else
    #define NUM_ROOTS POLYDEGREE
#endif

const float nan=sqrt(-1.);
const float inf=pow(999.,999.);
const float pi=3.14159265359;
const float goldenangle = (3.0 - sqrt(5.0)) * pi;


vec3 overwritecol=vec3(0.);
bool overrideactive=false;
void debugcolor(vec3 c){//just for debug
    overrideactive=true;
    overwritecol=c;
}

vec3 normaltocol(vec3 normal){
    return normal*vec2(1,-1).xxy/.2+0.5;
}

vec3 getNormal(vec3 p){//normal aproximation in 2x2 pixels
    return normalize( -cross(dFdx(p), dFdy(p)) );
}


float sum(vec3 v) {
    return v.x+v.y+v.z;
}
int sum(ivec3 v) {
    return v.x+v.y+v.z;
}
float vmax(vec3 v) {
    return max(max(v.x, v.y), v.z);
}


#define DualComplex vec4
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



DualComplex DualComplexMul(DualComplex a,DualComplex b){
    return DualComplex(ComplexMul(a.xy,b.xy),ComplexMul(a.xy,b.zw)+ComplexMul(a.zw,b.xy));
}
DualComplex DualComplexSqare(DualComplex a){
    return DualComplex(ComplexSquare(a.xy),2.0*ComplexMul(a.xy,a.zw));
}
DualComplex DualComplexAdd(DualComplex a,float b){
    return DualComplex(a.x+b, a.yzw);
}

//the following gets replaced by generated code
DualComplex DualComplexSummofsquares(vec3 rayDir, vec3 rayOrigin,Complex a){?} //gets replaced
  
void aberth_method(inout Complex[NUM_ROOTS] roots, vec3 rayDir, vec3 rayOrigin) {
    for (int iter = 0; iter < ABERTH_MAXITER; iter++) {
        float max_change = 0.0; // Track the largest change in roots

        for (int k = 0; k < NUM_ROOTS; k++) {
            // Evaluate the polynomial and its derivative at the current root
            DualComplex res=DualComplexSummofsquares(rayDir,rayOrigin,roots[k]);
            Complex a = ComplexDiv(
                res.xy,
                res.zw
            );


        #if USE_DOUBLEROOTS
            Complex rk=roots[k];
            Complex s =ComplexInv(rk-ComplexConjugate(rk)); // Summation term
            for (int j = 0; j < NUM_ROOTS; j++) {
                if (j != k) { // Avoid self-interaction
                    s += ComplexInv(rk - roots[j])+ComplexInv(rk - ComplexConjugate(roots[j]));
                }
            }
        #else
            Complex s = Complex(0.0); // Summation term
            for (int j = 0; j < NUM_ROOTS; j++) {
                if (j != k) {
                    Complex diff = roots[k] - roots[j];
                    s += ComplexInv(diff);
                }
            }
        #endif

            // Compute the correction term
            Complex w = ComplexDiv(a, Complex(1.0, 0.0) - ComplexMul(a, s));
            if(any(isnan(w))||any(isinf(w)))continue;
            roots[k] -= w; // Update the root

            // Track the maximum change in root
            max_change = float(max(max_change, length(w)));
        }
        

        // If the maximum change is smaller than the threshold, stop early
        if (max_change < ABERTH_THRESHOLD) {
            //debugcolor(vec3(float(iter+1)/float(ABERTH_MAXITER)));
            break; // Converged, exit the loop
        }
    }
}

void initial_roots(out Complex[NUM_ROOTS] roots,Complex center) {
    const Complex r1 = Complex(cos(goldenangle), sin(goldenangle)); // Base complex number
    roots[0]=r1;
    for (int i = 1; i < NUM_ROOTS; i++) {
        roots[i] = ComplexMul(r1, roots[i-1]);
    }
    for (int i = 0; i < NUM_ROOTS; i++) {
        roots[i]+=center;
    }
}

void DualComplexRaymarch(vec3 rayDir, vec3 rayOrigin,out float error,out float x) {
    
    Complex[NUM_ROOTS] roots;
    initial_roots(roots,Complex(1.0,0.0));
    //inout Complex[NUM_ROOTS] roots, vec3 rayDir, vec3 rayOrigin
    aberth_method(roots,rayDir,rayOrigin);
    

    error=inf;
    x=inf;
    for(int i = 0; i < NUM_ROOTS; ++i){
        Complex r=roots[i];
        r.y=abs(r.y);

        if(r.x>=0. && r.x<x && r.y<ROOT_ZERRO_THRESHOLD){
            error=r.y;
            x=r.x;
        }
    }

}





void main() {
    vec2 uv=(2.*gl_FragCoord.xy-windowsize)/windowsize.x;
    //vec2 uv=(2.*gl_FragCoord.xy-windowsize)/windowsize*vec2(1.,windowsize.y/windowsize.x);
    vec3 rayOrigin = cameraPos;
    vec3 raydirLocal=normalize(vec3(uv, FOVfactor));
    vec3 rayDir =cameraMatrix*raydirLocal;//cam to view
   



    
    float error,x;
    DualComplexRaymarch(rayDir,rayOrigin,error,x);
    vec3 p=rayOrigin+x*rayDir;
    x*=raydirLocal.z;//undo normalization. This means x is the z in view space

    //circle in middle of screen
    if(length(uv)<0.01 && length(uv)>0.005){
        color=vec4(0.5,1,0.5,1.);
        gl_FragDepth=0.;
        return;
    }

    

    //debug
    if(overrideactive){
        gl_FragDepth=0.;
        color=vec4(overwritecol,1.);return;
        }
    
    //if x is to big we ignore it
    if(x>1000.){
        gl_FragDepth=1.;
        return;
    }

    //set debth
    gl_FragDepth = x/1000.;

    // Checkerboard pattern
    float checker = 0.5 + 0.5 * mod(sum(floor(p * 4.0)), 2.0); // Alternates between 0.5 and 1.0
    
    
    vec3 col=incolor.rgb*checker;



    //col=vec3(1);
    col*=1.;//normaltocol(transpose(cameraMatrix)*getNormal(p));
    //col=getlight(p,rayDir,col);

    /*
    if(any(isnan(col))){
        col=vec3(1.,1.,0.);//nan is yellow
    }
    if(any(isinf(vec3(p))) || abs(p.x)>10E10||abs(p.y)>10E10||abs(p.z)>10E10){
        col=vec3(0.,0.,0.5);//blue
    }*/



    

    color= vec4(col,1.);
}


//cutoff
