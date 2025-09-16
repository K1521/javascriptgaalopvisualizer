


class visualizationtargetnode{ 
    constructor(nodes,name,color){
        this.color=color;
        this.nodes=nodes,
        this.name=name;
    }
}


export class GaalopGraph {
    constructor() {
        this.name = undefined;
        this.inputScalars = new Map(); // variablename->variable
        this.outputMultivectors = new Map(); // name -> Multivector of nodes
        this.allMultivectors=undefined;
        this.objectcolormap = new Map(); //name (of output node) -> color

        /** 
         * maps the name of the innerProductResult to the output Multivector Name
         * for example 
         * _V_PRODUCT0 => S1
         * _V_PRODUCT1 => S2
         * _V_PRODUCT2 => S3
         * @type {Map<string,string>} 
         * 
        */
        this.renderingExpression = new Map(); //name (of inner product result) -> expression (name of multivector)
    }



    static fromjson(jsonstring){
        const graph=new GaalopGraph();
        const json=JSON.parse(jsonstring);
        graph.name=json.name;
    
        const Multivectors=new Map(); // name -> Multivector of nodes
        const scalars=new Map(); // name -> node
    
        for(const [index, inputScalar] of json.inputScalars.entries()){
            let node;
            if(new Set(["_V_X", "_V_Y", "_V_Z"]).has(inputScalar))node=new VarNode(inputScalar);
            else node=new VarNode(inputScalar,NodeTypes.SCALAR);
            
            graph.inputScalars.set(inputScalar, node);
            scalars.set(inputScalar, node);
            scalars.set("inputsVector["+index+"]", node);//gapp behaves weirdly and uses inputsVector[index] instead of name
        }
    
        for (const renderingExpression of json.renderingExpressions) {
            const name = renderingExpression.name;
            const expression = renderingExpression.expression;
            graph.renderingExpression.set(name, expression);
        }
        //const inputsVector = json.inputScalars;
    
    
        function parseExpression(node) {
            switch(node.type){
                case "Mul":
                    return new MulNode(parseExpression(node.left), parseExpression(node.right));
                case "Add":
                    return new AddNode(parseExpression(node.left), parseExpression(node.right));
                case "Sub":
                    return new SubNode(parseExpression(node.left), parseExpression(node.right));
                case "Div":
                    return new DivNode(parseExpression(node.left), parseExpression(node.right));
                case "Const":
                    return new ConstNode(node.value);
                case "Negation":
                    return new NegNode(parseExpression(node.operand));
                case "MathFunctionCall":
                    const func = node.function;
                    const operand = parseExpression(node.operand);
                    if (func === "abs") {
                        //return new GraphNode(AbsOperand.instance,[operand]);
                        throw new Error(`i havent implementedthis node yet`);
                    } else if (func === "sqrt") {
                        //return new GraphNode(SqrtOperand.instance,[operand]);
                        throw new Error(`i havent implementedthis node yet`);
                    } else {
                        throw new Error(`Unknown function: ${func}`);
                    }
                case "MultivectorVariable":
                    //TODO bladindex should be integer. how do i cast it to int?
                    if (node.name.startsWith("inputsVector[") && node.name.endsWith("]")) {
                    return scalars.get(node.name);// Return the corresponding input vector
                    }
        
                    return Multivectors.get(node.name).get(node.bladeIndex);
                case "Variable":
                    return scalars.get(node.name);
                default:
                    throw new Error(`Unknown node type: ${node.type}`);
            }
        }
    
        var activeColor=new Color(0,0,0,1);
        for (const node of json.nodes){
            if(node.type==="AssignmentNode"){
                const expression=parseExpression(node.expression);
                const variablejson=node.variable;
                if(variablejson.type==="Variable"){
                    scalars.set(variablejson.name,expression);
                } else if(variablejson.type==="MultivectorVariable"){
                    const name=variablejson.name;
                    const bladeIndex=variablejson.bladeIndex;
                    if(!Multivectors.has(name)){
                        Multivectors.set(name,new Map());
                    }
                    //TODO handle reasigning of multivector variables
                    Multivectors.get(name).set(bladeIndex,expression);
                } else{
                    throw new Error(`Unknown variable type: ${variablejson.type}`);
                }
            } else if(node.type==="ColorNode"){
                activeColor=new Color(node.r,node.g,node.b,node.alpha);
            } else if (node.type==="StoreResultNode"){
    
            } else if(node.type==="ExpressionStatement"){
                if(node.expression.type!=="Variable"){
                    throw new Error("ExpressionStatement must be a variable");
                }
                graph.objectcolormap.set(node.expression.name,activeColor);
            } else {
                throw new Error(`Unknown node type: ${node.type}`);
            }
            
        }
    
        for (const name of json.outputMultivectors) {
            graph.outputMultivectors.set(name, Multivectors.get(name));
        }

        graph.allMultivectors=Multivectors;
        
        return graph;
    }

    
    /**
     * 
     * @returns {VisualisationGraph[]} list of visualisation graphs
     */
    createVisualisationgraphs1() {

        const VisualisationGraphs=[];
        const xyz=[..."XYZ"].map((cord)=>this.inputScalars.get("_V_"+cord));
        const inputnodes=new Map(xyz.map((node)=>[node,node]));
        for (const [innerProductResultName,outputMultivectorName] of this.renderingExpression.entries()) {
        const innerProductResult=this.outputMultivectors.get(innerProductResultName);
        const innerProductInput=this.outputMultivectors.get(outputMultivectorName);
        const newinnerProductInput=new Multivector();


        let args=0;
        for (const [index, value] of innerProductInput.entries()) {
            const node = new GraphNode(new VarOperand("args["+(args++)+"]"));
            newinnerProductInput.set(index, node);
            inputnodes.set(value, node);
        }
        const outputnodes=subgraph(inputnodes,innerProductResult.values());


        const newinnerProductResult=innerProductResult.map((value) => outputnodes.get(value));
        /*for (const [index, value] of innerProductResult.values.entries()) {
            newinnerProductResult.set(index, outputnodes.get(value));
        }*/
        //this code creates a input variable for each blade of the multivector to visualize (newinnerProductInput)
        //and a new multivector for each output node (newinnerProductResult)
        VisualisationGraphs.push(new VisualisationGraph(newinnerProductInput, newinnerProductResult,innerProductInput,outputMultivectorName));
        }
        return VisualisationGraphs;
    }

