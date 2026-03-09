#version 300 es
precision mediump float;


#define ACTIVATE_DEBUG_COLOR



#include "../../common/utilfrag.glsl"
#include "../../common/RevalGenerator.glsl"



//https://momentsingraphics.de/GPUPolynomialRoots.html
#define NO_INTERSECTION 3.4e38
#define MAX_DEGREE basismaxdegree

// Searches a single root of a polynomial within a given interval.
// \param out_root The location of the found root.
// \param out_end_value The value of the given polynomial at end.
// \param poly Coefficients of the polynomial for which a root should be found.
//        Coefficient poly[i] is multiplied by x^i.
// \param begin The beginning of an interval where the polynomial is monotonic.
// \param end The end of said interval.
// \param begin_value The value of the given polynomial at begin.
// \param error_tolerance The error tolerance for the returned root location.
//        Typically the error will be much lower but in theory it can be
//        bigger.
// \return true if a root was found, false if no root exists.
bool newton_bisection(out float out_root, out float out_end_value,
    float poly[MAX_DEGREE + 1], float begin, float end,
    float begin_value, float error_tolerance)
{
    if (begin == end) {
        out_end_value = begin_value;
        return false;
    }
    // Evaluate the polynomial at the end of the interval
    out_end_value = poly[MAX_DEGREE];
    //[[unroll]]
    for (int i = MAX_DEGREE - 1; i != -1; --i)
        out_end_value = out_end_value * end + poly[i];
    // If the values at both ends have the same non-zero sign, there is no root
    if (begin_value * out_end_value > 0.0)
        return false;
    // Otherwise, we find the root iteratively using Newton bisection (with
    // bounded iteration count)
    float current = 0.5 * (begin + end);
    //[[loop]]
    for (int i = 0; i != 90; ++i) {
        // Evaluate the polynomial and its derivative
        float value = poly[MAX_DEGREE] * current + poly[MAX_DEGREE - 1];
        float derivative = poly[MAX_DEGREE];
        //[[unroll]]
        for (int j = MAX_DEGREE - 2; j != -1; --j) {
            derivative = derivative * current + value;
            value = value * current + poly[j];
        }
        // Shorten the interval
        bool right = begin_value * value > 0.0;
        begin = right ? current : begin;
        end = right ? end : current;
        // Apply Newton's method
        float guess = current - value / derivative;
        // Pick a guess
        float middle = 0.5 * (begin + end);
        float next = (guess >= begin && guess <= end) ? guess : middle;
        // Move along or terminate
        bool done = abs(next - current) < error_tolerance;
        current = next;
        if (done)
            break;
    }
    out_root = current;
    return true;
}


