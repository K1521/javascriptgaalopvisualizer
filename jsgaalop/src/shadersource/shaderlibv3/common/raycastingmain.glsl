/*#define TEXTURE_SCALE 64.0
#define COLOR_MODE COLOR_MODE_NORMALS
#define NORMALS_MODE NORMALS_MODE_PIXEL_GRADIENTS
#define LIGHTING_MODE LIGHTING_MODE_OFF
*/

out vec4 color;
//camera params
uniform vec3 cameraPos;
uniform mat3 cameraMatrix;
uniform vec4 incolor;//only rgb are used currently (not alpha)



#ifndef TEXTURE_MODE
#define TEXTURE_MODE TEXTURE_MODE_CHECKER
#endif

#ifndef COLOR_MODE
#define COLOR_MODE COLOR_MODE_INCOLOR
#endif

#ifndef LIGHTING_MODE
#define LIGHTING_MODE LIGHTING_MODE_POINTLIGHT_PHONG
#endif

#ifndef NORMALS_MODE
#define NORMALS_MODE NORMALS_MODE_PIXEL_GRADIENTS
#endif

#ifndef TEXTURE_SCALE
#define TEXTURE_SCALE 4.0
#endif

#if NORMALS_MODE==NORMALS_MODE_FIRST_DERIV
vec3 getNormal(vec3 p,vec3 rayDir){
    vec3 res=xyzDualSummofsquares(p-0.01*rayDir).xyz;
    res*=sign(dot(res,rayDir));
    return -normalize(res);
}
#endif


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


bool checker(vec3 p,float scale){
    return mod(vsum(floor(p * scale)), 2.0)>0.5;
}
bool isolines(vec3 p, float scale, float width) {
    return any(lessThan(fract(p * scale), vec3(width)));
}

in vec2 v_rayDirXY;
//in vec2 v_screen;
void main() {
    vec3 rayOrigin = cameraPos;
    vec3 raydirLocal=normalize(vec3(v_rayDirXY, 1.));
    vec3 rayDir =cameraMatrix*raydirLocal;//cam to view

    vec3 camDir =cameraMatrix*vec3(0,0,1);//cam to view
   



    
    float error,x;
    Raymarch(rayDir,rayOrigin,error,x);
    vec3 p=rayOrigin+x*rayDir;
    x*=raydirLocal.z;//undo normalization. This means x is the z in view space


    //debug
    #ifdef ACTIVATE_DEBUG_COLOR
    if(overrideactive){
        gl_FragDepth=0.;
        color=vec4(overwritecol,1.);
        return;
    }
    #endif
    
    //if x is to big we ignore it
    if(x>1000.){
        gl_FragDepth=1.;
        return;
    }

    //set debth
    gl_FragDepth = x/1000.;





    #if !(COLOR_MODE==COLOR_MODE_NORMALS || LIGHTING_MODE!=LIGHTING_MODE_OFF)
        //in tis case we dont need normals
    #elif NORMALS_MODE==NORMALS_MODE_PIXEL_GRADIENTS
        vec3 normal=transpose(cameraMatrix)*getNormalPixelGradients(p);
    #elif NORMALS_MODE==NORMALS_MODE_FIRST_DERIV
        vec3 normal=transpose(cameraMatrix)*getNormal(p,rayDir);
    #else
      #error "Unknown NORMALS_MODE"
    #endif


    #if COLOR_MODE==COLOR_MODE_INCOLOR
        vec3 col=incolor.rgb;
    #elif COLOR_MODE==COLOR_MODE_NORMALS
        vec3 col=normaltocol(normal);
    #else
        #error "Unknown COLOR_MODE"
    #endif



    #if TEXTURE_MODE == TEXTURE_MODE_CHECKER
        float pattern= checker(p,TEXTURE_SCALE)?1.0:0.5;
    #elif TEXTURE_MODE == TEXTURE_MODE_ISOLINES
        float pattern= isolines(p,TEXTURE_SCALE,0.1)?1.0:0.5;
    #elif TEXTURE_MODE == TEXTURE_MODE_FLAT
        float pattern = 1.0;
    #else
        #error "Unknown TEXTURE_MODE"
    #endif
    col*=pattern;
    //if(pattern<0.9)col.xyz=col.yzx;

    
    #if LIGHTING_MODE==LIGHTING_MODE_OFF
       //nothing
    #elif LIGHTING_MODE==LIGHTING_MODE_POINTLIGHT_PHONG
        //col=applyLighting(col,normal,vec3(1,1,1),-rayDir,0.4,0.3,32.);
        col=applyLighting(col,normal,-rayDir,-camDir,0.4,0.3,32.);
    #else
        #error "Unknown LIGHTING_MODE"
    #endif


    


    /*
    if(any(isnan(col))){
        col=vec3(1.,1.,0.);//nan is yellow
    }
    if(any(isinf(vec3(p))) || abs(p.x)>10E10||abs(p.y)>10E10||abs(p.z)>10E10){
        col=vec3(0.,0.,0.5);//blue
    }*/



    

    color= vec4(col,incolor.a);
}

