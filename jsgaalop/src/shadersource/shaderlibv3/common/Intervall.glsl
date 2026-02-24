
#define Intervall vec2 // Interval type: [min, max]
// Interval addition
Intervall IntervallAdd(Intervall a, Intervall b) {
    return Intervall(a.x + b.x, a.y + b.y);
}
Intervall IntervallAdd(float a, Intervall b) {return a+b;}
Intervall IntervallAdd(Intervall a, float b) {return a+b;}

// Interval subtraction
Intervall IntervallSub(Intervall a, Intervall b) {
    return Intervall(a.x - b.y, a.y - b.x);
}
Intervall IntervallSub(float a, Intervall b) {return Intervall(a - b.y, a - b.x);}
Intervall IntervallSub(Intervall a, float b) {return a-b;}

// Interval multiplication
Intervall IntervallMul(Intervall a, Intervall b) {
    float ll = a.x * b.x;
    float lh = a.x * b.y;
    float hl = a.y * b.x;
    float hh = a.y * b.y;
    float lo = min(min(ll, lh), min(hl, hh));
    float hi = max(max(ll, lh), max(hl, hh));
    return Intervall(lo, hi);
}
Intervall IntervallMul(float a, Intervall b) {
    float l = a * b.x;
    float h = a * b.y;
    return Intervall(min(l, h), max(l, h));
}
Intervall IntervallMul(Intervall a, float b) {return IntervallMul(b,a);}

/*// Interval division
Intervall IntervallDiv(Intervall a, Intervall b) {
    if (b.x <= 0.0 && b.y >= 0.0) {
        // Division by interval containing zero is undefined
        return Intervall(-INFINITY, INFINITY);
    }
    float ll = a.x / b.x;
    float lh = a.x / b.y;
    float hl = a.y / b.x;
    float hh = a.y / b.y;
    float lo = min(min(ll, lh), min(hl, hh));
    float hi = max(max(ll, lh), max(hl, hh));
    return Intervall(lo, hi);
}*/

// Interval square
Intervall IntervallSquare(Intervall a) {//this is spelled correcty !!
    if (a.x >= 0.0) return Intervall(a.x * a.x, a.y * a.y);
    if (a.y <= 0.0) return Intervall(a.y * a.y, a.x * a.x);
    float hi = max(a.x * a.x, a.y * a.y);
    return Intervall(0.0, hi);
}

// Interval negation
Intervall IntervallNeg(Intervall a) {
    return Intervall(-a.y, -a.x);
}

bool IntervallContains(Intervall a, float value) {
    return value >= a.x && value <= a.y;
}

// Interval width
float IntervallWidth(Intervall a) {
    return a.y - a.x;
}

// Interval midpoint
float IntervallMidpoint(Intervall a) {
    return (a.x + a.y) * 0.5;
}

bool IntervallOverlap(vec2 a, vec2 b){
    return a.y >= b.x && b.y >= a.x;
}