// Finds all roots of the given polynomial in the interval [begin, end] and
// writes them to out_roots. Some entries will be NO_INTERSECTION but other
// than that the array is sorted. The last entry is always NO_INTERSECTION.
void find_roots(out float out_roots[MAX_DEGREE + 1], float poly[MAX_DEGREE + 1], float begin, float end) {
    float tolerance = (end - begin) * 1.0e-4;
    // Construct the quadratic derivative of the polynomial. We divide each
    // derivative by the factorial of its order, such that the constant
    // coefficient can be copied directly from poly. That is a safeguard
    // against overflow and makes it easier to avoid spilling below. The
    // factors happen to be binomial coefficients then.
    float derivative[MAX_DEGREE + 1];
    derivative[0] = poly[MAX_DEGREE - 2];
    derivative[1] = float(MAX_DEGREE - 1) * poly[MAX_DEGREE - 1];
    derivative[2] = (0.5 * float((MAX_DEGREE - 1) * MAX_DEGREE)) * poly[MAX_DEGREE - 0];
    //[[unroll]]
    for (int i = 3; i != MAX_DEGREE + 1; ++i)
        derivative[i] = 0.0;
    // Compute its two roots using the quadratic formula
    float discriminant = derivative[1] * derivative[1] - 4.0 * derivative[0] * derivative[2];
    if (discriminant >= 0.0) {
        float sqrt_discriminant = sqrt(discriminant);
        float scaled_root = derivative[1] + ((derivative[1] > 0.0) ? sqrt_discriminant : (-sqrt_discriminant));
        float root_0 = clamp(-2.0 * derivative[0] / scaled_root, begin, end);
        float root_1 = clamp(-0.5 * scaled_root / derivative[2], begin, end);
        out_roots[MAX_DEGREE - 2] = min(root_0, root_1);
        out_roots[MAX_DEGREE - 1] = max(root_0, root_1);
    }
    else {
        // Indicate that the cubic derivative has a single root
        out_roots[MAX_DEGREE - 2] = begin;
        out_roots[MAX_DEGREE - 1] = begin;
    }
    // The last entry in the root array is set to end to make it easier to
    // iterate over relevant intervals, all untouched roots are set to begin
    out_roots[MAX_DEGREE] = end;
    //[[unroll]]
    for (int i = 0; i != MAX_DEGREE - 2; ++i)
        out_roots[i] = begin;
    // Work your way up to derivatives of higher degree until you reach the
    // polynomial itself. This implementation may seem peculiar: It always
    // treats the derivative as though it had degree MAX_DEGREE and it
    // constructs the derivatives in a contrived way. Changing that would
    // reduce the number of arithmetic instructions roughly by a factor of two.
    // However, it would also cause register spilling, which has a far more
    // negative impact on the overall run time. Profiling indicates that the
    // current implementation has no spilling whatsoever.
    //[[loop]]
    for (int degree = 3; degree != MAX_DEGREE + 1; ++degree) {
        // Take the integral of the previous derivative (scaled such that the
        // constant coefficient can still be copied directly from poly)
        float prev_derivative_order = float(MAX_DEGREE + 1 - degree);
        //[[unroll]]
        for (int i = MAX_DEGREE; i != 0; --i)
            derivative[i] = derivative[i - 1] * (prev_derivative_order * (1.0 / float(i)));
        // Copy the constant coefficient without causing spilling. This part
        // would be harder if the derivative were not scaled the way it is.
        //[[unroll]]
        for (int i = 0; i != MAX_DEGREE - 2; ++i)
            derivative[0] = (degree == MAX_DEGREE - i) ? poly[i] : derivative[0];
        // Determine the value of this derivative at begin
        float begin_value = derivative[MAX_DEGREE];
        //[[unroll]]
        for (int i = MAX_DEGREE - 1; i != -1; --i)
            begin_value = begin_value * begin + derivative[i];
        // Iterate over the intervals where roots may be found
        //[[unroll]]
        for (int i = 0; i != MAX_DEGREE; ++i) {
            if (i < MAX_DEGREE - degree)
                continue;
            float current_begin = out_roots[i];
            float current_end = out_roots[i + 1];
            // Try to find a root
            float root;
            if (newton_bisection(root, begin_value, derivative, current_begin, current_end, begin_value, tolerance))
                out_roots[i] = root;
            else if (degree < MAX_DEGREE)
                // Create an empty interval for the next iteration
                out_roots[i] = out_roots[i - 1];
            else
                out_roots[i] = NO_INTERSECTION;
        }
    }
    // We no longer need this array entry
    out_roots[MAX_DEGREE] = NO_INTERSECTION;
}

const int ABERTH_MAXITER = 40;
const float ABERTH_THRESHOLD = 1e-3;
const float ROOT_ZERRO_THRESHOLD = 1e-4;

#define NUM_ROOTS basismaxdegree
//#define polylen basismaxdegree+1

void aberth_method(inout Complex[NUM_ROOTS] roots, vec3 rayDir, vec3 rayOrigin,int maxiter) {
    for (int iter = 0; iter < maxiter; iter++) {
        float max_change = 0.0; // Track the largest change in roots

        for (int k = 0; k < NUM_ROOTS; k++) {
            // Evaluate the polynomial and its derivative at the current root
            DualComplex res=DCrowR(rayDir,rayOrigin,roots[k]);
            Complex a = ComplexDiv(
                res.xy,
                res.zw
            );


        
            Complex s = Complex(0.0); // Summation term
            for (int j = 0; j < NUM_ROOTS; j++) {
                if (j != k) {
                    Complex diff = roots[k] - roots[j];
                    s += ComplexInv(diff);
                }
            }
        

            // Compute the correction term
            Complex w = ComplexDiv(a, Complex(1.0, 0.0) - ComplexMul(a, s));
            if(any(isnan(w))||any(isinf(w)))continue;
            roots[k] -= w; // Update the root

            // Track the maximum change in root
            max_change = float(max(max_change, length(w)));
        }
        

        // If the maximum change is smaller than the threshold, stop early
        /*if (max_change < ABERTH_THRESHOLD) {
            //debugcolor(vec3(float(iter+1)/float(ABERTH_MAXITER)));
            break; // Converged, exit the loop
        }*/
    }
}


