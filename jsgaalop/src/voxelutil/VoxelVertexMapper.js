export function setDefaultFast(map, key, value) {
  const cached = map.get(key);
  if (cached !== undefined) return cached;
  map.set(key, value);
  return value;
}

class VoxelVertexMapper {
    static pack(x, y, z) {
        if (x < 0 || x > 1024 || y < 0 || y > 1024 || z < 0 || z > 1024)
            throw new Error("vertex coordinate out of bounds");
        return (z << 22) | (y << 11) | x;
    }

    static unpack(key) {
        const x = key & 0x7FF;
        const y = (key >> 11) & 0x7FF;
        const z = (key >> 22) & 0x7FF;
        return [x, y, z];
    }

    static cornerOffset = [
        [0, 0, 0], [0, 0, 1],
        [0, 1, 0], [0, 1, 1],
        [1, 0, 0], [1, 0, 1],
        [1, 1, 0], [1, 1, 1]
    ];

    /**
     * @param {PackedVoxelGrid} voxelGrid
     */
    constructor(voxelGrid) {
        this.grid = voxelGrid;
        this.vertexMap = new Map(); // key → index
        this.voxelVertexIndices = [];
        this.vertexPositions = null;

        this.buildIndexMap();
        this.generateVertexPositions();
    }

    /** Builds vertex index map and per-voxel corner index lists */
    buildIndexMap() {
        const step = this.grid.step;

        for (const v of this.grid.voxels) {
            const [x, y, z] = this.grid.unpackVoxel(v);

            const cornerIndices = VoxelVertexMapper.cornerOffset.map(([dx, dy, dz]) => {
                const vx = x + dx * step;
                const vy = y + dy * step;
                const vz = z + dz * step;
                const key = VoxelVertexMapper.pack(vx, vy, vz);

                return setDefaultFast(this.vertexMap, key, this.vertexMap.size);
            });

            this.voxelVertexIndices.push(cornerIndices);
        }
    }

    /** Computes actual vertex positions from the packed keys */
    generateVertexPositions() {
        const count = this.vertexMap.size;
        this.vertexPositions = new Float32Array(count * 3);

        for (const [key, index] of this.vertexMap.entries()) {
            const [x, y, z] = VoxelVertexMapper.unpack(key);
            const [px, py, pz] = this.grid.voxelToPosition([x, y, z]);

            const base = index * 3;
            this.vertexPositions[base + 0] = px;
            this.vertexPositions[base + 1] = py;
            this.vertexPositions[base + 2] = pz;
        }
    }
}
