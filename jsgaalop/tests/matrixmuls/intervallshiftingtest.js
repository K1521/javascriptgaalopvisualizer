

const container = document.createElement("div");
container.style.width = "100%";
container.style.height = "100%";
container.style.display = "flex";
container.style.flexDirection = "column";

const slider = document.createElement("input");
slider.type = "range";
slider.min = "0";
slider.max = "1";
slider.step = "0.01";
slider.value = "1";
slider.style.width = "100%";
slider.style.flex = "0 0 auto";
slider.style.marginTop = "6px";
container.appendChild(slider);
//setCustom(container);



const traces=[];
const plotDiv = document.createElement('div');
plotDiv.style.width = '100%';
plotDiv.style.height = '100%';  
plotDiv.style.minHeight = '150px'; 
plotDiv.style.overflow= "hidden";
container.appendChild(plotDiv);

setCustom(container);

Plotly.newPlot(plotDiv, traces, {
  autosize: true,
  margin: { l: 30, r: 10, b: 30, t: 30 },
}, { responsive: true });


function updateTrace(trace, x, y) {
  trace.x = x;
  trace.y = y;
}

function redraw() {
  Plotly.react(plotDiv, traces);
}
function binom(n, k) {
  let r = 1;
  for (let i = 1; i <= k; ++i)
    r = r * (n - i + 1) / i;
  return r;
}

function addTrace(name, color=null) {
  const trace = {
    x: [],
    y: [],
    mode: "lines",
    name,
    line: { color }
  };
  traces.push(trace);
  return trace;
}
class Interval {
  constructor(lo, hi = lo) {
    if (lo > hi) [lo, hi] = [hi, lo];
    this.lo = lo;
    this.hi = hi;
  }

  // ---- basic ops ----

  add(b) {
    b = Interval.from(b);
    return new Interval(
      this.lo + b.lo,
      this.hi + b.hi
    );
  }

  sub(b) {
    b = Interval.from(b);
    return new Interval(
      this.lo - b.hi,
      this.hi - b.lo
    );
  }

  mul(b) {
    b = Interval.from(b);
    const p1 = this.lo * b.lo;
    const p2 = this.lo * b.hi;
    const p3 = this.hi * b.lo;
    const p4 = this.hi * b.hi;
    return new Interval(
      Math.min(p1, p2, p3, p4),
      Math.max(p1, p2, p3, p4)
    );
  }

  // ---- helpers ----

  width() {
    return this.hi - this.lo;
  }

  mid() {
    return 0.5 * (this.lo + this.hi);
  }

  contains(x) {
    return x >= this.lo && x <= this.hi;
  }

  toString() {
    return `[${this.lo}, ${this.hi}]`;
  }

  // ---- static ----

  static from(x) {
    return x instanceof Interval ? x : new Interval(x, x);
  }
}

class Polynomial {
  // coeffs: [c0, c1, c2, ...]  (constant first)
  constructor(coeffs) {
    this.coeffs = coeffs.slice();
  }

  degree() {
    return this.coeffs.length - 1;
  }
  eval(x) {
    let r = 0;
    for (let i = this.coeffs.length - 1; i >= 0; --i) {
      r = r * x + this.coeffs[i];
    }
    return r;
  }
   evalArray(xs) {
    return xs.map(x => this.eval(x));
  }
  shift(a) {
    const n = this.degree();
    const out = new Array(n + 1).fill(0);

    for (let i = 0; i <= n; ++i) {
      for (let k = 0; k <= i; ++k) {
        out[k] += this.coeffs[i] * binom(i, k) * Math.pow(a, i - k);
      }
    }

    return new Polynomial(out);
  }
  
  // Horner interval eval
  evalIntervalHorner(ix) {
    ix = Interval.from(ix);
    let r = new Interval(0);

    for (let i = this.coeffs.length - 1; i >= 0; --i) {
      r = r.mul(ix).add(this.coeffs[i]);
    }
    return r;
  }
  


  // Naive interval eval: a + b*x + c*x^2 + ...
  evalIntervalNaive(ix) {
    ix = Interval.from(ix);
    let r = new Interval(0);
    let xp = new Interval(1);

    for (let i = 0; i < this.coeffs.length; ++i) {
      r = r.add(xp.mul(this.coeffs[i]));
      xp = xp.mul(ix);
    }
    return r;
  }

  static fromRoots(roots) {
    let coeffs = [1];
    for (const r of roots) {
      const next = new Array(coeffs.length + 1).fill(0);
      for (let i = 0; i < coeffs.length; ++i) {
        next[i]     -= coeffs[i] * r;
        next[i + 1] += coeffs[i];
      }
      coeffs = next;
    }
    return new Polynomial(coeffs);
  }
}



function linspace(a,b,n=100){
  return Array.from({ length: n }, (_, i) => (a*i+b*(n-i-1))/(n-1));
}

const x=linspace(0,10,200);
let f=new Polynomial([2,2,2]);
f = Polynomial.fromRoots(linspace(0.5,1,4)).shift(-5);
//updateTrace(addTrace("row2"),x,x.map(x=>x*3));
updateTrace(addTrace("f"),x,f.evalArray(x));


const tracelo=addTrace("hornerlo")
const tracehi=addTrace("hornerhi");



function updateIntervalPlots(v){
  const I=new Interval(0,v);

  const horner=x.map(x=>f.evalIntervalHorner(I.add(x)));
  updateTrace(tracelo,x,horner.map(x=>x.lo));
  updateTrace(tracehi,x,horner.map(x=>x.hi));
  redraw();
}



updateIntervalPlots();
slider.addEventListener("input", () => {
  updateIntervalPlots(parseFloat(slider.value));
});

appendLog(f.coeffs);

let s=0;
let w=1000;

for(let i=0;i<100;i++){
	const fx=f.shift(s).evalIntervalHorner(new Interval(0,w));
          //f.evalIntervalHorner(new Interval(s,s+w));
	if(fx.contains(0)){
		w/=2;
		appendLog(`${i} ${s} ${s+w} ${w} ${fx.lo} ${fx.hi}`);
	}else{
    	s+=w;
		w*=2;
    }
}









