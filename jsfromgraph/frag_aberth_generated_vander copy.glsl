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
const float ABERTH_THRESHOLD = 1e-5;
const float ROOT_ZERRO_THRESHOLD = 1e-2;
const int POLYDEGREE=4;
//remember to sqare the ROOT_ZERRO_THRESHOLD 
#define USE_DOUBLEROOTS 1
#define USE_VANDER 0
#define USE_DUALCOMPLEX 1

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


#if USE_DUALCOMPLEX
//the following gets replaced by generated code
DualComplex DualComplexSummofsquares(vec3 rayDir, vec3 rayOrigin,Complex a){?} //gets replaced
#endif


#if USE_VANDER
//the following gets replaced by generated code
float Summofsquares(vec3 rayDir, vec3 rayOrigin,float a){?}
/*
import numpy as np

# Create Vandermonde matrix for x = [0, 1, ..., 8]
x = np.arange(9, dtype=np.float64)
V = np.vander(x, increasing=True)

# Compute inverse with high precision
V_inv = np.linalg.inv(V)
rows = V_inv.reshape((9, 9))
glsl_rows = [", ".join(f"{val:.15f}" for val in row) for row in rows]
glsl_block_str = ",\n    ".join(glsl_rows)

# Final GLSL code block
glsl_block_code = f"const float inverseVander9[81] = float[81](\n    {glsl_block_str}\n);"*/

/*
const float inverseVander9[81] = float[81](
    1.000000000000000000000000000000, 0.000000000000000000000000000000, 0.000000000000000000000000000000, 0.000000000000000000000000000000, 0.000000000000000000000000000000, 0.000000000000000000000000000000, 0.000000000000000000000000000000, 0.000000000000000000000000000000, 0.000000000000000000000000000000,
    -2.717857142857994290352507960051, 8.000000000006934897101018577814, -14.000000000020463630789890885353, 18.666666666713808808708563446999, -17.500000000051841198001056909561, 11.200000000041200109990313649178, -4.666666666686296593979932367802, 1.142857142862652608528151176870, -0.125000000000671462885293294676,
    2.929662698414919219658258953132, -13.742857142874143505650863517076, 31.050000000057082161220023408532, -44.511111111221964620199287310243, 43.187500000133127286972012370825, -28.200000000101681507658213376999, 11.905555555604706796657410450280, -2.942857142870536790724145248532, 0.324107142858777397265157560469,
    -1.668750000002168443202776870748, 9.694444444461026932913227938116, -25.490277777833583172650833148509, 39.850000000107129949356021825224, -40.472222222351113884997175773606, 27.172222222321011031453963369131, -11.687500000047595705154890310951, 2.927777777790848023897751772893, -0.325694444446027242534569268173,
    0.556770833334405246262122091139, -3.655555555563764436044493777445, 10.617361111138668761100234405603, -17.866666666719556388898126897402, 19.085069444507965386037540156394, -13.255555555604328077379250316881, 5.839583333356816119419363531051, -1.488888888895347983876149555726, 0.167881944445224334794275478089,
    -0.112500000000294503310627192150, 0.798611111113366800573487580550, -2.486111111118677552411782016861, 4.437500000014515499913159146672, -4.972222222239641276075872156071, 3.584722222235604327522651146865, -1.625000000006439071498220982903, 0.423611111112882243734389930978, -0.048611111111324663280885971517,
    0.013541666666712087394031094334, -0.101388888889236666868143288411, 0.331944444445610553628966954420, -0.620833333335569226285599597759, 0.725694444447126274511106203136, -0.543055555557615865502896213002, 0.254166666667657359379717263437, -0.068055555555827984548500353412, 0.007986111111143929727762547088,
    -0.000892857142860812419936367146, 0.006944444444472530966749879155, -0.023611111111205246998467899289, 0.045833333333513748275578336688, -0.055555555555771858611269209405, 0.043055555555721679306113713892, -0.020833333333413167620662420632, 0.005753968253990200329428539305, -0.000694444444447086563221294142,
    0.000024801587301707915669346863, -0.000198412698413621231205428153, 0.000694444444447536290282441129, -0.001388888888894811938362616743, 0.001736111111118209286360847265, -0.001388888888894338142013240578, 0.000694444444447061951831978721, -0.000198412698413417672247543999, 0.000024801587301673848004208295
);*/

