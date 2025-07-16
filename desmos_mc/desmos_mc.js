class E0 extends Xm {
    constructor(n, r, o, i, s, a) {
        super(TT, o, i, s, a);
        this.f = n;
        this.g = r;
        this.vertexFGZs = {};
        this.vertexZeroF = {};
        this.vertexZeroG = {};
        this.threshF = 0;
        this.threshG = 0;
        this.cubeID = 0;
        this.edgesMaybeCrossF = 0;
        this.edgesMaybeCrossG = 0;
        this.tetEdgeCrossings = new Array(26);
        this.edgeFGZs = new Array(26);
        this.edgeCrossings = new Map;
        this.allFGZs = new Map
    }
    //(arr, index, x, y, z)
    setAt(arr, index, x, y, z) {
        let a = this.f(x, y, z),
            u = this.g(x, y, z);
        arr.set(index, a, u)
    }
    run() {
        this.loopOverUnitCubes(this.onEachCube.bind(this));
        return this.traceCurves();
    }
    onEachCube() {
        // Berechne die ID des aktuellen Würfels aus den Koordinaten i, j, k
        this.cubeID = xF(this.i, this.j, this.k);
        
        // Überprüfe, welche Kanten möglicherweise die Flächen F und G schneiden könnten
        this.pruneEdges();
        
        // Wenn es Kanten gibt, die F und G schneiden könnten
        if (this.edgesMaybeCrossF && this.edgesMaybeCrossG) {
            // Positionen der Vertices setzen 
            this.setVertexPositions();
            
            // Nullstellen der Funktionen F und G an den Vertices bestimmen
            this.setVertexZeros();
            
            // Kanten mit Kreuzungen setzen
            this.setEdgeCrossings();
            
            // Kurvensegmente für den aktuellen Würfel einfügen
            this.insertCurveSegmentsFromCube();
        }
    }

    pruneEdges() {
        this.edgesMaybeCrossF = 0, this.edgesMaybeCrossG = 0;
        for (let n = 0; n < 26; n++) {
            let r = fo[n * 2],
                o = fo[n * 2 + 1],
                i = this.cubeVertexValue.getX(r),
                s = this.cubeVertexValue.getY(r),
                a = this.cubeVertexValue.getX(o),
                u = this.cubeVertexValue.getY(o);
            !(i > 0 && a > 0 || i < 0 && a < 0) && (isFinite(i) || isFinite(a)) && (this.edgesMaybeCrossF |= 1 << n),
             !(s > 0 && u > 0 || s < 0 && u < 0) && (isFinite(s) || isFinite(u)) && (this.edgesMaybeCrossG |= 1 << n)
        }
    }
    setVertexZeros() {
        let n = 0,
            r = 0;
        for (let s = 0; s < 9; s++) {
            let a = this.cubeVertexValue.getX(s),
                u = this.cubeVertexValue.getY(s),
                c = Math.abs(a),
                l = Math.abs(u);
            c > n && isFinite(c) && (n = c), l > r && isFinite(c) && (r = l)
        }
        this.threshF = n * Number.EPSILON * 32;
        this.threshG = r * Number.EPSILON * 32;
        for (let s = 0; s < 9; s++) {
            let a = this.cubeVertexValue.getX(s),
                u = this.cubeVertexValue.getY(s),
                c = Math.abs(a),
                l = Math.abs(u);
            this.vertexZeroF[s] = c <= this.threshF; 
            this.vertexZeroG[s] = l <=  this.threshG;
            if ( this.vertexZeroF[s] && this.vertexZeroG[s]) {
                let p = this.cubeVertex[s],
                    d = this.createFGZ(TF(this.cubeID, s), p);
                this.vertexFGZs[s] = d
            } else this.vertexFGZs[s] = void 0
        }
    }
    getEdgeCrossings(n) {
        let r = this.edgesMaybeCrossF >> n & 1,
            o = this.edgesMaybeCrossG >> n & 1;
        if (!r && !o) return UZ;
        let i = ig(this.cubeID, n),
            s = this.edgeCrossings.get(i);
        if (s !== void 0) return s;
        let a = this.getEdgeCrossingsUncached(n, r, o);
        return this.edgeCrossings.set(i, a), a
    }
    getEdgeCrossingsUncached(n, r, o) {
        let i = fo[n * 2],
            s = fo[n * 2 + 1],
            a = this.cubeVertexValue.getX(i),
            u = this.cubeVertexValue.getY(i),
            c = this.cubeVertexValue.getX(s),
            l = this.cubeVertexValue.getY(s),
            p = this.cubeVertex[i],
            d = this.cubeVertex[s],
            m = !r || a === 0 || c === 0 ? void 0 : sg(this.f, p, d, a, c),
            y = !o || u === 0 || l === 0 ? void 0 : sg(this.g, p, d, u, l),
            h = this.threshF;
        !m && y && Math.abs(a) <= h && Math.abs(c) <= h && Math.abs(this.f(y[0], y[1], y[2])) <= h && (m = y);
        let f = this.threshG;
        return !y && m && Math.abs(u) <= f && Math.abs(l) <= f && Math.abs(this.g(m[0], m[1], m[2])) <= f && (y = m), {
            f: m,
            g: y
        }
    }
    getTriangleCrossing(n) {
        let r = m0(this.cubeID, n),
            o = this.allFGZs.get(r);
        if (o !== void 0) return o;
        let i = this.getTriangleCrossingUncached(n);
        return this.allFGZs.set(r, i), i
    }
    createFGZ(n, r) {
        let o = this.allFGZs.get(n);
        if (o) return o;
        let i = {
            id: n,
            pos: r,
            connections: [],
            visited: false
        };
        this.allFGZs.set(n, i)
        return  i
    }
    getTriangleCrossingUncached(n) {
        let r = [],
            o = [],
            i = d0[n];
        for (let a = 0; a < 3; a++) {
            let u = i[a];
            if (this.vertexFGZs[u]) return null;
            this.vertexZeroF[u] && r.push(this.cubeVertex[u]), this.vertexZeroG[u] && o.push(this.cubeVertex[u])
        }
        let s = p0[n];
        for (let a = 0; a < 3; a++) {
            let u = s[a],
                c = this.tetEdgeCrossings[u];
            if (this.edgeFGZs[u] || !c) continue;
            let l = c.f,
                p = c.g,
                d = fo[2 * u],
                m = fo[2 * u + 1];
            l && !this.vertexZeroF[d] && !this.vertexZeroF[m] && r.push(l), p && !this.vertexZeroG[d] && !this.vertexZeroG[m] && o.push(p)
        }
        if (r.length === 2 && o.length === 2) {
            let a = kZ(r[0], r[1], o[0], o[1]);
            return a ? {
                id: m0(this.cubeID, n),
                pos: a,
                connections: [],
                visited: !1
            } : null
        } else return null
    }
    setEdgeCrossings() {
        for (let n = 0; n < 26; n++) {
            let r = this.getEdgeCrossings(n),
                o = r.f,
                i = r.g,
                s = fo[n * 2],
                a = fo[n * 2 + 1];
            if (this.vertexFGZs[s] || this.vertexFGZs[a]) this.tetEdgeCrossings[n] = void 0, this.edgeFGZs[n] = void 0;
            else if (o && this.vertexZeroG[s] && this.vertexZeroG[a]) {
                let u = this.createFGZ(ig(this.cubeID, n), o);
                this.edgeFGZs[n] = u, this.tetEdgeCrossings[n] = void 0
            } else if (i && this.vertexZeroF[s] && this.vertexZeroF[a]) {
                let u = this.createFGZ(ig(this.cubeID, n), i);
                this.edgeFGZs[n] = u, this.tetEdgeCrossings[n] = void 0
            } else if (o && i && yc(o, i) < 1e-8) {
                let u = this.createFGZ(ig(this.cubeID, n), o);
                this.edgeFGZs[n] = u, this.tetEdgeCrossings[n] = void 0
            } else this.edgeFGZs[n] = void 0, this.tetEdgeCrossings[n] = r
        }
    }
    insertCurveSegmentsFromCube() {
        for (let n = 0; n < 12; n++) this.insertCurveSegmentsFromTetrahedron(n)
    }
    insertCurveSegmentsFromTetrahedron(n) {
        let r = [],
            o = bF[n];
        for (let l = 0; l < 4; l++) {
            let p = this.getTriangleCrossing(o[l]);
            p && r.push(p)
        }
        let i = [],
            s = hT[n];
        for (let l = 0; l < 6; l++) {
            let p = this.edgeFGZs[s[l]];
            p && i.push(p)
        }
        let a = [],
            u = [fo[s[0] * 2], fo[s[0] * 2 + 1], fo[s[3] * 2], fo[s[3] * 2 + 1]];
        for (let l of u) {
            let p = this.vertexFGZs[l];
            p && a.push(p)
        }
        let c = [...a, ...i, ...r];
        switch (c.length) {
            case 0:
            case 1:
                break;
            case 2:
                this.connectCrossings(c[0], c[1]);
                break;
            case 3:
                r.length === 2 && this.connectCrossings(r[0], r[1]);
                break;
            case 4:
                r.length === 4 && (this.connectCrossings(r[0], r[1]), this.connectCrossings(r[2], r[3]));
                break;
            default:
                throw new Error("Programming error: 5 is impossible.")
        }
    }
    connectCrossings(n, r) {
        n.connections.some(o => o.id === r.id) || r.connections.some(o => o.id === n.id) || n.connections.length >= 2 || r.connections.length >= 2 || (n.connections.push(r), r.connections.push(n))
    }
    traceCurves() {
        let n = {
                xtolerance: this.size.x * .1,
                ytolerance: this.size.y * .1,
                ztolerance: this.size.z * .1,
                map: o => o
            },
            r = new ks(n);
        for (let o of this.allFGZs.values()) o && !o.visited && o.connections.length === 1 && this.traceCurve(r, o);
        for (let o of this.allFGZs.values()) o && !o.visited && this.traceCurve(r, o);
        return r.finish().segments
    }
    traceCurve(n, r) {
        let o = r;
        for (;;) {
            n.addPoint(r.pos), r.visited = !0;
            let i;
            for (let s of r.connections) s.visited || (i = s);
            if (!i) break;
            r = i
        }
        o.connections.length === 2 && n.addPoint(o.pos), n.breakSegment()
    }
}

