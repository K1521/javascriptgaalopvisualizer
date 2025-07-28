


function mix(x,y,a){
  return x*(1-a)+y*a;
}

export class PackedVoxelGrid {
  constructor(bounds=[[-1,1],[-1,1],[-1,1]],voxels = [0], level = 0) {
    this.level = level;
    this.voxels = voxels; // stored as packed integers
    [[this.minx,this.maxx],[this.miny,this.maxy],[this.minz,this.maxz] ] = bounds; // optional bounding box info
  }

  get length(){
    return this.voxels.length;
  }

  voxelSize() {
    // Total divisions along one axis at max level is 2^10 (1024)
    // At level 0: 1 voxel spans the entire [-1,1] range → length = 2.0
    // Each level subdivides by factor of 2, so edge length halves each level
    // So edge length = 2.0 / 2^level
    const scale=1.0/(1<<this.level);
    return [(this.maxx-this.minx)*scale,(this.maxy-this.miny)*scale,(this.maxz-this.minz)*scale];
  }



  packVoxel(x, y, z) {
    if(x>0x3FF || y>0x3FF || z>0x3FF ||x<0||y<0||z<0)throw new Error("coord out of bounds");
    return ( (z & 0x3FF) << 20 ) | ( (y & 0x3FF) << 10 ) | (x & 0x3FF);
  }
  unpackVoxel(packed) {

    // packed is an int 
    // We use >>> 0 to treat as unsigned 32-bit integer
    const u = packed >>> 0;//not actually needed
    //const u=packed;
    const x = u & 0x3FF;           // lower 10 bits
    const y = (u >>> 10) & 0x3FF;  // next 10 bits
    const z = (u >>> 20) & 0x3FF;  // next 10 bits
    return [x,y,z];
  }

  voxelToPosition([x, y, z]) {
    // voxelCoords: [x, y, z], each in [0..1023]
    return [mix(this.minx,this.maxx,x/1024.0),mix(this.miny,this.maxy,y/1024.0),mix(this.minz,this.maxz,z/1024.0)];
    //return voxelCoords.map(c => this.scale*((c) * (2.0 / 1024.0) - 1.0));
  }

  /**
   * Given an array of packed voxels and current subdivision level,
   * returns a flat array of their 8 child voxels each.
   * 
   * @param {number[]} parentVoxels - array of packed voxels (ints)
   * @param {number} currentLevel - subdivision level (0 to 9)
   * @returns {number[]} Array of packed child voxels
  */
  subdivide() {
    if(this.level==10){
      throw new Error("level to high");
    }
    this.level+=1;
    const step = 1 << (10 - this.level);
    //const dx = step;
    //const dy = step << 10;
    //const dz = step << 20;
    const dx = this.packVoxel(step, 0, 0);
    const dy = this.packVoxel(0, step, 0);
    const dz = this.packVoxel(0, 0, step);
    //console.log(dx,this.unpackVoxel(dx),currentLevel);

    this.voxels=this.voxels.flatMap(packedVoxel => [
      packedVoxel,
      packedVoxel + dx,
      packedVoxel + dy,
      packedVoxel + dz,
      packedVoxel + dx + dy,
      packedVoxel + dx + dz,
      packedVoxel + dy + dz,
      packedVoxel + dx + dy + dz,
    ]);
  }

  get step(){
    return 1 << (10 - this.level);
  }

  /**
   * Returns voxel positions with optional offset inside each voxel.
   * 
   * @param {number} dx - Offset in voxel space along X axis in [0,1]. Default 0.
   * @param {number} dy - Offset in voxel space along Y axis in [0,1]. Default 0.
   * @param {number} dz - Offset in voxel space along Z axis in [0,1]. Default 0.
   * @param {Object} options - Optional settings.
   * @param {'float32'|'flat'|'nested'} options.format - Output format:
   *    'float32' (default) returns a Float32Array flat [x0,y0,z0,x1,y1,z1,...]
   *    'flat' returns a normal JS array flat [x0,y0,z0,x1,y1,z1,...]
   *    'nested' returns an array of [x,y,z] arrays.
   * @returns {Float32Array|Array} Positions in the requested format.
   */
  getPositions(dx = 0, dy = 0, dz = 0, { format = 'float32' } = {}) {
    //const [sx, sy, sz] = this.voxelSize();
    //const offset = [dx * sx, dy * sy, dz * sz];

    //const voxels = [...this.voxels];

    /*const positionFn = (v) => {
      const base = this.voxelToPosition(this.unpackVoxel(v));
      return [base[0] + offset[0], base[1] + offset[1], base[2] + offset[2]];
    };*/

    const step = this.step;

    const dxs = dx * step;
    const dys = dy * step;
    const dzs = dz * step;

    //const voxels = [...this.voxels];

    const positionFn = (v) => {
      const [x, y, z] = this.unpackVoxel(v);
      return this.voxelToPosition([x + dxs,y + dys,z + dzs]);
    };


    if (format === 'nested') {
      return this.voxels.map(positionFn);
    }

    const flat = this.voxels.flatMap(positionFn);

    if (format === 'float32') {
      return new Float32Array(flat);
    } else {
      return flat; // plain JS array
    }
  }

}