    createVisualisationgraphs2(){
        const VisualisationGraphs=[];
        for (const [innerProductResultName,outputMultivectorName] of this.renderingExpression.entries()) {
            const innerProductResultNodes=[...this.outputMultivectors.get(innerProductResultName).values()];

            VisualisationGraphs.push(new VisualisationGraph2(innerProductResultNodes,outputMultivectorName));
        }
        return VisualisationGraphs;
    }

    
}





// ============================
// Type Enums
// ============================
const NodeTypes = Object.freeze({
  UNKNOWN: 'unknown',
  SCALAR: 'scalar',
  DUAL: 'dual',
  DUALXYZ: 'dualXYZ',
  //prob COMPLEX and COMPLEXDUAL later
  COMPLEX:"complex",
  COMPLEXDUAL:"complexdual",
  UNTYPED:"UNTYPED" //for nodes like assignement nodes
});

//possible upcasting rules
//scalar -> all
//complex->complexdual
//and maybe dual->complexdual. i willjust include it
const upcastMap = {
  [NodeTypes.SCALAR]: new Set([NodeTypes.SCALAR, NodeTypes.DUAL, NodeTypes.DUALXYZ, NodeTypes.COMPLEX, NodeTypes.COMPLEXDUAL]),
  [NodeTypes.DUAL]: new Set([NodeTypes.DUAL, NodeTypes.COMPLEXDUAL]),
  [NodeTypes.DUALXYZ]: new Set([NodeTypes.DUALXYZ]),
  [NodeTypes.COMPLEX]: new Set([NodeTypes.COMPLEX, NodeTypes.COMPLEXDUAL]),
  [NodeTypes.COMPLEXDUAL]: new Set([NodeTypes.COMPLEXDUAL]),
  [NodeTypes.UNKNOWN]: new Set(), // unknown cant be present at type propagation time at leaf nodes
  [NodeTypes.UNKNOWN]: new Set([NodeTypes.UNTYPED]),//untyped nodes stay untyped
};