class h0 extends Xm {
    constructor(n, r, o, i, s, a, {
        isInequality: u
    }) {
        super(xT, o, i, s, a);
        this.f = n;
        this.gradient = r;
        this.cubeEdge = new Array(26);
        this.face = g0();
        this.cubeHasCrossing = !1;
        this.allNormalsFromGradient = !0;
        this.normalFromGradient = [];
        this.edgesMaybeCross = 0;
        this.positions = [];
        this.uvs = [];
        this.normals = [];
        this.triangles = [];
        this.isInequality = u, this.sheet = Array((a + 1) * (a + 1)), this.strip = Array(a + 1);
        for (let c = 0; c < (a + 1) * (a + 1); c++) this.sheet[c] = g0();
        for (let c = 0; c < a + 1; c++) this.strip[c] = g0()
    }
//(arr, index, x, y, z)
    setAt(arr, index, x, y, z) {
        let a = this.f(x, y, z);
        arr.set(index, a)
    }
    fullLoopOverUnitCubes() {
        this.positions = [], this.normals = [], this.triangles = [];
         this.loopOverUnitCubes(this.onEachCube.bind(this));
        let {
            uvs: n,
            positions: r,
            normals: o
        } = this;
        if (!this.allNormalsFromGradient)
            for (let i = 0; i < o.length / 3; i++) {
                if (this.normalFromGradient[i]) continue;
                let s = o[3 * i],
                    a = o[3 * i + 1],
                    u = o[3 * i + 2],
                    c = Math.sqrt(s * s + a * a + u * u);
                o[3 * i] = s / c, o[3 * i + 1] = a / c, o[3 * i + 2] = u / c
            }
        return zm(this.triangles, this.positions, o, n, 0, [], .7), {
            positions: r,
            normals: o,
            faces: this.triangles,
            uvs: n,
            resolved: !0,
            extraAttrs: []
        }
    }
    onEachCube() {
        this.edgesMaybeCross = 0, this.cubeHasCrossing = false,;
        for (let n = 0; n < 26; n++) {
            let v1 = this.cubeVertexValue.get(fo[n * 2]);
            let v2 = this.cubeVertexValue.get(fo[n * 2 + 1]);
            if(v1 === 0 || v2 === 0) {
                this.cubeHasCrossing = true;
            } 
            if(!(v1 > 0 && v2 > 0 || v1 < 0 && v2 < 0) && (isFinite(v1) || isFinite(v2))){
                this.edgesMaybeCross |= 1 << n;
            }
        }
        if(this.edgesMaybeCross){ 
            this.setVertexPositions();
            this.setEdges();
        }
        
        this.saveEdges(); 
        if(this.cubeHasCrossing){
            this.generateTriangles();
        }
    }