const float inverseVander9[81] = float[81](
    1.000000000000000000000000000000, 0.000000000000000000000000000000, 0.000000000000000000000000000000, 0.000000000000000000000000000000, 0.000000000000000000000000000000, 0.000000000000000000000000000000, 0.000000000000000000000000000000, 0.000000000000000000000000000000, 0.000000000000000000000000000000,
    -1.358928571428997145176253980026, 4.000000000003467448550509288907, -7.000000000010231815394945442677, 9.333333333356904404354281723499, -8.750000000025920599000528454781, 5.600000000020600054995156824589, -2.333333333343148296989966183901, 0.571428571431326304264075588435, -0.062500000000335731442646647338,
    0.732415674603729804914564738283, -3.435714285718535876412715879269, 7.762500000014270540305005852133, -11.127777777805491155049821827561, 10.796875000033281821743003092706, -7.050000000025420376914553344250, 2.976388888901176699164352612570, -0.735714285717634197681036312133, 0.081026785714694349316289390117,
    -0.208593750000271055400347108844, 1.211805555557628366614153492264, -3.186284722229197896581354143564, 4.981250000013391243669502728153, -5.059027777793889235624646971701, 3.396527777790126378931745421141, -1.460937500005949463144361288869, 0.365972222223856002987218971612, -0.040711805555753405316821158522,
    0.034798177083400327891382630696, -0.228472222222735277252780861090, 0.663585069446166797568764650350, -1.116666666669972274306132931088, 1.192816840281747836627346259775, -0.828472222225270504836203144805, 0.364973958334801007463710220691, -0.093055555555959248992259347233, 0.010492621527826520924642217381,
    -0.003515625000009203228457099755, 0.024956597222292712517921486892, -0.077690972222458673512868188027, 0.138671875000453609372286223334, -0.155381944444988789877371004877, 0.112022569444862635235082848340, -0.050781250000201220984319405716, 0.013237847222277570116699685343, -0.001519097222228895727527686610,
    0.000211588541667376365531735849, -0.001584201388894322919814738881, 0.005186631944462664900452608663, -0.009700520833368269160712493715, 0.011338975694486348039236034424, -0.008485243055587747898482753328, 0.003971354166682146240308082241, -0.001063368055559812258570318022, 0.000124782986111623901996289798,
    -0.000006975446428600097030752868, 0.000054253472222441648177733431, -0.000184461805556290992175530463, 0.000358072916668076158402955755, -0.000434027777779467645400540698, 0.000336371527779075619579013390, -0.000162760416667290372036425161, 0.000044952876984298440073660463, -0.000005425347222242863775166360,
    0.000000096881200397296545583386, -0.000000775049603178207934396204, 0.000002712673611123188633915786, -0.000005425347222245359134228972, 0.000006781684027805505024847060, -0.000005425347222243508367239221, 0.000002712673611121335749343667, -0.000000775049603177412782216969, 0.000000096881200397163468766439
);
void gencoeffsvander(vec3 rayDir, vec3 rayOrigin,out float[9] coeffs){
    //8th degree vander
    float[9] samplesy;
    for(int i=0;i<9;i++){
        samplesy[i]=Summofsquares(rayDir,rayOrigin,float(i*2));
    }
    for (int row = 0; row < 9; row++) {
        float sum = 0.0;
        for (int col = 0; col < 9; col++) {
            sum += inverseVander9[row * 9 + col] * samplesy[col];
        }
        coeffs[row] = sum;
    }
}


DualComplex DualComplexEvaluatePolynomial(Complex z, float coeffs[9]) {
    DualComplex result = DualComplex(0.0); // value.xy = 0, derivative.zw = 0
    DualComplex z_pow = DualComplex(1.0, 0.0, 0.0, 0.0);

    for (int i = 0; i < 9; i++) {
        result += coeffs[i] * z_pow;
        z_pow = DualComplexMul(z_pow, DualComplex(z, Complex(1.0, 0.0)));
    }

    return result;
}

void aberth_method(inout Complex[POLYDEGREE] roots, vec3 rayDir, vec3 rayOrigin, float coeffs[9]) {
    //bool[POLYDEGREE] done;
    //for (int k = 0; k < POLYDEGREE; k++) done[k]=false;
    for (int iter = 0; iter < ABERTH_MAXITER; iter++) {
        

        float max_change = 0.0; // Track the largest change in roots

        for (int k = 0; k < POLYDEGREE; k++) {

            //while(k < POLYDEGREE && done[k])k++;
            //if(k >= POLYDEGREE)continue;

            // Evaluate the polynomial and its derivative at the current root
            DualComplex res=DualComplexEvaluatePolynomial(roots[k],coeffs);
            Complex a = ComplexDiv(
                res.xy,
                res.zw
            );


        #if USE_DOUBLEROOTS
            Complex rk=roots[k];
            Complex s = ComplexInv(rk-ComplexConjugate(rk)); // Summation term
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
            if(any(isnan(w))||any(isinf(w))){
                //done[k]=true;
                continue;}
            roots[k] -= w; // Update the root

            // Track the maximum change in root
            max_change = float(max(max_change, dot(w,w)));
        }
        

        // If the maximum change is smaller than the threshold, stop early
        if (max_change < ABERTH_THRESHOLD*ABERTH_THRESHOLD) {
            //debugcolor(vec3(float(iter+1)/float(ABERTH_MAXITER)));
            break; // Converged, exit the loop
        }
    }
}
#endif