void aberth_method2(inout Complex[NUM_ROOTS] roots, vec3 rayDir, vec3 rayOrigin) {
    for (int iter = 0; iter < 1; iter++) {
        float max_change = 0.0; // Track the largest change in roots

        for (int k = 0; k < NUM_ROOTS; k++) {
            // Evaluate the polynomial and its derivative at the current root
            DualComplex res=DCsusR(rayDir,rayOrigin,roots[k]);
            Complex a = ComplexDiv(
                res.xy,
                res.zw
            );


        
            Complex s = Complex(0.0); // Summation term
            for (int j = 0; j < NUM_ROOTS; j++) {
                if (j != k) {
                    Complex diff = roots[k] - roots[j];
                    s += ComplexInv(diff);
                }
            }
        

            // Compute the correction term
            Complex w = ComplexDiv(a, Complex(1.0, 0.0) - ComplexMul(a, s));
            if(any(isnan(w))||any(isinf(w)))continue;
            roots[k] -= w; // Update the root

            // Track the maximum change in root
            max_change = float(max(max_change, length(w)));
        }
        

        // If the maximum change is smaller than the threshold, stop early
        if (max_change < ABERTH_THRESHOLD) {
            //debugcolor(vec3(float(iter+1)/float(ABERTH_MAXITER)));
            break; // Converged, exit the loop
        }
    }
}


void aberth_method3(inout Complex[NUM_ROOTS] roots,float[NUM_ROOTS+1] coeffs,int maxiter) {
    for (int iter = 0; iter < maxiter; iter++) {
        float max_change = 0.0; // Track the largest change in roots

        for (int k = 0; k < NUM_ROOTS; k++) {
            // Evaluate the polynomial and its derivative at the current root
            DualComplex res=DChorner(roots[k],coeffs);//DCsusR(rayDir,rayOrigin,roots[k]);
            Complex a = ComplexDiv(
                res.xy,
                res.zw
            );


        
            Complex s = Complex(0.0); // Summation term
            for (int j = 0; j < NUM_ROOTS; j++) {
                if (j != k) {
                    Complex diff = roots[k] - roots[j];
                    s += ComplexInv(diff);
                }
            }
        

            // Compute the correction term
            Complex w = ComplexDiv(a, Complex(1.0, 0.0) - ComplexMul(a, s));
            if(any(isnan(w))||any(isinf(w)))continue;
            roots[k] -= w; // Update the root

            // Track the maximum change in root
            max_change = float(max(max_change, length(w)));
        }
        

        // If the maximum change is smaller than the threshold, stop early
        if (max_change < ABERTH_THRESHOLD) {
            //debugcolor(vec3(float(iter+1)/float(ABERTH_MAXITER)));
            break; // Converged, exit the loop
        }
    }
}

void initial_roots(out Complex[NUM_ROOTS] roots) {
    const Complex r1 = Complex(cos(goldenangle), sin(goldenangle)); // Base complex number
    roots[0]=r1;
    for (int i = 1; i < NUM_ROOTS; i++) {
        roots[i] = ComplexMul(r1, roots[i-1]);
    }
}
void initial_roots(out Complex[NUM_ROOTS] roots,Complex center) {
    initial_roots(roots);
    for (int i = 0; i < NUM_ROOTS; i++) roots[i]+=center;
}

float calcscale(float[NUM_ROOTS+1] coeffs){
    //from https://dl.acm.org/doi/epdf/10.1145/2699468
    //Algorithm 954: An Accurate and Efﬁcient Cubic and QuarticEquation Solver for Physical ApplicationsN. FLOCKE, Flash Center for Computational Science, University of Chicago
    float m=0.;
    float leadinv = 1./coeffs[NUM_ROOTS];
    for(int i=0;i<NUM_ROOTS;i++)
        m=max(m,
            pow(abs(coeffs[i]*leadinv),1./float(NUM_ROOTS-i))
        );
    //all real roots are in intervall [-2m,2m]
    return m;
}

