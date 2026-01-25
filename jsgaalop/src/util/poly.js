export class Poly {
  constructor(coeffs) {
    for (const [key, value] of coeffs) {
      if (value === 0) {
        coeffs.delete(key);
      }
    }
    this.coeffs = coeffs; 
  }



  static monomialToKey(monomial) {
    return JSON.stringify(
      Object.fromEntries(
        Object.entries(monomial).filter(([k,v])=>v!=0).sort((a, b) => (a[0] > b[0] ? 1 : -1))
      )
    );
  }

  static keyToMonomial(key) {
    return JSON.parse(key);
  }

  static convert(x) {
    if (x instanceof Poly) return x;
    const key = Poly.monomialToKey({}); // constant term
    return new Poly(new Map([[key, x]]));
  }

  static var(varname, value = 1) {
    const key = Poly.monomialToKey({ [varname]: 1 });
    return new Poly(new Map([[key, value]]));
  }
  
  entries(){
    return this.coeffs.entries().map(([k,v])=>[Poly.keyToMonomial(k),v]);
  }

  add(other) {
    other = Poly.convert(other);
    const coeffs = new Map(this.coeffs);
    for (const [key, c] of other.coeffs) {
      coeffs.set(key, (coeffs.get(key) ?? 0) + c);
    }
    return new Poly(coeffs);
  }

  sub(other) {
    other = Poly.convert(other);
    const coeffs = new Map(this.coeffs);
    for (const [key, c] of other.coeffs) {
      coeffs.set(key, (coeffs.get(key) ?? 0) - c);
    }
    return new Poly(coeffs);
  }

  mul(other) {
    other = Poly.convert(other);
    const coeffs = new Map();

    const entriesB=[...other.entries()];
    for (const [monomA, coeffA] of this.entries()) {
      for (const [monomB, coeffB] of entriesB) {
        const monom = { ...monomA };
        for (const [variable, power] of Object.entries(monomB)) {
          monom[variable] = (monom[variable] ?? 0) + power;
        }
        const key = Poly.monomialToKey(monom);
        coeffs.set(key, (coeffs.get(key) ?? 0) + coeffA * coeffB);
      }
    }
    return new Poly(coeffs);
  }

  div(other) {
    other = Poly.convert(other);
    // Only supports monomial division
    if (other.coeffs.size !== 1) {
      throw new Error("only monomial division currently :(");
    }

    const [[monomDivisor, coeffDivisor]] = other.entries();

    const result = new Map();

    for (const [monomDividend, coeffDividend] of this.entries()) {

      // Subtract divisor exponents from dividend exponents
      for (const [variable, power] of Object.entries(monomDivisor)) {
        monomDividend[variable] = (monomDividend[variable] ?? 0) - power;
      }

      const keyResult = Poly.monomialToKey(monomDividend);
      result.set(keyResult, coeffDividend / coeffDivisor);
    }

    return new Poly(result);
  }

  equals(other) {
    other = Poly.convert(other);
    if (this.coeffs.size !== other.coeffs.size) return false;
    for (const [k, v] of this.coeffs) {
      if (other.coeffs.get(k) !== v) return false;
    }
    return true;
  }

  evaluate(point) {
    let result = 0;
    for (const [monom, coeff] of this.entries()) {
      let termVal = coeff;
      for (const [v, p] of Object.entries(monom)) {
        termVal *= (point[v] ?? 0) ** p;
      }
      result += termVal;
    }
    return result;
  }

  toString() {
    const terms = [];
    for (const [monom, coeff] of this.entries()) {
      const vars = Object.entries(monom)
        .map(([v, p]) => v + (p === 1 ? "" : "^" + p))
        .join("*");
      terms.push(`${coeff}${vars ? "*" + vars : ""}`);
    }
    return terms.length ? terms.join(" + ") : "0";
  }

  degree() {
    let maxDeg = 0;
    for (const key of this.coeffs.keys()) {
      const monom = Poly.keyToMonomial(key);
      const deg = Object.values(monom).reduce((a, b) => a + b, 0);
      if (deg > maxDeg) maxDeg = deg;
    }
    return maxDeg;
  }

  degreePerVariable() {
    const degrees = {};
    for (const key of this.coeffs.keys()) {
      const monom = Poly.keyToMonomial(key);
      for (const [variable, power] of Object.entries(monom)) {
        if (!(variable in degrees) || power > degrees[variable]) {
          degrees[variable] = power;
        }
      }
    }
    return degrees;
  }




  isZero(eps = 1e-12) {
    for (const c of this.coeffs.values())
      if (Math.abs(c) > eps)
        return false;
    return true;
  }

  /**
   * Checks whether this polynomial is a scalar multiple of another.
   *
   * Finds k such that: this = k * other, up to numerical tolerance.
   * Uses the largest-magnitude coefficient as a pivot for stability.
   *
   * Zero cases:
   * - both zero → returns 1
   * - one zero  → returns false
   *
   * @param {Poly} other
   * @returns {number|false} k if multiple, otherwise false
   */
  isMultipleOf(other) {
    const eps = 1e-10;

    const thisZero  = this.isZero(eps);
    const otherZero = other.isZero(eps);
    if (thisZero && otherZero) return 1;
    if (thisZero || otherZero) return false;

    // find pivot with largest magnitude in this poly
    let pivotMonom = null;
    let pivotAbs = 0;
    for (const [m, c] of this.coeffs.entries()) {
        const abs = Math.abs(c);
        if (abs > pivotAbs) {
            pivotAbs = abs;
            pivotMonom = m;
        }
    }

    const pivotCoeffOther = other.coeffs.get(pivotMonom);
    if (pivotCoeffOther == null || Math.abs(pivotCoeffOther) < eps)
        return false;

    const k = this.coeffs.get(pivotMonom) / pivotCoeffOther;

    for (const m of new Set([
        ...this.coeffs.keys(),
        ...other.coeffs.keys()
    ])) {
        const coeffThis  = this.coeffs.get(m) ?? 0;
        const coeffOther = (other.coeffs.get(m) ?? 0) * k;
        const diff = coeffThis - coeffOther;
        const tol = eps * Math.max(1, Math.abs(coeffThis), Math.abs(coeffOther));
        if (Math.abs(diff) > tol)
            return false;
    }

    return k; // this = k * other
  }

}
