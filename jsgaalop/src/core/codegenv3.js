





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
                case "Mul":return new MulNode(parseExpression(node.left), parseExpression(node.right));
                case "Add":return new AddNode(parseExpression(node.left), parseExpression(node.right));
                case "Sub":return new SubNode(parseExpression(node.left), parseExpression(node.right));
                case "Div":return new DivNode(parseExpression(node.left), parseExpression(node.right));
                case "Const":return new ConstNode(node.value);
                case "Negation":return new NegNode(parseExpression(node.operand));
                case "MathFunctionCall":
                    const func = node.function;
                    const operand = parseExpression(node.operand);
                    if (func === "abs") {
                        //return new GraphNode(AbsOperand.instance,[operand]);
                        throw new Error(`i havent implementedthis node yet`);
                    } else if (func === "sqrt") {
                        //return new GraphNode(SqrtOperand.instance,[operand]);
                        //throw new Error(`i havent implementedthis node yet`);
                        return new SqrtNode(operand);
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

    vistargets(){
        const VisualisationGraphs=[];
        for (const [innerProductResultName,outputMultivectorName] of this.renderingExpression.entries()) {
            const innerProductResultNodes=[...this.outputMultivectors.get(innerProductResultName).values()];
            const color=this.objectcolormap.get(outputMultivectorName);
            //VisualisationGraphs.push(new VisualisationGraph2(innerProductResultNodes,outputMultivectorName));
            VisualisationGraphs.push(new visualizationtargetnode(innerProductResultNodes,outputMultivectorName,color))
        }
        return VisualisationGraphs;
    }

    getoptimizedvistargets(){
        return new Bundlenode(this.vistargets()).constantfolding().commonsubexpressionelimination().parents;
    }


    
}