function setIntersect(...sets){
  //for some reason js has no intersect for sets and i have to make one myself
  return new Set(sets.reduce(
    (seta,setb)=>[...seta].filter(elemenofa=>setb.has(elemenofa))
  ));
}

function first(arrorset){//doesnt currently 
  const {done,value}= arrorset.values().next();
  if(done)throw new Error("empty sequence has no first element");
  return value;


}

function arrayEquals(a, b) {
  if (a === b) return true;        // same reference
  if (!a || !b) return false;      // one is null/undefined
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function findLowestCommonType(types){
  const possibletypes=new Set(types);
  if(possibletypes.size==1)return first(possibletypes);//fast return
  const commontypes=setIntersect(...[...possibletypes].map(t=>upcastMap[t]));
  
  const priority = [
    NodeTypes.SCALAR,
    NodeTypes.DUAL,
    NodeTypes.DUALXYZ,
    NodeTypes.COMPLEX,
    NodeTypes.COMPLEXDUAL
  ];

  for (let t of priority) {
    if (commontypes.has(t)) return t;
  }
  throw new Error("type not available");
}


class Dual {
  constructor(val, der = 0) {
    this.val = val;
    this.der = der;
  }

  toString() {
    return `${this.val} + ${this.der}ε`; // nice symbolic form
  }
}

class DualXYZ {
  constructor(val, dx = 0, dy = 0, dz = 0) {
    this.val = val;
    this.dx = dx;
    this.dy = dy;
    this.dz = dz;
  }

  toString() {
    return `${this.val} + ${this.dx}εx + ${this.dy}εy + ${this.dz}εz`;
  }
}


// ============================                                                                                                                                                                    
// Base Node
// ============================
class Node {
  static globalId = 0;

  constructor(type = NodeTypes.UNKNOWN, parents = []) {
    this.id = Node.globalId++;
    this.type = type;
    this.parents = parents;
    this.parentreferencemultiplicity=1;//if a node references a parent multiple times this will be set >1
  }

  topologicalsort(){

    const stack=new Set();
    //this it named stack because i use it as a stack. i need a set for the O(1) lookup if a node is already on it
    //with a list it would also work but slower

    const onpath=new Set();//this is needed for cycle detection only

    function visit(node){
      if(stack.has(node))return;
      if(onpath.has(node))throw new Error("oh no, the graph has a cycle. fix it!! because a expression should never have cycles");
      onpath.add(node);
  
      for(let parent of node.parents){
        visit(parent);
      }

      onpath.delete(node);
      stack.add(node);
    }
    visit(this);
    return [...stack];


  }

  //evaluates nodes
  eval(variables=null,cache=new Map()){
    if(cache.has(this))return cache.get(this);
    const parentresults=this.parents.map(parent=>parent.eval(variables,cache));
    const result=this._eval(parentresults,variables,cache);
    cache.set(this,result);
    return result;
  }

  // subclasses must override
  _eval(parentresults,variables,cache) {
    throw new Error('Not implemented');
  }

  // cloning logic //clones all nodes up to this node and returns it
  copyGraph(replaceFn=(()=>undefined),mapping=new Map()) {
    if (mapping.has(this)) return mapping.get(this);

    let newNode=replaceFn(this,mapping);

    if(!newNode){//if replaceFn is falsy we copy otherwise we use the replacement
      const clonedParents = this.parents.map(p => p.copyGraph(replaceFn,mapping));
      newNode = this._cloneWithNewParents(clonedParents);
    }

    mapping.set(this, newNode);
    return newNode;
  }

  // subclasses must override
  _cloneWithNewParents(parents) {
    throw new Error('Not implemented');
  }

  promoteTypes(visited=new Set()){
    if (visited.has(this)) return;
    for(let parent of this.parents)parent.promoteTypes(visited);
    this._promoteType(visited);//maybe i should add a flag if i care about unknown type
    visited.add(this);
  }

  _promoteType(visited){
    //subclasses need to implement and validate
    //this default behavior casts all parents to the same common type and sets this typealso as the return type
    const targettype=findLowestCommonType(this.parents.map(p=>p.type));
    this.parents=this.parents.map(p=>castNode(p,targettype));
    this.parents.forEach(p => p.promoteTypes(visited));//this is here to promote newly created cast nodes mainly for savety checks
    this.type=targettype;
  }


  codegenGLSL(){
    const parentresults=this.parents.map(parent=>parent.codegenGLSL());
    const result=this._codegenGLSL(parentresults);
    return result;
  }

  _codegenGLSL(parents) {
    throw new Error('Not implemented');
  }

  visitnodesrec(visitorfn,resultscache=new Map()){ 
    function visit(node){
        if(resultscache.has(node))return resultscache.get(node);
        const parentresults=node.parents.map(p=>visit(p));
        const result=visitorfn(node,parentresults,resultscache);
        resultscache.set(node,result);
        return result;
    }
    return visit(this);
  }

  commonsubexpressionelimination(){
    const signaturemap=new Map();
    return this.visitnodesrec((node,parentresults)=>{
        const sig=node.nodesignature(parentresults.map(parent=>`[${parent.id}]`),parentresults);
        if(signaturemap.has(sig))return signaturemap.get(sig);
        const newnode=node._cloneWithNewParents(parentresults);
        signaturemap.set(sig,newnode);
        return newnode;
    });
  }

  /*commonsubexpressionelimination(signaturemap=new Map(),replacementmap=new Map()){
    if(replacementmap.has(this))return replacementmap.get(this);
    const sig=this.nodesignature(this.parents.map(x=>replacementmap.get(x)));
    if(signaturemap.has(sig))return signaturemap.get(sig);
    
    const newnode=this._cloneWithNewParents(this.parents.map(node=>node.commonsubexpressionelimination(signaturemap,replacementmap)));
    signaturemap.set(sig,newnode);
    replacementmap.set(this,newnode);
    return newnode;
  }*/
  nodesignature(parentids,parents){
    return this._codegenGLSL(parentids);
  }
}

// ============================
// Leaf Nodes
// ============================
class ConstNode extends Node {
  constructor(value, type = NodeTypes.SCALAR) {
    super(type, []);
    this.value = value;
  }
  

  _eval(parentresults,variables,cache) {
    return this.value;
  }

  _cloneWithNewParents(_) {
    return new ConstNode(this.value, this.type);
  }
  _promoteType(){}



  _codegenGLSL(){
    function flotify(x){
      const s=x.toString();
      if (s.includes('.') || s.includes('e') || s.includes('E')) return s;
      return s+".0";
    }

    if(this.type==NodeTypes.SCALAR){
      return flotify(this.value);
    }else if(this.type==NodeTypes.DUAL){
      return `Dual(${this.value.val},${this.value.der})`;
    }else if(this.type==NodeTypes.DUALXYZ){
      return `Dual(${this.value.dx},${this.value.dy},${this.value.dz}${this.value.val})`;//val is last here ecause dualxyz is just a vec4 under the hood and that way i dx=vec.x
    }
  }
}

class VarNode extends Node {
  constructor(name, type = NodeTypes.UNKNOWN) {
    super(type, []);
    this.name = name;
  }

  _eval(parentresults,variables,cache) {
    return variables.get(this.name);
  }

  _cloneWithNewParents(_) {
    return new VarNode(this.name, this.type);
  }
  _promoteType(){}

  _codegenGLSL(){
    return this.name;
  }
}

// ============================
// Cast Nodes
// ============================
class CastToDualNode extends Node {
  constructor(parent) {
    super(NodeTypes.DUAL, [parent]);
  }

  _eval(parentresults,variables,cache) {
    return new Dual(parentresults[0]);
  }

  _cloneWithNewParents(parents) {
    return new CastToDualNode(parents[0]);
  }

  _promoteType(){
    const parenttype=this.parents[0].type;
    if(parenttype!=NodeTypes.SCALAR)new Error(`casting ${parenttype} to Dual is not implemented/sensible`);
  }

  _codegenGLSL(parentresults){
    return `Dual(${parentresults[0]},0.0)`;
  }
}

class CastToDualXYZNode extends Node {
  constructor(parent) {
    super(NodeTypes.DUALXYZ, [parent]);
  }

  _eval(parentresults,variables,cache) {
    return new DualXYZ(parentresults[0]);
  }

  _cloneWithNewParents(parents) {
    return new CastToDualXYZNode(parents[0]);
  }

  _promoteType(){
    const parenttype=this.parents[0].type;
    if(parenttype!=NodeTypes.SCALAR)new Error(`casting ${parenttype} to Dual is not implemented/sensible`);
  }

  _codegenGLSL(parentresults){
    return `DualXYZ(0.0,0.0,0.0,${parentresults[0]})`;
  }
}
function castNode(node,targettype){
  if(node.type==targettype)return node;
  if(targettype==NodeTypes.DUAL)return new CastToDualNode(node);
  if(targettype==NodeTypes.DUALXYZ)return new CastToDualXYZNode(node);
  throw new Error("cast not implemented yet");
}
// ============================
// Operation Nodes
// ============================
class AddNode extends Node {
  constructor(a, b, type = NodeTypes.UNKNOWN) {
    super(type, [a, b]);
  }

  _eval(parentresults,variables,cache) {
    const [a,b]=parentresults;
    if(this.type==NodeTypes.SCALAR)return a+b;
    if(this.type==NodeTypes.DUAL)return new Dual(a.val+b.val,a.der+b.der);
    if(this.type==NodeTypes.DUALXYZ)return new Dual(a.val+b.val,a.dx+b.dx,a.dy+b.dy,a.dz+b.dz);
    throw new Error("unknown type");
  }

  _cloneWithNewParents(parents) {
    return new AddNode(parents[0], parents[1], this.type);
  }

  _promoteType(visited){
    //not sure how to implement it. maybei can let me think
    const targettype=findLowestCommonType(this.parents.map(p=>p.type));
    this.parents=this.parents.map(p=>castNode(p,targettype));
    this.parents.forEach(p => p.promoteTypes(visited));//this is here to promote newly created cast nodes mainly for savety cheks
    this.type=targettype;
  }
  _codegenGLSL(parentresults){
    return `(${parentresults[0]}+${parentresults[1]})`;
  }
}

class SubNode extends Node {
  constructor(a, b, type = NodeTypes.UNKNOWN) {
    super(type, [a, b]);
  }

  _eval(parentresults,variables,cache) {
    const [a,b]=parentresults;
    if(this.type==NodeTypes.SCALAR)return a-b;
    if(this.type==NodeTypes.DUAL)return new Dual(a.val-b.val,a.der-b.der);
    if(this.type==NodeTypes.DUALXYZ)return new Dual(a.val-b.val,a.dx-b.dx,a.dy-b.dy,a.dz-b.dz);
    throw new Error("unknown type");
  }

  _cloneWithNewParents(parents) {
    return new SubNode(parents[0], parents[1], this.type);
  }

  _codegenGLSL(parentresults){
    return `(${parentresults[0]}-${parentresults[1]})`;
  }
}

class NegNode extends Node {
  constructor(a, type = NodeTypes.UNKNOWN) {
    super(type, [a]);
  }

  _eval(parentresults,variables,cache) {
    const [a]=parentresults;
    if(this.type==NodeTypes.SCALAR)return -a;
    if(this.type==NodeTypes.DUAL)return new Dual(-a.val,-a.der);
    if(this.type==NodeTypes.DUALXYZ)return new Dual(a.val,-a.dx,-a.dy,-a.dz);
    throw new Error("unknown type");
  }

  _cloneWithNewParents(parents) {
    return new NegNode(parents[0], this.type);
  }

  _codegenGLSL(parentresults){
    return `(-${parentresults[0]})`;
  }
}


class MulNode extends Node {
  constructor(a, b, type = NodeTypes.UNKNOWN) {
    super(type, [a, b]);
  }

  _eval(parentresults,variables,cache) {
    //similar to add but i also need to implement mul for scalar and dual because that is possible (so more complex then add)
    throw Error("not implemented yet")
  }

  _cloneWithNewParents(parents) {
    return new MulNode(parents[0], parents[1], this.type);
  }

  static typesignatures=[
    {in:[NodeTypes.SCALAR,NodeTypes.SCALAR],out:NodeTypes.SCALAR},
    {in:[NodeTypes.SCALAR,NodeTypes.DUAL],out:NodeTypes.DUAL},
    {in:[NodeTypes.DUAL,NodeTypes.SCALAR],out:NodeTypes.DUAL},
    {in:[NodeTypes.DUAL,NodeTypes.DUAL],out:NodeTypes.DUAL}

  ];

  _promoteType(visited){
    const parenttypes=this.parents.map(p=>p.type);
    let sig = MulNode.typesignatures.find(sig =>arrayEquals(sig.in,parenttypes));

    if (sig) {
      this.type = sig.out;
      return;
    }
    throw new Error("no signature found");
    
  }

  _eval(parentresults, variables, cache) {
    const [a, b] = parentresults;
    const [typeA, typeB] = this.parents.map(p => p.type);

    // Scalar * Scalar
    if (typeA === NodeTypes.SCALAR && typeB === NodeTypes.SCALAR) {
      return a * b;
    }

    // Dual or Scalar × Dual combinations
    if (typeA === NodeTypes.DUAL || typeB === NodeTypes.DUAL) {
      let [valA, derA] = typeA === NodeTypes.DUAL ? [a.val, a.der] : [a, 0];
      let [valB, derB] = typeB === NodeTypes.DUAL ? [b.val, b.der] : [b, 0];
      return new Dual(valA * valB, valA * derB + derA * valB);
    }

    // DualXYZ or Scalar × DualXYZ combinations
    if (typeA === NodeTypes.DUALXYZ || typeB === NodeTypes.DUALXYZ) {
      let [valA, dxA, dyA, dzA] = typeA === NodeTypes.DUALXYZ ? [a.val, a.dx, a.dy, a.dz] : [a, 0, 0, 0];
      let [valB, dxB, dyB, dzB] = typeB === NodeTypes.DUALXYZ ? [b.val, b.dx, b.dy, b.dz] : [b, 0, 0, 0];

      return new DualXYZ(
        valA * valB,
        valA * dxB + dxA * valB,
        valA * dyB + dyA * valB,
        valA * dzB + dzA * valB
      );
    }

    throw new Error(`MulNode: unsupported type combination ${typeA} * ${typeB}`);
  }

  _codegenGLSL(parentresults){
    return `(${parentresults[0]}*${parentresults[1]})`;
  }

}

class DivNode extends Node {
  constructor(a, b, type = NodeTypes.UNKNOWN) {
    super(type, [a, b]);
  }


  _cloneWithNewParents(parents) {
    return new DivNode(parents[0], parents[1], this.type);
  }

  static typesignatures=[
    {in:[NodeTypes.SCALAR,NodeTypes.SCALAR],out:NodeTypes.SCALAR},
    {in:[NodeTypes.SCALAR,NodeTypes.DUAL],out:NodeTypes.DUAL},
    {in:[NodeTypes.DUAL,NodeTypes.SCALAR],out:NodeTypes.DUAL},
    {in:[NodeTypes.DUAL,NodeTypes.DUAL],out:NodeTypes.DUAL}

  ];

  _promoteType(visited){
    const parenttypes=this.parents.map(p=>p.type);
    let sig = MulNode.typesignatures.find(sig =>arrayEquals(sig.in,parenttypes));

    if (sig) {
      this.type = sig.out;


      if(sig.in[0]==NodeTypes.SCALAR && sig.in[1]==NodeTypes.DUAL){
        this.parents[0]=castNode(this.parents[0],NodeTypes.DUAL);
        this.parents[0].promoteTypes(visited);//this is here to promote newly created cast nodes mainly for savety checks
        
      }  

      return;
    }
    throw new Error("no signature found");
    
  }
  _eval(parentresults, variables, cache) {
    const [a, b] = parentresults;
    const [typeA, typeB] = this.parents.map(p => p.type);

    // Scalar / Scalar
    if (typeA === NodeTypes.SCALAR && typeB === NodeTypes.SCALAR) {
      return a / b;
    }

    // Dual or Scalar × Dual combinations
    if (typeA === NodeTypes.DUAL || typeB === NodeTypes.DUAL) {
      let [valA, derA] = typeA === NodeTypes.DUAL ? [a.val, a.der] : [a, 0];
      let [valB, derB] = typeB === NodeTypes.DUAL ? [b.val, b.der] : [b, 0];

      const val = valA / valB;
      const der = (derA * valB - valA * derB) / (valB * valB);
      return new Dual(val, der);
    }

    // DualXYZ or Scalar × DualXYZ combinations
    if (typeA === NodeTypes.DUALXYZ || typeB === NodeTypes.DUALXYZ) {
      let [valA, dxA, dyA, dzA] = typeA === NodeTypes.DUALXYZ ? [a.val, a.dx, a.dy, a.dz] : [a, 0, 0, 0];
      let [valB, dxB, dyB, dzB] = typeB === NodeTypes.DUALXYZ ? [b.val, b.dx, b.dy, b.dz] : [b, 0, 0, 0];

      const val = valA / valB;
      const dx = (dxA * valB - valA * dxB) / (valB * valB);
      const dy = (dyA * valB - valA * dyB) / (valB * valB);
      const dz = (dzA * valB - valA * dzB) / (valB * valB);

      return new DualXYZ(val, dx, dy, dz);
    }

    throw new Error(`DivNode: unsupported type combination ${typeA} / ${typeB}`);
  }  
  _codegenGLSL(parentresults){
    if(this.parents[1]==NodeTypes.SCALAR)
      return `(${parentresults[0]}/${parentresults[1]})`;
    if(this.parents[0]==NodeTypes.DUAL && this.parents[1]==NodeTypes.DUAL)
      return `DualDiv(${parentresults[0]},${parentresults[1]})`;
  }
}


class AssignementNode extends Node {
  constructor(variable, expression) {
    super(NodeTypes.UNTYPED, [variable,expression]);
  }


  _cloneWithNewParents(parents) {
    return new AssignementNode(parents[0], parents[1]);
  }

  _promoteType(visited){



    if(!parents[0]instanceof VarNode)throw new Error("can only assign variable nodes");

    this.parents[1]=castNode(this.parents[1],parents[0].type);//try to cast expression node to type of variable node
    if(parents[0].type!=parents[1].type)
      throw new Error("cant assign nodes of different types");
    
  }
    
  _codegenGLSL(parentresults) {
  const types = {
    [NodeTypes.SCALAR]: "float",
    [NodeTypes.DUAL]: "Dual",
    [NodeTypes.DUALXYZ]: "DualXYZ",
  };

  const [variable, expression] = this.parents;
  const [variableString, expressionString] = parentresults;

  const isConst = expression instanceof ConstNode;
  const qualifier = isConst ? "const " : "";

  return `${qualifier}${types[variable.type]} ${variableString} = ${expressionString};`;
}

}
class ReturnNode extends Node {
  constructor( expression,returntype) {
    super(NodeTypes.UNTYPED, [expression]);
    this.returntype=returntype;
  }


  _cloneWithNewParents(parents) {
    return new ReturnNode(parents[0], this.returntype);
  }

  _promoteType(visited){
    this.parents[0]=castNode(this.parents[0],this.returntype);    
  }
    
  _codegenGLSL(parentresults){
    return `return ${parentresults[0]};`;
  }
}





function makeAssignementGraph(root, inlineConstants = true) {
  // roots with more than one child need to be assignments
  // constants may be removed from this
  // n1 = 0.5
  // n2 = n1 * x
  // n3 = n1 * y
  // vs with constant inlining
  // n2 = 0.5 * x
  // n3 = 0.5 * y

  const nodes = root.topologicalsort();

  // count how many children each node has
  const numberOfChildren = new Map();
  for (const node of nodes) {
    //numberOfChildren.set(node,0);//at this point numberOfChildren.get(node) isnt initialized
    for (const parent of node.parents) {
      numberOfChildren.set(parent, (numberOfChildren.get(parent) ?? 0) + node.parentreferencemultiplicity);
    }
  }



  const nodeToVariable = new Map();
  function replaceWithVariables(node) {
    return node.copyGraph(currentNode => nodeToVariable.get(currentNode));
  }

  let variablecounter=0;

  return nodes.map(node => {
    if(node.type==NodeTypes.UNTYPED)return replaceWithVariables(node);
    if (node instanceof VarNode) return;// Variable nodes don’t need to be assigned a new name
    if (inlineConstants && node instanceof ConstNode) return; // optionally skip consts
    if ((numberOfChildren.get(node) ?? 0) == 0) throw new Error("typed node without children. use a return or assignement node to get output");//or u could implement a custom untyped node for that     
    if ((numberOfChildren.get(node) ?? 0) <= 1) return;       // we only want to assign nodes which have 2 or more children

    const variable = new VarNode(`_generatednode${variablecounter++}`, node.type);
    
    // copy the graph, replacing other assigned nodes with their variables
    const expression = replaceWithVariables(node);
    
    nodeToVariable.set(node,variable);//this indecates all occurences of node will be replaced by variable
    return new AssignementNode(variable,expression);
    
  }).filter(x=>x!=undefined);
}



class RootNode extends Node {
  constructor(children) {
    super(NodeTypes.UNTYPED, children);
  }

  makeAssignementGraph( inlineConstants = true) {
    // roots with more than one child need to be assignments
    // constants may be removed from this
    // n1 = 0.5
    // n2 = n1 * x
    // n3 = n1 * y
    // vs with constant inlining
    // n2 = 0.5 * x
    // n3 = 0.5 * y

    const nodes = root.topologicalsort();

    // count how many children each node has
    const numberOfChildren = new Map();
    for (const node of nodes) {
      //numberOfChildren.set(node,0);//at this point numberOfChildren.get(node) isnt initialized
      for (const parent of node.parents) {
        numberOfChildren.set(parent, (numberOfChildren.get(parent) ?? 0) + node.parentreferencemultiplicity);
      }
    }



    const nodeToVariable = new Map();
    function replaceWithVariables(node) {
      return node.copyGraph(currentNode => nodeToVariable.get(currentNode));
    }

    let variablecounter=0;

    return nodes.map(node => {
      if(node.type==NodeTypes.UNTYPED)return replaceWithVariables(node);
      if (node instanceof VarNode) return;// Variable nodes don’t need to be assigned a new name
      if (inlineConstants && node instanceof ConstNode) return; // optionally skip consts
      if ((numberOfChildren.get(node) ?? 0) == 0) throw new Error("typed node without children. use a return or assignement node to get output");//or u could implement a custom untyped node for that     
      if ((numberOfChildren.get(node) ?? 0) <= 1) return;       // we only want to assign nodes which have 2 or more children

      const variable = new VarNode(`_generatednode${variablecounter++}`, node.type);
      
      // copy the graph, replacing other assigned nodes with their variables
      const expression = replaceWithVariables(node);
      
      nodeToVariable.set(node,variable);//this indecates all occurences of node will be replaced by variable
      return new AssignementNode(variable,expression);
      
    }).filter(x=>x!=undefined);
  }

  gencodeGLSL(){
    const assignments=this.makeAssignementGraph();
    return assignments.map(node=>
      node.codegenGLSL()
    ).join("\n");
  }

  
}
















