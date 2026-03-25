export class Grid3D {
  constructor(low = [0,0,0], high = [1,1,1], dim = [10,10,10]) {
    this.setDim(dim);
    this.setBounds(low, high);
  }

  setBounds(low, high) {
    this.low = low;
    this.high = high;
    this.computeSpacing();
  }

  setDim(dim) {
    this.dim = dim;
    this.stride=[dim[1]*dim[2],dim[2],1];
    this.computeSpacing();
  }

  computeSpacing() {
    if (!this.low || !this.high || !this.dim) return;
    const [nx, ny, nz] = this.dim;

    this.dx = (this.high[0] - this.low[0]) / (nx - 1);
    this.dy = (this.high[1] - this.low[1]) / (ny - 1);
    this.dz = (this.high[2] - this.low[2]) / (nz - 1);
  }


  setUniforms(shader) {
    shader.uniform3f("low", ...this.low);
    shader.uniform3f("high", ...this.high);
    shader.uniform3i("dim", ...this.dim);
  }


  getIndex(i, j, k) {
    const [_, ny, nz] = this.dim;
    return i * ny * nz + j * nz + k;
  }

  getPoint(i, j, k) {
    return [
      this.low[0] + i * this.dx,
      this.low[1] + j * this.dy,
      this.low[2] + k * this.dz
    ];
  }

  getPointLinear(index) {
    const [_, ny, nz] = this.dim;
    const i = Math.floor(index / (ny * nz));
    const j = Math.floor(index / nz) % ny;
    const k = index % nz;
    return this.getPoint(i, j, k);
  }
  getPointLinearBatch(indices) {
    const points=new Float32Array(indices.length*3);
    const [_, ny, nz] = this.dim;
    let offset=0;
    for(let i=0;i<indices.length;i++){
        const index = indices[i];
        points[offset++]=this.low[0] + (Math.floor(index / (ny * nz))) * this.dx,
        points[offset++]=this.low[1] + (Math.floor(index / nz) % ny) * this.dy,
        points[offset++]=this.low[2] + (index % nz) * this.dz
    }
    return points;
  }


  makevoxelgrid(){
    return new Grid3D(
      [this.low[0]-this.dx,this.low[1]-this.dy,this.low[2]-this.dz],
      [this.high[0]+this.dx,this.high[1]+this.dy,this.high[2]+this.dz],
      this.dim.map(x=>x+1)
    )
  }


  size() {
    const [nx, ny, nz] = this.dim;
    return nx * ny * nz;
  }

  getCellRadius() {
    return Math.sqrt(this.dx*this.dx + this.dy*this.dy + this.dz*this.dz);
  }
  static indexunique(gridindicees){
        const map = new Map(), indices = new Uint32Array(gridindicees.length);
        let next = 0;
        
        for (let i = 0; i < gridindicees.length; i++) {
            const k = gridindicees[i];
            let idx = map.get(k);
            if (idx === undefined) { idx = next++; map.set(k, idx); }
            indices[i] = idx;
        }
        const gridindiceesunique = new Uint32Array(next);
        for (let i = 0, w = 0; i < gridindicees.length; i++) {
            if (indices[i] === w) {
                gridindiceesunique[w] = gridindicees[i];
                w++;
            }
        }
        return {gridindiceesunique,indices};
  }
}