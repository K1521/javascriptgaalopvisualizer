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




float sum(vec3 v) {
    return v.x+v.y+v.z;
}
int sum(ivec3 v) {
    return v.x+v.y+v.z;
}
float vmax(vec3 v) {
    return max(max(v.x, v.y), v.z);
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

//const int numoutputs=?;
void DualF(vec3 rayDir, vec3 rayOrigin,float a,out Dual[numoutputs] result) {?}


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

    const float threshold=1e-2;
    const float minstep=0.00001;

    Dual[numoutputs] result;

    x=0.0;
    error=inf;
    float xact=0.0;
    //Dual res;

    //sphere tracing aproximation

    float delta;
    for(int i=0;i<60;i++){
        DualF(rayDir,rayOrigin,xact,result);
        Dual res=Dual(0.);
        float summofsquares=0.;
        for(int j=0;j<numoutputs;j++){
            Dual outputj=result[j];
            summofsquares+=outputj.x*outputj.x;
            res+=outputj*outputj.y;
            //res+=DualSquare(outputj);
        };

        float e=summofsquares;
        if(e<error){
            x=xact;
            error=e;
        }

        delta= res.x / res.y*0.5;

        if(error<threshold && delta>0.)return;

        xact+=max(abs(delta),minstep);;
        
    }

    /*for(int i=0;i<5;i++){
        DualF(rayDir,rayOrigin,xact,result);
        Dual res=Dual(0.);
        float summofsquares=0.;
        for(int j=0;j<numoutputs;j++){
            Dual outputj=result[j];
            summofsquares+=outputj.x*outputj.x;
            res+=outputj*outputj.y;
            //res+=DualSquare(outputj);
        };

        float e=summofsquares;
        if(e<error){
            x=xact;
            error=e;
        }
        xact-=res.x / res.y;
    }
    if(error<threshold)return;*/
    x=inf;
    //if(delta<0.)x=inf;

    //newton iterations
    /*for(int i=0;i<60;i++){
        res=xyzDualSummofsquares(rayDir*xact+rayOrigin);
        float f_=dot(rayDir,res.xyz);
        float e=abs(res.w);
        if(e<error){
            x=xact;
            error=e;
        }

        if(error<threshold && f_<0.)return;

        float delta= max(abs(e/ f_),minstep)*0.5;

        xact+=delta;
        
    }
    x=inf;
    if(dot(rayDir,res.xyz)>0.)x=inf;*/



    //ganja
    /*float lastd = 1000.0;
    for (int i=0; i<1000; i++) {
    float d = sqrt(xyzDualSummofsquares(rayDir*x+rayOrigin).w);
    float diff = 0.0001*(1.0+2000.0*d)*0.1;
    if (d < threshold){
        x=x + (lastd-threshold)/(lastd-d)*diff;
        return;
    } 
    lastd = d; x += diff;
    }
    x=inf;*/

         	




}

vec3 getNormal(vec3 p,vec3 rayDir){//normal aproximation in 2x2 pixels
    return normalize( -cross(dFdx(p), dFdy(p)) );
    /*vec3 res=xyzDualSummofsquares(p-0.01*rayDir).xyz;
    res*=sign(dot(res,rayDir));
    return -normalize(res);*/

}

vec3 applyLighting(
    vec3 baseColor,
    vec3 normal,
    vec3 lightDir,
    vec3 viewDir,
    float ambientStrength,
    float specularStrength,
    float shininess
) {
    normal = normalize(normal);
    lightDir = normalize(lightDir);
    viewDir = normalize(viewDir);

    // Ambient
    float ambient = ambientStrength;

    // Diffuse (Lambert)
    float diff = max(dot(normal, lightDir), 0.0);

    // Specular (Phong)
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    
    float specular = specularStrength * spec;

    // Final color
    return baseColor * (ambient + diff) + vec3(1.)*specular;
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
    float pattern = 0.5 + 0.5 * mod(sum(floor(p * 4.0)), 2.0); // Alternates between 0.5 and 1.0
    // Isolinien
    //float pattern=0.5 + 0.5 * ((fract(p.x * 4.0)<0.1)||(fract(p.y * 4.0)<0.1)||fract(p.z * 4.0)<0.1?1.:0.);
    //float pattern=1.;
    vec3 col=incolor.rgb*pattern;

    col=applyLighting(col,getNormal(p,rayDir),vec3(1.,1.,1.),-rayDir,0.4,0.3,32.);



    //col=vec3(1);
    col*=1.;//normaltocol(transpose(cameraMatrix)*getNormal(p));


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
