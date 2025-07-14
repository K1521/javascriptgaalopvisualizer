async function load(url) {
  const response = await fetch(url);
  if (!response.ok) {
    //console.error('Failed to load:', url);
    throw Error('Failed to load:', url);
    return '';
  }
  return await response.text();
}
/*
const shaderpaths = {
  fragTemplateAberth: "frag_aberth_generated.glsl",//raycasting using aberth
  fragTemplateDualGauss: "frag_generated_Dual.glsl",//raycasting using Gauss
  fragTemplateAxisAligned: "frag_aberth_generated_axis_aligned.glsl",//orthographic , outputs roots for each ray 
  fragTemplateAberthMatrix: "frag_aberth_matrix_dcga.glsl",//raycasting using aberth with matrix
  vertTemplateVoxel: "vert_voxel_generated.glsl",//compute shader for voxels, bool evaluatevoxelIntervall3d(Intervall x, Intervall y, Intervall z) {?}
  vertTemplateVoxelBool: "vert_voxel_bool_generated.glsl",//compute shader for voxels, Intervall IntervallSummofsquares(Intervall _V_X,Intervall _V_Y,Intervall _V_Z) {?}
  vertRaycastingFullscreen:"vertRaycastingFullscreen.glsl",
};

const basePath = "./src/shadersource/";//relative to index




const _shaderSources = Object.fromEntries(
  await Promise.all(
    Object.entries(shaderpaths).map(async ([name, path]) => {
      const source = await load(basePath + path);
      return [name, source];
    })
  )
);


export const shaderSources = {//for code highliting
  fragTemplateAberth: _shaderSources.fragTemplateAberth,
  fragTemplateDualGauss: _shaderSources.fragTemplateDualGauss,
  axisTemplateAligned: _shaderSources.axisTemplateAligned,
  fragTemplateAberthMatrix: _shaderSources.fragTemplateAberthMatrix,
  vertTemplateVoxel: _shaderSources.vertTemplateVoxel,
  vertTemplateVoxelBool: _shaderSources.vertTemplateVoxelBool,
  vertRaycastingFullscreen:_shaderSources.vertRaycastingFullscreen,
};*/

export const shaderSources  = {
  fragTemplateAberth: "frag_aberth_generated.glsl",//raycasting using aberth
  fragTemplateDualGauss: "frag_generated_Dual.glsl",//raycasting using Gauss
  fragTemplateAxisAligned: "frag_aberth_generated_axis_aligned.glsl",//orthographic , outputs roots for each ray 
  fragTemplateAberthMatrix: "frag_aberth_matrix_dcga.glsl",//raycasting using aberth with matrix
  vertTemplateVoxel: "vert_voxel_generated.glsl",//compute shader for voxels, bool evaluatevoxelIntervall3d(Intervall x, Intervall y, Intervall z) {?}
  vertTemplateVoxelBool: "vert_voxel_bool_generated.glsl",//compute shader for voxels, Intervall IntervallSummofsquares(Intervall _V_X,Intervall _V_Y,Intervall _V_Z) {?}
  vertRaycastFullscreen:"vertRaycastFullscreen.glsl",
};

const basePath = "./src/shadersource/";//relative to index


await Promise.all(
  Object.entries(shaderSources).map(async ([name, path]) => {
    const source = await load(basePath + path);
    shaderSources[name] = source;
  })
);


async function loadwithincludes(url) {
  
}