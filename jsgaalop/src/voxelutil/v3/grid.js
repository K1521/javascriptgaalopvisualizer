export class Grid3D {
  constructor(low = [0,0,0], high = [1,1,1], dim = [10,10,10]) {
    this.dim = dim;
    this.setBounds(low, high);
  }

  setBounds(low, high) {
    this.low = low;
    this.high = high;
    this.computeSpacing();
  }

  setDim(dim) {
    this.dim = dim;
    this.computeSpacing();
  }

  computeSpacing() {
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

  size() {
    const [nx, ny, nz] = this.dim;
    return nx * ny * nz;
  }

  getCellRadius() {
    return Math.sqrt(this.dx*this.dx + this.dy*this.dy + this.dz*this.dz);
  }
}