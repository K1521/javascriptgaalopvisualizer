export { Vector, Matrix, Multidual };


class Vector {
    constructor(array) {
        this.array = array;
    }

    // Get the size (length) of the vector
    size() {
        return this.array.length;
    }

    // Helper function to check if two vectors can be operated on (same size)
    _checkSizeAndType(B) {
        if (!(B instanceof Vector)) {
            throw new TypeError("The argument must be an instance of Vector");
        }
        if (this.size() !== B.size()) {
            throw new TypeError("Vectors must be of the same size for this operation");
        }
    }

    x(){return this.array[0];}
    y(){return this.array[1];}
    z(){return this.array[2];}

    map(fun) { // Apply a function to each element of the vector
        return new Vector(this.array.map(fun));
    }

    static binaryOp(fun,A,B) {
        const Aisvector=A instanceof Vector;
        const Bisvector=B instanceof Vector;
        if(Aisvector && Bisvector){
            A._checkSizeAndType(B);
            return A.map((val, i) => fun(val, B.array[i]));
        } else if(Aisvector){
            return A.map(val => fun(val, B));
        } else if(Bisvector){
            return B.map(val => fun(A, val));
        } else{
            return fun(A,B);
        }


        /*if (typeof B === 'number') return new Vector(this.array.map(val => fun(val, B)));
        this._checkSizeAndType(B);
        return new Vector(this.array.map((val, i) => fun(val, B.array[i])));*/
    }

    // Vector addition
    add(B) {
        return Vector.add(this,B);
    }
    static add(A,B) {
        return Vector.binaryOp( (a, b) => a + b,A,B);
    }
    

    // Vector subtraction
    sub(B) {
        return Vector.sub(this,B);
    }
    static sub(A,B) { 
        return Vector.binaryOp( (a, b) => a - b,A,B);
    }
    

    // Scalar multiplication
    mul(B) {
        return Vector.mul(this,B);
    }
    static mul(A,B) {
        return Vector.binaryOp( (a, b) => a * b,A,B);
    }
    
    div(B) {
        return Vector.div(this,B);
    } 
    static div(A,B) {
        return Vector.binaryOp( (a, b) => a / b,A,B);
    }


    // Dot product of two vectors
    dot(B) {
        this._checkSizeAndType(B);
        const result = this.array.reduce((sum, val, idx) => sum + val * B.array[idx], 0);
        return result;
    }

    // Cross product of two 3D vectors
    cross(B) {
        this._checkSizeAndType(B);
        if (this.size() !== 3 || B.size() !== 3) {
            throw new TypeError("Cross product is only defined for 3D vectors");
        }

        const [x1, y1, z1] = this.array;
        const [x2, y2, z2] = B.array;

        const result = [
            y1 * z2 - z1 * y2,  // x-component
            z1 * x2 - x1 * z2,  // y-component
            x1 * y2 - y1 * x2   // z-component
        ];
        return new Vector(result);
    }

    length(){return Math.sqrt(this.array.reduce((sum, val) => sum + val * val, 0));}

    //this is element wise abs not the length of the vector
    //use length() for that
    abs(){return Vector.abs(this);}
    static abs(A){
        if(A instanceof Vector)return A.map(Math.abs);
        return Math.abs(A);
    }

    sqrt(){return Vector.sqrt(this);}
    static sqrt(A){
        if(A instanceof Vector)return A.map(Math.sqrt);
        return Math.sqrt(A);
    }

    normalize(){
        const l=this.length();
        if(l===0)return new Vector(new Array(this.size()).fill(0));//this.mul(0);
        return this.div(l);
    }
}

class Matrix {
    constructor(array) {
      this.array = array;
    }

    size(){
        const rows = this.array.length;
        const cols = this.array[0].length;
        return [rows,cols];
    }

    #matmul(B){
        const MA=this.array;
        const MB=B.array;
        const [rowsA,colsA] = this.size();
        const [rowsB,colsB] = B.size();
       
        // Check if multiplication is possible
        if (colsA !== rowsB) {
            throw new Error("Matrix dimensions do not allow multiplication");
        }

        // Initialize result matrix with zeroes
        const result = new Array(rowsA);
        for (let i = 0; i < rowsA; i++) {
            result[i] = new Array(colsB).fill(0);
        }

