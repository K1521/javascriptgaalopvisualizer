import {GaalopGraph,visitnodes,VarOperand,AddOperand,MulOperand,NegOperand,ConstOperand,DivOperand} from "../core/graph2.js";
import { Poly } from "../util/poly.js";
import { pinv, multiply, transpose ,qr} from 'https://cdn.jsdelivr.net/npm/mathjs@14.5.2/+esm';

export class matrixextractor{
  constructor(visgraph,basisconvert){
    this.visgraph=visgraph;
    this.basisconvert=basisconvert;
    this.converted=this.extractPolynomials(this.basisconvert);
  }


  
  M(nodecache,useqr=true){
    //.setuniforms(ctx.nodecache,this.shader);
    const basislength=this.basisconvert.basislength;

    const parameters = this.visgraph.parameters(nodecache);
    parameters.set("",1);//"" stands for no parameter

    let M = this.converted.map(varpolys => {
      // Start with a zero array of appropriate length
      let rowacc = Array.from({ length: basislength }, () => 0);

      for (const [parametername, row] of varpolys) {
        const weight = parameters.get(parametername);
        if (weight === undefined) throw new Error(`Missing parameter: ${parametername}`);

        // Element-wise addition: rowacc += weight * row
        for (let i = 0; i < basislength; i++) {
          rowacc[i] += row[i] * weight;
        }
      }

      return rowacc;
    });

    if(useqr && M.length>1){
      const R=qr(M).R;
      const tol = 1e-12;

      const R_ = R.filter(row =>
        //row.reduce((acc, x) => Math.max(acc, Math.abs(x)), 0) > tol
        row.some(x => Math.abs(x) > tol)
      );
      console.log(R,R_);
      M=R_;
      //return R_;
    } 

    

    //console.log(M);
    return M;
  }

  setuniforms(nodecache,shader){
    /** @type {[]} */
    let M=this.M(nodecache);
    const degree=this.basisconvert.calcMaxDegree(M);
    M=this.basisconvert.reorder(M);//reorder to gpu order

    //console.log(M,shader.getUniformLocation(`M`));

      //for(const [value,i]of M.flat()){
      /*M.flat().forEach((value,i)=>{
        console.log(value,i,shader.getUniformLocation(`M[${i}]`));
        shader.gl.uniform1f(shader.getUniformLocation(`M[${i}]`), value);
      });*/
      console.log(degree);
      shader.gl.uniform1fv(shader.getUniformLocation(`M`), M.flat());

      shader.gl.uniform1i(shader.getUniformLocation(`numrows`), M.length);
      shader.gl.uniform1i(shader.getUniformLocation(`POLYDEGREE`), degree);//max degree of unsquared 
  }


  extractPolynomials(basisconverter){

    //first convert gpu code to a polynom
    /*const nametovar=new Map([
      ["_V_X",Poly.var("_V_X")],
      ["_V_Y",Poly.var("_V_Y")],
      ["_V_Z",Poly.var("_V_Z")]
    ]);
    for(const [cpunode,gpunode]of this.visgraph.cpu_out_to_gpu_in.entries()){
      nametovar.set(gpunode.operand.name,Poly.var(gpunode.operand.name));
    }*/

    //console.log(this.visgraph.gencode("float Summofsquares(vec3 rayDir, vec3 rayOrigin,float a){?}"));
    
    
    const nodecache= visitnodes(this.visgraph.outputnodes,(node,parentresults)=>{
      if(node.operand instanceof VarOperand) {
          return Poly.var(node.operand.name);
          /*if(nametovar.has(node.operand.name)){
              return nametovar.get(node.operand.name);
          }else{
              //console.log("missing variable "+node.operand.name);
              //return new Multidual(0,0,0,0,0,0,0);
              throw new Error("missing variable "+node.operand.name);
          }*/
      }
      if(node.operand instanceof AddOperand){
          return parentresults.reduce((prev,cur)=>prev.add(cur));
      }
      if(node.operand instanceof MulOperand){
          return parentresults.reduce((prev,cur)=>prev.mul(cur));
      }
      if(node.operand instanceof NegOperand){
          return parentresults[0].mul(-1);
      }
      if(node.operand instanceof ConstOperand){
          return Poly.convert(node.operand.value);
      }
      if(node.operand instanceof DivOperand){
        //console.log("div "+parentresults[0]);
          return parentresults[0].div(parentresults[1]);//only maximal degree
      }
      throw new Error("bad operation :"+node.operand.constructor.name);
    });

    /**@type {Poly[]} */
    const outputpolys=this.visgraph.outputnodes.map(node=>nodecache.get(node));//list of polynoms
    for(const poly of outputpolys){console.log(poly,poly.toString());}
    const xyzstrings=new Set(["_V_X","_V_Y","_V_Z"]);
    /** {Map<string,Poly>[]} */
    /**@type {Map<string,number[]>[]} */
    const outputpolyspervarperrow=outputpolys.map((poly)=>{
      // sorts monoms per variable  a*x+a*y+b*z->a:x+y,b:z
      const polymap=new Map();
      for(let [monom, value] of poly.entries()){
        /**@type {String[]} */
        const variables=Object.keys(monom).filter(v => !xyzstrings.has(v));
        if(variables.length>1)throw new Error("transformation is not linear but it should be :(");
        let varname;
        if(variables.length==1){
          varname=variables[0];
          if(monom[varname]!=1)throw new Error("transformation is not linear but it should be :(");
          delete monom[varname];
        }else{
          varname="";
        }

        if (!polymap.has(varname)) polymap.set(varname, new Poly(new Map()));//set default
        polymap.get(varname).coeffs.set(Poly.monomialToKey(monom),value);//add monom to poly
      }

      //basis switch
      /**@type {Map<string,number[]>} */
      const outputrowspervar=new Map(
        polymap.entries().map(
          ([varname,poly])=>[varname,basisconverter.convert(poly)]
        )
      );
      return outputrowspervar;
      
      
    });
    return outputpolyspervarperrow;
    //console.log(outputpolyspervarperrow);






    //throw new Error("This code is only half finished. please continue here lol");
  }

}