    setEdges() {
        let i = this.i;
        let j = this.j;
        let k = this.k;
        let gridSize = this.gridsize;

        let sheetCurrent = this.sheet[i * (gridSize + 1) + j];
        let sheetNextI = this.sheet[(i + 1) * (gridSize + 1) + j];
        let sheetNextJ = this.sheet[i * (gridSize + 1) + (j + 1)];

        let mask = 0;

        if (k > 0) {
            this.cubeEdge[0] = sheetCurrent.edge0;
            this.cubeEdge[1] = sheetCurrent.edge1;
            this.cubeEdge[2] = sheetCurrent.edge2;
            this.cubeEdge[3] = sheetNextJ.edge2;
            this.cubeEdge[4] = sheetNextI.edge0;
            mask |= 31;  // binary 11111 for edges 0 to 4
        }

        if (j > 0) {
            this.cubeEdge[5] = this.strip[i].edge0;
            this.cubeEdge[6] = this.strip[i].edge1;
            this.cubeEdge[7] = this.strip[i + 1].edge0;
            this.cubeEdge[8] = this.strip[i].edge2;
            mask |= 480;  // binary 111100000, edges 5 to 8

            if (k === 0) {
                this.cubeEdge[2] = sheetCurrent.edge2;
                mask |= 4;  // edge 2
            }
        }

        if (i > 0) {
            this.cubeEdge[9] = this.face.edge0;
            this.cubeEdge[10] = this.face.edge1;
            this.cubeEdge[11] = this.face.edge2;
            mask |= 3584;  // binary 111000000000, edges 9 to 11

            if (k === 0) {
                this.cubeEdge[0] = sheetCurrent.edge0;
                mask |= 1;  // edge 0
            }

            if (j === 0) {
                this.cubeEdge[5] = this.strip[i].edge0;
                mask |= 32;  // edge 5
            }
        }

        for (let edgeIndex = 0; edgeIndex < 26; edgeIndex++) {
            // Prüfen ob edgeIndex bit in edgesMaybeCross gesetzt ist
            if (((this.edgesMaybeCross >> edgeIndex) & 1) === 0) {
                this.cubeEdge[edgeIndex] = ag;  // ag = "empty" oder "kein Schnitt"
                continue;
            }

            if ((mask >> edgeIndex) & 1) {
                if ( this.cubeEdge[edgeIndex].posNeg || this.cubeEdge[edgeIndex].posNaN) {
                    this.cubeHasCrossing = true;
                }
                continue;
            }

            let crossingPoint = this.findSurfaceCrossingEDI(
                fo[edgeIndex * 2],
                fo[edgeIndex * 2 + 1]
            );

            this.cubeEdge[edgeIndex] = crossingPoint;

            if (qZ(crossingPoint)) {
                this.cubeHasCrossing = true;
            }
        }
    }