        // Perform matrix multiplication
        for (let i = 0; i < rowsA; i++) {
            for (let j = 0; j < colsB; j++) {
                for (let k = 0; k < colsA; k++) {
                    result[i][j] += MA[i][k] * MB[k][j];
                }
            }
        }

        return new Matrix(result);
    }

    #scalarmul(B){
        return new Matrix(this.array.map(row => row.map(element => element * scalar)));
    }

    #vecmul(B){
        if(this.size()[1]!==B.size())
            throw new Error("Matrix dimensions do not allow matrix vector multiplication");
        const Barr=B.array;
        return new Vector(
            this.array.map(row => 
                row.reduce((sum, val, idx) => 
                    sum + val * Barr[idx], 0)
        ));
    }
  
    mul(B){
        if(B instanceof Matrix)return this.#matmul(B);
        if(B instanceof Vector)return this.#vecmul(B);
        if(typeof value === "number")return this.#scalarmul(B);
        throw new TypeError(`Incompatible types for matmul: ${typeof this} and ${typeof B}`);
    }

    add(B) {//TODO check type and add skalar addition
        const [rowsA, colsA] = this.size();
        const [rowsB, colsB] = B.size();

        // Check if matrices have the same dimensions
        if (rowsA !== rowsB || colsA !== colsB) {
            throw new Error("Matrices must have the same dimensions for addition");
        }

        // Perform element-wise addition
        const result = this.array.map((row, i) =>
            row.map((val, j) => val + B.array[i][j])
        );

        return new Matrix(result);
    }

    // Subtract two matrices
    sub(B) {
        const [rowsA, colsA] = this.size();
        const [rowsB, colsB] = B.size();

        // Check if matrices have the same dimensions
        if (rowsA !== rowsB || colsA !== colsB) {
            throw new Error("Matrices must have the same dimensions for subtraction");
        }

        // Perform element-wise subtraction
        const result = this.array.map((row, i) =>
            row.map((val, j) => val - B.array[i][j])
        );

        return new Matrix(result);
    }

    // Function to compute the rotation matrix around an arbitrary axis k by an angle theta (in radians)
    static rotationMatrix(k, theta) {
        // Normalize k to ensure it's a unit vector
        k = k.normalize().array;
    
        // Cosine and Sine of the angle
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);
    
        // Identity matrix (3x3)
        const identity = [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ];
    
        // Outer product of k with itself (k * k^T)
        const outerProduct = [
            [k[0] * k[0], k[0] * k[1], k[0] * k[2]],
            [k[1] * k[0], k[1] * k[1], k[1] * k[2]],
            [k[2] * k[0], k[2] * k[1], k[2] * k[2]]
        ];
    
    
        // Cross-product matrix of k
        const crossMatrix = [
            [0, -k[2], k[1]],  // First row
            [k[2], 0, -k[0]],  // Second row
            [-k[1], k[0], 0]   // Third row
        ];
    
        // Rotation matrix = I * cos(theta) + (1 - cos(theta)) * (k * k^T) + sin(theta) * [k]_{\times}
        const rotationMat = identity.map((row, i) => 
            row.map((val, j) => 
            val * cosTheta +
            (outerProduct[i][j] * (1 - cosTheta)) +
            crossMatrix[i][j] * sinTheta
            )
        );
    
        return new Matrix(rotationMat);
    }

    
    // Static method to create an identity matrix of given size
    static eye(size) {
        if (typeof size !== 'number' || size <= 0) {
            throw new Error("Size must be a positive integer");
        }
        
        const identity = [];
        for (let i = 0; i < size; i++) {
            const row = new Array(size).fill(0);  // Fill the row with 0s
            row[i] = 1;  // Set the diagonal element to 1
            identity.push(row);
        }
        
        return new Matrix(identity);
    }

    orthogonalize() {
        //https://stackoverflow.com/questions/23080791/eigen-re-orthogonalization-of-rotation-matrix
        // i modified it a little
        if (this.size()[0] !== 3 || this.size()[1] !== 3) {
            throw new Error("This method only works for 3x3 matrices.");
        }

        const [x, y, z] = this.array.map( val=>new Vector(val));

        const error = x.dot(y)/2;

        // Spread the error equally between x and y
        const x_ort = x.sub(y.mul(error));
        const y_ort = y.sub(x.mul(error));


        //const z_ort = x_ort.cross(y_ort);


        const x_new = x_ort.mul(0.5 * (3 - x_ort.dot(x_ort)));
        const y_new = y_ort.mul(0.5 * (3 - y_ort.dot(y_ort)));
        //const z_new = z_ort.mul(0.5 * (3 - z_ort.dot(z_ort)));

        let z_new = x_new.cross(y_new);

        // If z_new's dot product with original z is negative, flip z_new
        if (z_new.dot(z) < 0) {
            z_new = z_new.mul(-1);
        }

        const orthogonalMatrix = new Matrix([x_new.array, y_new.array, z_new.array]);

        return orthogonalMatrix;
    }

    transpose() {
      
        const arr=this.array;  
        const [rows,cols] = this.size();
        const transposed = [];
      
        for (let i = 0; i < cols; i++) {
          transposed[i] = [];
          for (let j = 0; j < rows; j++) {
            transposed[i][j] = arr[j][i];
          }
        }
      
        return new Matrix(transposed);
    }
}