void Raymarch(vec3 rayDir, vec3 rayOrigin,out float error,out float xmin,vec2 v_rayDirXY) {
    
    
    //inout Complex[NUM_ROOTS] roots, vec3 rayDir, vec3 rayOrigin
    //aberth_method(roots,rayDir,rayOrigin);
    //aberth_method2(roots,rayDir,rayOrigin);
    float[NUM_ROOTS+1] xi;
    makeChebyshevNodes(xi);
    float[NUM_ROOTS+1] coeffs;
    float[NUM_ROOTS+1] yi;
    for(int i=0;i<NUM_ROOTS+1;i++) yi[i]=rowR(rayOrigin+rayDir*xi[i]);
    makeCoeffs(yi,coeffs);

Complex[NUM_ROOTS] roots;
    if(v_rayDirXY.y>0.){
        float m=calcscale(coeffs);
        //float minv=1./m;
        //real roots are in [-2m,2m] but we onlycare about positive roots so [0,2m]
        //now we can remap [0,2m] to [-1,1] so x=>x/m-1  the inverse mapping is x=>(x+1)*m
        //for(int i=0;i<NUM_ROOTS+1;i++)xi[i]=xi[i]*minv-1.;
        //for(int i=0;i<NUM_ROOTS+1;i++) yi[i]=rowR(rayOrigin+rayDir*xi[i]);
        if(v_rayDirXY.x>0.)for(int i=0;i<NUM_ROOTS+1;i++) yi[i]=rowR(rayOrigin+rayDir*(xi[i]+1.)*m);
        else for(int i=0;i<NUM_ROOTS+1;i++) yi[i]=rowR(rayOrigin+rayDir*xi[i]*m*2.);
        
        makeCoeffs(yi,coeffs);
        for(int i=0;i<NUM_ROOTS;i++)coeffs[i]/=coeffs[NUM_ROOTS];
        coeffs[NUM_ROOTS]=1.;



        
        initial_roots(roots);
        //aberth_method2(roots,rayDir,rayOrigin);
        aberth_method3(roots,coeffs,40);
        if(v_rayDirXY.x>0.) for(int i=0;i<NUM_ROOTS;i++)roots[i].x=(roots[i].x+1.)*m;//remap back to [0,2m]
        else for(int i=0;i<NUM_ROOTS;i++)roots[i].x=roots[i].x*m*2.;//remap back to [0,2m]
    }else {
        float m=calcscale(coeffs);
        //float minv=1./m;
        //real roots are in [-2m,2m] but we onlycare about positive roots so [0,2m]
        //now we can remap [0,2m] to [-1,1] so x=>x/m-1  the inverse mapping is x=>(x+1)*m
        //for(int i=0;i<NUM_ROOTS+1;i++)xi[i]=xi[i]*minv-1.;
        //for(int i=0;i<NUM_ROOTS+1;i++) yi[i]=rowR(rayOrigin+rayDir*xi[i]);
        if(v_rayDirXY.x>0.)for(int i=0;i<NUM_ROOTS+1;i++) yi[i]=rowR(rayOrigin+rayDir*(xi[i]+1.)*m);
        else for(int i=0;i<NUM_ROOTS+1;i++) yi[i]=rowR(rayOrigin+rayDir*xi[i]*m*2.);
        
        makeCoeffs(yi,coeffs);
        for(int i=0;i<NUM_ROOTS;i++)coeffs[i]/=coeffs[NUM_ROOTS];
        coeffs[NUM_ROOTS]=1.;



        
        initial_roots(roots);
        //aberth_method2(roots,rayDir,rayOrigin);
        //aberth_method3(roots,coeffs,40);
        if(v_rayDirXY.x>0.)  {
            float[NUM_ROOTS+1] froots;
            find_roots(froots,coeffs,-1.,1.);
            for(int i=0;i<NUM_ROOTS;i++)roots[i].x=(froots[i]+1.)*m;//remap back to [0,2m]
        }
        else for(int i=0;i<NUM_ROOTS;i++){
            float[NUM_ROOTS+1] froots;
            find_roots(froots,coeffs,0.,1.);
            roots[i].x=froots[i]*m*2.;//remap back to [0,2m]
        }

    }
    Complex[NUM_ROOTS] roots2;
    initial_roots(roots2);
    aberth_method(roots2,rayDir,rayOrigin,20);
    //aberth_method(roots,rayDir,rayOrigin);
    float xmin2=inf;
    for(int i = 0; i < NUM_ROOTS; ++i){
        Complex r=roots2[i];
        //r.y=abs(r.y);
        
        if(r.x<0.)continue;
        float y=susR(rayDir*r.x+rayOrigin);
        if(r.x<xmin2 && y<ROOT_ZERRO_THRESHOLD){
            xmin2=r.x;
        }
    }

    float diff=inf;
    for(int i = 0; i < NUM_ROOTS; ++i)diff=min(diff,abs(xmin2-roots[i].x));
    //debugcolor(vec3(clamp(diff*10.0, 0.0, 1.0))); 


    error=inf;
    xmin=inf;
    for(int i = 0; i < NUM_ROOTS; ++i){
        Complex r=roots[i];
        //r.y=abs(r.y);
        
        if(r.x<0.)continue;
        float y=susR(rayDir*r.x+rayOrigin);

        if(r.x<xmin && y<ROOT_ZERRO_THRESHOLD){
            error=y;
            xmin=r.x;
        }
    }

}



#include "../../common/raycastingmain.glsl"