    saveEdges() {
        let {
            i: n,
            j: r,
            k: o,
            gridsize: i
        } = this;
        o < i - 1 && (this.sheet[(n + 0) * (i + 1) + r + 0].edge0 = this.cubeEdge[11], this.sheet[(n + 0) * (i + 1) + r + 0].edge1 = this.cubeEdge[17], this.sheet[(n + 0) * (i + 1) + r + 0].edge2 = this.cubeEdge[8]), r < i - 1 && (this.strip[n].edge0 = this.cubeEdge[10], this.strip[n].edge1 = this.cubeEdge[12], this.strip[n].edge2 = this.cubeEdge[14]), n < i - 1 && (this.face.edge0 = this.cubeEdge[15], this.face.edge1 = this.cubeEdge[13], this.face.edge2 = this.cubeEdge[16]), o == 0 && (this.sheet[(n + 0) * (i + 1) + r + 1].edge2 = this.cubeEdge[3], this.sheet[(n + 1) * (i + 1) + r + 0].edge0 = this.cubeEdge[4]), r == 0 && (this.strip[n + 1].edge0 = this.cubeEdge[7]), r == i - 1 && (this.sheet[n * (i + 1) + i].edge2 = this.cubeEdge[14]), n == i - 1 && (this.sheet[(i + 0) * (i + 1) + r].edge0 = this.cubeEdge[16], this.strip[i].edge0 = this.cubeEdge[13])
    }
    findSurfaceCrossingEDI(n, r) {
        let o = this.cubeVertexValue.get(n),
            i = this.cubeVertexValue.get(r);
        if (o === 0 || i === 0) return ag;
        let s = this.cubeVertex[n],
            a = this.cubeVertex[r];
        if (this.isInequality) {
            let {
                posNeg: u,
                posNaN: c
            } = IF(this.f, s, a, o, i);
            return {
                posNeg: u !== void 0 ? this.pushPositionWithGradient(...u) : void 0,
                posNaN: c !== void 0 ? this.pushPositionNoGradient(...c) : void 0
            }
        } else {
            let u = sg(this.f, s, a, o, i);
            return {
                posNeg: u !== void 0 ? this.pushPositionWithGradient(...u) : void 0
            }
        }
    }
    pushPositionWithGradient(n, r, o) {
        if (!(isFinite(n) && isFinite(r) && isFinite(o))) return 0;
        let [i, s, a] = this.computeGradient(n, r, o), u = Math.sqrt(i * i + s * s + a * a);
        return i /= -u, s /= -u, a /= -u, bd(i, s, a) ? (this.normalFromGradient.push(!0), this._pushPositionAndNormal(n, r, o, i, s, a)) : this.pushPositionNoGradient(n, r, o)
    }
    pushPositionNoGradient(n, r, o) {
        return isFinite(n) && isFinite(r) && isFinite(o) ? (this.allNormalsFromGradient = !1, this.normalFromGradient.push(!1), this._pushPositionAndNormal(n, r, o, 0, 0, 0)) : 0
    }
    _pushPositionAndNormal(n, r, o, i, s, a) {
        return this.positions.push(n, r, o), this.uvs.push((n - this.x.min) / this.x.width, (r - this.y.min) / this.y.width), this.normals.push(i, s, a), this.positions.length / 3
    }
    computeGradient(n, r, o) {
        let i = NaN,
            s = NaN,
            a = NaN;
        if (this.gradient && ([i, s, a] = this.gradient(n, r, o), isFinite(i) && isFinite(s) && isFinite(a))) return [i, s, a];
        let u = .001 * Math.min(this.size.x, this.size.y, this.size.z),
            c = this.f(n, r, o);
        if (isFinite(i) || (i = (this.f(n + u, r, o) - c) / u), isFinite(i) || (i = (c - this.f(n - u, r, o)) / u), isFinite(s) || (s = (this.f(n, r + u, o) - c) / u), isFinite(s) || (s = (c - this.f(n, r - u, o)) / u), isFinite(a) || (a = (this.f(n, r, o + u) - c) / u), isFinite(a) || (a = (c - this.f(n, r, o - u)) / u), isFinite(i) && isFinite(s) && isFinite(a)) return [i, s, a];
        let l = NaN,
            p = NaN,
            d = NaN,
            m = NaN,
            y = NaN,
            h = NaN,
            f = u / 2;
        return (!isFinite(i) || !isFinite(s)) && (l = (this.f(n + f, r + f, o) - c) / u, isFinite(l) || (l = (c - this.f(n - f, r - f, o)) / u), p = (this.f(n + f, r - f, o) - c) / u, isFinite(p) || (p = (c - this.f(n - f, r + f, o)) / u), isFinite(l) && isFinite(p) && (isFinite(i) || (i = l + p), isFinite(s) || (s = l - p))), (!isFinite(s) || !isFinite(a)) && (d = (this.f(n, r + f, o + f) - c) / u, isFinite(d) || (d = (c - this.f(n, r - f, o - f)) / u), m = (this.f(n, r + f, o - f) - c) / u, isFinite(m) || (m = (c - this.f(n, r - f, o + f)) / u), isFinite(d) && isFinite(m) && (isFinite(s) || (s = d + m), isFinite(a) || (a = d - m))), (!isFinite(a) || !isFinite(i)) && (y = (this.f(n + f, r, o + f) - c) / u, isFinite(y) || (y = (c - this.f(n - f, r, o - f)) / u), h = (this.f(n - f, r, o + f) - c) / u, isFinite(h) || (h = (c - this.f(n + f, r, o - f)) / u), isFinite(y) && isFinite(h) && (isFinite(i) || (i = y - h), isFinite(a) || (a = y + h))), [i, s, a]
    }
    generateTriangles() {
        for (let n = 0; n < 12; n++) {
            let r = hT[n],
                o = [],
                i = 0,
                s = gF[n],
                a = 0,
                u = s[0],
                c = Math.abs(this.cubeVertexValue.get(u));
            c > a && isFinite(c) && (a = c);
            let l = s[1],
                p = Math.abs(this.cubeVertexValue.get(l));
            p > a && isFinite(p) && (a = p);
            let d = s[2],
                m = Math.abs(this.cubeVertexValue.get(d));
            m > a && isFinite(m) && (a = m);
            let y = s[3],
                h = Math.abs(this.cubeVertexValue.get(y));
            h > a && isFinite(h) && (a = h);
            let f = a * Number.EPSILON * 32;
            if (c <= f) {
                i |= 35;
                let b = this.pushPositionWithGradient(...this.cubeVertex[u]);
                b !== void 0 && o.push(b)
            }
            if (p <= f) {
                i |= 21;
                let b = this.pushPositionWithGradient(...this.cubeVertex[l]);
                b !== void 0 && o.push(b)
            }
            if (m <= f) {
                i |= 14;
                let b = this.pushPositionWithGradient(...this.cubeVertex[d]);
                b !== void 0 && o.push(b)
            }
            if (h <= f) {
                i |= 56;
                let b = this.pushPositionWithGradient(...this.cubeVertex[y]);
                b !== void 0 && o.push(b)
            }
            if (o.length === 4) continue;
            let g;
            for (let b = 0; b < 4; b++) {
                let T = s[b];
                if (this.cubeVertexValue.get(T) > f) {
                    g = this.cubeVertex[T];
                    break
                }
            }
            if (g === void 0 && this.isInequality)
                for (let b = 0; b < 6; b++) {
                    if (i >> b & 1) continue;
                    let {
                        posNeg: T,
                        posNaN: I
                    } = this.cubeEdge[r[b]];
                    if (kp(T) && kp(I)) {
                        g = Os(this.positions.slice((T - 1) * 3, T * 3), this.positions.slice((I - 1) * 3, I * 3), .5);
                        break
                    }
                }
            if (g === void 0)
                for (let b = 0; b < 4; b++) {
                    let T = s[b];
                    if (!isFinite(this.cubeVertexValue.get(T))) {
                        g = this.cubeVertex[T];
                        break
                    }
                }
            if (g === void 0 && i && o.length > 0) {
                let b;
                for (let T = 0; T < 4; T++) {
                    let I = s[T];
                    if (this.cubeVertexValue.get(I) < -f) {
                        b = this.cubeVertex[I];
                        break
                    }
                }
                if (b) {
                    let T = o[0],
                        I = this.positions.slice((T - 1) * 3, T * 3);
                    g = Os(b, I, 2)
                }
            }
            if (g !== void 0) {
                if (this.isInequality) {
                    let b = [],
                        T = [],
                        I = !1;
                    for (let C = 0; C < 6; C++) {
                        if (i >> C & 1) continue;
                        let {
                            posNeg: S,
                            posNaN: E
                        } = this.cubeEdge[r[C]], v = kp(S), _ = kp(E);
                        v && b.push(S), _ && T.push(E), v && _ && (I = !0)
                    }
                    if (I) {
                        b.push(...o), this.pushTriangleFromCorners(T, g), this.pushTriangleFromCorners(b, g);
                        continue
                    }
                }
                for (let b = 0; b < 6; b++) {
                    if (i >> b & 1) continue;
                    let {
                        posNeg: T,
                        posNaN: I
                    } = this.cubeEdge[r[b]], C = T || I;
                    kp(C) && o.push(C)
                }
                this.pushTriangleFromCorners(o, g)
            }
        }
    }
    pushTriangleFromCorners(n, r) {
        if (n.length >= 3) {
            let o = n[0] - 1,
                i = n[1] - 1,
                s = n[2] - 1;
            this.pushTriangle(o, i, s, r)
        }
        if (n.length == 4) {
            let o = n[0] - 1,
                i = n[2] - 1,
                s = n[3] - 1;
            this.pushTriangle(o, i, s, r)
        }
    }
    pushTriangle(n, r, o, i) {
        this.allNormalsFromGradient || this.fixBadNormals(n, r, o, i), this.checkWindingOrder(n, r, o) && ([r, o] = [o, r]), this.triangles.push(n, r, o)
    }
    fixBadNormals(n, r, o, i) {
        let s = !this.normalFromGradient[n],
            a = !this.normalFromGradient[r],
            u = !this.normalFromGradient[o];
        if (!(s || a || u)) return;
        let c = this.positions,
            l = this.normals,
            p = new at(c[3 * n], c[3 * n + 1], c[3 * n + 2]),
            d = new at(c[3 * r], c[3 * r + 1], c[3 * r + 2]),
            m = new at(c[3 * o], c[3 * o + 1], c[3 * o + 2]),
            y = new at().subVectors(m, p),
            h = new at().subVectors(p, d),
            f = y.cross(h),
            g = new at().subVectors(p, new at(...i));
        f.dot(g) < 0 && f.multiply(-1), f.isFinite() && (s && (l[3 * n + 0] += f.x, l[3 * n + 1] += f.y, l[3 * n + 2] += f.z), a && (l[3 * r + 0] += f.x, l[3 * r + 1] += f.y, l[3 * r + 2] += f.z), u && (l[3 * o + 0] += f.x, l[3 * o + 1] += f.y, l[3 * o + 2] += f.z))
    }
    checkWindingOrder(n, r, o) {
        let i = this.positions,
            s = this.normals,
            a = i[3 * o] - i[3 * n],
            u = i[3 * o + 1] - i[3 * n + 1],
            c = i[3 * o + 2] - i[3 * n + 2],
            l = i[3 * n] - i[3 * r],
            p = i[3 * n + 1] - i[3 * r + 1],
            d = i[3 * n + 2] - i[3 * r + 2],
            m = u * d - c * p,
            y = c * l - a * d,
            h = a * p - u * l,
            f = s[3 * n],
            g = s[3 * n + 1],
            b = s[3 * n + 2];
        return m * f + y * g + h * b < 0
    }
};



