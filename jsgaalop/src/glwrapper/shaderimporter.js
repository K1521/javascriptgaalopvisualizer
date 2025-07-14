async function load(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load: ${url}`);
  }
  return await response.text();
}

const loadcache=new Map();

async function loadCached(url){
  const resolvedUrl = new URL(url, location.href).toString();
  if(!loadcache.has(resolvedUrl))
    loadcache.set(resolvedUrl,await load(resolvedUrl));
  return loadcache.get(resolvedUrl);
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




/**
 * Generator function that extracts raw include paths from GLSL shader code.
 * It looks for lines matching the pattern: // #include "relative/path.glsl"
 *
 * @param {string} shaderCode - The GLSL shader source code.
 * @yields {string} - Each relative include path found in the shader code.
 */
function* extractIncludes(shaderCode) {
  const includeRegex = /^\s*\/\/\s*#include\s+"([^"]+)"\s*$/gm;
  let match;
  while ((match = includeRegex.exec(shaderCode)) !== null) {
    yield match[1]; // raw include path, e.g. "../common.glsl"
  }
}

/**
 * Recursively loads a GLSL shader file and all its included files,
 * resolving includes relative to each file's location.
 * Preserves include lines as comments, detects cycles, and returns
 * the combined shader source as a single string.
 *
 * @param {string} entryUrl - URL or relative path to the initial shader file.
 * @returns {Promise<string>} - Promise resolving to the combined shader source code.
 * @throws {Error} Throws if include cycles are detected or fetch fails.
 */
async function loadWithIncludes(entryUrl) {
  const visited = new Set();
  const onStack = new Set();
  const chunks = [];

  /**
   * Internal recursive function to load a shader file and its includes.
   *
   * @param {string} url - URL of the shader file to load.
   */
  async function loadRec(url) {
    const resolvedUrl = new URL(url, location.href).toString();//normalizes the url

    if (onStack.has(resolvedUrl)) {
      throw new Error(`Include cycle detected: ${resolvedUrl}`);
    }
    if (visited.has(resolvedUrl)) {
      return;
    }
    onStack.add(resolvedUrl);

    const code = await loadCached(resolvedUrl);
    const baseUrl = new URL('.', resolvedUrl).toString();

    // Recursively load all includes first, resolving relative paths
    for (const includePath of extractIncludes(code)) {
      const includeUrl = new URL(includePath, baseUrl).toString();//resolves relative path
      await loadRec(includeUrl);
    }

    chunks.push(code);

    visited.add(resolvedUrl);
    onStack.delete(resolvedUrl);
  }

  await loadRec(entryUrl);
  return chunks.join('\n');
}




/*export const shaderSources  = {
  fragTemplateAberth: "frag_aberth_generated.glsl",//raycasting using aberth
  fragTemplateDualGauss: "frag_generated_Dual.glsl",//raycasting using Gauss
  fragTemplateAxisAligned: "frag_aberth_generated_axis_aligned.glsl",//orthographic , outputs roots for each ray 
  fragTemplateAberthMatrix: "frag_aberth_matrix_dcga.glsl",//raycasting using aberth with matrix
  vertTemplateVoxel: "vert_voxel_generated.glsl",//compute shader for voxels, bool evaluatevoxelIntervall3d(Intervall x, Intervall y, Intervall z) {?}
  vertTemplateVoxelBool: "vert_voxel_bool_generated.glsl",//compute shader for voxels, Intervall IntervallSummofsquares(Intervall _V_X,Intervall _V_Y,Intervall _V_Z) {?}
  vertRaycastFullscreen:"vertRaycastFullscreen.glsl",
};*/
export const shaderSources  = {
  fragTemplateAberth: "shaderlibv1/frag_aberth.glsl",//raycasting using aberth
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
    const source = await loadWithIncludes(basePath + path);
    shaderSources[name] = source;
  })
);