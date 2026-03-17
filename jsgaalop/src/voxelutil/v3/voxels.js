export class Voxels {
//refactor using chatgpr
  constructor(scale = 4) {
    this.scale = scale;

    // initial single voxel
    this.data = new Float32Array([
      -scale, scale,
      -scale, scale,
      -scale, scale
    ]);
  }

  static sum(arr) {
    let acc = 0;
    for (let x of arr) acc += x;
    return acc;
  }

  get count() {
    return this.data.length / 6;
  }

  /**
   * Subdivide voxels (optionally filtered)
   * filter gets applied before subdivision
   */
  subdivide(filter = null) {
    const voxelsflat = this.data;
    const voxelCount = voxelsflat.length / 6;

    const result = new Float32Array(
      (filter ? Voxels.sum(filter) : voxelCount) * 6 * 8
    );

    let offset = 0;

    for (let i = 0; i < voxelCount; i++) if (!filter || filter[i]) {
      const base = i * 6;

      const xmin = voxelsflat[base + 0], xmax = voxelsflat[base + 1], xmid = (xmin + xmax) * 0.5;
      const ymin = voxelsflat[base + 2], ymax = voxelsflat[base + 3], ymid = (ymin + ymax) * 0.5;
      const zmin = voxelsflat[base + 4], zmax = voxelsflat[base + 5], zmid = (zmin + zmax) * 0.5;

      for (let xi = 0; xi < 2; xi++)
      for (let yi = 0; yi < 2; yi++)
      for (let zi = 0; zi < 2; zi++) {
        result[offset++] = xi === 0 ? xmin : xmid;
        result[offset++] = xi === 0 ? xmid : xmax;

        result[offset++] = yi === 0 ? ymin : ymid;
        result[offset++] = yi === 0 ? ymid : ymax;

        result[offset++] = zi === 0 ? zmin : zmid;
        result[offset++] = zi === 0 ? zmid : zmax;
      }
    }

    this.data = result;
    return this;
  }

  /**
   * Apply boolean filter to voxels
   */
  filter(filter) {
    const voxelsflat = this.data;
    const voxelCount = voxelsflat.length / 6;

    const result = new Float32Array(Voxels.sum(filter) * 6);

    let offset = 0;

    for (let i = 0; i < voxelCount; i++) if (filter[i]) {
      for (let j = 0; j < 6; j++) {
        result[offset++] = voxelsflat[i * 6 + j];
      }
    }

    this.data = result;
    return this;
  }

  /**
   * Convert voxels to center points
   */
  toPoints(filter = null) {
    const voxelsflat = this.data;
    const voxelCount = voxelsflat.length / 6;

    const result = new Float32Array(
      (filter ? Voxels.sum(filter) : voxelCount) * 3
    );

    let offset = 0;

    for (let i = 0; i < voxelCount; i++) if (!filter || filter[i]) {
      const base = i * 6;

      const xmin = voxelsflat[base + 0], xmax = voxelsflat[base + 1];
      const ymin = voxelsflat[base + 2], ymax = voxelsflat[base + 3];
      const zmin = voxelsflat[base + 4], zmax = voxelsflat[base + 5];

      result[offset++] = (xmin + xmax) * 0.5;
      result[offset++] = (ymin + ymax) * 0.5;
      result[offset++] = (zmin + zmax) * 0.5;
    }

    return result;
  }

    cornerPoints() {
        const voxelsflat = this.data;
        const voxelCount = voxelsflat.length / 6;
        const result = new Float32Array(voxelCount * 8 * 3);

        let offset = 0;

        for (let i = 0; i < voxelCount; i++) {
            const base = i * 6;

            const xmin = voxelsflat[base + 0], xmax = voxelsflat[base + 1];
            const ymin = voxelsflat[base + 2], ymax = voxelsflat[base + 3];
            const zmin = voxelsflat[base + 4], zmax = voxelsflat[base + 5];

            for (let xi = 0; xi < 2; xi++)
            for (let yi = 0; yi < 2; yi++)
            for (let zi = 0; zi < 2; zi++) {
            result[offset++] = xi === 0 ? xmin : xmax;
            result[offset++] = yi === 0 ? ymin : ymax;
            result[offset++] = zi === 0 ? zmin : zmax;
            }
        }

        return result;
    }

    static cornerOffset = [
        [0, 0, 0], [0, 0, 1],
        [0, 1, 0], [0, 1, 1],
        [1, 0, 0], [1, 0, 1],
        [1, 1, 0], [1, 1, 1]
    ];


    cornerpointsUnique(){
        return Voxels.pointsuniqueString(this.cornerPoints());
    }

    static pointsuniqueString(points) {//there has to bea better way but this is the fastest i came up with
        const total = points.length / 3;
        const u16 = new Uint16Array(points.buffer, points.byteOffset, points.byteLength / 2);
        const map = new Map(), indices = new Int32Array(total);
        let next = 0;
        
        for (let i = 0; i < total; i++) {
            const o = i * 6;
            const k = String.fromCharCode(u16[o], u16[o+1], u16[o+2], u16[o+3], u16[o+4], u16[o+5]);
            //const k=u16[o]+u16[o+1];
            let idx = map.get(k);
            if (idx === undefined) { idx = next++; map.set(k, idx); }
            indices[i] = idx;
        }
        const verts = new Float32Array(next * 3);
        for (let i = 0, w = 0; i < total; i++) {
            if (indices[i] === w) {
                const s = i * 3, d = w * 3;
                verts[d] = points[s]; verts[d+1] = points[s+1]; verts[d+2] = points[s+2];
                w++;
            }
        }
        return {verts,indices};
    }

    subdivideAndFilter(maxVoxel = 10000, maxSubdivisions = 8, filterFunc) {
        for (let i = 0; i < maxSubdivisions; i++) {
            if (this.count > maxVoxel || this.count === 0) break;

            const filter = filterFunc(this.data);

            this.subdivide(filter);
        }
        if(this.count==0)return;

        // apply final filter
        if (filterFunc) {
            const finalFilter = filterFunc(this.data);
            this.filter(finalFilter);
        }

        return;
    }

}