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
const int POLYDEGREE=4;
//remember to sqare the ROOT_ZERRO_THRESHOLD 
//#define USE_DOUBLEROOTS 1
//#define USE_VANDER 0
//#define USE_DUALCOMPLEX 1

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


xyzDual xyzDualSummofsquares(vec3 pos) {?}

void DualComplexRaymarch(vec3 rayDir, vec3 rayOrigin,out float error,out float x) {
    

    /*
    x=0.0;
    error=inf;
    float xact=0.;
    for(int i=0;i<60;i++){
        xyzDual res=xyzDualSummofsquares(rayDir*x+rayOrigin);
        error=res.w ;
        
        float delta= abs(res.w / length(res.xyz));
        if(error<1e-3 && delta < 1e-3)return;
        //TODO while error is getting lower refine until below threshold
        x+=delta;
        
    }
    error=inf;
    x=inf;*/

    const float threshold=1e-1;

    x=0.0;
    error=inf;
    float xact=0.0;
    xyzDual res;

    for(int i=0;i<60;i++){
        res=xyzDualSummofsquares(rayDir*xact+rayOrigin);
        float e=abs(res.w);
        if(e<error){
            x=xact;
            error=e;
        }

        if(error<threshold && dot(rayDir,res.xyz)>0.)return;

        float delta= abs(res.w / length(res.xyz));
        xact+=delta;
        
    }
    if(dot(rayDir,res.xyz)>0.)x=inf;



}





void main() {
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



    

    color= vec4(col,incolor.a);
}


//cutoff