// ============================
// Type Enums
// ============================
export const NodeTypes = Object.freeze({
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
  [NodeTypes.UNTYPED]: new Set([NodeTypes.UNTYPED]),//untyped nodes stay untyped
};


function setIntersect(...sets){
  //for some reason js has no intersect for sets and i have to make one myself
  return new Set(sets.reduce(
    (seta,setb)=>[...seta].filter(elemenofa=>setb.has(elemenofa))
  ));
}

function first(arrayORset){//doesnt currently 
  const {done,value}= arrayORset.values().next();
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


class Complex {
  constructor(x, i = 0) {
    this.x = x;
    this.i = i;
  }

  toString() {
    return `${this.x} + ${this.i}i`;
  }
}

class ComplexDual {
  constructor(x, i = 0, dx = 0, di = 0) {
    this.x = x;
    this.i = i;
    this.dx = dx;
    this.di = di;
  }

  toString() {
    return `${this.x} + ${this.i}i + ${this.dx}ε + ${this.di}εi`;
  }
}

function getValueType(value){
  if (typeof value === "number") return NodeTypes.SCALAR;
  else if (value instanceof Dual) return NodeTypes.DUAL;
  else if (value instanceof DualXYZ) return NodeTypes.DUALXYZ;
  else if (value instanceof Complex) return NodeTypes.COMPLEX;
  else if (value instanceof ComplexDual) return NodeTypes.COMPLEXDUAL; 
  throw new Error("unknown type");
}

function upcastValue(value,targetType){
  const acttype=getValueType(value);
  if(acttype===targetType)return value;
  switch(acttype){
    case NodeTypes.SCALAR:
      switch(targetType){
        case NodeTypes.DUAL:return new Dual(value);
        case NodeTypes.DUALXYZ:return new DualXYZ(value);
        default: throw new Error("cant find cast");
      }
    default:throw new Error("cant find cast");
  }
}

class Color {
    constructor(r = 0, g = 0, b = 0 ,a = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    toString() {
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
    }
}
// ============================                                                                                                                                                                    
// Base Node
// ============================
class Node {
  static globalId = 0;

  constructor(type = NodeTypes.UNKNOWN, parents = []) {
    if(!Array.isArray(parents))throw new Error("parents must be a array");
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
  /*copyGraph(replaceFn=(()=>undefined),mapping=new Map()) {
    if (mapping.has(this)) return mapping.get(this);

    const clonedParents = this.parents.map(p => p.copyGraph(replaceFn,mapping));
    const clonednode=this._cloneWithNewParents(clonedParents);
    let newNode=replaceFn(this,clonednode)??clonednode;

    //if replaceFn is falsy we copy otherwise we use the replacement
      
    mapping.set(this, newNode);
    return newNode;
  }*/
    /**
     * Deeply clones this node and its parents, with optional custom replacements.
     *
     * @param {function(Node, function(): Node): Node} [replaceFn]
     *   A function called for each node with two arguments:
     *     - `node`: the original node being visited
     *     - `lazyClone`: a function that returns the normal cloned node with cloned parents
     *   Should return a replacement node, or `undefined`/`null` to use the normal clone.
     *
     * @param {Map<Node, Node>} [mapping=new Map()]
     *   Cache of already cloned nodes to handle shared parents and avoid duplicate copies.
     *
     * @returns {Node} The cloned (or replaced) node corresponding to this node.
     *
     * @example
     * const newRoot = oldRoot.copyGraph((original, lazyClone) => {
     *   if (original instanceof VisualizationTarget) {
     *     return new LabelNode(lazyClone(), original.name);
     *   }
     *   return undefined;
     * });
     */
    copyGraph(replaceFn = ((original,lazyClone) => undefined), mapping = new Map()) {
        if (mapping.has(this)) return mapping.get(this);

        const lazyClone = () => {
            const clonedParents = this.parents.map(p => p.copyGraph(replaceFn, mapping));
            return this._cloneWithNewParents(clonedParents);
        };

        const newNode = replaceFn(this, lazyClone) ?? lazyClone();

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
    if(this.type==NodeTypes.UNKNOWN)console.warn(this.constructor.name+" ?? why is this "+NodeTypes.UNKNOWN+" ??");
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
    throw new Error('Not implemented for '+this.constructor.name);
  }

  /**
   * Recursively visits all nodes in the graph.
   *
   * @template T
   * @param {(node: Node, parentResults: T[], cache: Map<Node, T>) => T} visitorfn
   *   A function applied to each node.
   * @param {Map<Node, T>} [resultscache=new Map()]
   *   Optional cache to store results for nodes.
   * @returns {T} The result of visiting this node.
  */
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

  constantfolding() {
    return this.visitnodesrec((node, parentresults) => {
      if (node.type !== NodeTypes.UNTYPED && parentresults.length>0 && parentresults.every(x => x instanceof ConstNode)) {
        if(node.type !== NodeTypes.UNKNOWN)node.promoteTypes();// safe: all parents are const-> only one layer deep
        const result = node.eval(); // safe: parents are all ConstNodes
        return new ConstNode(result, node.type);
      }
      return node._cloneWithNewParents(parentresults);
    });

    /*return this.copyGraph((original,lazyClone)=>{
        const node=lazyClone();
        if (node.type !== NodeTypes.UNTYPED && node.parents.length>0 && node.parents.every(x => x instanceof ConstNode)) {
            if(node.type !== NodeTypes.UNKNOWN)node.promoteTypes();
            const result = node.eval(); // safe: parents are all ConstNodes
            return new ConstNode(result, node.type);
      }
      return node;
    });*/
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
    return `${this.constructor.name}([${parentids.join(",")}],${this._signatureExtras()})`;
  }
  _signatureExtras() {
    return "";
  }

  graphnodecounts(){
    const count={};
    for(const node of this.topologicalsort()){
        const key=node.constructor.name;
        count[key]=(count[key]??0)+1;
    }
    return count;
  }


  getLabelNodes() {
    //return new Map(this.topologicalsort().filter(n=>n instanceof LabelNode).map(n=>[n.label,n]));
    const result = new Map();
    for (const n of this.topologicalsort()) {
        if (n instanceof LabelNode) {
            if (result.has(n.label)) {
                throw new Error(`Duplicate label found: ${n.label}`);
            }
            result.set(n.label, n);
        }
    }
    return result;
  }
}

class FunctionSignature {
  constructor(inputTypes, outputType, glslPattern, jsEval) {
    this.inputTypes = inputTypes;
    this.outputType = outputType;
    this.glslPattern = glslPattern;
    this.jsEval = jsEval;
  }

  matches(node){
    const parents=node.parents;
    if(parents.length!==this.inputTypes.length)return false;
    return this.inputTypes.every((type,i)=>upcastMap[parents[i].type].has(type));
  }

  promoteType(node){
    node.parents=this.inputTypes.map((type,i)=>castNode(parents[i].type,type));
    node.type=this.outputtype;
  }

  canServeAsEvalFor(glslSig) {
    if (!this.jsEval) return false;
    if (this.outputType !== glslSig.outputType) return false;
    if (this.inputTypes.length !== glslSig.inputTypes.length) return false;

    return this.inputTypes.every((evalType, i) =>
      upcastMap[glslSig.inputTypes[i]].has(evalType)
    );
  }
}

class TypedOpNode extends Node {
  static signatures = [];//gets overwridden (yes static can be overwidden)

  constructor(parents) {
    super(NodeTypes.UNTYPED, parents);
    this._cachedSig = null;
    this._cachedSigEval = null;
  }

  _promoteType(visited) {
    this._cachedSig = this.constructor.signatures.find(s => s.matches(this));
    this._cachedSigEval = this.constructor.signatures.find(s => s.canServeAsEvalFor(this._cachedSig));
    if (!this._cachedSig) 
      throw new Error(`${this.constructor.name}: no signature found for [${this.parents.map(p => p.type).join(", ")}]`);
    if (!this._cachedSigEval) 
      throw new Error(`${this.constructor.name}: no eval found for [${this.parents.map(p => p.type).join(", ")}]`);
    this._cachedSig.promoteTypes(this);
    this.parents.forEach(p=>p.promoteTypes(visited));
  }

  _eval(parentResults) {
    parentResults=parentResults.map((value,i)=>{
      const targetType=this._cachedSig.inputTypes[i];
      const actualtype=this.parents[i].type;
      if(targetType==actualtype)return value;
      return castValue(value,targetType);

    });
    return this._cachedSigEval.jsEval(parentResults);
  }

  _codegenGLSL(parentResults) {
    //return parentResults.reduce((str,parentstr,i)=>str.replaceAll("{"+i+"}",parentstr),this._cachedSig.glslPattern);
    this._cachedSig.glslPattern.replace(/{([0-9]+)}/g,(_,i)=>parentResults[i]);
  }
}




function setxyzType(root, nodetype) {
  const xyznames = new Set(["_V_X", "_V_Y", "_V_Z"]);
  root.topologicalsort().forEach(n => {
    if (n instanceof VarNode && xyznames.has(n.name)) {
      n.type = nodetype;
    }
  });
}



export class visualizationtargetnode extends Node{ 
    constructor(nodes,name,color){
        super(NodeTypes.UNTYPED,nodes);
        this.color=color;
        this.nodes=nodes,
        this.name=name;
    }
    _cloneWithNewParents(newparents){
        return new visualizationtargetnode(newparents,this.name,this.nodes);
    }
    _signatureExtras(){
        return `${this.color},${this.name}`;
    }

    get splitgraph(){
      if(!this.splitgraph){
        this.splitgraph=Splitgraph.splitxyz(this);
      }
      return this.splitgraph;
    }

   makecodeorsmth(){//rename
    function summofsquares(nodes){
      return nodes.map(n=>new MulNode(n,n)).reduce((prev,curr)=>new AddNode(prev,curr));
    }

    function replacexyz(root,x,y,z){
      return root.copyGraph((original,lazyClone)=>{
      if(original instanceof VarNode){
        if(original.name=="_V_X"){return x;}
        if(original.name=="_V_Y"){return y;}
        if(original.name=="_V_Z"){return z;}
      }
    });
    }

    const splitgraph=Splitgraph.splitxyz(this);
    const vistarget=splitgraph.subgraph.copyGraph();
    
    let singularoutput;
    if(vistarget.parents.length==1)singularoutput=first(vistarget.parents);
    else singularoutput=summofsquares(vistarget);

    const evaltargets=[];

    //DualComplexSummofsquares
    let a=new AddNode(new VarNode("a",NodeTypes.COMPLEX),new ConstNode(new ComplexDual(0,1)));
    let x=new AddNode(new VarNode("rayOrigin.x",NodeTypes.SCALAR),new MulNode(a,new VarNode("rayDir.x",NodeTypes.SCALAR)));
    let y=new AddNode(new VarNode("rayOrigin.y",NodeTypes.SCALAR),new MulNode(a,new VarNode("rayDir.y",NodeTypes.SCALAR)));
    let z=new AddNode(new VarNode("rayOrigin.z",NodeTypes.SCALAR),new MulNode(a,new VarNode("rayDir.z",NodeTypes.SCALAR)));
    let subgraph=replacexyz(singularoutput,x,y,z);
    const func=new FunctionbodyNode([new ReturnNode(subgraph,NodeTypes.COMPLEXDUAL)]);
    func.promoteTypes();

    let body="\n"+func.codegenGLSL()+"\n";
    let header="DualComplex DualComplexSummofsquares(vec3 rayDir, vec3 rayOrigin,Complex a){?}";
    let evaltarget=new Splitgraph(splitgraph.parents,splitgraph.subgraphvarnames,subgraph);
    evaltargets.push([header,header.replace("?",body),evaltarget])

    //Sumofsquares
    a=new VarNode("a",NodeTypes.SCALAR);
    x=new AddNode(new VarNode("rayOrigin.x",NodeTypes.SCALAR),new MulNode(a,new VarNode("rayDir.x",NodeTypes.SCALAR)));
    y=new AddNode(new VarNode("rayOrigin.y",NodeTypes.SCALAR),new MulNode(a,new VarNode("rayDir.y",NodeTypes.SCALAR)));
    z=new AddNode(new VarNode("rayOrigin.z",NodeTypes.SCALAR),new MulNode(a,new VarNode("rayDir.z",NodeTypes.SCALAR)));
    subgraph=replacexyz(singularoutput,x,y,z);
    func=new FunctionbodyNode([new ReturnNode(subgraph,NodeTypes.SCALAR)]);
    func.promoteTypes();

     body="\n"+func.codegenGLSL()+"\n";
     header="float Summofsquares(vec3 rayDir, vec3 rayOrigin,float a){?}";
     evaltarget=new Splitgraph(splitgraph.parents,splitgraph.subgraphvarnames,subgraph);
    evaltargets.push([header,header.replace("?",body),evaltarget]);


    //xyzDualSummofsquares
    x=new AddNode(new VarNode("pos.x",NodeTypes.SCALAR),new ConstNode(new DualXYZ(0,1,0,0)));
    y=new AddNode(new VarNode("pos.y",NodeTypes.SCALAR),new ConstNode(new DualXYZ(0,0,1,0)));
    z=new AddNode(new VarNode("pos.z",NodeTypes.SCALAR),new ConstNode(new DualXYZ(0,0,0,1)));
    subgraph=replacexyz(singularoutput,x,y,z);
     FunctionbodyNode(new ReturnNode(subgraph,NodeTypes.DualXYZ));
    func.promoteTypes();

     body="\n"+func.codegenGLSL()+"\n";
     header="xyzDual xyzDualSummofsquares(vec3 pos) {?}";
     evaltarget=new Splitgraph(splitgraph.parents,splitgraph.subgraphvarnames,subgraph);
    evaltargets.push([header,header.replace("?",body),evaltarget]);


        //DualF
    a=new AddNode(new VarNode("a",NodeTypes.COMPLEX),new ConstNode(new Dual(0,1)));
    x=new AddNode(new VarNode("rayOrigin.x",NodeTypes.SCALAR),new MulNode(a,new VarNode("rayDir.x",NodeTypes.SCALAR)));
    y=new AddNode(new VarNode("rayOrigin.y",NodeTypes.SCALAR),new MulNode(a,new VarNode("rayDir.y",NodeTypes.SCALAR)));
    z=new AddNode(new VarNode("rayOrigin.z",NodeTypes.SCALAR),new MulNode(a,new VarNode("rayDir.z",NodeTypes.SCALAR)));
    subgraph=replacexyz(vistarget,x,y,z);
    func=new FunctionbodyNode(subgraph.parents.map((node,idx)=>{
      new AssignementNode(new VarNode(`result[${idx}]`,NodeTypes.DUAL),node);
    }));
    func.promoteTypes();

     body="\n"+func.codegenGLSL()+"\n";
     header="void DualF(vec3 rayDir, vec3 rayOrigin,float a,out Dual[numoutputs] result) {?}";
     evaltarget=new Splitgraph(splitgraph.parents,splitgraph.subgraphvarnames,subgraph);
    evaltargets.push([header,header.replace("?",body),evaltarget]);

return evaltarget;
  } 




}



/*class arraynode extends Node{
  constructor(parents,name,declareinglsl=false){
    super(NodeTypes.UNKNOWN,parents);
    this.name=name;
    this.declareinglsl=declareinglsl;
  }
  _signatureExtras(){return this.name;}
  _cloneWithNewParents(){return new arraynode(this.parents,this.name);}
}*/


class Splitgraph extends Node{

  static splitxyz(graph){
    const splitnodes=new Set();//these nodes are the gpu inputs which are precomputed on cpu
        graph.visitnodesrec((node,parentresults)=>{
            if(node instanceof VarNode){
                if(["V_X_","V_Y_","V_Z_"].includes(node.name))return {dependsonxyz :true,dependsonvariables:false};
                else return {dependsonxyz :false,dependsonvariables:true};
            }else{
                const dependsonxyz=parentresults.some(item => item.dependsonxyz);//reduce((a,b)=> a||b.dependsonxyz,false);
                const dependsonvariables=parentresults.some(item => item.dependsonvariables);//.reduce((a,b)=> a||b.dependsonvariables,false);
                //using constantelimination all nodes should depend on vars or be const nodes (or be xyz)

                if(dependsonxyz && dependsonvariables){
                    for (let i = 0; i < parentresults.length; i++) {
                        const parentres = parentresults[i];
                        if (parentres.dependsonvariables && !parentres.dependsonxyz) {
                            splitnodes.add(node.parents[i]);  //if node depends on xyz but parent doesnt
                        }
                    }
                }
                return { dependsonxyz, dependsonvariables };
            }
        });

        let variablecounter=0;
        const varnames=[];
        const correspondingnode=[];
        //const splitmap=new Map();
        const graphcopy=graph.copyGraph((node,lazyclone)=>{
          if(splitnodes.has(node)){
            const newvar=new VarNode(`_input${variablecounter++}`, node.type);
            //splitmap.set(newvar,node);
            varnames.push(newvar.name);
            correspondingnode.push(node);
            return newvar;
          }
        });
        return new Splitgraph(correspondingnode,varnames,graphcopy);
  }

  constructor(nodes,subgraphvarnames,subgraph){
    //variables node->variable of subgraph
    super(subgraph.type,nodes);
    this.subgraph=subgraph;
    this.subgraphvarnames=subgraphvarnames;
  }
  copywithnewsubgraph(){
    return new Splitgraph(this.parents,this.subgraphvarnames,this.subgraph.copyGraph());
  };

  _cloneWithNewParents(newparents){
    new Splitgraph(newparents,this.subgraphvarnames,this.subgraph);
  }

  _eval(parentresults,variables,cache){
    const subgraphvariables=new Map(variables);
    for(let i=0;i<this.subgraphvarnames.length;i++){
      subgraphvariables.set(this.subgraphvarnames[i],parentresults[i]);
    }
    return this.subgraph.eval(subgraphvariables);
  }
  _promoteType(){
    this.subgraph.promoteTypes();
    this.type=this.subgraph.type;
    //throw new Error("not implemented yet");
  }

}


// ============================
// Leaf Nodes
// ============================
class ConstNode extends Node {
 constructor(value, type = undefined) {
    // auto-infer type if not provided
    if (type === undefined) {
      type = getValueType(value)??NodeTypes.UNKNOWN;
    }
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



  _codegenGLSL() {
    function flotify(x) {
      const s = x.toString();
      if (s.includes('.') || s.includes('e') || s.includes('E')) return s;
      return s + ".0";
    }
  
    if (this.type === NodeTypes.SCALAR) {
      return flotify(this.value);
    } else if (this.type === NodeTypes.DUAL) {
      return `Dual(${flotify(this.value.val)}, ${flotify(this.value.der)})`;
    } else if (this.type === NodeTypes.DUALXYZ) {
      return `xyzDual(${flotify(this.value.dx)}, ${flotify(this.value.dy)}, ${flotify(this.value.dz)}, ${flotify(this.value.val)})`;
      // val is last here because DualXYZ maps to vec4 under the hood: dx=vec.x, dy=vec.y, dz=vec.z, val=vec.w
    }
    super._codegenGLSL();//throws
  }

    _signatureExtras(){
        return this._codegenGLSL();
    }

}

export class VarNode extends Node {
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

  _signatureExtras(){
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


class CastToComplex extends Node {
  constructor(parent) {
    super(NodeTypes.COMPLEX, [parent]);
  }

  _eval(parentresults,variables,cache) {
    return new Complex(parentresults[0]);
  }

  _cloneWithNewParents(parents) {
    return new CastToComplex(parents[0]);
  }

  _promoteType(){
    const parenttype=this.parents[0].type;
    if(parenttype!=NodeTypes.SCALAR)new Error(`casting ${parenttype} to Complex is not implemented/sensible`);
  }

  _codegenGLSL(parentresults){
    return `Complex(${parentresults[0]},0.0)`;
  }
}


class CastToComplexDual extends Node {
  constructor(parent) {
    super(NodeTypes.COMPLEXDUAL, [parent]);
  }

  _eval(parentresults,variables,cache) {
    return new ComplexDual(parentresults[0]);
  }

  _cloneWithNewParents(parents) {
    return new CastToComplex(parents[0]);
  }

  _promoteType(){
    const parenttype=this.parents[0].type;
    if(parenttype==NodeTypes.SCALAR||parenttype==NodeTypes.DUAL)return;
    new Error(`casting ${parenttype} to ComplexDual is not implemented/sensible`);
  }

  _codegenGLSL(parentresults){
    if(this.type==NodeTypes.SCALAR)
      return `ComplexDual(${parentresults[0]},0.0,0.0,0.0)`;
    if(this.type==NodeTypes.COMPLEX)
      return `ComplexDual(${parentresults[0]},0.0,0.0)`;
    throw new Error("invallid node type");
  }
}
function castNode(node,targettype){
  if(node.type==targettype)return node;
  if(targettype==NodeTypes.DUAL)return new CastToDualNode(node);
  if(targettype==NodeTypes.DUALXYZ)return new CastToDualXYZNode(node);
  if(targettype==NodeTypes.COMPLEXDUAL)return new CastToComplexDual(node);
  if(targettype==NodeTypes.COMPLEX)return new CastToComplex(node);
  throw new Error("cast not implemented yet");
}
function castValue(value,targettype){//same as upcastValue i think??
  const subgraph = castNode(new ConstNode(value), targettype);
  subgraph.promoteTypes();
  return subgraph.eval();
}
// ============================
// Operation Nodes
// ============================
export class AddNode extends Node {
  constructor(a, b) {
    super(NodeTypes.UNKNOWN, [a, b]);
  }

  _eval(parentresults,variables,cache) {
    const [a,b]=parentresults;
    if(this.type==NodeTypes.SCALAR)return a+b;
    if(this.type==NodeTypes.DUAL)return new Dual(a.val+b.val,a.der+b.der);
    if(this.type==NodeTypes.DUALXYZ)return new Dual(a.val+b.val,a.dx+b.dx,a.dy+b.dy,a.dz+b.dz);
    throw new Error("unknown type");
  }

  _cloneWithNewParents(parents) {
    return new AddNode(parents[0], parents[1]);//, this.type);
  }

  _codegenGLSL(parentresults){
    return `(${parentresults[0]}+${parentresults[1]})`;
  }
}

class SubNode extends Node {
  constructor(a, b) {
    super(NodeTypes.UNKNOWN, [a, b]);
  }

  _eval(parentresults,variables,cache) {
    const [a,b]=parentresults;
    if(this.type==NodeTypes.SCALAR)return a-b;
    if(this.type==NodeTypes.DUAL)return new Dual(a.val-b.val,a.der-b.der);
    if(this.type==NodeTypes.DUALXYZ)return new Dual(a.val-b.val,a.dx-b.dx,a.dy-b.dy,a.dz-b.dz);
    throw new Error("unknown type");
  }

  _cloneWithNewParents(parents) {
    return new SubNode(parents[0], parents[1]);//, this.type);
  }
  

  _codegenGLSL(parentresults){
    return `(${parentresults[0]}-${parentresults[1]})`;
  }
}

class NegNode extends Node {
  constructor(a) {
    super(NodeTypes.UNKNOWN, [a]);
  }

  _eval(parentresults,variables,cache) {
    const [a]=parentresults;
    if(this.type==NodeTypes.SCALAR)return -a;
    if(this.type==NodeTypes.DUAL)return new Dual(-a.val,-a.der);
    if(this.type==NodeTypes.DUALXYZ)return new Dual(a.val,-a.dx,-a.dy,-a.dz);
    throw new Error("unknown type");
  }

  _cloneWithNewParents(parents) {
    return new NegNode(parents[0]);//, this.type);;
  }

  _codegenGLSL(parentresults){
    return `(-${parentresults[0]})`;
  }
}

/*
export class MulNode extends Node {
  constructor(a, b) {
    super(NodeTypes.UNKNOWN, [a, b]);
  }

  _eval(parentresults,variables,cache) {
    //similar to add but i also need to implement mul for scalar and dual because that is possible (so more complex then add)
    throw Error("not implemented yet")
  }

  _cloneWithNewParents(parents) {
    return new MulNode(parents[0], parents[1]);//, this.type);;
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

  _codegenGLSL(parentresults) {
    const [a, b] = parentresults;
    const [typeA, typeB] = this.parents.map(p => p.type);
  
    // Scalar × anything → simple *
    if (typeA === NodeTypes.SCALAR || typeB === NodeTypes.SCALAR) {
      return `(${a} * ${b})`;
    }
  
    // Dual × Dual → DualMul / DualSquare
    if (typeA === NodeTypes.DUAL && typeB === NodeTypes.DUAL) {
      return a === b ? `DualSquare(${a})` : `DualMul(${a},${b})`;
    }
  
    // DualXYZ × DualXYZ → xyzDualMul / xyzDualSquare
    if (typeA === NodeTypes.DUALXYZ && typeB === NodeTypes.DUALXYZ) {
      return a === b ? `xyzDualSquare(${a})` : `xyzDualMul(${a},${b})`;
    }
  
    // All other combinations are unsupported
    throw new Error(`MulNode GLSL codegen: unsupported type combination ${typeA} * ${typeB}`);
  }


}
*/

export class MulNode extends Node {
  constructor(a, b) {
    super(NodeTypes.UNKNOWN, [a, b]);
  }

  _eval(parentresults,variables,cache) {
    //similar to add but i also need to implement mul for scalar and dual because that is possible (so more complex then add)
    throw Error("not implemented yet")
  }

  _cloneWithNewParents(parents) {
    return new MulNode(parents[0], parents[1]);//, this.type);;
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

  _codegenGLSL(parentresults) {
    const [a, b] = parentresults;
    const [typeA, typeB] = this.parents.map(p => p.type);
  
    // Scalar × anything → simple *
    if (typeA === NodeTypes.SCALAR || typeB === NodeTypes.SCALAR) {
      return `(${a} * ${b})`;
    }
  
    // Dual × Dual → DualMul / DualSquare
    if (typeA === NodeTypes.DUAL && typeB === NodeTypes.DUAL) {
      return a === b ? `DualSquare(${a})` : `DualMul(${a},${b})`;
    }
  
    // DualXYZ × DualXYZ → xyzDualMul / xyzDualSquare
    if (typeA === NodeTypes.DUALXYZ && typeB === NodeTypes.DUALXYZ) {
      return a === b ? `xyzDualSquare(${a})` : `xyzDualMul(${a},${b})`;
    }
  
    // All other combinations are unsupported
    throw new Error(`MulNode GLSL codegen: unsupported type combination ${typeA} * ${typeB}`);
  }


}

class DivNode extends Node {
  constructor(a, b) {
    super(NodeTypes.UNKNOWN, [a, b]);
  }


  _cloneWithNewParents(parents) {
    return new DivNode(parents[0], parents[1]);//, this.type);;
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
_eval(parentResults, variables, cache) {
  const A = castValue(parentResults[0], this.type);
  const B = castValue(parentResults[1], this.type);

  switch (this.type) {
    case NodeTypes.SCALAR:
      return A / B;

    case NodeTypes.DUAL: {
      const val = A.val / B.val;
      const der = (A.der * B.val - A.val * B.der) / (B.val * B.val);
      return new Dual(val, der);
    }

    case NodeTypes.DUALXYZ: {
      const val = A.val / B.val;
      const dx = (A.dx * B.val - A.val * B.dx) / (B.val * B.val);
      const dy = (A.dy * B.val - A.val * B.dy) / (B.val * B.val);
      const dz = (A.dz * B.val - A.val * B.dz) / (B.val * B.val);
      return new DualXYZ(val, dx, dy, dz);
    }

    default:
      throw new Error(`DivNode: unsupported output type ${this.type}`);
  }
}
  
  _codegenGLSL(parentresults){
    if(this.parents[1].type==NodeTypes.SCALAR)
      return `(${parentresults[0]}/${parentresults[1]})`;
    if(this.parents[0].type==NodeTypes.DUAL && this.parents[1].type==NodeTypes.DUAL)
      return `DualDiv(${parentresults[0]},${parentresults[1]})`;
    super._codegenGLSL();//throws
  }
}


class SqrtNode extends Node {
  constructor(a) {
    super(NodeTypes.UNKNOWN, [a]);
  }

  _eval(parentresults, variables, cache) {
    const [a] = parentresults;

    if (this.type === NodeTypes.SCALAR) {
      return Math.sqrt(a);
    }

    if (this.type === NodeTypes.DUAL) {
      const sqrtval = Math.sqrt(a.val);
      const der = a.der;
      return new Dual(sqrtval, der / (2 * sqrtval));
    }

    if (this.type === NodeTypes.DUALXYZ) {
      const sqrtval = Math.sqrt(a.val);
      return new DualXYZ(
        sqrtval,
        a.dx / (2 * sqrtval),
        a.dy / (2 * sqrtval),
        a.dz / (2 * sqrtval)
      );
    }

    throw new Error("SqrtNode: unknown type");
  }

  _cloneWithNewParents(parents) {
    return new SqrtNode(parents[0]);//, this.type);;
  }

  _promoteType(visited) {
    const targetType = this.parents[0].type;
    if (![NodeTypes.SCALAR, NodeTypes.DUAL, NodeTypes.DUALXYZ].includes(targetType)) {
      throw new Error("SqrtNode: invalid parent type");
    }
    this.type = targetType;
  }

  _codegenGLSL(parentresults) {
    if (this.type === NodeTypes.SCALAR) {
      return `sqrt(${parentresults[0]})`;
    }
    throw Error("Not implemented jet");
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



    if(!this.parents[0]instanceof VarNode)throw new Error("can only assign variable nodes");

    this.parents[1]=castNode(this.parents[1],this.parents[0].type);//try to cast expression node to type of variable node
    if(this.parents[0].type!=this.parents[1].type)
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
export class ReturnNode extends Node {
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
  _signatureExtras(){
    return this.returntype;
    //not sure this is sensible
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



export class FunctionbodyNode extends Node {
  constructor(parents) {
    super(NodeTypes.UNTYPED, parents);
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

    const nodes = this.topologicalsort();
    nodes.pop();//remove itself

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

    const idkiamtired= nodes.map(node => {
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
    idkiamtired.forEach(n=>n.promoteTypes());
    return idkiamtired;

  }

  codegenGLSL(){//maybe name this differently
    const assignments=this.makeAssignementGraph();
    return assignments.map(node=>
      node.codegenGLSL()
    ).join("\n");
  }

  
}








export class Bundlenode extends Node {
  constructor(parents) {
    super(NodeTypes.UNTYPED, parents);
  }
  _cloneWithNewParents(newparents){
    return new Bundlenode(newparents);
  }
}


export class LabelNode extends Node {
  constructor(a, name) {
    super(NodeTypes.UNKNOWN, [a]);
    this.label = name;
  }

  _eval(parentresults, variables, cache) {
    // Just forward the value from the parent
    return parentresults[0];
  }

  _cloneWithNewParents(parents) {
    // Keep the same label when cloning
    return new LabelNode(parents[0], this.label);
  }

  _codegenGLSL(parentresults) {
    // Just forward the parent code
    return parentresults[0];
  }

}