/*
class Multidual{
    constructor(f,dx,dy,dz,d1,d2,d3){
        this.f=f;
        this.dx=dx;
        this.dy=dy;
        this.dz=dz;
        this.d1=d1;
        this.d2=d2;
        this.d3=d3;
    }
    add(other){//TODO add typechecks
        if(typeof other === "number")return new Multidual(this.f+other,this.dx,this.dy,this.dz,this.d1,this.d2,this.d3);
        return new Multidual(this.f+other.f,this.dx+other.dx,this.dy+other.dy,this.dz+other.dz,this.d1+other.d1,this.d2+other.d2,this.d3+other.d3);
    }
    sub(other){//TODO add typechecks
        if(typeof other === "number")return new Multidual(this.f-other,this.dx,this.dy,this.dz,this.d1,this.d2,this.d3);
        return new Multidual(this.f-other.f,this.dx-other.dx,this.dy-other.dy,this.dz-other.dz,this.d1-other.d1,this.d2-other.d2,this.d3-other.d3);
    }
    mul(other){//TODO add typechecks
        if(typeof other === "number")return new Multidual(other*this.f,other*this.dx,other*this.dy,other*this.dz,other*this.d1,other*this.d2,other*this.d3);
        return new Multidual(
            this.f*other.f,
            this.dx*other.f+this.f*other.dx,
            this.dy*other.f+this.f*other.dy,
            this.dz*other.f+this.f*other.dz,
            this.d1*other.f+this.f*other.d1,//d1
            this.d2*other.f+2*this.d1*other.d1+this.f*other.d2,//d2
            this.d3*other.f+3*(this.d2*other.d1+this.d1*other.d2)+this.f*other.d3//d3
        );
    }
    square(){
        return this.mul(this);
    }
    sqrt(){
        const sqrtf=Math.sqrt(this.f);
        const halfinvsqrt=1/(2*sqrtf);
        return new Multidual(sqrtf,this.dx*halfinvsqrt,this.dy*halfinvsqrt,this.dz*halfinvsqrt,this.d1*halfinvsqrt,(2*this.f*this.d2-this.d1*this.d1)/(4*this.f*sqrtf),this.d3*halfinvsqrt-3*this.d1*(2*this.f*this.d2-this.d1*this.d1)/(8*this.f*this.f*sqrtf));
    }
}*/

class Multidual {
    constructor(f, dx, dy, dz, d1, d2, d3) {
        this.f = f;
        this.dx = dx;
        this.dy = dy;
        this.dz = dz;
        this.d1 = d1;
        this.d2 = d2;
        this.d3 = d3;
    }

    static promote(x) {
        return (x instanceof Multidual) ? x : new Multidual(x, 0, 0, 0, 0, 0, 0);
    }

    add(other) {
        other = Multidual.promote(other);
        return new Multidual(
            Vector.add(this.f, other.f),
            Vector.add(this.dx, other.dx),
            Vector.add(this.dy, other.dy),
            Vector.add(this.dz, other.dz),
            Vector.add(this.d1, other.d1),
            Vector.add(this.d2, other.d2),
            Vector.add(this.d3, other.d3)
        );
    }

