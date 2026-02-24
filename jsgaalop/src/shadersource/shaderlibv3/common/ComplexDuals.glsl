
#define Complex vec2
Complex ComplexAdd(Complex a, Complex b) {return a+b;}
Complex ComplexAdd(float a, Complex b) {return Complex(a + b.x,b.y);}
Complex ComplexAdd(Complex a, float b) {return ComplexAdd(b,a);}
Complex ComplexSub(float a, Complex b) {return Complex(a - b.x,b.y);}
Complex ComplexSub(Complex a, float b) {return Complex(a.x-b,a.y);}
Complex ComplexSub(Complex a, Complex b) {return a-b;}

Complex ComplexMul(Complex a, Complex b) {
    // Complex multiplication: (a.x + i*a.y) * (b.x + i*b.y)
    return Complex(
        a.x * b.x - a.y * b.y, // Real part
        a.x * b.y + a.y * b.x  // Imaginary part
    );
}
Complex ComplexMul(Complex a, float b) {return a*b;}
Complex ComplexMul(float a, Complex b) {return a*b;}
Complex ComplexSquare(Complex a) {
    // Complex multiplication: (a.x + i*a.y) * (b.x + i*b.y)
    return Complex(
        a.x * a.x - a.y * a.y, // Real part
        2.0 * a.x * a.y  // Imaginary part
    );
}
Complex ComplexDiv(Complex a, Complex b) {
    // Complex division: (a.x + i*a.y) / (b.x + i*b.y)
    return Complex(
        (a.x * b.x + a.y * b.y) ,
        (a.y * b.x - a.x * b.y)
    ) / dot(b,b);
}
Complex ComplexDiv(Complex a, Complex b,float eps) {
    // Complex division: (a.x + i*a.y) / (b.x + i*b.y)
    return Complex(
        (a.x * b.x + a.y * b.y) ,
        (a.y * b.x - a.x * b.y)
    ) / max(dot(b,b),eps);
}
Complex ComplexInv(Complex a) {
    // Complex division: 1 / (a.x + i*a.y)
    return a*Complex(1,-1) / dot(a,a);
}
Complex ComplexConjugate(Complex a) {
    return a*Complex(1,-1);
}

#define DualComplex vec4

DualComplex DualComplexMul(DualComplex a,DualComplex b){
    return DualComplex(ComplexMul(a.xy,b.xy),ComplexMul(a.xy,b.zw)+ComplexMul(a.zw,b.xy));
}
DualComplex DualComplexSqare(DualComplex a){
    return DualComplex(ComplexSquare(a.xy),2.0*ComplexMul(a.xy,a.zw));
}
DualComplex DualComplexAdd(DualComplex a,float b){
    return DualComplex(a.x+b, a.yzw);
}
DualComplex DualComplexAdd(float a,DualComplex b){
    return DualComplexAdd(b,a);
}
DualComplex DualComplexInv(DualComplex a){
    Complex inv = ComplexInv(a.xy);        
    Complex dualPart = -ComplexMul(a.zw,ComplexSquare(inv)); 
  	return DualComplex(inv, dualPart);     // negate dual part
}
DualComplex DualComplexDiv(DualComplex a, DualComplex b){
    return DualComplexMul(a, DualComplexInv(b));
}
