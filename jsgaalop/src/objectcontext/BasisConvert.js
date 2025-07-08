import { Poly } from "../util/poly.js";
import { pinv, multiply, transpose ,qr} from 'https://cdn.jsdelivr.net/npm/mathjs@14.5.2/+esm';

export class BasisConvert{

   static get dcga(){
    if(this._dcga==undefined){
    const x=Poly.var("_V_X");
    const y=Poly.var("_V_Y");
    const z=Poly.var("_V_Z");
    
    /*const xx=x.mul(x);
    const yy=y.mul(y);
    const zz=z.mul(z);

    const r=xx.add(yy).add(zz);
    const rp=(r.add(1)).mul(0.5);
    const rm=(r.add(-1)).mul(0.5);
    //console.log(r);
    //console.log(rm);

    const xy=x.mul(y);
    const yz=y.mul(z);
    const zx=z.mul(x);

    const xrp=x.mul(rp);
    const xrm=x.mul(rm);
    const yrp=y.mul(rp);
    const yrm=y.mul(rm);
    const zrp=z.mul(rp);
    const zrm=z.mul(rm);

    const rprp=rp.mul(rp);
    const rmrm=rm.mul(rm);
    const rprm=rp.mul(rm);

    const gpuorder = [
      xx, xy, zx, xrm, xrp,
      yy, yz, yrm, yrp,
      zz, zrm, zrp,
      rmrm, rprm, 
      rprp
    ];
    const terms = [//i thought maybe this order is better because it has less therms with high degree in the triangular matrix
      rmrm, rprm, rprp,     // 2 'r's
      xrm, xrp, yrm, yrp, zrm, zrp, // 1 'r'
      xx, xy, zx, yy, yz, zz        // 0 'r'
    ];*/

    const xx=x.mul(x);
    const yy=y.mul(y);
    const zz=z.mul(z);
    const r=xx.add(yy).add(zz);

    //const cgabase=[x,y,z,r,1]



    const xy=x.mul(y);
    const xz=x.mul(z);
    const xr=x.mul(r);

    const yz=y.mul(z);
    const yr=y.mul(r);

    const zr=z.mul(r);

    const rr=r.mul(r);

    const terms = [
      Poly.convert(1),x,y,z,//r, r=xx+yy+zz so not linear independant
      xx,xy,xz,xr,
      yy,yz,yr,
      zz,zr,
      rr
    ];
    



    //const reordering=BasisConvert.makepermutation(terms,gpuorder);


     this._dcga=new BasisConvert(terms);//,reordering);
    }
    return this._dcga;
  }

  static makepermutation(from,to){
    if(from.length!=to.length){throw new Error("length mismatch");}
    if((new Set(to)).size!=to.length){throw new Error("to has duplicate entries");}
    const reorderingmap=new Map(from.map((v,i)=>[v,i]));
    if(reorderingmap.size!=from.length){throw new Error("from has duplicate entries");}
    const reordering=to.map(t=>{
      const v=reorderingmap.get(t);
      if(v===undefined)throw new Error("mismatched entries");
      return v;
    });
    return reordering;
  }

  constructor(outputbasis,gpuorder=undefined) {
    this.outputbasis = outputbasis;
    this.basisdegrees=outputbasis.map(b=>b.degree());

    

    this.gpuorder=gpuorder;// ?? [...outputbasis.keys()];//outputbasis.keys()==range(len(outputbasis))


    // Collect all monomials used in any polynomial in the output basis
    const monoms = [...new Set(outputbasis.flatMap(poly => [...poly.coeffs.keys()]))];
    this.monoms = monoms;

    // Build the output basis matrix: each column is a basis polynomial's coefficients
    this.outputbasismat = transpose(
      outputbasis.map(basispoly =>
        monoms.map(m => basispoly.coeffs.get(m) ?? 0)
      )
    );

    //console.log(rankQR(this.outputbasismat));
    //throw new Error();

    // Precompute the pseudoinverse for fast conversion
    this.pinv = pinv(this.outputbasismat);
    this.basislength=this.outputbasis.length;
    console.log(this.pinv);

        //console.log(this.outputbasismat);
    //outputbasismat*row=monompoly
  }

  calcMaxDegree(M) {
    let maxDegree = 0;

    for (const row of M) {
      for (let i = 0; i < row.length; i++) {
        const coeff = row[i];
        if (coeff !== 0) {
          maxDegree = Math.max(this.basisdegrees[i], maxDegree);
        }
      }
    }

    return maxDegree;
  }

  reorder(M){
    if(this.gpuorder===undefined)return M;
    return M.map(row=>{
        const reorderedrow=this.gpuorder.map(i=>row[i]);
        return reorderedrow;
      });
  }
  

 
  convert(monompoly){
    //outputbasismat*row=monompoly
    let hits=0;
    const monompolyrow=this.monoms.map(m=>{
      const variable=monompoly.coeffs.get(m);
      if(variable!==undefined)hits+=1;
      return variable ?? 0;
    });
    if(hits<monompoly.coeffs.size)
      throw Error("poly has monoms which are not in this basis :(");
    return multiply(this.pinv, monompolyrow);
  }
}