#if USE_DUALCOMPLEX
/*
void aberth_method(inout Complex[POLYDEGREE] roots, vec3 rayDir, vec3 rayOrigin) {
    bool[POLYDEGREE] done;
    for (int k = 0; k < POLYDEGREE; k++) done[k]=false;

    for (int iter = 0; iter < ABERTH_MAXITER; iter++) {
        float max_change = 0.0; // Track the largest change in roots

        for (int k = 0; k < POLYDEGREE; k++) {
            while(k < POLYDEGREE && done[k])k++;
            if(!(k < POLYDEGREE))continue;

            // Evaluate the polynomial and its derivative at the current root
            DualComplex res=DualComplexSummofsquares(rayDir,rayOrigin,roots[k]);
            Complex a = ComplexDiv(
                res.xy,
                res.zw
            );


        #if USE_DOUBLEROOTS
            Complex rk=roots[k];
            Complex s = ComplexInv(rk-ComplexConjugate(rk)); // Summation term
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
            if(any(isnan(w))||any(isinf(w))){
                //debugcolor(vec3(1.,1.,0.));
                done[k]=true;
                continue;
            }
            roots[k] -= w; // Update the root

            // Track the maximum change in root
            max_change = float(max(max_change, dot(w,w)));//dot(w,w) instead of length(w)
        }
        

        // If the maximum change is smaller than the threshold, stop early
        if (max_change < ABERTH_THRESHOLD*ABERTH_THRESHOLD) {
            //debugcolor(vec3(float(iter+1)/float(ABERTH_MAXITER)));
            break; // Converged, exit the loop
        }
    }
}*/

void aberth_method(inout Complex[POLYDEGREE] roots, vec3 rayDir, vec3 rayOrigin) {
    int done=0;


    for (int iter = 0; iter < ABERTH_MAXITER; iter++) {

        for (int k = done; k < POLYDEGREE; k++) {
            
            

            // Evaluate the polynomial and its derivative at the current root
            DualComplex res=DualComplexSummofsquares(rayDir,rayOrigin,roots[k]);
            Complex a = ComplexDiv(
                res.xy,
                res.zw
            );


        #if USE_DOUBLEROOTS
            Complex rk=roots[k];
            Complex s = ComplexInv(rk-ComplexConjugate(rk)); // Summation term
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
            
            bool wisnan=any(isnan(w))||any(isinf(w));
            bool converged=dot(w,w) < ABERTH_THRESHOLD*ABERTH_THRESHOLD;
            
            if(wisnan || converged){
                //debugcolor(vec3(1.,1.,0.));

                if(!wisnan)roots[k] -= w; // Update the root


                //swap roots[k],roots[done]
                Complex temp=roots[done];
                roots[done]=roots[k];
                roots[k]=temp;
                
                done++;
                continue;
            }
            roots[k] -= w; // Update the root

           
        }
        

    }
}
#endif
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

void DualComplexRaymarch(vec3 rayDir, vec3 rayOrigin,out float error,out float x) {
    
    Complex[POLYDEGREE] roots;
    initial_roots(roots,Complex(1.0,0.0));
    //inout Complex[POLYDEGREE] roots, vec3 rayDir, vec3 rayOrigin


#if USE_VANDER
    float[9] coeffs;
    gencoeffsvander(rayDir,rayOrigin,coeffs);
    aberth_method(roots,rayDir,rayOrigin,coeffs);
#endif

#if USE_DUALCOMPLEX
    aberth_method(roots,rayDir,rayOrigin);
#endif

    error=inf;
    x=inf;
    for(int i = 0; i < POLYDEGREE; ++i){
        Complex r=roots[i];
        r.y=abs(r.y);

        if(r.x>=0. && r.x<x && r.y<ROOT_ZERRO_THRESHOLD){
            error=r.y;
            x=r.x;
        }
    }

}



uniform vec2 focal;
void main() {
    //vec2 uv=(2.*gl_FragCoord.xy-windowsize)/windowsize.x;
    //vec2 uv=(2.*gl_FragCoord.xy-windowsize)/windowsize*vec2(1.,windowsize.y/windowsize.x);
    //vec3 rayOrigin = cameraPos;
    //vec3 raydirLocal=normalize(vec3(uv, FOVfactor));
    //vec3 rayDir =cameraMatrix*raydirLocal;//cam to view



    vec2 uv=(2.*gl_FragCoord.xy-windowsize)/(windowsize*focal);
    vec3 rayOrigin = cameraPos;
    vec3 raydirLocal=normalize(vec3(uv, 1.));
    vec3 rayDir =cameraMatrix*raydirLocal;//cam to view
   



    
    float error,x;
    DualComplexRaymarch(rayDir,rayOrigin,error,x);
    vec3 p=rayOrigin+x*rayDir;
    x*=raydirLocal.z;//undo normalization. This means x is the z in view space


    
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



    

    color= vec4(col,incolor.a);
}


//cutoff
