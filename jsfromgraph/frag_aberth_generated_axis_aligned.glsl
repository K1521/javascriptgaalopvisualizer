#version 300 es
precision mediump float;





uniform float[?] args;//gets replaced



layout(location = 0) out vec4 root0;
layout(location = 1) out vec4 root1;
layout(location = 2) out vec4 root2;
layout(location = 3) out vec4 root3;

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
const int POLYDEGREE=4;
//remember to sqare the ROOT_ZERRO_THRESHOLD 
#define USE_DOUBLEROOTS 1


const float nan=sqrt(-1.);
const float inf=pow(999.,999.);
const float pi=3.14159265359;
const float goldenangle = (3.0 - sqrt(5.0)) * pi;



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
  
void aberth_method(inout Complex[POLYDEGREE] roots, vec3 rayDir, vec3 rayOrigin) {
    for (int iter = 0; iter < ABERTH_MAXITER; iter++) {
        float max_change = 0.0; // Track the largest change in roots

        for (int k = 0; k < POLYDEGREE; k++) {
            // Evaluate the polynomial and its derivative at the current root
            DualComplex res=DualComplexSummofsquares(rayDir,rayOrigin,roots[k]);
            Complex a = ComplexDiv(
                res.xy,
                res.zw
            );


        #if USE_DOUBLEROOTS
            Complex rk=roots[k];
            Complex s =ComplexInv(rk-ComplexConjugate(rk)); // Summation term
            for (int j = 0; j < POLYDEGREE; j++) {
                if (j != k) { // Avoid self-interaction
                    s += ComplexInv(rk - roots[j])+ComplexInv(rk - ComplexConjugate(roots[j]));
                }
            }
        #else
            Complex s = Complex(0.0); // Summation term
            for (int j = 0; j < POLYDEGREE; j++) {
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

void initial_roots(out Complex[POLYDEGREE] roots,Complex center) {
    const Complex r1 = Complex(cos(goldenangle), sin(goldenangle)); // Base complex number
    roots[0]=r1;
    for (int i = 1; i < POLYDEGREE; i++) {
        roots[i] = ComplexMul(r1, roots[i-1]);
    }
    for (int i = 0; i < POLYDEGREE; i++) {
        roots[i]+=center;
    }
}



void main() {
    vec2 uv = (2.0 * gl_FragCoord.xy - windowsize) / windowsize;

    // Initial orthographic ray
    vec3 rayOrigin = vec3(uv, 0.0);
    vec3 rayDir    = vec3(0.0, 0.0, 1.0);

    // Transform ray to camera space
    rayOrigin = cameraMatrix * rayOrigin;
    rayDir    = cameraMatrix * rayDir;

    // Compute roots along the ray
    Complex[POLYDEGREE] Roots;
    initial_roots(Roots, Complex(1.0, 0.0));
    aberth_method(Roots, rayDir, rayOrigin);

    // Pad output with inf
    const int MAX_ROOTS = 8;
    Complex[MAX_ROOTS] paddedRoots;
    for (int i = 0; i < POLYDEGREE; ++i) {
        Complex r=Roots[i];
        paddedRoots[i] = Complex(r.x,abs(r.y));
    }
    for (int i = POLYDEGREE; i < MAX_ROOTS; ++i) {
        paddedRoots[i] = Complex(inf, inf);
    }

    // Output two roots per texture (assuming out vec4 root0, root1, root2, root3)
    root0 = vec4(paddedRoots[0],
                 paddedRoots[1]);
    root1 = vec4(paddedRoots[2],
                 paddedRoots[3]);
    root2 = vec4(paddedRoots[4],
                 paddedRoots[5]);
    root3 = vec4(paddedRoots[6],
                 paddedRoots[7]);
    
    //root0 = vec4(0.4,0.5,0.6,0.7);
}


//cutoff