    sub(other) {
        other = Multidual.promote(other);
        return new Multidual(
            Vector.sub(this.f, other.f),
            Vector.sub(this.dx, other.dx),
            Vector.sub(this.dy, other.dy),
            Vector.sub(this.dz, other.dz),
            Vector.sub(this.d1, other.d1),
            Vector.sub(this.d2, other.d2),
            Vector.sub(this.d3, other.d3)
        );
    }

    mul(other) {
        other = Multidual.promote(other);
        const f = Vector.mul(this.f, other.f);
        const dx = Vector.add(Vector.mul(this.dx, other.f), Vector.mul(this.f, other.dx));
        const dy = Vector.add(Vector.mul(this.dy, other.f), Vector.mul(this.f, other.dy));
        const dz = Vector.add(Vector.mul(this.dz, other.f), Vector.mul(this.f, other.dz));
        const d1 = Vector.add(Vector.mul(this.d1, other.f), Vector.mul(this.f, other.d1));
        const d2 = Vector.add(
            Vector.mul(this.d2, other.f),
            Vector.add(Vector.mul(this.d1, other.d1), Vector.mul(this.d1, other.d1)) // 2*this.d1*other.d1
        );
        const d2_scaled = Vector.add(d2, Vector.mul(this.f, other.d2));
        const d3 = Vector.add(
            Vector.mul(this.d3, other.f),
            Vector.add(
                Vector.mul(this.d2, Vector.mul(other.d1, 3)),
                Vector.add(Vector.mul(this.d1, Vector.mul(other.d2, 3)), Vector.mul(this.f, other.d3))
            )
        );
        return new Multidual(f, dx, dy, dz, d1, d2_scaled, d3);
    }

    square() {
        return this.mul(this);
    }

    sqrt() {
        const sqrtf = Vector.sqrt(this.f);
        const halfInvSqrt = Vector.div(1, Vector.mul(2, sqrtf));
        const f2 = Vector.mul(2, this.f);
        const fourfsqrtf = Vector.mul(4, Vector.mul(this.f, sqrtf));
        const eightf2sqrtf = Vector.mul(8, Vector.mul(Vector.mul(this.f, this.f), sqrtf));

        const dx = Vector.mul(this.dx, halfInvSqrt);
        const dy = Vector.mul(this.dy, halfInvSqrt);
        const dz = Vector.mul(this.dz, halfInvSqrt);
        const d1 = Vector.mul(this.d1, halfInvSqrt);

        const term = Vector.sub(Vector.mul(f2, this.d2), Vector.mul(this.d1, this.d1));
        const d2 = Vector.div(term, fourfsqrtf);

        const term3 = Vector.mul(this.d3, halfInvSqrt);
        const correction = Vector.mul(this.d1, term);
        const d3 = Vector.sub(term3, Vector.div(Vector.mul(3, correction), eightf2sqrtf));

        return new Multidual(sqrtf, dx, dy, dz, d1, d2, d3);
    }

    div(other) {
        //this function was generated by chatgpt so it might be bad 
        other = Multidual.promote(other);
    
        const invg = Vector.div(1, other.f);
        const f = Vector.mul(this.f, invg);
    
        const g2 = Vector.mul(other.f, other.f);
        const g3 = Vector.mul(g2, other.f);
        const g4 = Vector.mul(g2, g2);
    
        // First derivatives
        const dx = Vector.div(
            Vector.sub(Vector.mul(this.dx, other.f), Vector.mul(this.f, other.dx)),
            g2
        );
        const dy = Vector.div(
            Vector.sub(Vector.mul(this.dy, other.f), Vector.mul(this.f, other.dy)),
            g2
        );
        const dz = Vector.div(
            Vector.sub(Vector.mul(this.dz, other.f), Vector.mul(this.f, other.dz)),
            g2
        );
        const d1 = Vector.div(
            Vector.sub(Vector.mul(this.d1, other.f), Vector.mul(this.f, other.d1)),
            g2
        );
    
        // Second derivative
        const num2 = Vector.sub(
            Vector.mul(this.d2, other.f),
            Vector.add(
                Vector.mul(Vector.mul(this.d1, other.d1), 2),
                Vector.mul(this.f, other.d2)
            )
        );
        const d2 = Vector.div(num2, g2);
    
        // Third derivative
        const t1 = Vector.mul(this.d3, other.f);
        const t2 = Vector.mul(this.d2, Vector.mul(other.d1, 3));
        const t3 = Vector.mul(this.d1, Vector.mul(other.d2, 3));
        const t4 = Vector.mul(this.f, other.d3);
        const num3 = Vector.sub(t1, Vector.add(t2, Vector.add(t3, t4)));
        const d3 = Vector.div(num3, g2);
    
        return new Multidual(f, dx, dy, dz, d1, d2, d3);
    }
}