class Xm {
    constructor(t, n, r, o, i) {
        this.PAConstructor = t;
        this.x = n;
        this.y = r;
        this.z = o;
        this.gridsize = i;
        this.i = 0;
        this.j = 0;
        this.k = 0;
        this.cubeVertex = new Array(9);
        this.cubeVertexValue = new this.PAConstructor(9);
        if (i > 250) throw new Error("Programming Error: resolution should be clamped well below 250.");
        this.size = new at(this.x.width / i, this.y.width / i, this.z.width / i)
    }
    loopOverUnitCubes(t) {
        let n = this.gridsize,
            r = n + 1,
            o = new bT(this.x.min, this.y.min, this.z.min, this.size.x, this.size.y, this.size.z, n + 1, n + 1, n + 1),
            i = new bT(this.x.min + this.size.x / 2, this.y.min + this.size.y / 2, this.z.min + this.size.z / 2, this.size.x, this.size.y, this.size.z, n, n, n),
            s = o.setupArray(this.PAConstructor),
            a = o.setupArray(this.PAConstructor),
            u = i.setupArray(this.PAConstructor);
        this.evaluateArray(a, o, 0);
        for (let c = 0; c < n; c++) {
            this.k = c, [s, a] = [a, s], this.evaluateArray(a, o, c + 1), this.evaluateArray(u, i, c);
            for (let l = 0; l < n; l++) {
                this.j = l;
                for (let p = 0; p < n; p++) {
                    this.i = p;
                    let d = l * r + p;
                    this.cubeVertexValue.setFrom(0, s, d), this.cubeVertexValue.setFrom(1, s, d + r), this.cubeVertexValue.setFrom(2, s, d + r + 1), this.cubeVertexValue.setFrom(3, s, d + 1), this.cubeVertexValue.setFrom(4, a, d), this.cubeVertexValue.setFrom(5, a, d + r), this.cubeVertexValue.setFrom(6, a, d + r + 1), this.cubeVertexValue.setFrom(7, a, d + 1), this.cubeVertexValue.setFrom(8, u, l * n + p), t()
                }
            }
        }
    }
    evaluateArray(t, n, r) {
        let o = n.z0 + r * n.dz;
        for (let i = 0; i < n.numX; i++)
            for (let s = 0; s < n.numY; s++) {
                let a = n.x0 + i * n.dx,
                    u = n.y0 + s * n.dy;
                this.setAt(t, s * n.numX + i, a, u, o)
            }
    }
    setVertexPositions() {
        for (let t = 0; t < 9; t++) {
            let n = hF[t];
            this.cubeVertex[t] = [this.x.min + (this.i + n[0]) * this.size.x, this.y.min + (this.j + n[1]) * this.size.y, this.z.min + (this.k + n[2]) * this.size.z]
        }
    }
}