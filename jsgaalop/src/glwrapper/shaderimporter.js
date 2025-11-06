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
 * Generator that yields interleaved code and include parts,
 * with line number metadata for each.
 *
 * @param {string} shaderCode - The full shader source text.
 * @returns {Generator<{ type: 'code' | 'include', value: string, line: number }>}
 */
function* extractIncludes(shaderCode) {
  //const includeRegex = /^\s*\/\/\s*#include\s+"([^"]+)"\s*$/gm;
  const includeRegex = /^#include\s+"([^"]+)"\s*$/gm;

  let lastIndex = 0;
  let currentLine = 1;
  let match;

  while ((match = includeRegex.exec(shaderCode)) !== null) {
    const matchStart = match.index;
    const matchEnd = includeRegex.lastIndex;

    const chunkBefore = shaderCode.slice(lastIndex, matchStart);
    const chunkBeforeLines = chunkBefore.split('\n');

    if (chunkBefore.trim()) {
      yield {
        type: 'code',
        value: chunkBefore,
        line: currentLine,
      };
    }

    yield {
      type: 'include',
      value: match[1],
      line: currentLine + chunkBeforeLines.length - 1,
    };

    currentLine += chunkBeforeLines.length;

    lastIndex = matchEnd;
  }

  const remaining = shaderCode.slice(lastIndex);
  if (remaining.trim()) {
    yield {
      type: 'code',
      value: remaining,
      line: currentLine,
    };
  }
}


/**
 * Recursively loads a GLSL shader file and all its included files,
 * resolving includes relative to each file's location.
 * Preserves include lines as comments, detects cycles, and returns
 * the combined shader source as a single string.
 *
 * @param {string} entryUrl - URL or relative path to the initial shader file.
 * @param {string} shadersource - optional, this makes it possible to load a shader string directly without it beeing in a file. entry url becomes the relative url from which imports are made
 * @returns {Promise<string>} - Promise resolving to the combined shader source code.
 * @throws {Error} Throws if include cycles are detected or fetch fails.
 */
export async function loadWithIncludes(entryUrl,shadersource=undefined) {
  const visited = new Set();
  const onStack = new Set();
  const chunks = [];

  if(shadersource && !entryUrl.endsWith("/")){
    throw new Error("if shadersource is supplied entryUrl must be a folder");
  }

  /**
   * Internal recursive function to load a shader file and its includes.
   *
   * @param {string} url - URL of the shader file to load.
   */
  async function loadRec(url,shadersource) {
    const resolvedUrl = new URL(url, location.href).toString();//normalizes the url

    if (onStack.has(resolvedUrl)) {
      throw new Error(`Include cycle detected: ${resolvedUrl}`);
    }
    if (visited.has(resolvedUrl)) {
      return;
    }
    onStack.add(resolvedUrl);

    let code,baseUrl;
    if(!shadersource){
      code = await loadCached(resolvedUrl);
      baseUrl=new URL('.', resolvedUrl).toString();
    }else{
      code=shadersource;
      baseUrl=resolvedUrl;
    }

    //const baseUrl = new URL('.', resolvedUrl).toString();

    // Recursively load all includes first, resolving relative paths
    for (const item of extractIncludes(code)) {
      if(item.type=="code"){
        const isVersionLine = item.value.trimStart().startsWith("#version");
        if (isVersionLine) {
          // Allow #version only at the very top
          chunks.push(item.value.trimStart());
        } else {
          chunks.push(`// from ${resolvedUrl} @ line ${item.line}\n${item.value}`);
        }
      }else if(item.type=="include"){
        const includePath=item.value;
        const includeUrl = new URL(includePath, baseUrl).toString();//resolves relative path
        await loadRec(includeUrl);
        }
    }
    //chunks.push(code);

    

    visited.add(resolvedUrl);
    onStack.delete(resolvedUrl);
  }

  await loadRec(entryUrl,shadersource);
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
export const shaderSources  = {//path gets replaced with content
  fragTemplateAberth: "shaderlibv1/raycasting_frag_shaders/frag_aberth.glsl",//raycasting using aberth
  fragTemplateDualGauss: "shaderlibv1/raycasting_frag_shaders/frag_gauss.glsl",//raycasting using Gauss
  fragTemplateSphere: "shaderlibv1/raycasting_frag_shaders/frag_sphereaprox.glsl",//raycasting using Gauss
  fragTemplateAxisAligned: "frag_aberth_generated_axis_aligned.glsl",//orthographic , outputs roots for each ray 
  fragTemplateAberthMatrix: "frag_aberth_matrix_dcga.glsl",//raycasting using aberth with matrix
  vertTemplateVoxel: "vert_voxel_generated.glsl",//compute shader for voxels, bool evaluatevoxelIntervall3d(Intervall x, Intervall y, Intervall z) {?}
  vertTemplateVoxelBool: "vert_voxel_bool_generated.glsl",//compute shader for voxels, Intervall IntervallSummofsquares(Intervall _V_X,Intervall _V_Y,Intervall _V_Z) {?}
  vertRaycastFullscreen:"vertRaycastFullscreen.glsl",
  computeTemplatexyzDual:"shaderlibv1/computeshaders/dualxyz.glsl",
  vertTemplateVoxelBig:"vert_voxel_bool_generated_big.glsl",
};
const basePath = "./src/shadersource/";//relative to index


await Promise.all(
  Object.entries(shaderSources).map(async ([name, path]) => {
    const source = await loadWithIncludes(basePath + path);
    shaderSources[name] = source;
  })
);