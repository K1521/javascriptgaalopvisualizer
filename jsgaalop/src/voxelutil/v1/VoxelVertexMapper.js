/**
 * Retrieves the value for a given key from a Map.
 * If the key is not present, sets it to the provided default value and returns that value.
 * 
 * This function avoids unnecessary writes if the key already exists.
 *
 * @template K, V
 * @param {Map<K, V>} map - The map to operate on.
 * @param {K} key - The key to look up.
 * @param {V} value - The default value to insert if the key is not found.
 * @returns {V} The existing or newly set value associated with the key.
 */
export function setDefaultFast(map, key, value) {
  const cached = map.get(key);
  if (cached !== undefined) return cached;
  map.set(key, value);
  return value;
}

export class VoxelVertexMapper {
    /*static pack(x, y, z) {
        if (x < 0 || x > 1024 || y < 0 || y > 1024 || z < 0 || z > 1024)
            throw new Error("vertex coordinate out of bounds");
        return (z << 22) | (y << 11) | x;
    }

    static unpack(key) {
        const x = key & 0x7FF;
        const y = (key >> 11) & 0x7FF;
        const z = (key >> 22) & 0x7FF;
        return [x, y, z];
    }*/
    static pack(x, y, z) {
        if (x < 0 || x > 1024 || y < 0 || y > 1024 || z < 0 || z > 1024)
            throw new Error("vertex coordinate out of bounds");
        return z * 1025 * 1025 + y * 1025 + x;
    }

    static unpack(key) {
        const x = key % 1025;
        const y = Math.floor(key / 1025) % 1025;
        const z = Math.floor(key / (1025 * 1025));
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
        this.vertexMap = new Map(); // packedvertex → index
        this.voxelVertexIndices = [];
        this.vertexPositions = null;

        this.#buildIndexMap();
        this.#generateVertexPositions();
    }

    /** Builds vertex index map and per-voxel corner index lists */
    #buildIndexMap() {
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
    #generateVertexPositions() {
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


        /**
     * Returns the voxel-to-vertex connectivity.
     * Each voxel is represented by an array of indices into the vertex array.
     *
     * @returns {number[][]} An array of voxels, where each voxel is an array of vertex indices.
     */
    getVoxels() {
        return this.voxelVertexIndices;
    }

    /**
     * Returns the flat list of vertex positions.
     * Each group of 3 values corresponds to the x, y, z coordinates of a vertex.
     *
     * @returns {Float32Array} A flat array of vertex positions in the format [x0, y0, z0, x1, y1, z1, ...].
     */
    getVertices() {
        return this.vertexPositions;
    }

    /**
     * Returns the 3D position of a single vertex.
     *
     * @param {number} vertID - The index of the vertex to retrieve.
     * @returns {number[]} A 3-element array [x, y, z] representing the vertex position.
     */
    getVertex(vertID) {
        const base = vertID * 3;
        return [
            this.vertexPositions[base + 0],
            this.vertexPositions[base + 1],
            this.vertexPositions[base + 2]
        ];
    }
}
