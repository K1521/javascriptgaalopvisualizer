#version 300 es
precision mediump float;




const int basislength=14;
uniform int numrows;




uniform float[basislength*basislength] M;
//uniform float[?] args;//gets replaced



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



const int MAX_NUM_ROOTS=4;

int numroots=MAX_NUM_ROOTS;//can change after compile time
uniform int POLYDEGREE;//degree of sum of squares
#define USE_DOUBLEROOTS (numroots!=1)

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

DualComplex DualComplexSummofsquares(vec3 rayDir, vec3 rayOrigin,Complex a){
    DualComplex x=DualComplex(ComplexMul(Complex(rayDir.x,0.),a)+Complex(rayOrigin.x,0.),rayDir.x,0.);
    DualComplex y=DualComplex(ComplexMul(Complex(rayDir.y,0.),a)+Complex(rayOrigin.y,0.),rayDir.y,0.);
    DualComplex z=DualComplex(ComplexMul(Complex(rayDir.z,0.),a)+Complex(rayOrigin.z,0.),rayDir.z,0.);
    

    DualComplex xx = DualComplexSqare(x);
    DualComplex yy = DualComplexSqare(y);
    DualComplex zz = DualComplexSqare(z);

    DualComplex r = xx+yy+zz;

    DualComplex xy = DualComplexMul(x, y);
    DualComplex xz = DualComplexMul(x, z);
    DualComplex xr = DualComplexMul(x, r);

    DualComplex yz = DualComplexMul(y, z);
    DualComplex yr = DualComplexMul(y, r);

    DualComplex zr = DualComplexMul(z, r);

    DualComplex rr = DualComplexSqare(r);

    // Result basis array
    DualComplex basis[14];
    basis[0]  = DualComplex(1.0, 0.0, 0.0, 0.0); // constant term
    basis[1]  = x;
    basis[2]  = y;
    basis[3]  = z;
    basis[4]  = xx;
    basis[5]  = xy;
    basis[6]  = xz;
    basis[7]  = xr;
    basis[8]  = yy;
    basis[9]  = yz;
    basis[10] = yr;
    basis[11] = zz;
    basis[12] = zr;
    basis[13] = rr;

    DualComplex sum=DualComplex(0.);
    for(int i=0;i<numrows;i++){
        int index=basislength*i;
        DualComplex term = vec4(0.0);
        
        // Accumulate the weighted sum
        for (int j = 0; j < 15; j++) {
            term += M[index + j] * basis[j];
        }
        
        // Square and add to sum
        if(!USE_DOUBLEROOTS)return term;
        sum += DualComplexSqare(term);
    }
    return (sum);


    //[x**2, x*y, x*z, rm*x, rp*x, y**2, y*z, rm*y, rp*y, z**2, rm*z, rp*z, rm**2, rm*rp, rp**2]

}

void aberth_method(inout Complex[MAX_NUM_ROOTS] roots, vec3 rayDir, vec3 rayOrigin) {
    for (int iter = 0; iter < ABERTH_MAXITER; iter++) {
        float max_change = 0.0; // Track the largest change in roots

        for (int k = 0; k < numroots; k++) {
            // Evaluate the polynomial and its derivative at the current root
            DualComplex res=DualComplexSummofsquares(rayDir,rayOrigin,roots[k]);
            Complex a = ComplexDiv(
                res.xy,
                res.zw
            );

            Complex s;
            if(USE_DOUBLEROOTS){
                Complex rk=roots[k];
                s =ComplexInv(rk-ComplexConjugate(rk)); // Summation term
                for (int j = 0; j < numroots; j++) {
                    if (j != k) { // Avoid self-interaction
                        s += ComplexInv(rk - roots[j])+ComplexInv(rk - ComplexConjugate(roots[j]));
                    }
                }
            }else{    
            
		
                s = Complex(0.0); // Summation term
                for (int j = 0; j < numroots; j++) {
                    if (j != k) {
                        Complex diff = roots[k] - roots[j];
                        s += ComplexInv(diff);
                    }
                }
            }
		 


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

void initial_roots(out Complex[MAX_NUM_ROOTS] roots,Complex center) {
    const Complex r1 = Complex(cos(goldenangle), sin(goldenangle)); // Base complex number
    roots[0]=r1;
    for (int i = 1; i < numroots; i++) {
        roots[i] = ComplexMul(r1, roots[i-1]);
    }
    for (int i = 0; i < numroots; i++) {
        roots[i]+=center;
    }
}

void DualComplexRaymarch(vec3 rayDir, vec3 rayOrigin,out float error,out float x) {
    
    Complex[MAX_NUM_ROOTS] roots;
    initial_roots(roots,Complex(1.0,0.0));
    //inout Complex[MAX_NUM_ROOTS] roots, vec3 rayDir, vec3 rayOrigin
    aberth_method(roots,rayDir,rayOrigin);
    

    error=inf;
    x=inf;
    for(int i = 0; i < numroots; ++i){
        Complex r=roots[i];
        r.y=abs(r.y);

        if(r.x>=0. && r.x<x && r.y<ROOT_ZERRO_THRESHOLD){
            error=r.y;
            x=r.x;
        }
    }

}





void main() {
    //USE_DOUBLEROOTS=numrows!=1;
    numroots=POLYDEGREE;
        



    vec2 uv=(2.*gl_FragCoord.xy-windowsize)/windowsize.x;
    //vec2 uv=(2.*gl_FragCoord.xy-windowsize)/windowsize*vec2(1.,windowsize.y/windowsize.x);
    vec3 rayOrigin = cameraPos;
    vec3 rayDir =cameraMatrix*normalize(vec3(uv, FOVfactor));//cam to view
   





    
    float error,x;
    DualComplexRaymarch(rayDir,rayOrigin,error,x);
    vec3 p=rayOrigin+x*rayDir;

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