class Complex {
    constructor(real, imag) {
      if (real instanceof Complex) {
        // Copy constructor
        this.real = real.real;
        this.imag = real.imag;
      } else {
        this.real = real || 0;
        this.imag = imag || 0;
      }
    }

    static complexify(x){
        if (typeof other === "Complex")return x;
        return new Complex(other);
    }
  
    add(other) {
      if (typeof other === "number") other = new Complex(other);
      return new Complex(this.real + other.real, this.imag + other.imag);
    }
  
    sub(other) {
      if (typeof other === "number") other = new Complex(other);
      return new Complex(this.real - other.real, this.imag - other.imag);
    }
  
    multiply(other) {
      if (typeof other === "number") other = new Complex(other);
      return new Complex(
        this.real * other.real - this.imag * other.imag,
        this.real * other.imag + this.imag * other.real
      );
    }
  
    div(other) {
      if (typeof other === "number") other = new Complex(other);
      const denom = other.real * other.real + other.imag * other.imag;
      return new Complex(
        (this.real * other.real + this.imag * other.imag) / denom,
        (this.imag * other.real - this.real * other.imag) / denom
      );
    }

    inv() {
        const denom = this.real * this.real + this.imag * this.imag;
        return new Complex(
          (this.real) / denom,
          (- this.imag) / denom
        );
    }
  
    square() {
      return this.multiply(this);
    }
  
    sqrt() {
      const r = this.abs();
  
      if (this.real < 0 && this.imag === 0) {
        // Negative real number case: sqrt(-r) = i * sqrt(r)
        return new Complex(0, Math.sqrt(r));
      }
  
      const z_plus_r = this.add(r);
      const mod_z_plus_r = Math.sqrt(z_plus_r.real ** 2 + z_plus_r.imag ** 2);
  
      return new Complex(
        Math.sqrt(r) * (z_plus_r.real / mod_z_plus_r),
        Math.sqrt(r) * (z_plus_r.imag / mod_z_plus_r)
      );
    }
  
    abs() {
      return Math.sqrt(this.real * this.real + this.imag * this.imag);
    }
  
    conjugate() {
      return new Complex(this.real, -this.imag);
    }
  
    toString() {
      return `${this.real} + ${this.imag}i`;
    }
  }

class Complexdual{
    constructor(f,d1,d2){
        this.f =Complex.complexify(f );
        this.d1=Complex.complexify(d1);
        this.d2=Complex.complexify(d2);
    }
    add(other){//TODO add typechecks
        if(typeof other === "number")return new Complexdual(this.f.add(other),this.d1,this.d2);
        return new Complexdual(this.f.add(other.f),this.d1.add(other.d1),this.d2.add(other.d2));
    }
    sub(other){//TODO add typechecks
        if(typeof other === "number")return new Complexdual(this.f.sub(other),this.d1,this.d2);
        return new Complexdual(this.f.sub(other.f),this.d1.sub(other.d1),this.d2.sub(other.d2));
    }
    mul(other){//TODO add typechecks
        if(typeof other === "number")return new Complexdual(this.f.mul(other),this.d1.mul(other),this.d2.mul(other));
        return new Complexdual(
            this.f.mul(other.f),
            this.d1.mul(other.f).add(this.f.mul(other.d1)),//d1
            this.d2.mul(other.f).add(mul(this.d1).mul(other.d1).mul(2)).add(this.f.mul(other.d2))//d2
        );
    }
    square(){
        return this.mul(this);
    }
    sqrt(){
        const sqrtf=this.f.sqrt();

        return new Complexdual(sqrtf,this.d1.div(sqrtf.mul(2)),(this.f.mul(this.d2).mul(2).sub(this.d1.square())).div(this.f.mul(sqrtf).mul(4)));
    }
}
//-1/4*f(x)**(-3/2)*f'(x)**2+1/2*f(x)**(-1/2)*f''(x)

//-f'/(4*f**(3/2))+f''*(2*f**(1/2))